import os
import json
import time
import re
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

# ============================================================================
# STREAMING CALLBACK HANDLER
# ============================================================================

class DetailedStreamingCallbackHandler(BaseCallbackHandler):
    """Enhanced callback to stream actual retrieved content"""
    def __init__(self, stream_func):
        self.stream_func = stream_func
        self.current_tool = None
        
    def on_llm_start(self, serialized, prompts, **kwargs):
        self.stream_func("thinking", "🤖 AI Model Processing...")
        
    def on_llm_new_token(self, token: str, **kwargs):
        """Stream LLM tokens as they're generated"""
        # Don't stream raw tokens during agent reasoning, only final output
        pass
        
    def on_tool_start(self, serialized, input_str, **kwargs):
        tool_name = serialized.get("name", "Unknown")
        self.current_tool = tool_name
        self.stream_func("thinking", f"🔧 Tool Activated: {tool_name}")
        self.stream_func("thinking_detail", f"Query: {input_str[:150]}...")
        
    def on_tool_end(self, output, **kwargs):
        if self.current_tool:
            # Stream portions of retrieved content
            if isinstance(output, str):
                # Extract first few lines of retrieved content
                lines = output.split('\n')[:5]
                preview = '\n'.join(lines)
                if len(preview) > 300:
                    preview = preview[:300] + "..."
                self.stream_func("thinking_detail", f"Retrieved:\n{preview}")
            self.stream_func("thinking", f"✅ {self.current_tool} completed")
        self.current_tool = None


# ============================================================================
# MODELS
# ============================================================================

class Paragraph(BaseModel):
    title: str = Field(description="Paragraph title/heading")
    text: str = Field(description="Paragraph text content")
    images: List[str] = Field(default_factory=list, description="Image IDs")
    tables: List[str] = Field(default_factory=list, description="Table IDs")


# ============================================================================
# VECTOR STORE
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
# ROLE-BASED CONFIGURATIONS
# ============================================================================

ROLE_STRUCTURES = {
    'scientist': [
        "Executive Summary",
        "Technical Breakdown",
        "Methodology Analysis",
        "Results & Data",
        "Comparative Analysis",
        "Future Research Directions"
    ],
    'investor': [
        "Investment Overview",
        "Market Opportunity",
        "Commercial Applications",
        "Financial Projections",
        "Risk Assessment",
        "Funding Requirements"
    ],
    'mission-architect': [
        "Mission Overview",
        "Technical Requirements",
        "Implementation Strategy",
        "Mission Roadmap",
        "System Integration",
        "Risk Mitigation"
    ]
}

ROLE_PROMPTS = {
    'scientist': """You are a senior scientific research analyst. Provide detailed technical analysis.

STRUCTURE YOUR RESPONSE WITH THESE EXACT SECTIONS:
1. Executive Summary: Brief overview (3-4 sentences)
2. Technical Breakdown: Detailed technical analysis with specific data
3. Methodology Analysis: Research methods and experimental design
4. Results & Data: Quantitative results and statistical significance
5. Comparative Analysis: Compare with other methods (search web if needed)
6. Future Research Directions: Novel hypotheses and next steps

CRITICAL INSTRUCTIONS:
- Reference images explicitly: "As shown in Figure X below, ..."
- Reference tables: "Table Y presents the detailed measurements..."
- Include specific numbers, equations, and measurements
- Each section should be 2-4 paragraphs
- Use technical terminology appropriate for experts""",
    
    'investor': """You are an investment analyst for space technology ventures.

STRUCTURE YOUR RESPONSE WITH THESE EXACT SECTIONS:
1. Investment Overview: Executive summary of opportunity
2. Market Opportunity: Market size, trends, growth projections
3. Commercial Applications: Specific use cases and customers
4. Financial Projections: Revenue models and ROI estimates
5. Risk Assessment: Technical, market, and regulatory risks
6. Funding Requirements: Capital needs and milestones

CRITICAL INSTRUCTIONS:
- Reference financial charts: "The projections in Table X show..."
- Include market size estimates with sources
- Quantify investment amounts and timelines
- Compare to similar investments
- Each section should be 2-4 paragraphs""",
    
    'mission-architect': """You are a space mission planning expert for NASA missions.

STRUCTURE YOUR RESPONSE WITH THESE EXACT SECTIONS:
1. Mission Overview: High-level objectives and scope
2. Technical Requirements: Specific technical specifications
3. Implementation Strategy: Proposed architecture and approach
4. Mission Roadmap: Timeline with milestones
5. System Integration: Integration with existing NASA systems
6. Risk Mitigation: Critical risks and contingency plans

CRITICAL INSTRUCTIONS:
- Reference system diagrams: "Figure X illustrates the system architecture..."
- Include resource requirements (power, fuel, life support)
- Provide specific timeline estimates
- Consider Moon/Mars mission applicability
- Each section should be 2-4 paragraphs"""
}


# ============================================================================
# RAG FUNCTIONS
# ============================================================================

