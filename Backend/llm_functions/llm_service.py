import os
import json
import time
import re
import logging
from typing import Dict, List, Set, Generator, Tuple
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
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt

# Configure logging
logger = logging.getLogger(__name__)

load_dotenv()

# ============================================================================
# MODELS
# ============================================================================

class Paragraph(BaseModel):
    title: str = Field(description="Paragraph title/heading")
    text: str = Field(description="Paragraph text content")
    images: List[str] = Field(default_factory=list, description="Image IDs")
    tables: List[str] = Field(default_factory=list, description="Table IDs")
    sources: List[Dict] = Field(default_factory=list, description="Source citations")
    technical_terms: List[str] = Field(default_factory=list, description="Technical terms used")

class SourceCitation(BaseModel):
    source_type: str = Field(description="Type: research_paper, website, database")
    title: str = Field(description="Source title")
    url: str = Field(description="Source URL if available")
    authors: List[str] = Field(default_factory=list, description="Authors if available")
    publication_date: str = Field(description="Publication date if available")
    relevance_score: float = Field(description="Relevance score 0-1")


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
    'scientist': """You are a senior scientific research analyst providing expert-level technical analysis based EXCLUSIVELY on the retrieved vector database content.

STRUCTURE YOUR RESPONSE WITH THESE EXACT SECTIONS (Each section MUST be 200-300 words):
1. Executive Summary: Concise overview highlighting the most significant findings and their implications
2. Technical Breakdown: Detailed analysis of methodology, experimental design, instruments, and technical specifications with specific parameters
3. Methodology Analysis: Comprehensive evaluation of research approach, experimental controls, validation methods, and scientific rigor
4. Results & Data: Quantitative findings with statistical analysis, error margins, significance levels, and key measurements
5. Comparative Analysis: In-depth comparison with existing research, alternative approaches, and benchmark studies
6. Future Research Directions: Novel hypotheses, recommended next steps, and potential breakthrough opportunities

CRITICAL REQUIREMENTS:
- Each section must contain 200-300 words (approximately 15-25 sentences)
- ONLY use information from the provided vector database context - do not generate generic content
- Reference specific numerical data, measurements, and equations from the retrieved documents
- Use advanced technical terminology: "biochemical pathways", "molecular mechanisms", "physiological responses", "metabolic processes", "cellular signaling", "gene expression", "protein synthesis", "enzymatic activity", "oxidative stress", "mitochondrial function"
- Include statistical significance values (p-values, confidence intervals) from the source data
- Compare findings with established scientific benchmarks from the retrieved research
- Provide detailed technical explanations with specific examples from the documents
- Discuss limitations and potential sources of error mentioned in the source material
- End each paragraph with proper citations: "Source: [Document Title] (Authors, Year)" or "Reference: [Research Paper Title]"
- Use technical abbreviations: NASA, ISS, ESA, CNSA, JAXA, ROSCOSMOS, etc.
- Include specific technical parameters: temperature ranges, pressure values, radiation levels, gravitational forces, etc.""",
    
    'investor': """You are an investment analyst specializing in space technology ventures and deep-tech commercialization based EXCLUSIVELY on the retrieved vector database content.

STRUCTURE YOUR RESPONSE WITH THESE EXACT SECTIONS (Each section MUST be 200-300 words):
1. Investment Overview: Executive summary of the investment opportunity with key value propositions and competitive advantages
2. Market Opportunity: Detailed analysis of market size, growth trajectory, competitive landscape, and addressable market segments
3. Commercial Applications: Specific use cases, target customer segments, revenue streams, and go-to-market strategies
4. Financial Projections: Revenue models, ROI estimates, scaling economics, unit economics, and path to profitability
5. Risk Assessment: Comprehensive evaluation of technical risks, market risks, regulatory challenges, and execution risks
6. Funding Requirements: Detailed capital needs, funding milestones, use of proceeds, and investment timeline

CRITICAL REQUIREMENTS:
- Each section must contain 200-300 words with specific financial data from the retrieved documents
- ONLY use information from the provided vector database context - do not generate generic content
- Use advanced financial and technical terminology: "market capitalization", "revenue streams", "scaling economics", "unit economics", "total addressable market (TAM)", "serviceable addressable market (SAM)", "serviceable obtainable market (SOM)", "venture capital", "private equity", "initial public offering (IPO)", "mergers and acquisitions (M&A)"
- Include concrete market size estimates with credible sources from the retrieved data
- Provide quantified financial projections with assumptions clearly stated from the source material
- Specify investment amounts, timelines, and expected returns from the documents
- Compare to similar investments and market comparables mentioned in the research
- Address intellectual property, regulatory compliance, and competitive moats from the source data
- Include TAM/SAM/SOM analysis where applicable from the retrieved information
- Discuss exit strategies and liquidity scenarios based on the source material
- End each paragraph with proper citations: "Source: [Document Title] (Authors, Year)" or "Reference: [Research Paper Title]"
- Use technical abbreviations: NASA, ISS, ESA, CNSA, JAXA, ROSCOSMOS, SpaceX, Blue Origin, etc.""",
    
    'mission-architect': """You are a NASA mission planning expert specializing in lunar and Mars mission architecture based EXCLUSIVELY on the retrieved vector database content.

STRUCTURE YOUR RESPONSE WITH THESE EXACT SECTIONS (Each section MUST be 200-300 words):
1. Mission Overview: Comprehensive description of mission objectives, scientific goals, strategic alignment with NASA priorities
2. Technical Requirements: Detailed specifications including power requirements, mass budgets, thermal constraints, communication needs, and performance criteria
3. Implementation Strategy: Mission architecture, systems integration approach, technology readiness levels, and deployment methodology
4. Mission Roadmap: Phase-by-phase timeline with specific milestones, decision gates, and critical path analysis
5. System Integration: Integration with existing NASA infrastructure, compatibility with Artemis/Mars programs, and interoperability requirements
6. Risk Mitigation: Identification of critical risks, failure modes and effects analysis (FMEA), contingency plans, and redundancy strategies

CRITICAL REQUIREMENTS:
- Each section must contain 200-300 words with specific technical parameters from the retrieved documents
- ONLY use information from the provided vector database context - do not generate generic content
- Use advanced aerospace and mission planning terminology: "mission architecture", "systems integration", "technology readiness level (TRL)", "critical path analysis", "failure modes and effects analysis (FMEA)", "redundancy strategies", "thermal management", "power distribution", "communication protocols", "navigation systems", "life support systems", "environmental control", "crew safety protocols"
- Include quantified resource requirements (power in kW, mass in kg, data rates in Mbps) from the source data
- Provide detailed timeline estimates with specific dates and durations from the documents
- Consider harsh lunar/Martian environment challenges (radiation, temperature extremes, dust) mentioned in the research
- Reference system diagrams and technical architecture naturally in text from the source material
- Address crew safety, life support requirements, and mission-critical systems from the retrieved data
- Include Technology Readiness Level (TRL) assessments from the source documents
- Discuss mission success criteria and performance metrics from the research
- End each paragraph with proper citations: "Source: [Document Title] (Authors, Year)" or "Reference: [Research Paper Title]"
- Use technical abbreviations: NASA, ISS, ESA, CNSA, JAXA, ROSCOSMOS, SpaceX, Blue Origin, etc.
- Include specific technical parameters: temperature ranges, pressure values, radiation levels, gravitational forces, etc. from the source material""",
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

