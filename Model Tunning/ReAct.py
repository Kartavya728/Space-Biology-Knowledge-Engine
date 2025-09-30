import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain import hub
from langchain.agents import AgentExecutor, create_react_agent
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.tools import Tool
from langchain.chat_models import init_chat_model
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from typing import Dict, List, Set
import json

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
tavily_key = os.getenv("TAVILY_API_KEY")
if not api_key or not tavily_key:
    raise ValueError("API keys not found!")

os.environ["GOOGLE_API_KEY"] = api_key
os.environ["TAVILY_API_KEY"] = tavily_key

embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
vector_store = Chroma(
    collection_name="example_collection",
    embedding_function=embeddings,
    persist_directory="./chroma_langchain_db",
)

# ============================================================================
# STRUCTURED OUTPUT MODELS
# ============================================================================

class Paragraph(BaseModel):
    text: str = Field(description="Paragraph text content")
    images: List[str] = Field(default_factory=list, description="Image IDs")
    tables: List[str] = Field(default_factory=list, description="Table IDs")

class StructuredResponse(BaseModel):
    paragraphs: List[Paragraph] = Field(description="List of paragraphs")
    total_images: List[str] = Field(default_factory=list, description="All image IDs")
    total_tables: List[str] = Field(default_factory=list, description="All table IDs")
    source_documents: int = Field(description="Number of source documents")

# ============================================================================
# RAG FUNCTIONS
# ============================================================================

def parse_media_refs(metadata: Dict) -> Dict[str, List[str]]:
    refs = {'images': [], 'tables': [], 'direct_refs': []}
    
    if metadata.get('images'):
        refs['images'] = [img.strip() for img in metadata['images'].split(',') if img.strip()]
    if metadata.get('tables'):
        refs['tables'] = [tbl.strip() for tbl in metadata['tables'].split(',') if tbl.strip()]
    if metadata.get('direct_refs'):
        refs['direct_refs'] = [ref.strip() for ref in metadata['direct_refs'].split(',') if ref.strip()]
    
    return refs

def get_context_with_media(query: str, k: int = 5) -> Dict:
    print(f"\n[RAG] Retrieving documents for: '{query}'")
    
    retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": k})
    docs = retriever.get_relevant_documents(query)
    
    all_images: Set[str] = set()
    all_tables: Set[str] = set()
    formatted_blocks = []
    
    for i, doc in enumerate(docs, 1):
        media_refs = parse_media_refs(doc.metadata)
        all_images.update(media_refs['images'])
        all_tables.update(media_refs['tables'])
        
        block = f"--- Document {i} ---\n"
        block += f"Source: {doc.metadata.get('source', 'Unknown')}\n"
        
        if media_refs['images'] or media_refs['tables']:
            block += "Media: "
            if media_refs['images']:
                block += f"Images: {', '.join(media_refs['images'])} "
            if media_refs['tables']:
                block += f"Tables: {', '.join(media_refs['tables'])}"
            block += "\n"
        
        block += doc.page_content + "\n"
        formatted_blocks.append(block)
    
    context = "\n".join(formatted_blocks)
    
    print(f"[RAG] Retrieved {len(docs)} documents, {len(all_images)} images, {len(all_tables)} tables")
    
    return {
        'context': context,
        'references': {
            'images': sorted(list(all_images)),
            'tables': sorted(list(all_tables))
        },
        'total_documents': len(docs)
    }

def rag_retrieval_tool(query: str) -> str:
    print(f"\n{'='*80}\n[RAG TOOL INVOKED] Query: {query}\n{'='*80}")
    
    result = get_context_with_media(query, k=5)
    
    response = f"""Retrieved Context:
{result['context']}

Media References:
- Images: {', '.join(result['references']['images']) if result['references']['images'] else 'None'}
- Tables: {', '.join(result['references']['tables']) if result['references']['tables'] else 'None'}

Total Documents: {result['total_documents']}"""
    
    return response

# ============================================================================
# OUTPUT PARSER
# ============================================================================

