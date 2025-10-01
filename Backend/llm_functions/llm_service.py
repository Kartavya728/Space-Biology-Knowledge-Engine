import os
import json
import time
from typing import Dict, List, Set
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain import hub
from langchain.agents import AgentExecutor, create_react_agent
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.tools import Tool
from langchain.chat_models import init_chat_model
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from pydantic import BaseModel, Field

load_dotenv()

# ============================================================================
# MODELS
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
# VECTOR STORE INITIALIZATION
# ============================================================================

api_key = os.getenv("GOOGLE_API_KEY")
if api_key:
    os.environ["GOOGLE_API_KEY"] = api_key

try:
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    vector_store = Chroma(
        collection_name="example_collection",
        embedding_function=embeddings,
        persist_directory="./../chroma_langchain_db",
    )
except Exception as e:
    print(f"Error initializing vector store: {e}")
    vector_store = None


# ============================================================================
# ROLE-BASED PROMPTS
# ============================================================================

ROLE_PROMPTS = {
    'scientist': """You are a scientific research analyst. Focus on:
    - Research methodologies and experimental design
    - Statistical significance and data analysis
    - Novel hypotheses and scientific implications
    - Peer-reviewed findings and validation
    - Technical details and mechanisms
    Provide detailed scientific analysis with proper citations.""",
    
    'investor': """You are an investment analyst specializing in space technology. Focus on:
    - Commercial applications and market potential
    - Investment opportunities and ROI projections
    - Competitive landscape and market size
    - Technology readiness level (TRL) and commercialization timeline
    - Funding requirements and revenue models
    - Risk assessment and mitigation strategies
    Provide business-focused analysis with financial implications.""",
    
    'mission-architect': """You are a space mission planning expert. Focus on:
    - Mission feasibility and technical requirements
    - Safety considerations and risk mitigation
    - Engineering challenges and solutions
    - Resource requirements (fuel, power, life support)
    - Timeline and mission architecture
    - Integration with existing systems
    - Moon/Mars mission applicability
    Provide mission-planning focused analysis with practical implementation details."""
}


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
    
    paragraphs_text = [p.strip() for p in agent_response.split('\n\n') if p.strip()]
    
    paragraphs = []
    all_images_used = set()
    all_tables_used = set()
    unused_images = set(media_references.get('images', []))
    unused_tables = set(media_references.get('tables', []))
    
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
    
    current_para_count = len(paragraphs)
    
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
    
    while current_para_count < 3 and any(len(p.text) > 200 for p in paragraphs):
        longest_idx = max(range(len(paragraphs)), key=lambda i: len(paragraphs[i].text))
        longest_para = paragraphs[longest_idx]
        
        if len(longest_para.text) > 200:
            sentences = longest_para.text.split('. ')
            if len(sentences) >= 2:
                mid = len(sentences) // 2
                first_half = '. '.join(sentences[:mid]) + '.'
                second_half = '. '.join(sentences[mid:])
                
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
            "images": para.images,  # Return as array, not dict
            "tables": para.tables   # Return as array, not dict
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
# MAIN GENERATOR FOR DJANGO STREAMING
# ============================================================================

def generate_text_with_gemini(user_input: str, user_type: str = 'scientist'):
    """
    Generator function for Django StreamingHttpResponse with role-based analysis
    """
    
    api_key = os.getenv("GOOGLE_API_KEY")
    tavily_key = os.getenv("TAVILY_API_KEY")
    
    if not api_key:
        yield "data: " + json.dumps({"type": "error", "content": "GOOGLE_API_KEY not found!"}) + "\n\n"
        yield "data: " + json.dumps({"type": "done"}) + "\n\n"
        return
    
    if not tavily_key:
        yield "data: " + json.dumps({"type": "error", "content": "TAVILY_API_KEY not found!"}) + "\n\n"
        yield "data: " + json.dumps({"type": "done"}) + "\n\n"
        return
    
    os.environ["GOOGLE_API_KEY"] = api_key
    os.environ["TAVILY_API_KEY"] = tavily_key
    
    try:
        yield "data: " + json.dumps({"type": "thinking", "content": f"Starting {user_type} analysis...\n"}) + "\n\n"
        
        print("\n" + "="*80)
        print(f"QUERY: {user_input}")
        print(f"USER TYPE: {user_type}")
        print("="*80)
        
        yield "data: " + json.dumps({"type": "thinking", "content": "Initializing AI agent...\n"}) + "\n\n"
        
        print("\n[SETUP] Initializing agent with streaming...")
        
        llm = init_chat_model(
            "gemini-2.0-flash-exp",
            model_provider="google_genai",
            streaming=True,
            callbacks=[StreamingStdOutCallbackHandler()]
        )
        
        yield "data: " + json.dumps({"type": "thinking", "content": "Setting up tools...\n"}) + "\n\n"
        
        rag_tool = Tool(
            name="KnowledgeBaseRetrieval",
            func=rag_retrieval_tool,
            description="""Search internal knowledge base for scientific documents with images and tables. 
            Input: search query. Returns: context with media references."""
        )
        
        web_search = TavilySearchResults(
            max_results=1,
            description="Search the web for current information if KnowledgeBaseRetrieval fails.",
            name="WebSearch"
        )
        
        tools = [rag_tool, web_search]
        
        yield "data: " + json.dumps({"type": "thinking", "content": "Creating specialized agent...\n"}) + "\n\n"
        
        # Modify prompt based on role
        role_context = ROLE_PROMPTS.get(user_type, ROLE_PROMPTS['scientist'])
        enhanced_query = f"{role_context}\n\nUser Query: {user_input}"
        
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
        print(f"[SETUP] Role: {user_type}")
        
        yield "data: " + json.dumps({"type": "thinking", "content": "Processing your query...\n"}) + "\n\n"
        
        print("\n[AGENT] Processing with streaming...\n")
        
        result = agent_executor.invoke({"input": enhanced_query})
        
        yield "data: " + json.dumps({"type": "thinking", "content": "Agent completed analysis\n"}) + "\n\n"
        
        agent_output = result.get('output', '')
        
        print("\n" + "="*80)
        print("AGENT OUTPUT:")
        print("="*80)
        print(agent_output)
        print("="*80)
        
        yield "data: " + json.dumps({"type": "thinking", "content": "Retrieving media references...\n"}) + "\n\n"
        
        rag_result = get_context_with_media(user_input, k=5)
        media_refs = rag_result['references']
        
        yield "data: " + json.dumps({"type": "thinking", "content": "Structuring response...\n"}) + "\n\n"
        
        structured_json = parse_to_structured_json(agent_output, media_refs)
        
        # Add user_type to metadata
        structured_json["_metadata"]["user_type"] = user_type
        
        print("\n" + "="*80)
        print("FINAL JSON OUTPUT:")
        print("="*80)
        print(json.dumps(structured_json, indent=2))
        print("="*80)
        
        for key, value in structured_json.items():
            if key.startswith('para'):
                yield "data: " + json.dumps({'type': 'paragraph', 'content': value}) + "\n\n"
                time.sleep(0.05)
        
        if '_metadata' in structured_json:
            yield "data: " + json.dumps({'type': 'metadata', 'content': structured_json['_metadata']}) + "\n\n"
        
        yield "data: " + json.dumps({"type": "done"}) + "\n\n"
        
    except Exception as e:
        error_msg = f"Error: {str(e)}"
        print(f"[ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        yield "data: " + json.dumps({'type': 'error', 'content': error_msg}) + "\n\n"
        yield "data: " + json.dumps({"type": "done"}) + "\n\n"