import os
import json
from typing import Dict, List, Set
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain import hub
from langchain.agents import AgentExecutor, create_react_agent
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.tools import Tool
from langchain.chat_models import init_chat_model
from langchain.callbacks.base import BaseCallbackHandler
from pydantic import BaseModel, Field

load_dotenv()

class Paragraph(BaseModel):
    text: str = Field(description="Paragraph text content")
    images: List[str] = Field(default_factory=list, description="Image IDs")
    tables: List[str] = Field(default_factory=list, description="Table IDs")

class StreamingYieldCallback(BaseCallbackHandler):
    def __init__(self, yield_func):
        self.yield_func = yield_func
    
    def on_agent_action(self, action, **kwargs):
        msg = json.dumps({"type": "thinking", "content": f"🤔 Using tool: {action.tool}\n"})
        self.yield_func(f"data: {msg}\n\n")
    
    def on_tool_start(self, serialized, input_str, **kwargs):
        msg = json.dumps({"type": "thinking", "content": f"📊 Searching: {input_str[:100]}...\n"})
        self.yield_func(f"data: {msg}\n\n")
    
    def on_tool_end(self, output, **kwargs):
        msg = json.dumps({"type": "thinking", "content": "✅ Retrieved data\n"})
        self.yield_func(f"data: {msg}\n\n")
    
    def on_llm_start(self, serialized, prompts, **kwargs):
        msg = json.dumps({"type": "thinking", "content": "💭 Thinking...\n"})
        self.yield_func(f"data: {msg}\n\n")

embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
vector_store = Chroma(
    collection_name="example_collection",
    embedding_function=embeddings,
    persist_directory="./chroma_langchain_db",
)

def parse_media_refs(metadata: Dict) -> Dict[str, List[str]]:
    refs = {'images': [], 'tables': []}
    if metadata.get('images'):
        refs['images'] = [img.strip() for img in metadata['images'].split(',') if img.strip()]
    if metadata.get('tables'):
        refs['tables'] = [tbl.strip() for tbl in metadata['tables'].split(',') if tbl.strip()]
    return refs

def get_context_with_media(query: str, k: int = 5) -> Dict:
    retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": k})
    docs = retriever.get_relevant_documents(query)
    
    all_images, all_tables = set(), set()
    formatted_blocks = []
    
    for i, doc in enumerate(docs, 1):
        media_refs = parse_media_refs(doc.metadata)
        all_images.update(media_refs['images'])
        all_tables.update(media_refs['tables'])
        
        block = f"--- Document {i} ---\nSource: {doc.metadata.get('source', 'Unknown')}\n"
        if media_refs['images'] or media_refs['tables']:
            block += f"Media: Images: {', '.join(media_refs['images'])} Tables: {', '.join(media_refs['tables'])}\n"
        block += doc.page_content + "\n"
        formatted_blocks.append(block)
    
    return {
        'context': "\n".join(formatted_blocks),
        'references': {'images': sorted(list(all_images)), 'tables': sorted(list(all_tables))},
        'total_documents': len(docs)
    }

def rag_retrieval_tool(query: str) -> str:
    result = get_context_with_media(query, k=5)
    return f"""Retrieved Context:\n{result['context']}\n\nMedia References:\n- Images: {', '.join(result['references']['images']) if result['references']['images'] else 'None'}\n- Tables: {', '.join(result['references']['tables']) if result['references']['tables'] else 'None'}\n\nTotal Documents: {result['total_documents']}"""

def parse_to_structured_json(agent_response: str, media_references: Dict) -> Dict:
    paragraphs_text = [p.strip() for p in agent_response.split('\n\n') if p.strip()]
    paragraphs = []
    all_images_used, all_tables_used = set(), set()
    unused_images = set(media_references.get('images', []))
    unused_tables = set(media_references.get('tables', []))
    
    for para_text in paragraphs_text:
        para_images = [img for img in media_references.get('images', []) if img.lower() in para_text.lower()]
        para_tables = [tbl for tbl in media_references.get('tables', []) if tbl.lower() in para_text.lower()]
        
        all_images_used.update(para_images)
        all_tables_used.update(para_tables)
        unused_images.difference_update(para_images)
        unused_tables.difference_update(para_tables)
        
        paragraphs.append(Paragraph(text=para_text, images=para_images, tables=para_tables))
    
    if len(paragraphs) < 3:
        if unused_images:
            paragraphs.append(Paragraph(
                text=f"Additional visual references: {', '.join(sorted(unused_images))}",
                images=sorted(list(unused_images)), tables=[]
            ))
        if len(paragraphs) < 3:
            paragraphs.append(Paragraph(text="Further details may require additional context.", images=[], tables=[]))
    
    output_dict = {
        f"para{i+1}": {
            "text": para.text,
            "images": {f"img_{j+1}": img for j, img in enumerate(para.images)} if para.images else {},
            "tables": {f"table_{j+1}": tbl for j, tbl in enumerate(para.tables)} if para.tables else {}
        }
        for i, para in enumerate(paragraphs)
    }
    
    output_dict["_metadata"] = {
        "total_paragraphs": len(paragraphs),
        "total_images": sorted(list(all_images_used)),
        "total_tables": sorted(list(all_tables_used)),
        "source_documents": len(paragraphs)
    }
    
    return output_dict

def generate_text_with_gemini(user_input: str):
    api_key = os.getenv("GOOGLE_API_KEY")
    tavily_key = os.getenv("TAVILY_API_KEY")
    
    if not api_key or not tavily_key:
        yield "data: {\"type\": \"error\", \"content\": \"API keys not found!\"}\n\n"
        return
    
    os.environ["GOOGLE_API_KEY"] = api_key
    os.environ["TAVILY_API_KEY"] = tavily_key
    
    yielded_messages = []
    
    def yield_message(msg):
        yielded_messages.append(msg)
    
    try:
        callback = StreamingYieldCallback(yield_message)
        
        llm = init_chat_model("gemini-2.0-flash-exp", model_provider="google_genai", streaming=True)
        
        rag_tool = Tool(
            name="KnowledgeBaseRetrieval",
            func=rag_retrieval_tool,
            description="Search internal knowledge base for scientific documents with images and tables."
        )
        web_search = TavilySearchResults(max_results=1, description="Search the web for current information.")
        
        prompt = hub.pull("hwchase17/react")
        agent = create_react_agent(llm, [rag_tool, web_search], prompt)
        agent_executor = AgentExecutor(
            agent=agent, 
            tools=[rag_tool, web_search],
            verbose=True, 
            handle_parsing_errors=True, 
            max_iterations=5,
            callbacks=[callback]
        )
        
        yield "data: {\"type\": \"thinking\", \"content\": \"🚀 Starting analysis...\\n\"}\n\n"
        
        result = agent_executor.invoke({"input": user_input})
        
        for msg in yielded_messages:
            yield msg
        
        agent_output = result.get('output', '')
        
        yield "data: {\"type\": \"thinking\", \"content\": \"✨ Generating structured response...\\n\"}\n\n"
        
        rag_result = get_context_with_media(user_input, k=5)
        structured_json = parse_to_structured_json(agent_output, rag_result['references'])
        
        for key, value in structured_json.items():
            if key.startswith('para'):
                yield f"data: {json.dumps({'type': 'paragraph', 'content': value})}\n\n"
        
        yield f"data: {json.dumps({'type': 'metadata', 'content': structured_json.get('_metadata', {})})}\n\n"
        yield "data: {\"type\": \"done\"}\n\n"
        
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"