def parse_to_structured_json(agent_response: str, media_references: Dict) -> Dict:
    print("\n[PARSER] Converting to structured JSON with smart paragraph handling...")
    
    # Split response into initial paragraphs
    paragraphs_text = [p.strip() for p in agent_response.split('\n\n') if p.strip()]
    
    paragraphs = []
    all_images_used = set()
    all_tables_used = set()
    unused_images = set(media_references.get('images', []))
    unused_tables = set(media_references.get('tables', []))
    
    # Process existing paragraphs and track media usage
    for para_text in paragraphs_text:
        para_images = []
        para_tables = []
        
        for img_id in media_references.get('images', []):
            if img_id.lower() in para_text.lower():
                para_images.append(img_id)
                all_images_used.add(img_id)
                unused_images.discard(img_id)
        
        for tbl_id in media_references.get('tables', []):
            if tbl_id.lower() in para_text.lower():
                para_tables.append(tbl_id)
                all_tables_used.add(tbl_id)
                unused_tables.discard(tbl_id)
        
        paragraph = Paragraph(text=para_text, images=para_images, tables=para_tables)
        paragraphs.append(paragraph)
    
    # Smart paragraph management: ensure at least 3 paragraphs
    current_para_count = len(paragraphs)
    
    # If we have unused media, create media-only paragraphs
    if unused_images or unused_tables:
        if unused_images:
            media_text = f"Additional visual references: {', '.join(sorted(unused_images))}"
            media_para = Paragraph(
                text=media_text,
                images=sorted(list(unused_images)),
                tables=[]
            )
            paragraphs.append(media_para)
            all_images_used.update(unused_images)
            current_para_count += 1
        
        if unused_tables and current_para_count < 3:
            table_text = f"Additional data tables: {', '.join(sorted(unused_tables))}"
            table_para = Paragraph(
                text=table_text,
                images=[],
                tables=sorted(list(unused_tables))
            )
            paragraphs.append(table_para)
            all_tables_used.update(unused_tables)
            current_para_count += 1
    
    # If still less than 3 paragraphs, split the largest paragraph
    while current_para_count < 3 and any(len(p.text) > 200 for p in paragraphs):
        # Find longest paragraph
        longest_idx = max(range(len(paragraphs)), key=lambda i: len(paragraphs[i].text))
        longest_para = paragraphs[longest_idx]
        
        if len(longest_para.text) > 200:
            sentences = longest_para.text.split('. ')
            if len(sentences) >= 2:
                mid = len(sentences) // 2
                first_half = '. '.join(sentences[:mid]) + '.'
                second_half = '. '.join(sentences[mid:])
                
                # Distribute media between splits
                mid_img = len(longest_para.images) // 2
                mid_tbl = len(longest_para.tables) // 2
                
                para1 = Paragraph(
                    text=first_half,
                    images=longest_para.images[:mid_img],
                    tables=longest_para.tables[:mid_tbl]
                )
                para2 = Paragraph(
                    text=second_half,
                    images=longest_para.images[mid_img:],
                    tables=longest_para.tables[mid_tbl:]
                )
                
                paragraphs[longest_idx] = para1
                paragraphs.insert(longest_idx + 1, para2)
                current_para_count += 1
            else:
                break
        else:
            break
    
    # If still less than 3 and data is insufficient, add summary paragraphs
    if current_para_count < 3:
        if current_para_count == 1:
            summary_para = Paragraph(
                text="This information represents the key findings from the available sources.",
                images=[],
                tables=[]
            )
            paragraphs.append(summary_para)
            current_para_count += 1
        
        if current_para_count == 2:
            footer_para = Paragraph(
                text="Further details may require additional context or more specific queries.",
                images=[],
                tables=[]
            )
            paragraphs.append(footer_para)
    
    structured = StructuredResponse(
        paragraphs=paragraphs,
        total_images=sorted(list(all_images_used)),
        total_tables=sorted(list(all_tables_used)),
        source_documents=len(paragraphs)
    )
    
    output_dict = {
        f"para{i+1}": {
            "text": para.text,
            "images": {f"img_{j+1}": img for j, img in enumerate(para.images)} if para.images else {},
            "tables": {f"table_{j+1}": tbl for j, tbl in enumerate(para.tables)} if para.tables else {}
        }
        for i, para in enumerate(structured.paragraphs)
    }
    
    output_dict["_metadata"] = {
        "total_paragraphs": len(structured.paragraphs),
        "total_images": structured.total_images,
        "total_tables": structured.total_tables,
        "source_documents": structured.source_documents
    }
    
    print(f"[PARSER] Created {len(paragraphs)} structured paragraphs (min 3 enforced)")
    print(f"[PARSER] Images used: {len(all_images_used)}, Tables used: {len(all_tables_used)}")
    
    return output_dict

# ============================================================================
# AGENT SETUP
# ============================================================================

def setup_agent():
    print("\n[SETUP] Initializing agent with streaming...")
    
    llm = init_chat_model(
        "gemini-2.0-flash-exp",
        model_provider="google_genai",
        streaming=True,
        callbacks=[StreamingStdOutCallbackHandler()]
    )
    
    rag_tool = Tool(
        name="KnowledgeBaseRetrieval",
        func=rag_retrieval_tool,
        description="""Search internal knowledge base for scientific documents with images and tables. 
        Input: search query. Returns: context with media references."""
    )
    
    web_search = TavilySearchResults(
        max_results=1,
        description="Search the web for current information."
    )
    
    tools = [rag_tool, web_search]
    prompt = hub.pull("hwchase17/react")
    agent = create_react_agent(llm, tools, prompt)
    
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=5,
        callbacks=[StreamingStdOutCallbackHandler()]
    )
    
    print(f"[SETUP] Tools: {[tool.name for tool in tools]}")
    return agent_executor

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def run_query(query: str, output_file: str = "output.json") -> Dict:
    print("\n" + "="*80)
    print(f"QUERY: {query}")
    print("="*80)
    
    agent_executor = setup_agent()
    
    print("\n[AGENT] Processing with streaming...\n")
    result = agent_executor.invoke({"input": query})
    
    agent_output = result.get('output', '')
    
    print("\n" + "="*80)
    print("AGENT OUTPUT:")
    print("="*80)
    print(agent_output)
    print("="*80)
    
    rag_result = get_context_with_media(query, k=5)
    media_refs = rag_result['references']
    
    structured_json = parse_to_structured_json(agent_output, media_refs)
    
    print("\n" + "="*80)
    print("FINAL JSON OUTPUT:")
    print("="*80)
    print(json.dumps(structured_json, indent=2))
    print("="*80)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(structured_json, f, indent=2, ensure_ascii=False)
    
    print(f"\n[EXPORT] Saved to {output_file}")
    
    return structured_json

# ============================================================================
# EXAMPLES
# ============================================================================

if __name__ == "__main__":
    # Example 1: RAG Query
    print("\n" + "#"*80)
    print("# Example 1: RAG Query - Arabidopsis")
    print("#"*80)
    
    result1 = run_query(
        "Tell me significant GO terms assigned with AgriGO and gProfiler to 130 genes of the physiological adaptation with only FArg: GArgFC",
        "arabidopsis_output.json"
    )
    
    # Example 2: Web Query
    print("\n\n" + "#"*80)
    print("# Example 2: Web Query - LangChain")
    print("#"*80)
    
    result2 = run_query(
        "What is LangChain?",
        "langchain_output.json"
    )
    
    print("\n" + "="*80)
    print("COMPLETED")
    print("="*80)