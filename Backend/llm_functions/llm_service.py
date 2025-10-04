import os
import json
import time
import re
from typing import Dict, List, Set, Generator
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
# MODELS
# ============================================================================

class Paragraph(BaseModel):
    title: str = Field(description="Paragraph title/heading")
    text: str = Field(description="Paragraph text content")
    images: List[str] = Field(default_factory=list, description="Image IDs")
    tables: List[str] = Field(default_factory=list, description="Table IDs")


# ============================================================================
# CHAT FUNCTIONS
# ============================================================================

def generate_chat_response(message: str, context: str = "") -> str:
    """
    Generate a chat response using Gemini model
    
    Args:
        message: The user's message
        context: Optional context from previous conversation
        
    Returns:
        The generated response as a string
    """
    try:
        # Initialize the chat model
        model = init_chat_model(
            "gemini-2.0-flash-exp",
            model_provider="google_genai",
            streaming=False
        )
        
        # Prepare the prompt with context if available
        prompt = f"Context: {context}\n\nUser: {message}\n\nAssistant:"
        if not context:
            prompt = f"User: {message}\n\nAssistant:"
            
        # Generate the response
        response = model.invoke(prompt)
        
        # Return the response content
        return response.content
        
    except Exception as e:
        print(f"Error generating chat response: {e}")
        return f"I'm sorry, I encountered an error: {str(e)}"


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
    'scientist': """You are a senior scientific research analyst providing expert-level technical analysis.

STRUCTURE YOUR RESPONSE WITH THESE EXACT SECTIONS (Each section MUST be 200-300 words):
1. Executive Summary: Concise overview highlighting the most significant findings and their implications
2. Technical Breakdown: Detailed analysis of methodology, experimental design, instruments, and technical specifications with specific parameters
3. Methodology Analysis: Comprehensive evaluation of research approach, experimental controls, validation methods, and scientific rigor
4. Results & Data: Quantitative findings with statistical analysis, error margins, significance levels, and key measurements
5. Comparative Analysis: In-depth comparison with existing research, alternative approaches, and benchmark studies
6. Future Research Directions: Novel hypotheses, recommended next steps, and potential breakthrough opportunities

CRITICAL REQUIREMENTS:
- Each section must contain 200-300 words (approximately 15-25 sentences)
- Reference specific numerical data, measurements, and equations throughout
- Use technical terminology appropriate for expert scientific audience
- Naturally integrate references to figures and tables in flowing text
- Include statistical significance values (p-values, confidence intervals)
- Compare findings with established scientific benchmarks and prior research
- Provide detailed technical explanations with specific examples
- Discuss limitations and potential sources of error""",
    
    'investor': """You are an investment analyst specializing in space technology ventures and deep-tech commercialization.

STRUCTURE YOUR RESPONSE WITH THESE EXACT SECTIONS (Each section MUST be 200-300 words):
1. Investment Overview: Executive summary of the investment opportunity with key value propositions and competitive advantages
2. Market Opportunity: Detailed analysis of market size, growth trajectory, competitive landscape, and addressable market segments
3. Commercial Applications: Specific use cases, target customer segments, revenue streams, and go-to-market strategies
4. Financial Projections: Revenue models, ROI estimates, scaling economics, unit economics, and path to profitability
5. Risk Assessment: Comprehensive evaluation of technical risks, market risks, regulatory challenges, and execution risks
6. Funding Requirements: Detailed capital needs, funding milestones, use of proceeds, and investment timeline

CRITICAL REQUIREMENTS:
- Each section must contain 200-300 words with specific financial data
- Include concrete market size estimates with credible sources
- Provide quantified financial projections with assumptions clearly stated
- Specify investment amounts, timelines, and expected returns
- Compare to similar investments and market comparables
- Address intellectual property, regulatory compliance, and competitive moats
- Include TAM/SAM/SOM analysis where applicable
- Discuss exit strategies and liquidity scenarios""",
    
    'mission-architect': """You are a NASA mission planning expert specializing in lunar and Mars mission architecture.

STRUCTURE YOUR RESPONSE WITH THESE EXACT SECTIONS (Each section MUST be 200-300 words):
1. Mission Overview: Comprehensive description of mission objectives, scientific goals, strategic alignment with NASA priorities
2. Technical Requirements: Detailed specifications including power requirements, mass budgets, thermal constraints, communication needs, and performance criteria
3. Implementation Strategy: Mission architecture, systems integration approach, technology readiness levels, and deployment methodology
4. Mission Roadmap: Phase-by-phase timeline with specific milestones, decision gates, and critical path analysis
5. System Integration: Integration with existing NASA infrastructure, compatibility with Artemis/Mars programs, and interoperability requirements
6. Risk Mitigation: Identification of critical risks, failure modes and effects analysis (FMEA), contingency plans, and redundancy strategies

CRITICAL REQUIREMENTS:
- Each section must contain 200-300 words with specific technical parameters
- Include quantified resource requirements (power in kW, mass in kg, data rates in Mbps)
- Provide detailed timeline estimates with specific dates and durations
- Consider harsh lunar/Martian environment challenges (radiation, temperature extremes, dust)
- Reference system diagrams and technical architecture naturally in text
- Address crew safety, life support requirements, and mission-critical systems
- Include Technology Readiness Level (TRL) assessments
- Discuss mission success criteria and performance metrics""",
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
        'scientist': 'methodology experimental results data analysis research scientific',
        'investor': 'commercial market investment ROI revenue applications business',
        'mission-architect': 'mission planning requirements safety feasibility engineering systems'
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
        'total_documents': len(docs),
        'documents': formatted_blocks
    }