def parse_media_refs(metadata: Dict) -> Dict[str, List[str]]:
    refs = {'images': [], 'tables': []}
    if metadata.get('images'):
        refs['images'] = [img.strip() for img in metadata['images'].split(',') if img.strip()]
    if metadata.get('tables'):
        refs['tables'] = [tbl.strip() for tbl in metadata['tables'].split(',') if tbl.strip()]
    return refs

def get_context_with_media(query: str, user_type: str, k: int = 10) -> Dict:
    """Enhanced retrieval with user type context"""
    role_keywords = {
        'scientist': 'methodology experimental results data analysis research',
        'investor': 'commercial market investment ROI revenue applications',
        'mission-architect': 'mission planning requirements safety feasibility engineering'
    }
    
    enhanced_query = f"{query} {role_keywords.get(user_type, '')}"
    retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": k})
    docs = retriever.get_relevant_documents(enhanced_query)
    
    all_images, all_tables = set(), set()
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
    
    return {
        'context': "\n".join(formatted_blocks),
        'references': {
            'images': sorted(list(all_images)),
            'tables': sorted(list(all_tables))
        },
        'total_documents': len(docs)
    }

def rag_retrieval_tool(query: str) -> str:
    result = get_context_with_media(query, 'scientist', k=10)
    response = f"""Retrieved Context:\n{result['context']}\n\nMedia: Images: {', '.join(result['references']['images']) if result['references']['images'] else 'None'}, Tables: {', '.join(result['references']['tables']) if result['references']['tables'] else 'None'}\n\nTotal: {result['total_documents']} documents"""
    return response


# ============================================================================
# OUTPUT PARSER WITH STREAMING SUPPORT
# ============================================================================

def parse_to_streamable_structure(agent_response: str, media_references: Dict, user_type: str, query: str) -> List[Dict]:
    """Parse response into streamable paragraph chunks"""
    expected_sections = ROLE_STRUCTURES.get(user_type, ROLE_STRUCTURES['scientist'])
    
    # Split response by sections
    paragraphs_data = []
    unused_images = set(media_references.get('images', []))
    unused_tables = set(media_references.get('tables', []))
    
    # Try to identify sections in the response
    response_sections = re.split(r'\n(?=\d+\.|\#\#)', agent_response)
    
    for i, section_title in enumerate(expected_sections):
        # Find matching content
        section_text = ""
        for section in response_sections:
            if section_title.lower() in section.lower() or (i < len(response_sections)):
                section_text = response_sections[i] if i < len(response_sections) else section
                break
        
        if not section_text:
            section_text = f"Analysis for {section_title} is being compiled based on available data."
        
        # Clean section text
        section_text = re.sub(r'^\d+\.\s*', '', section_text)
        section_text = re.sub(r'^#+\s*', '', section_text)
        section_text = section_text.strip()
        
        # Find media references
        para_images = [img for img in media_references.get('images', []) if img.lower() in section_text.lower()]
        para_tables = [tbl for tbl in media_references.get('tables', []) if tbl.lower() in section_text.lower()]
        
        for img in para_images:
            unused_images.discard(img)
        for tbl in para_tables:
            unused_tables.discard(tbl)
        
        # Add media references if not already mentioned
        if para_images and "figure" not in section_text.lower():
            section_text += f"\n\nRefer to {', '.join(para_images)} for visual analysis."
        if para_tables and "table" not in section_text.lower():
            section_text += f"\n\nSee {', '.join(para_tables)} for detailed data."
        
        paragraphs_data.append({
            "title": section_title,
            "text": section_text,
            "images": para_images,
            "tables": para_tables
        })
    
    # Add remaining media
    if unused_images or unused_tables:
        refs_text = "Additional reference materials available"
        if unused_images:
            refs_text += f": {', '.join(sorted(unused_images))}"
        if unused_tables:
            refs_text += f" | Tables: {', '.join(sorted(unused_tables))}"
        
        paragraphs_data.append({
            "title": "Additional Resources",
            "text": refs_text,
            "images": sorted(list(unused_images)),
            "tables": sorted(list(unused_tables))
        })
    
    return paragraphs_data


# ============================================================================
# MAIN GENERATOR WITH TOKEN STREAMING
# ============================================================================