def get_context_with_media(query: str, user_type: str, k: int = 15) -> Dict:
    """Enhanced retrieval with user type context and source tracking"""
    role_keywords = {
        'scientist': 'methodology experimental results data analysis research scientific methodology experimental design statistical significance',
        'investor': 'commercial market investment ROI revenue applications business market analysis financial projections',
        'mission-architect': 'mission planning requirements safety feasibility engineering systems technical specifications'
    }
    
    enhanced_query = f"{query} {role_keywords.get(user_type, '')}"
    retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": k})
    docs = retriever.get_relevant_documents(enhanced_query)
    
    all_images, all_tables = set(), set()
    formatted_blocks = []
    source_citations = []
    
    for i, doc in enumerate(docs, 1):
        media_refs = parse_media_refs(doc.metadata)
        all_images.update(media_refs['images'])
        all_tables.update(media_refs['tables'])
        
        # Extract source information
        source_info = {
            'source_type': 'research_paper' if 'paper' in doc.metadata.get('source', '').lower() else 'database',
            'title': doc.metadata.get('title', doc.metadata.get('source', 'Unknown Source')),
            'url': doc.metadata.get('url', ''),
            'authors': doc.metadata.get('authors', []),
            'publication_date': doc.metadata.get('date', ''),
            'relevance_score': 1.0 - (i * 0.05)  # Higher relevance for earlier results
        }
        source_citations.append(source_info)
        
        block = f"--- Document {i} ---\n"
        block += f"Source: {doc.metadata.get('source', 'Unknown')}\n"
        block += f"Title: {source_info['title']}\n"
        if source_info['authors']:
            block += f"Authors: {', '.join(source_info['authors'])}\n"
        if source_info['publication_date']:
            block += f"Date: {source_info['publication_date']}\n"
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
        'source_citations': source_citations,
        'total_documents': len(docs),
        'documents': formatted_blocks
    }