def rag_retrieval_tool(query: str) -> str:
    result = get_context_with_media(query, 'scientist', k=10)
    response = f"""Retrieved Context:\n{result['context']}\n\nMedia: Images: {', '.join(result['references']['images']) if result['references']['images'] else 'None'}, Tables: {', '.join(result['references']['tables']) if result['references']['tables'] else 'None'}\n\nTotal: {result['total_documents']} documents"""
    return response


# ============================================================================
# STREAMING HELPERS
# ============================================================================

def stream_event(event_type: str, content: any) -> str:
    """Helper to format SSE events"""
    return "data: " + json.dumps({"type": event_type, "content": content}) + "\n\n"


# ============================================================================
# OUTPUT PARSER
# ============================================================================

def parse_to_streamable_structure(agent_response: str, media_references: Dict, user_type: str, query: str) -> List[Dict]:
    """Parse response into streamable paragraph chunks with proper word count and key concepts"""
    expected_sections = ROLE_STRUCTURES.get(user_type, ROLE_STRUCTURES['scientist'])
    
    paragraphs_data = []
    unused_images = list(media_references.get('images', []))
    unused_tables = list(media_references.get('tables', []))
    
    # Extract key concepts from query for section titles
    query_keywords = extract_key_concepts(query)
    
    # Split response by sections
    sections = re.split(r'\n(?=\d+\.|\#{1,3}\s)', agent_response)
    
    for i, base_section_title in enumerate(expected_sections):
        section_text = ""
        
        # Find matching content
        for section in sections:
            if base_section_title.lower() in section.lower()[:100]:
                section_text = section
                break
        
        if not section_text and i < len(sections):
            section_text = sections[i]
        
        if not section_text:
            continue  # Skip empty sections instead of generating filler
        
        # Clean section text
        section_text = re.sub(r'^\d+\.\s*|^#+\s*', '', section_text).strip()
        section_text = re.sub(r'^' + re.escape(base_section_title) + r':?\s*', '', section_text, flags=re.IGNORECASE).strip()
        
        # Ensure proper word count (200-300 words)
        words = section_text.split()
        if len(words) < 180:
            continue  # Skip sections that are too short
        elif len(words) > 350:
            section_text = ' '.join(words[:330]) + "..."
        
        # Create contextual title with key concepts
        section_title = create_contextual_title(base_section_title, query_keywords, section_text)
        
        # Assign media intelligently based on content
        para_image = None
        para_table = None
        
        # Find table references in text
        for tbl in unused_tables[:]:
            if tbl.lower() in section_text.lower() or 'table' in section_text.lower():
                para_table = tbl
                unused_tables.remove(tbl)
                break
        
        # Assign image if figure is mentioned or for visual sections
        if ('figure' in section_text.lower() or 'fig' in section_text.lower() or 
            'visualization' in section_text.lower() or i % 2 == 0) and unused_images:
            para_image = unused_images.pop(0)
        
        paragraphs_data.append({
            "title": section_title,
            "text": section_text,
            "images": [para_image] if para_image else [],
            "tables": [para_table] if para_table else []
        })
    
    return paragraphs_data


def extract_key_concepts(query: str) -> List[str]:
    """Extract key concepts from query for contextual titles"""
    # Remove common words and extract meaningful terms
    common_words = {'what', 'how', 'why', 'when', 'where', 'the', 'is', 'are', 'of', 'in', 'on', 'for', 'to', 'and'}
    words = query.lower().split()
    keywords = [w for w in words if len(w) > 3 and w not in common_words]
    return keywords[:3]  # Return top 3 key concepts


def create_contextual_title(base_title: str, keywords: List[str], content: str) -> str:
    """Create contextual paragraph title with key concepts"""
    # Find relevant keyword in content
    for keyword in keywords:
        if keyword in content.lower():
            return f"{base_title}: {keyword.title()}"
    return base_title