def generate_text_with_gemini(user_input: str, user_type: str = 'scientist'):
    """Enhanced generator with detailed token-by-token streaming"""
    
    api_key = os.getenv("GOOGLE_API_KEY")
    tavily_key = os.getenv("TAVILY_API_KEY")
    
    if not api_key or not tavily_key:
        yield "data: " + json.dumps({"type": "error", "content": "API keys not configured"}) + "\n\n"
        yield "data: " + json.dumps({"type": "done"}) + "\n\n"
        return
    
    os.environ["GOOGLE_API_KEY"] = api_key
    os.environ["TAVILY_API_KEY"] = tavily_key
    
    def stream_thinking(content: str):
        yield "data: " + json.dumps({"type": "thinking", "content": content}) + "\n\n"
    
    def stream_detail(content: str):
        yield "data: " + json.dumps({"type": "thinking_detail", "content": content}) + "\n\n"
    
    try:
        yield from stream_thinking(f"🚀 Initializing {user_type.upper()} analysis mode")
        yield from stream_thinking(f"📋 Processing query: {user_input[:100]}...")
        
        # Initialize callback with streaming
        def callback_stream(event_type, content):
            if event_type == "thinking":
                yield "data: " + json.dumps({"type": "thinking", "content": content}) + "\n\n"
            elif event_type == "thinking_detail":
                yield "data: " + json.dumps({"type": "thinking_detail", "content": content}) + "\n\n"
        
        callback_handler = DetailedStreamingCallbackHandler(lambda t, c: None)
        
        yield from stream_thinking("🧠 Loading Gemini 2.0 Flash model...")
        
        llm = init_chat_model(
            "gemini-2.0-flash-exp",
            model_provider="google_genai",
            streaming=True,
            callbacks=[callback_handler]
        )
        
        yield from stream_thinking("🔧 Configuring retrieval tools...")
        
        rag_tool = Tool(
            name="KnowledgeBaseRetrieval",
            func=rag_retrieval_tool,
            description="Search knowledge base for scientific documents."
        )
        
        web_search = TavilySearchResults(
            max_results=3,
            description="Search web for current information.",
            name="WebSearch"
        )
        
        tools = [rag_tool, web_search]
        
        yield from stream_thinking("📊 Retrieving relevant documents from knowledge base...")
        
        context_result = get_context_with_media(user_input, user_type, k=10)
        
        yield from stream_thinking(f"✅ Retrieved {context_result['total_documents']} documents")
        yield from stream_detail(f"Found {len(context_result['references']['images'])} images and {len(context_result['references']['tables'])} tables")
        
        # Show preview of retrieved content
        context_preview = context_result['context'][:500] + "..."
        yield from stream_detail(f"Content preview:\n{context_preview}")
        
        role_prompt = ROLE_PROMPTS.get(user_type, ROLE_PROMPTS['scientist'])
        enhanced_query = f"""{role_prompt}\n\nUser Query: {user_input}\n\nContext: {context_result['context'][:4000]}\n\nProvide comprehensive analysis following the structure."""
        
        yield from stream_thinking("🤖 Agent analyzing query with retrieved context...")
        
        prompt = hub.pull("hwchase17/react")
        agent = create_react_agent(llm, tools, prompt)
        
        # Enhanced callback for agent execution
        class AgentCallbackHandler(BaseCallbackHandler):
            def __init__(self, parent_stream):
                self.parent_stream = parent_stream
                
            def on_agent_action(self, action, **kwargs):
                self.parent_stream("thinking", f"🎯 Agent Action: {action.tool}")
                self.parent_stream("thinking_detail", f"Input: {str(action.tool_input)[:200]}")
        
        agent_callback = AgentCallbackHandler(lambda t, c: None)
        
        agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=6,
            callbacks=[callback_handler, agent_callback]
        )
        
        yield from stream_thinking("⚡ Executing agent reasoning...")
        
        result = agent_executor.invoke({"input": enhanced_query})
        
        yield from stream_thinking("✨ Analysis complete, structuring response...")
        
        agent_output = result.get('output', '')
        
        # Parse into structured format
        paragraphs_data = parse_to_streamable_structure(
            agent_output,
            context_result['references'],
            user_type,
            user_input
        )
        
        # Generate title
        role_titles = {
            'scientist': 'Scientific Analysis Report',
            'investor': 'Investment Analysis Report',
            'mission-architect': 'Mission Architecture Report'
        }
        overall_title = f"{role_titles.get(user_type, 'Analysis Report')}: {user_input[:60]}"
        
        yield "data: " + json.dumps({
            'type': 'title',
            'content': overall_title
        }) + "\n\n"
        time.sleep(0.05)
        
        yield from stream_thinking("📤 Streaming structured paragraphs...")
        
        # Stream paragraphs
        for para in paragraphs_data:
            yield "data: " + json.dumps({
                'type': 'paragraph',
                'content': para
            }) + "\n\n"
            time.sleep(0.1)
        
        # Stream metadata
        all_images = set()
        all_tables = set()
        for para in paragraphs_data:
            all_images.update(para.get('images', []))
            all_tables.update(para.get('tables', []))
        
        metadata = {
            "total_paragraphs": len(paragraphs_data),
            "total_images": sorted(list(all_images)),
            "total_tables": sorted(list(all_tables)),
            "source_documents": context_result['total_documents'],
            "user_type": user_type
        }
        
        yield "data: " + json.dumps({
            'type': 'metadata',
            'content': metadata
        }) + "\n\n"
        
        yield "data: " + json.dumps({"type": "done"}) + "\n\n"
        
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        yield "data: " + json.dumps({'type': 'error', 'content': f"Error: {str(e)}"}) + "\n\n"
        yield "data: " + json.dumps({"type": "done"}) + "\n\n"