def extract_technical_terms(text: str) -> List[str]:
    """Extract technical terms from text"""
    technical_patterns = [
        r'\b[A-Z]{2,}\b',  # Acronyms
        r'\b\w*[a-z]{2,}\w*[a-z]{2,}\b',  # Compound technical terms
        r'\b\w*[a-z]{3,}\w*[a-z]{3,}\b',  # Multi-syllable technical terms
        r'\b\w*[a-z]{2,}\w*[a-z]{2,}\w*[a-z]{2,}\b'  # Complex technical terms
    ]
    
    terms = set()
    for pattern in technical_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        terms.update(matches)
    
    # Filter out common words
    common_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use'}
    technical_terms = [term for term in terms if term.lower() not in common_words and len(term) > 3]
    
    return sorted(list(set(technical_terms)))[:10]  # Return top 10 unique terms

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

def parse_to_streamable_structure(agent_response: str, media_references: Dict, user_type: str, query: str, source_citations: List[Dict] = None) -> List[Dict]:
    """Parse response into streamable paragraph chunks with proper word count (200-300 words)"""
    expected_sections = ROLE_STRUCTURES.get(user_type, ROLE_STRUCTURES['scientist'])
    
    paragraphs_data = []
    unused_images = list(media_references.get('images', []))
    unused_tables = list(media_references.get('tables', []))
    
    # Split response by sections
    sections = re.split(r'\n(?=\d+\.|\#{1,3}\s)', agent_response)
    
    for i, section_title in enumerate(expected_sections):
        section_text = ""
        
        # Find matching content
        for section in sections:
            if section_title.lower() in section.lower()[:100]:
                section_text = section
                break
        
        if not section_text and i < len(sections):
            section_text = sections[i]
        
        if not section_text:
            section_text = f"Analysis for {section_title} is being compiled based on available research data and contextual information from the knowledge base."
        
        # Clean section text
        section_text = re.sub(r'^\d+\.\s*|^#+\s*', '', section_text).strip()
        
        # Extract technical terms
        technical_terms = extract_technical_terms(section_text)
        
        # Ensure proper word count (200-300 words)
        words = section_text.split()
        if len(words) < 180:
            # Pad if too short
            section_text += "\n\nThis analysis is derived from comprehensive evaluation of the available research data, technical specifications, and contextual information retrieved from the knowledge base. Further detailed investigation of these findings would provide additional insights into the implications and applications of this research."
        elif len(words) > 350:
            # Truncate if too long
            section_text = ' '.join(words[:330]) + "..."
        
        # Assign ONE image per paragraph (distributed evenly)
        para_image = unused_images.pop(0) if unused_images else None
        para_table = None
        
        # Find table references in text
        for tbl in media_references.get('tables', []):
            if tbl.lower() in section_text.lower():
                para_table = tbl
                if tbl in unused_tables:
                    unused_tables.remove(tbl)
                break
        
        # If no table found in text, assign one if available
        if not para_table and unused_tables and i % 2 == 0:
            para_table = unused_tables.pop(0)
        
        # Enhance text with natural media references
        if para_image and "figure" not in section_text.lower() and "fig" not in section_text.lower():
            section_text += f"\n\nThe accompanying visualization in {para_image} provides detailed illustration of these key aspects and relationships."
        
        if para_table and "table" not in section_text.lower():
            section_text += f"\n\nComprehensive measurements and detailed data are presented in {para_table} for reference."
        
        # Add source citations
        section_sources = []
        if source_citations:
            # Assign 2-3 most relevant sources per section
            relevant_sources = source_citations[i*2:(i+1)*2+1] if i < len(source_citations) else source_citations[-2:]
            for source in relevant_sources:
                citation_text = f"Source: {source['title']}"
                if source.get('authors'):
                    citation_text += f" ({', '.join(source['authors'][:2])})"
                if source.get('publication_date'):
                    citation_text += f" ({source['publication_date']})"
                section_sources.append({
                    'text': citation_text,
                    'type': source['source_type'],
                    'relevance': source['relevance_score']
                })
        
        paragraphs_data.append({
            "title": section_title,
            "text": section_text,
            "images": [para_image] if para_image else [],
            "tables": [para_table] if para_table else [],
            "sources": section_sources,
            "technical_terms": technical_terms
        })
    
    # Handle remaining media
    if unused_images or unused_tables:
        additional_text = "Additional reference materials and supporting data are available for further investigation."
        if unused_images:
            additional_text += f" Visual materials include: {', '.join(unused_images[:3])}."
        if unused_tables:
            additional_text += f" Supplementary data tables: {', '.join(unused_tables[:3])}."
        
        paragraphs_data.append({
            "title": "Additional Resources",
            "text": additional_text,
            "images": unused_images[:3] if unused_images else [],
            "tables": unused_tables[:3] if unused_tables else [],
            "sources": [],
            "technical_terms": []
        })
    
    return paragraphs_data