def generate_text_with_gemini(user_input: str, user_type: str = 'scientist', deep_think: bool = False) -> Generator[str, None, None]:
    """Enhanced generator with proper streaming and relevant content only"""
    
    api_key = os.getenv("GOOGLE_API_KEY")
    tavily_key = os.getenv("TAVILY_API_KEY")
    
    if not api_key or not tavily_key:
        yield stream_event("error", "API keys not configured")
        yield stream_event("done", None)
        return
    
    os.environ["GOOGLE_API_KEY"] = api_key
    os.environ["TAVILY_API_KEY"] = tavily_key
    
    try:
        # Stream query first
        yield stream_event("query", user_input)
        time.sleep(0.05)
        
        yield stream_event("thinking_step", {
            "step": "initialization",
            "message": f"Initializing {user_type.upper()} analysis mode",
            "details": {"user_type": user_type, "query_length": len(user_input)}
        })
        
        # Initialize LLM
        yield stream_event("thinking_step", {
            "step": "model_loading",
            "message": "Loading Gemini model"
        })
        
        llm = init_chat_model(
            "gemini-2.0-flash-exp",
            model_provider="google_genai",
            streaming=True,
            temperature=0.3 if deep_think else 0.7  # Lower temp for deep think
        )
        
        # Retrieve documents
        yield stream_event("thinking_step", {
            "step": "retrieval_start",
            "message": "Searching knowledge base..."
        })
        
        context_result = get_context_with_media(user_input, user_type, k=15 if deep_think else 10)
        
        yield stream_event("thinking_step", {
            "step": "retrieval_complete",
            "message": f"Retrieved {context_result['total_documents']} relevant documents",
            "details": {
                "total_documents": context_result['total_documents'],
                "images_found": len(context_result['references']['images']),
                "tables_found": len(context_result['references']['tables'])
            }
        })
        
        # Setup tools with enhanced prompt
        role_prompt = ROLE_PROMPTS.get(user_type, ROLE_PROMPTS['scientist'])
        
        enhanced_query = f"""{role_prompt}

User Query: {user_input}

Available Context from Knowledge Base:
{context_result['context']}

CRITICAL INSTRUCTIONS:
1. Answer ONLY based on the provided context - do not generate speculative content
2. Each section MUST be 200-300 words with specific data from the context
3. Include key concepts from the query: {extract_key_concepts(user_input)}
4. Reference figures and tables naturally when they support your points
5. If context is insufficient for a section, SKIP that section entirely
6. Maintain scientific accuracy - cite specific measurements, dates, and findings from the documents"""
        
        # Rest of agent setup...
        rag_tool = Tool(
            name="KnowledgeBaseRetrieval",
            func=rag_retrieval_tool,
            description="Search internal knowledge base for scientific documents"
        )
        
        web_search = TavilySearchResults(max_results=3, name="WebSearch")
        tools = [rag_tool, web_search]
        
        prompt = hub.pull("hwchase17/react")
        agent = create_react_agent(llm, tools, prompt)
        agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=8 if deep_think else 6
        )
        
        yield stream_event("thinking_step", {
            "step": "agent_execution_start",
            "message": "Analyzing with AI agent"
        })
        
        result = agent_executor.invoke({"input": enhanced_query})
        agent_output = result.get('output', '')
        
        # Parse and filter relevant paragraphs
        paragraphs_data = parse_to_streamable_structure(
            agent_output,
            context_result['references'],
            user_type,
            user_input
        )
        
        # Generate title with key concepts
        key_concepts = extract_key_concepts(user_input)
        role_titles = {
            'scientist': 'Scientific Analysis',
            'investor': 'Investment Analysis',
            'mission-architect': 'Mission Architecture'
        }
        overall_title = f"{role_titles.get(user_type, 'Analysis')}: {' & '.join([k.title() for k in key_concepts[:2]])}"
        
        # Stream title
        yield stream_event('title', overall_title)
        time.sleep(0.1)
        
        # Stream paragraphs one by one
        for idx, para in enumerate(paragraphs_data, 1):
            yield stream_event("thinking_step", {
                "step": f"streaming_section_{idx}",
                "message": f"Streaming: {para['title']}"
            })
            time.sleep(0.05)
            
            yield stream_event('paragraph', para)
            time.sleep(0.15)  # Visible streaming delay
        
        # Stream metadata
        all_images = []
        all_tables = []
        for para in paragraphs_data:
            all_images.extend(para.get('images', []))
            all_tables.extend(para.get('tables', []))
        
        metadata = {
            "total_paragraphs": len(paragraphs_data),
            "total_images": all_images,
            "total_tables": all_tables,
            "source_documents": context_result['total_documents'],
            "user_type": user_type,
            "query": user_input
        }
        yield stream_event('metadata', metadata)
        time.sleep(0.05)
        
        yield stream_event("done", None)
        
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        yield stream_event('error', f"Error: {str(e)}")
        yield stream_event("done", None)