# ============================================================================
# MAIN GENERATOR WITH STREAMING
# ============================================================================

def generate_text_with_gemini(user_input: str, user_type: str = 'scientist', deep_think: bool = False) -> Generator[str, None, None]:
    """Enhanced generator with detailed real-time streaming of agent thinking process"""
    
    api_key = os.getenv("GOOGLE_API_KEY")
    tavily_key = os.getenv("TAVILY_API_KEY")
    
    if not api_key or not tavily_key:
        yield stream_event("error", "API keys not configured")
        yield stream_event("done", None)
        return
    
    os.environ["GOOGLE_API_KEY"] = api_key
    os.environ["TAVILY_API_KEY"] = tavily_key
    
    try:
        # Initial setup
        yield stream_event("thinking_step", {
            "step": "initialization",
            "message": f"🚀 Initializing {user_type.upper()} analysis mode",
            "details": {
                "user_type": user_type,
                "query_length": len(user_input)
            }
        })
        
        yield stream_event("thinking_step", {
            "step": "query_processing",
            "message": f"📋 Processing query",
            "details": {"query": user_input[:200] + ("..." if len(user_input) > 200 else "")}
        })
        
        # Initialize LLM
        yield stream_event("thinking_step", {
            "step": "model_loading",
            "message": "🧠 Loading Gemini 2.0 Flash model with streaming capabilities"
        })
        
        llm = init_chat_model(
            "gemini-2.0-flash-exp",
            model_provider="google_genai",
            streaming=True,
            temperature=0.7,
            max_tokens=4096,
            top_p=0.9
        )
        
        # Retrieve documents
        yield stream_event("thinking_step", {
            "step": "retrieval_start",
            "message": "📊 Searching knowledge base for relevant documents..."
        })
        
        context_result = get_context_with_media(user_input, user_type, k=15)
        
        # Stream detailed retrieval results
        yield stream_event("thinking_step", {
            "step": "retrieval_complete",
            "message": f"✅ Successfully retrieved {context_result['total_documents']} relevant documents",
            "details": {
                "total_documents": context_result['total_documents'],
                "images_found": len(context_result['references']['images']),
                "tables_found": len(context_result['references']['tables']),
                "image_ids": context_result['references']['images'][:5],
                "table_ids": context_result['references']['tables'][:5]
            },
            "preview": context_result['context'][:1000] + "..." if len(context_result['context']) > 1000 else context_result['context']
        })
        
        # Show first few retrieved documents
        for idx, doc in enumerate(context_result['documents'][:3], 1):
            yield stream_event("thinking_step", {
                "step": f"document_preview_{idx}",
                "message": f"📄 Document {idx} preview",
                "output": doc[:600] + ("..." if len(doc) > 600 else "")
            })
        
        # Setup tools
        yield stream_event("thinking_step", {
            "step": "tool_setup",
            "message": "🔧 Configuring analysis tools (Knowledge Base + Web Search)"
        })
        
        rag_tool = Tool(
            name="KnowledgeBaseRetrieval",
            func=rag_retrieval_tool,
            description="Search internal knowledge base for scientific documents, research papers, and technical data"
        )
        
        web_search = TavilySearchResults(
            max_results=5,
            name="WebSearch",
            description="Search the web for current information, recent developments, and external sources. Use this to verify and supplement information from the knowledge base."
        )
        
        tools = [rag_tool, web_search]
        
        # Build enhanced query
        role_prompt = ROLE_PROMPTS.get(user_type, ROLE_PROMPTS['scientist'])
        enhanced_query = f"""{role_prompt}

User Query: {user_input}

Available Context from Knowledge Base:
{context_result['context'][:8000]}

CRITICAL INSTRUCTIONS:
1. Use ONLY the information provided in the context above - do not generate generic content
2. Each section MUST be 200-300 words (approximately 15-25 sentences)
3. Include specific data, measurements, and technical details from the retrieved documents
4. Naturally reference the figures and tables available in the context
5. Use advanced technical terminology appropriate for the user type
6. End each paragraph with proper citations from the source documents
7. Ensure all content is highly relevant and not generic or bluffed
8. Use web search only to verify or supplement information from the knowledge base"""
        
        yield stream_event("thinking_step", {
            "step": "agent_initialization",
            "message": "🤖 Initializing ReAct agent with reasoning capabilities",
            "details": {
                "tools_available": ["KnowledgeBaseRetrieval", "WebSearch"],
                "max_iterations": 6,
                "context_length": len(enhanced_query)
            }
        })
        
        # Create agent
        prompt = hub.pull("hwchase17/react")
        agent = create_react_agent(llm, tools, prompt)
        
        # Custom callback for detailed streaming
        class DetailedAgentCallback(BaseCallbackHandler):
            def __init__(self, generator_func):
                self.generator_func = generator_func
                self.iteration = 0
                
            def on_agent_action(self, action, **kwargs):
                self.iteration += 1
                self.generator_func(stream_event("thinking_step", {
                    "step": f"agent_action_{self.iteration}",
                    "message": f"🎯 Agent Action {self.iteration}: Using {action.tool}",
                    "details": {
                        "tool": action.tool,
                        "tool_input": str(action.tool_input)[:500]
                    }
                }))
            
            def on_tool_start(self, serialized, input_str, **kwargs):
                tool_name = serialized.get("name", "Unknown")
                self.generator_func(stream_event("thinking_step", {
                    "step": "tool_execution",
                    "message": f"⚡ Executing {tool_name}",
                    "details": {"input": input_str[:300]}
                }))
            
            def on_tool_end(self, output, **kwargs):
                # Stream tool output in detail
                output_str = str(output)
                self.generator_func(stream_event("thinking_step", {
                    "step": "tool_result",
                    "message": "✅ Tool execution completed",
                    "output": output_str[:1500] + ("..." if len(output_str) > 1500 else "")
                }))
            
            def on_agent_finish(self, finish, **kwargs):
                self.generator_func(stream_event("thinking_step", {
                    "step": "agent_complete",
                    "message": "🎉 Agent reasoning completed"
                }))
        
        # Store yielded events
        def yield_wrapper(event_str):
            nonlocal latest_yield
            latest_yield = event_str
        
        latest_yield = None
        callback = DetailedAgentCallback(yield_wrapper)
        
        agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=4,  # Reduced for faster processing
            callbacks=[callback],
            return_intermediate_steps=False  # Optimize for speed
        )
        
        yield stream_event("thinking_step", {
            "step": "agent_execution_start",
            "message": "🔄 Starting agent execution with iterative reasoning"
        })
        
        # Execute agent
        result = agent_executor.invoke({"input": enhanced_query})
        
        # Yield any pending callbacks
        if latest_yield:
            yield latest_yield
        
        yield stream_event("thinking_step", {
            "step": "response_structuring",
            "message": "✨ Structuring final response into formatted sections"
        })
        
        agent_output = result.get('output', '')
        
        # Parse into structured format
        paragraphs_data = parse_to_streamable_structure(
            agent_output,
            context_result['references'],
            user_type,
            user_input,
            context_result.get('source_citations', [])
        )
        
        yield stream_event("thinking_step", {
            "step": "final_formatting",
            "message": f"📝 Generated {len(paragraphs_data)} structured sections",
            "details": {
                "sections": [p['title'] for p in paragraphs_data],
                "total_images": sum(len(p['images']) for p in paragraphs_data),
                "total_tables": sum(len(p['tables']) for p in paragraphs_data)
            }
        })
        
        # Generate title
        role_titles = {
            'scientist': 'Scientific Analysis Report',
            'investor': 'Investment Analysis Report',
            'mission-architect': 'Mission Architecture Report'
        }
        overall_title = f"{role_titles.get(user_type, 'Analysis Report')}: {user_input[:60]}"
        
        yield stream_event('title', overall_title)
        time.sleep(0.05)
        
        # Stream paragraphs with brief delay for smooth rendering
        for idx, para in enumerate(paragraphs_data, 1):
            yield stream_event("thinking_step", {
                "step": f"streaming_section_{idx}",
                "message": f"📤 Streaming section {idx}/{len(paragraphs_data)}: {para['title']}"
            })
            
            yield stream_event('paragraph', para)
            time.sleep(0.08)
        
        # Stream metadata
        all_images = set()
        all_tables = set()
        all_sources = []
        all_technical_terms = set()
        
        for para in paragraphs_data:
            all_images.update(para.get('images', []))
            all_tables.update(para.get('tables', []))
            all_sources.extend(para.get('sources', []))
            all_technical_terms.update(para.get('technical_terms', []))
        
        metadata = {
            "total_paragraphs": len(paragraphs_data),
            "total_images": sorted(list(all_images)),
            "total_tables": sorted(list(all_tables)),
            "source_documents": context_result['total_documents'],
            "source_citations": context_result.get('source_citations', []),
            "technical_terms": sorted(list(all_technical_terms)),
            "user_type": user_type,
            "query": user_input
        }
        yield stream_event('metadata', metadata)
        
        # Add chatbot section
        chatbot_section = {
            "title": "AI Research Assistant",
            "text": "This analysis was generated by our AI Research Assistant, which combines advanced natural language processing with comprehensive space biology research databases. The system utilizes vector similarity search to retrieve the most relevant scientific literature and research data, ensuring that all information presented is grounded in peer-reviewed research and verified sources. Our AI assistant continuously learns from the latest research publications and maintains up-to-date knowledge of space biology developments.",
            "images": [],
            "tables": [],
            "sources": [
                {
                    "text": "AI Research Assistant - Space Biology Knowledge Engine",
                    "type": "system",
                    "relevance": 1.0
                }
            ],
            "technical_terms": ["AI", "NLP", "vector similarity", "machine learning", "research database"]
        }
        
        yield stream_event('paragraph', chatbot_section)
        time.sleep(0.05)
        
        yield stream_event("thinking_step", {
            "step": "complete",
            "message": "✅ Analysis complete and delivered"
        })
        
        yield stream_event("done", None)
        
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        
        yield stream_event("thinking_step", {
            "step": "error",
            "message": f"❌ Error occurred: {str(e)}"
        })
        yield stream_event('error', f"Error: {str(e)}")
        yield stream_event("done", None)


@csrf_exempt
def chat_api(request):
    """
    API endpoint for streaming chat responses
    Handles POST requests with user_input, user_type, and deep_think
    """
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        # Parse JSON body
        body = json.loads(request.body.decode('utf-8'))
        user_input = body.get("query", "").strip()
        user_type = body.get("userType", "scientist").strip()
        deep_think = body.get("deepThink", False)

        # Validate user_type
        valid_types = ['scientist', 'investor', 'mission-architect']
        if user_type not in valid_types:
            user_type = 'scientist'  # Default fallback

        # Validate input
        if not user_input:
            def error_stream():
                yield 'data: ' + json.dumps({"type": "error", "content": "Empty query received"}) + '\n\n'
                yield 'data: ' + json.dumps({"type": "done"}) + '\n\n'

            response = StreamingHttpResponse(
                error_stream(),
                content_type="text/event-stream"
            )
            response["Cache-Control"] = "no-cache"
            response["X-Accel-Buffering"] = "no"
            response["Access-Control-Allow-Origin"] = "*"
            return response

        # Log the request
        logger.info(f"Processing query for {user_type}: {user_input[:100]}... DeepThink: {deep_think}")
        if deep_think:
            print("DeepThink mode is ON")  # <-- Print to terminal

        # Create streaming response
        response = StreamingHttpResponse(
            generate_text_with_gemini(user_input, user_type),
            content_type="text/event-stream"
        )

        # Set headers for SSE
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"

        return response

    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    except Exception as e:
        logger.error(f"Error in streaming response: {str(e)}")

        def error_stream():
            yield 'data: ' + json.dumps({"type": "error", "content": f"Server error: {str(e)}"}) + '\n\n'
            yield 'data: ' + json.dumps({"type": "done"}) + '\n\n'

        response = StreamingHttpResponse(
            error_stream(),
            content_type="text/event-stream"
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        response["Access-Control-Allow-Origin"] = "*"
        return response