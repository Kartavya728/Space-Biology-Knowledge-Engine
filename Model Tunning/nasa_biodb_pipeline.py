# %% [markdown]
# # NASA BioDB Knowledge Graph Ingestion Pipeline (Google Cloud Version)
# 
# This pipeline processes NASA biological research papers to create a comprehensive knowledge graph
# in Neo4j, extracting entities, relationships, and visual evidence from text, tables, and images.
#
# ## Features:
# - Automated entity extraction using Google Gemini models
# - Multi-modal processing (text, tables, images) with Gemini Vision
# - Robust error handling and logging
# - Batch processing optimizations
# - Configurable processing parameters

# %% [markdown]
# ## 1. Setup and Environment Configuration

# %%
# Install required dependencies
# !pip install langchain langchain-google-genai langchain-community neo4j pandas python-dotenv beautifulsoup4 tabulate tqdm google-cloud-aiplatform

# %%
import os
import re
import json
import logging
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
from tqdm import tqdm

from dotenv import load_dotenv
from bs4 import BeautifulSoup
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_experimental.graph_transformers import LLMGraphTransformer
from langchain_community.graphs import Neo4jGraph
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter

# %% [markdown]
# ## 2. Configuration and Logging Setup

# %%
@dataclass
class PipelineConfig:
    """Configuration settings for the knowledge graph pipeline"""
    # Processing parameters
    chunk_size: int = 1500
    chunk_overlap: int = 200
    context_window: int = 250
    batch_size: int = 20
    request_timeout: int = 120
    
    # Google Gemini model settings
    llm_model: str = "gemini-2.0-flash-exp"  # Latest Gemini model
    vision_model: str = "gemini-2.0-flash-exp"  # Gemini with vision capabilities
    temperature: float = 0.0
    top_p: float = 0.95
    top_k: int = 40
    max_output_tokens: int = 8192
    
    # Processing flags
    process_tables: bool = True
    process_images: bool = True
    verbose: bool = True
    
    # Retry settings
    max_retries: int = 3
    retry_delay: int = 2

# Initialize configuration
config = PipelineConfig()

# Setup logging
logging.basicConfig(
    level=logging.INFO if config.verbose else logging.WARNING,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'pipeline_run_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# %%
class EnvironmentManager:
    """Manages environment variables and paths"""
    
    def __init__(self):
        # Use the directory two levels up from this file as the project root
        self.root_dir = Path(__file__).resolve().parent.parent
        self.setup_paths()
        self.load_environment()
        
    def setup_paths(self):
        """Setup all required paths"""
        self.dotenv_path = self.root_dir / "Backend" / ".env"
        self.data_dir = self.root_dir / "Research Data set"
        self.text_folder = self.data_dir / "text"
        self.tables_folder = self.data_dir / "tables_data"
        self.images_file = self.data_dir / "images_data.json"
        self.csv_file = self.data_dir / "SB_publication_PMC.csv"
        
        logger.info(f"Project root: {self.root_dir}")
        logger.info(f"Data directory: {self.data_dir}")
        
    def load_environment(self):
        """Load and validate environment variables"""
        load_dotenv(dotenv_path=self.dotenv_path)
        
        # Neo4j credentials
        self.neo4j_uri = os.getenv("NEO4J_URI")
        self.neo4j_username = os.getenv("NEO4J_USERNAME")
        self.neo4j_password = os.getenv("NEO4J_PASSWORD")
        
        # Google API key
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        
        # Optional: Google Cloud Project (for Vertex AI)
        self.gcp_project_id = os.getenv("GCP_PROJECT_ID")
        self.gcp_location = os.getenv("GCP_LOCATION", "us-central1")
        
        # Validation
        missing_vars = []
        if not self.google_api_key:
            missing_vars.append("GOOGLE_API_KEY")
        if not self.neo4j_uri:
            missing_vars.append("NEO4J_URI")
        if not self.neo4j_username:
            missing_vars.append("NEO4J_USERNAME")
        if not self.neo4j_password:
            missing_vars.append("NEO4J_PASSWORD")
            
        if missing_vars:
            raise ValueError(f"Missing environment variables: {', '.join(missing_vars)}")
        
        os.environ["GOOGLE_API_KEY"] = self.google_api_key
        logger.info("Environment variables loaded successfully")
        logger.info(f"Using Google Gemini models for all processing")

# Initialize environment
env = EnvironmentManager()

# %% [markdown]
# ## 3. Database and Model Initialization

# %%
class GraphManager:
    """Manages Neo4j graph database operations with Google Gemini models"""
    
    def __init__(self, env_manager: EnvironmentManager, config: PipelineConfig):
        self.env = env_manager
        self.config = config
        self.initialize_connections()
        self.setup_transformer()
        
    def initialize_connections(self):
        """Initialize database and Google Gemini model connections"""
        try:
            # Neo4j connection
            self.graph = Neo4jGraph(
                url=self.env.neo4j_uri,
                username=self.env.neo4j_username,
                password=self.env.neo4j_password
            )
            logger.info("Neo4j connection established")
            
            # Google Gemini LLM for text processing
            self.llm = ChatGoogleGenerativeAI(
                model=self.config.llm_model,
                temperature=self.config.temperature,
                top_p=self.config.top_p,
                top_k=self.config.top_k,
                max_output_tokens=self.config.max_output_tokens,
                request_timeout=self.config.request_timeout,
                convert_system_message_to_human=True  # Gemini compatibility
            )
            logger.info(f"Google Gemini LLM initialized: {self.config.llm_model}")
            
            # Google Gemini Vision model for image processing
            self.llm_vision = ChatGoogleGenerativeAI(
                model=self.config.vision_model,
                temperature=self.config.temperature,
                top_p=self.config.top_p,
                top_k=self.config.top_k,
                max_output_tokens=self.config.max_output_tokens,
                request_timeout=self.config.request_timeout,
                convert_system_message_to_human=True
            )
            logger.info(f"Google Gemini Vision initialized: {self.config.vision_model}")
            
        except Exception as e:
            logger.error(f"Failed to initialize connections: {e}")
            raise
            
    def setup_transformer(self):
        """Setup the LLM graph transformer with custom prompt optimized for Gemini"""
        system_prompt = """You are a brilliant NASA biologist and data scientist specializing in knowledge graph extraction. 
Your task is to extract a structured knowledge graph from NASA biological research papers.

**ENTITY EXTRACTION (Nodes):**
Identify all relevant scientific entities and assign appropriate types:

- **Paper**: The research paper itself
- **BioEntity**: Genes, proteins, cells, tissues, biological molecules, metabolites
- **Concept**: Scientific concepts, phenomena, processes, mechanisms, pathways
- **Stressor**: Environmental factors (radiation, microgravity, hypoxia, oxidative stress)
- **Organism**: Species, model organisms (mice, rats, humans, C. elegans, etc.)
- **MissionContext**: Space missions, mission phases, mission objectives
- **Application**: Potential applications, countermeasures, therapeutics
- **Institution**: Research institutions, universities, space agencies

**RELATIONSHIP EXTRACTION:**
Identify meaningful relationships between entities using these standardized types:

1. **AFFECTS** (Primary finding relationship)
   - Source: Any entity (BioEntity, Stressor, Concept)
   - Target: Any entity
   - Required properties:
     * `effect`: Description of the effect (e.g., "increases", "decreases", "modulates")
     * `evidence`: Brief supporting evidence from text (1-2 sentences)
   - Example: (Radiation)-[AFFECTS {effect: "increases", evidence: "..."}]->(DNA_Damage)

2. **INVESTIGATES**
   - Source: Paper
   - Target: Any entity being studied
   
3. **STUDIED_IN**
   - Source: Any entity
   - Target: Organism, MissionContext
   
4. **PART_OF**
   - Source: Component entity
   - Target: Larger system/pathway
   
5. **HAS_POTENTIAL**
   - Source: BioEntity, Concept
   - Target: Application
   
6. **AFFILIATED_WITH**
   - Source: Paper
   - Target: Institution

**OUTPUT FORMAT:**
Return a valid knowledge graph with nodes and relationships. Each node must have:
- `id`: Unique identifier (standardized entity name)
- `type`: One of the types listed above

Each relationship must have:
- `source`: Node id
- `target`: Node id  
- `type`: One of the relationship types above
- `properties`: Dict with relationship-specific properties (especially for AFFECTS)

**IMPORTANT GUIDELINES:**
- Only extract information explicitly stated in the text
- Use standardized scientific terminology for entity IDs
- For AFFECTS relationships, always include effect and evidence properties
- Avoid creating duplicate nodes (same entity should have same ID across the graph)
- Focus on key scientific findings and relationships
- Be precise and concise in descriptions
"""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "Extract the knowledge graph from this text:\n\n{input}"),
        ])
        
        self.transformer = LLMGraphTransformer(
            llm=self.llm,
            prompt=prompt,
            node_properties=["id", "type"],
            relationship_properties=["effect", "evidence"]
        )
        logger.info("Graph transformer configured with Google Gemini")
    
    def add_graph_documents(self, graph_documents, paper_node):
        """Add graph documents and link to paper node"""
        if not graph_documents:
            return []
        
        try:
            # Add documents to graph
            self.graph.add_graph_documents(graph_documents)
            
            # Collect node IDs for linking
            paper_id = paper_node['properties']['id']
            node_ids = []
            
            for doc in graph_documents:
                for node in doc.nodes:
                    if node.type != 'Paper':
                        node_ids.append(node.id)
            
            # Batch link nodes to paper
            if node_ids:
                self.graph.query("""
                    MATCH (p:Paper {id: $paper_id})
                    UNWIND $node_ids AS node_id
                    MATCH (n) WHERE n.id = node_id
                    MERGE (p)-[:MENTIONS]->(n)
                """, params={"paper_id": paper_id, "node_ids": node_ids})
            
            return node_ids
            
        except Exception as e:
            logger.error(f"Failed to add graph documents: {e}")
            return []
    
    def cleanup_paper(self, pmc_id: str):
        """Clean up existing data for a paper before reprocessing"""
        try:
            # Remove visual evidence
            self.graph.query("""
                MATCH (p:Paper {id: $pmc_id})
                OPTIONAL MATCH (p)-[:HAS_EVIDENCE]->(v:VisualEvidence)
                DETACH DELETE v
            """, params={"pmc_id": pmc_id})
            
            # Remove mentions relationships
            self.graph.query("""
                MATCH (p:Paper {id: $pmc_id})-[r:MENTIONS]->(n)
                DELETE r
            """, params={"pmc_id": pmc_id})
            
            logger.debug(f"Cleaned up existing data for {pmc_id}")
            
        except Exception as e:
            logger.warning(f"Cleanup failed for {pmc_id}: {e}")

# Initialize graph manager
graph_manager = GraphManager(env, config)

# %% [markdown]
# ## 4. Content Processing Functions

# %%
class ContentProcessor:
    """Processes different types of content (text, tables, images) using Google Gemini"""
    
    def __init__(self, graph_manager: GraphManager, config: PipelineConfig):
        self.graph = graph_manager
        self.config = config
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=config.chunk_size,
            chunk_overlap=config.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        
    def process_text_chunk(self, text_chunk: str, paper_node: dict) -> bool:
        """Process a text chunk using Gemini and add to graph"""
        if not text_chunk.strip():
            return False
            
        try:
            document = Document(page_content=text_chunk)
            graph_documents = self.graph.transformer.convert_to_graph_documents([document])
            self.graph.add_graph_documents(graph_documents, paper_node)
            return True
            
        except Exception as e:
            logger.error(f"Failed to process text chunk: {e}")
            return False
    
    def process_table(self, pmc_id: str, table_id: str, context: str, 
                     paper_node: dict, tables_folder: Path) -> bool:
        """Process a table using Gemini and add to graph"""
        if not self.config.process_tables:
            return False
            
        table_filename = f"{pmc_id}_{table_id}.csv"
        table_path = tables_folder / table_filename
        
        if not table_path.exists():
            logger.warning(f"Table file not found: {table_filename}")
            return False
        
        try:
            # Read and convert table to markdown
            df = pd.read_csv(table_path)
            
            # Clean column names
            df.columns = df.columns.str.strip()
            
            # Convert to markdown format (better for Gemini processing)
            table_string = df.to_markdown(index=False)
            
            # Create enriched document with context
            enhanced_prompt = f"""TABLE CONTEXT: "{context}"

TABLE DATA (in markdown format):
{table_string}

Extract key findings, entities, and relationships from this table data."""
            
            document = Document(page_content=enhanced_prompt)
            
            # Extract entities and relationships using Gemini
            graph_documents = self.graph.transformer.convert_to_graph_documents([document])
            node_ids = self.graph.add_graph_documents(graph_documents, paper_node)
            
            # Link visual evidence
            if node_ids:
                self._link_visual_evidence(
                    pmc_id, f"{pmc_id}_{table_id}", "Table",
                    table_filename, context, node_ids
                )
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to process table {table_filename}: {e}")
            return False
    
    def process_image(self, pmc_id: str, image_id: str, context: str,
                     paper_node: dict, image_url_map: dict) -> bool:
        """Process an image using Gemini Vision and add to graph"""
        if not self.config.process_images:
            return False
        
        try:
            # Get image URL
            if pmc_id not in image_url_map or image_id not in image_url_map[pmc_id]:
                logger.warning(f"Image URL not found: {pmc_id}/{image_id}")
                return False
            
            image_url = image_url_map[pmc_id][image_id]
            
            # Enhanced prompt for Gemini Vision
            vision_prompt = f"""Analyze this scientific figure from a NASA biological research paper.

CAPTION/CONTEXT: "{context}"

TASK:
1. Describe the primary scientific finding or data shown in this image
2. Identify key biological entities (genes, proteins, cell types, etc.)
3. Identify any experimental conditions or stressors shown
4. Describe any measurable effects or trends (increases, decreases, changes)
5. Note the organism or model system if visible

Provide a concise scientific analysis focusing on extractable knowledge graph entities and relationships."""
            
            # Analyze image with Gemini Vision
            message = HumanMessage(content=[
                {
                    "type": "text",
                    "text": vision_prompt
                },
                {
                    "type": "image_url",
                    "image_url": image_url
                }
            ])
            
            response = self.graph.llm_vision.invoke([message])
            finding_text = response.content
            
            if finding_text and len(finding_text) > 50:
                # Extract entities from Gemini's image analysis
                document = Document(
                    page_content=f"IMAGE ANALYSIS:\n{finding_text}\n\nORIGINAL CAPTION: {context}"
                )
                graph_documents = self.graph.transformer.convert_to_graph_documents([document])
                node_ids = self.graph.add_graph_documents(graph_documents, paper_node)
                
                # Link visual evidence
                if node_ids:
                    self._link_visual_evidence(
                        pmc_id, f"{pmc_id}_{image_id}", "Image",
                        image_url, context, node_ids,
                        analysis=finding_text
                    )
                
                return True
            else:
                logger.warning(f"Insufficient image analysis for {image_id}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to process image {image_id}: {e}")
            return False
    
    def _link_visual_evidence(self, pmc_id: str, unique_id: str, evidence_type: str,
                             content: str, caption: str, concept_ids: List[str],
                             analysis: str = None):
        """Link visual evidence to concepts in graph"""
        try:
            params = {
                "pmc_id": pmc_id,
                "unique_id": unique_id,
                "type": evidence_type,
                "content": content,
                "caption": caption,
                "concept_ids": concept_ids
            }
            
            # Add analysis field for images
            if analysis:
                params["analysis"] = analysis[:1000]  # Limit length
                query = """
                    MATCH (p:Paper {id: $pmc_id})
                    MERGE (v:VisualEvidence {
                        id: $unique_id,
                        type: $type,
                        content: $content,
                        caption: $caption,
                        analysis: $analysis
                    })
                    MERGE (p)-[:HAS_EVIDENCE]->(v)
                    WITH v, $concept_ids AS concept_ids
                    UNWIND concept_ids AS concept_id
                    MATCH (c) WHERE c.id = concept_id
                    MERGE (v)-[:ILLUSTRATES]->(c)
                """
            else:
                query = """
                    MATCH (p:Paper {id: $pmc_id})
                    MERGE (v:VisualEvidence {
                        id: $unique_id,
                        type: $type,
                        content: $content,
                        caption: $caption
                    })
                    MERGE (p)-[:HAS_EVIDENCE]->(v)
                    WITH v, $concept_ids AS concept_ids
                    UNWIND concept_ids AS concept_id
                    MATCH (c) WHERE c.id = concept_id
                    MERGE (v)-[:ILLUSTRATES]->(c)
                """
            
            self.graph.graph.query(query, params=params)
            
        except Exception as e:
            logger.error(f"Failed to link visual evidence: {e}")

# Initialize content processor
processor = ContentProcessor(graph_manager, config)

# %% [markdown]
# ## 5. Main Pipeline Execution

# %%
class PipelineExecutor:
    """Main pipeline execution logic using Google Gemini throughout"""
    
    def __init__(self, env_manager: EnvironmentManager, graph_manager: GraphManager,
                processor: ContentProcessor, config: PipelineConfig):
        self.env = env_manager
        self.graph = graph_manager
        self.processor = processor
        self.config = config
        self.stats = {
            'papers_processed': 0,
            'text_chunks': 0,
            'tables': 0,
            'images': 0,
            'errors': 0,
            'retries': 0
        }
        
    def load_metadata(self) -> Tuple[Dict, Dict, Dict]:
        """Load paper metadata and image URLs"""
        try:
            # Load image URL mapping
            with open(self.env.images_file, 'r') as f:
                image_url_map = json.load(f)
            
            # Load paper metadata
            papers_df = pd.read_csv(self.env.csv_file)
            papers_df['pmc_id'] = papers_df['Link'].str.extract(r'(PMC\d+)', expand=False)
            papers_df.dropna(subset=['pmc_id'], inplace=True)
            
            # Create lookup dictionaries
            id_to_title = pd.Series(papers_df.Title.values, index=papers_df.pmc_id).to_dict()
            id_to_url = pd.Series(papers_df.Link.values, index=papers_df.pmc_id).to_dict()
            
            logger.info(f"Loaded metadata for {len(id_to_title)} papers")
            return image_url_map, id_to_title, id_to_url
            
        except Exception as e:
            logger.error(f"Failed to load metadata: {e}")
            raise
    
    def process_paper(self, pmc_id: str, title: str, url: str,
                     image_url_map: dict) -> bool:
        """Process a single paper using Google Gemini"""
        logger.info(f"Processing paper: {pmc_id} - {title[:50]}...")
        
        try:
            # Clean up existing data
            self.graph.cleanup_paper(pmc_id)
            
            # Create/update paper node
            self.graph.graph.query(
                "MERGE (p:Paper {id: $id}) SET p.title = $title, p.url = $url",
                params={"id": pmc_id, "title": title, "url": url}
            )
            paper_node = {"type": "Paper", "properties": {"id": pmc_id}}
            
            # Load paper text
            text_file = self.env.text_folder / f"{pmc_id}.txt"
            if not text_file.exists():
                logger.warning(f"Text file not found for {pmc_id}")
                return False
            
            with open(text_file, 'r', encoding='utf-8') as f:
                full_text = f.read()
            
            # Process content with media references
            self._process_content_with_media(
                pmc_id, full_text, paper_node, image_url_map
            )
            
            self.stats['papers_processed'] += 1
            logger.info(f"✓ Successfully processed {pmc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to process paper {pmc_id}: {e}")
            self.stats['errors'] += 1
            return False
    
    def _process_content_with_media(self, pmc_id: str, full_text: str,
                                   paper_node: dict, image_url_map: dict):
        """Process text content with embedded media references"""
        import time
        
        media_pattern = re.compile(r'(table\d+|Img\d+)')
        last_end = 0
        media_matches = list(media_pattern.finditer(full_text))
        
        # Track progress
        chunk_counter = 0
        table_counter = 0
        image_counter = 0
        
        for match in tqdm(media_matches, desc=f"Media for {pmc_id}", leave=False):
            start, end = match.span()
            media_id = match.group(0)
            
            # Process text before media reference
            text_chunk = full_text[last_end:start]
            chunks = self.processor.text_splitter.split_text(text_chunk)
            
            if chunks:
                for chunk in chunks:
                    retry_count = 0
                    while retry_count < self.config.max_retries:
                        try:
                            if self.processor.process_text_chunk(chunk, paper_node):
                                self.stats['text_chunks'] += 1
                                chunk_counter += 1
                            break
                        except Exception as e:
                            retry_count += 1
                            self.stats['retries'] += 1
                            if retry_count < self.config.max_retries:
                                logger.warning(f"Retry {retry_count} for text chunk")
                                time.sleep(self.config.retry_delay)
                            else:
                                logger.error(f"Failed after {self.config.max_retries} retries: {e}")
            
            # Extract context around media
            context_start = max(0, start - self.config.context_window)
            context_end = min(len(full_text), end + self.config.context_window)
            context = full_text[context_start:context_end]
            
            # Process media with retry logic
            retry_count = 0
            while retry_count < self.config.max_retries:
                try:
                    if media_id.startswith('table'):
                        if self.processor.process_table(
                            pmc_id, media_id, context, paper_node, self.env.tables_folder
                        ):
                            self.stats['tables'] += 1
                            table_counter += 1
                            logger.debug(f"✓ Table {media_id}")
                    elif media_id.startswith('Img'):
                        if self.processor.process_image(
                            pmc_id, media_id, context, paper_node, image_url_map
                        ):
                            self.stats['images'] += 1
                            image_counter += 1
                            logger.debug(f"✓ Image {media_id}")
                    break
                except Exception as e:
                    retry_count += 1
                    self.stats['retries'] += 1
                    if retry_count < self.config.max_retries:
                        logger.warning(f"Retry {retry_count} for {media_id}")
                        time.sleep(self.config.retry_delay)
                    else:
                        logger.error(f"Failed {media_id} after {self.config.max_retries} retries: {e}")
            
            last_end = end
        
        # Process remaining text
        remaining_text = full_text[last_end:]
        chunks = self.processor.text_splitter.split_text(remaining_text)
        
        if chunks:
            for chunk in chunks:
                retry_count = 0
                while retry_count < self.config.max_retries:
                    try:
                        if self.processor.process_text_chunk(chunk, paper_node):
                            self.stats['text_chunks'] += 1
                            chunk_counter += 1
                        break
                    except Exception as e:
                        retry_count += 1
                        self.stats['retries'] += 1
                        if retry_count < self.config.max_retries:
                            time.sleep(self.config.retry_delay)
                        else:
                            logger.error(f"Failed after retries: {e}")
        
        logger.info(f"  {pmc_id}: {chunk_counter} chunks, {table_counter} tables, {image_counter} images")
    
    def run(self, limit: Optional[int] = None):
        """Execute the main pipeline with Google Gemini"""
        logger.info("=" * 60)
        logger.info("NASA BioDB Knowledge Graph Pipeline - Google Gemini Edition")
        logger.info("=" * 60)
        
        # Load metadata
        image_url_map, id_to_title, id_to_url = self.load_metadata()
        
        # Get list of text files
        text_files = sorted([
            f for f in os.listdir(self.env.text_folder)
            if f.endswith('.txt')
        ])
        
        if limit:
            text_files = text_files[:limit]
            logger.info(f"Processing {limit} papers (limited)")
        else:
            logger.info(f"Processing {len(text_files)} papers")
        
        logger.info(f"Using Google Gemini: {self.config.llm_model}")
        
        # Process papers with progress bar
        for filename in tqdm(text_files, desc="Processing papers"):
            pmc_id = os.path.splitext(filename)[0]
            
            # Get metadata
            title = id_to_title.get(pmc_id, "Unknown Title")
            url = id_to_url.get(pmc_id, "")
            
            if title == "Unknown Title":
                logger.warning(f"Skipping {pmc_id} - no metadata found")
                continue
            
            # Process paper
            self.process_paper(pmc_id, title, url, image_url_map)
        
        # Print summary statistics
        self.print_summary()
    
    def print_summary(self):
        """Print processing summary"""
        logger.info("=" * 60)
        logger.info("Pipeline Execution Complete")
        logger.info("=" * 60)
        logger.info(f"Papers processed: {self.stats['papers_processed']}")
        logger.info(f"Text chunks: {self.stats['text_chunks']}")
        logger.info(f"Tables processed: {self.stats['tables']}")
        logger.info(f"Images processed: {self.stats['images']}")
        logger.info(f"Errors encountered: {self.stats['errors']}")
        logger.info(f"Retries performed: {self.stats['retries']}")
        
        # Query graph statistics
        try:
            node_count = self.graph.graph.query(
                "MATCH (n) RETURN count(n) as count"
            )[0]['count']
            rel_count = self.graph.graph.query(
                "MATCH ()-[r]->() RETURN count(r) as count"
            )[0]['count']
            
            # Entity type distribution
            entity_types = self.graph.graph.query("""
                MATCH (n)
                RETURN labels(n)[0] as type, count(n) as count
                ORDER BY count DESC
            """)
            
            logger.info(f"\nGraph Statistics:")
            logger.info(f"  Total nodes: {node_count}")
            logger.info(f"  Total relationships: {rel_count}")
            logger.info(f"\nEntity Distribution:")
            for row in entity_types:
                logger.info(f"  {row['type']}: {row['count']}")
                
        except Exception as e:
            logger.error(f"Could not query graph statistics: {e}")

# %% [markdown]
# ## 6. Execute Pipeline

# %%
# Initialize and run the pipeline with Google Gemini
executor = PipelineExecutor(env, graph_manager, processor, config)

# Run with limit for testing (remove limit parameter for full run)
# For production: executor.run()
executor.run(limit=20)

# %% [markdown]
# ## 7. Advanced Query Examples

# %%
# Example queries to explore the knowledge graph built with Gemini

def run_query(query: str, params: dict = None):
    """Helper function to run and display query results"""
    try:
        results = graph_manager.graph.query(query, params=params)
        return pd.DataFrame(results)
    except Exception as e:
        logger.error(f"Query failed: {e}")
        return None

print("\n" + "="*60)
print("KNOWLEDGE GRAPH EXPLORATION")
print("="*60)

# Example 1: Top entities by mention count
print("\n=== Top 15 Most Mentioned Entities ===")
query = """
MATCH (p:Paper)-[:MENTIONS]->(e)
WHERE e.type IS NOT NULL
RETURN e.id as Entity, 
       e.type as Type, 
       count(DISTINCT p) as PaperCount
ORDER BY PaperCount DESC
LIMIT 15
"""
df = run_query(query)
if df is not None:
    print(df.to_string(index=False))

# Example 2: Key AFFECTS relationships with effects
print("\n=== Top 15 AFFECTS Relationships ===")
query = """
MATCH (a)-[r:AFFECTS]->(b)
WHERE r.effect IS NOT NULL
RETURN a.id as Source, 
       r.effect as Effect, 
       b.id as Target,
       substring(coalesce(r.evidence, 'No evidence'), 0, 80) as Evidence
LIMIT 15
"""
df = run_query(query)
if df is not None:
    print(df.to_string(index=False))

# Example 3: Papers with most visual evidence
print("\n=== Papers with Most Visual Evidence ===")
query = """
MATCH (p:Paper)-[:HAS_EVIDENCE]->(v:VisualEvidence)
RETURN p.id as PaperID,
       substring(p.title, 0, 60) as Title,
       count(v) as EvidenceCount,
       collect(DISTINCT v.type) as EvidenceTypes
ORDER BY EvidenceCount DESC
LIMIT 10
"""
df = run_query(query)
if df is not None:
    print(df.to_string(index=False))

# Example 4: Stressor effects on biological entities
print("\n=== Stressor Effects on BioEntities ===")
query = """
MATCH (s:Stressor)-[r:AFFECTS]->(b:BioEntity)
RETURN s.id as Stressor,
       r.effect as Effect,
       b.id as BioEntity,
       substring(coalesce(r.evidence, ''), 0, 70) as Evidence
LIMIT 10
"""
df = run_query(query)
if df is not None:
    print(df.to_string(index=False))

# Example 5: Research by organism
print("\n=== Studies by Organism ===")
query = """
MATCH (p:Paper)-[:MENTIONS]->(o:Organism)
RETURN o.id as Organism,
       count(DISTINCT p) as StudyCount
ORDER BY StudyCount DESC
LIMIT 10
"""
df = run_query(query)
if df is not None:
    print(df.to_string(index=False))

# Example 6: Concepts with potential applications
print("\n=== Concepts with Applications ===")
query = """
MATCH (c)-[r:HAS_POTENTIAL]->(a:Application)
RETURN c.id as Concept,
       c.type as ConceptType,
       a.id as Application
LIMIT 10
"""
df = run_query(query)
if df is not None:
    print(df.to_string(index=False))

# Example 7: Most connected entities (hub analysis)
print("\n=== Most Connected Entities (Hubs) ===")
query = """
MATCH (n)
WHERE n.type IS NOT NULL AND n.type <> 'Paper'
WITH n, size((n)--()) as connections
RETURN n.id as Entity,
       n.type as Type,
       connections as TotalConnections
ORDER BY connections DESC
LIMIT 15
"""
df = run_query(query)
if df is not None:
    print(df.to_string(index=False))

# Example 8: Visual evidence with analysis
print("\n=== Image Analyses (Gemini Vision Results) ===")
query = """
MATCH (v:VisualEvidence)
WHERE v.type = 'Image' AND v.analysis IS NOT NULL
RETURN v.id as ImageID,
       substring(v.caption, 0, 50) as Caption,
       substring(v.analysis, 0, 100) as GeminiAnalysis
LIMIT 5
"""
df = run_query(query)
if df is not None:
    print(df.to_string(index=False))

# %% [markdown]
# ## 8. Graph Analysis and Insights

# %%
class GraphAnalyzer:
    """Analyze the knowledge graph using Google Gemini for insights"""
    
    def __init__(self, graph_manager: GraphManager):
        self.graph = graph_manager
        
    def get_entity_statistics(self):
        """Get comprehensive entity statistics"""
        query = """
        MATCH (n)
        WHERE n.type IS NOT NULL
        WITH n.type as EntityType, count(n) as Count
        RETURN EntityType, Count
        ORDER BY Count DESC
        """
        return self.graph.graph.query(query)
    
    def get_relationship_statistics(self):
        """Get comprehensive relationship statistics"""
        query = """
        MATCH ()-[r]->()
        RETURN type(r) as RelationType, count(r) as Count
        ORDER BY Count DESC
        """
        return self.graph.graph.query(query)
    
    def find_key_pathways(self, limit=10):
        """Find key biological pathways (chains of AFFECTS relationships)"""
        query = f"""
        MATCH path = (a)-[:AFFECTS*2..4]->(b)
        WHERE a.type IN ['Stressor', 'BioEntity'] 
          AND b.type IN ['BioEntity', 'Concept']
        WITH path, length(path) as pathLength
        RETURN [n in nodes(path) | n.id] as Pathway,
               pathLength as Steps
        ORDER BY pathLength DESC
        LIMIT {limit}
        """
        return self.graph.graph.query(query)
    
    def find_research_gaps(self):
        """Identify under-studied areas"""
        query = """
        MATCH (n)
        WHERE n.type IN ['BioEntity', 'Concept', 'Stressor']
        WITH n, size((n)--()) as connections
        WHERE connections < 3
        RETURN n.id as Entity, n.type as Type, connections as Connections
        ORDER BY connections ASC
        LIMIT 20
        """
        return self.graph.graph.query(query)
    
    def summarize_with_gemini(self, data: List[Dict], analysis_type: str) -> str:
        """Use Gemini to generate natural language summary of analysis"""
        try:
            # Prepare data summary
            data_json = json.dumps(data, indent=2)
            
            prompt = f"""Analyze this knowledge graph data and provide a concise scientific summary:

ANALYSIS TYPE: {analysis_type}

DATA:
{data_json}

Provide:
1. Key patterns and trends
2. Most significant findings
3. Potential research implications

Keep response under 200 words."""
            
            response = self.graph.llm.invoke(prompt)
            return response.content
            
        except Exception as e:
            logger.error(f"Gemini summarization failed: {e}")
            return "Summary unavailable"

# Initialize analyzer
analyzer = GraphAnalyzer(graph_manager)

print("\n" + "="*60)
print("GRAPH ANALYSIS WITH GEMINI")
print("="*60)

# Entity statistics
print("\n=== Entity Type Distribution ===")
entity_stats = analyzer.get_entity_statistics()
for stat in entity_stats:
    print(f"  {stat['EntityType']}: {stat['Count']}")

# Relationship statistics  
print("\n=== Relationship Type Distribution ===")
rel_stats = analyzer.get_relationship_statistics()
for stat in rel_stats:
    print(f"  {stat['RelationType']}: {stat['Count']}")

# Key pathways
print("\n=== Key Biological Pathways (Multi-hop AFFECTS) ===")
pathways = analyzer.find_key_pathways(5)
for i, pathway in enumerate(pathways, 1):
    path_str = " → ".join(pathway['Pathway'])
    print(f"{i}. {path_str} ({pathway['Steps']} steps)")

# Research gaps
print("\n=== Under-studied Entities (Research Gaps) ===")
gaps = analyzer.find_research_gaps()
for gap in gaps[:10]:
    print(f"  {gap['Entity']} ({gap['Type']}): {gap['Connections']} connections")

# Gemini-powered summary
print("\n=== Gemini-Generated Analysis Summary ===")
summary = analyzer.summarize_with_gemini(
    entity_stats + rel_stats,
    "Knowledge Graph Structure Analysis"
)
print(summary)

# %% [markdown]
# ## 9. Export and Backup Functions

# %%
def export_graph_to_json(filename: str = "graph_export.json"):
    """Export the entire graph to a JSON file"""
    try:
        logger.info("Exporting graph to JSON...")
        
        nodes_query = """
        MATCH (n)
        RETURN n.id as id, 
               labels(n)[0] as type,
               properties(n) as properties
        """
        
        rels_query = """
        MATCH (a)-[r]->(b)
        RETURN a.id as source,
               type(r) as type,
               b.id as target,
               properties(r) as properties
        """
        
        nodes = graph_manager.graph.query(nodes_query)
        relationships = graph_manager.graph.query(rels_query)
        
        export_data = {
            "metadata": {
                "export_date": datetime.now().isoformat(),
                "node_count": len(nodes),
                "relationship_count": len(relationships),
                "model_used": config.llm_model,
                "vision_model": config.vision_model
            },
            "nodes": nodes,
            "relationships": relationships
        }
        
        with open(filename, 'w') as f:
            json.dump(export_data, f, indent=2, default=str)
        
        logger.info(f"✓ Graph exported to {filename}")
        logger.info(f"  Nodes: {len(nodes)}, Relationships: {len(relationships)}")
        
    except Exception as e:
        logger.error(f"Failed to export graph: {e}")

def export_to_csv(output_dir: str = "graph_exports"):
    """Export graph data to CSV files for analysis"""
    try:
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        logger.info(f"Exporting graph to CSV files in {output_dir}/...")
        
        # Export nodes by type
        node_types = ['Paper', 'BioEntity', 'Concept', 'Stressor', 
                     'Organism', 'MissionContext', 'Application', 'Institution']
        
        for node_type in node_types:
            query = f"""
            MATCH (n:{node_type})
            RETURN n.id as id, properties(n) as properties
            """
            try:
                results = graph_manager.graph.query(query)
                if results:
                    df = pd.DataFrame(results)
                    df.to_csv(output_path / f"{node_type.lower()}_nodes.csv", index=False)
                    logger.info(f"  ✓ {node_type}: {len(results)} nodes")
            except:
                pass
        
        # Export relationships
        rel_query = """
        MATCH (a)-[r]->(b)
        RETURN a.id as source,
               labels(a)[0] as source_type,
               type(r) as relationship,
               b.id as target,
               labels(b)[0] as target_type,
               properties(r) as properties
        """
        results = graph_manager.graph.query(rel_query)
        df = pd.DataFrame(results)
        df.to_csv(output_path / "relationships.csv", index=False)
        logger.info(f"  ✓ Relationships: {len(results)}")
        
        # Export visual evidence
        evidence_query = """
        MATCH (v:VisualEvidence)
        RETURN v.id as id,
               v.type as type,
               v.caption as caption,
               v.analysis as analysis
        """
        results = graph_manager.graph.query(evidence_query)
        if results:
            df = pd.DataFrame(results)
            df.to_csv(output_path / "visual_evidence.csv", index=False)
            logger.info(f"  ✓ Visual Evidence: {len(results)}")
        
        logger.info(f"✓ CSV export complete in {output_dir}/")
        
    except Exception as e:
        logger.error(f"Failed to export to CSV: {e}")

def create_graph_backup():
    """Create a timestamped backup of the graph"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = Path("backups")
    backup_dir.mkdir(exist_ok=True)
    
    # JSON export
    json_file = backup_dir / f"graph_backup_{timestamp}.json"
    export_graph_to_json(str(json_file))
    
    # CSV export
    csv_dir = backup_dir / f"csv_backup_{timestamp}"
    export_to_csv(str(csv_dir))
    
    logger.info(f"✓ Complete backup created: backups/graph_backup_{timestamp}.*")

# Create backup
print("\n" + "="*60)
print("CREATING GRAPH BACKUP")
print("="*60)
create_graph_backup()

# %% [markdown]
# ## 10. Utility Functions

# %%
def validate_graph_integrity():
    """Validate graph data integrity"""
    print("\n" + "="*60)
    print("GRAPH INTEGRITY VALIDATION")
    print("="*60)
    
    # Check for orphaned nodes
    query = """
    MATCH (n)
    WHERE NOT (n)--()
    RETURN count(n) as orphaned_nodes
    """
    result = graph_manager.graph.query(query)
    print(f"Orphaned nodes: {result[0]['orphaned_nodes']}")
    
    # Check for nodes without type
    query = """
    MATCH (n)
    WHERE n.type IS NULL AND NOT n:Paper
    RETURN count(n) as untyped_nodes
    """
    result = graph_manager.graph.query(query)
    print(f"Untyped nodes: {result[0]['untyped_nodes']}")
    
    # Check AFFECTS relationships without evidence
    query = """
    MATCH ()-[r:AFFECTS]->()
    WHERE r.evidence IS NULL OR r.effect IS NULL
    RETURN count(r) as incomplete_affects
    """
    result = graph_manager.graph.query(query)
    print(f"AFFECTS relationships missing properties: {result[0]['incomplete_affects']}")
    
    print("✓ Validation complete")

def get_paper_summary(pmc_id: str):
    """Get a comprehensive summary of a paper's graph data"""
    query = """
    MATCH (p:Paper {id: $pmc_id})
    OPTIONAL MATCH (p)-[:MENTIONS]->(e)
    OPTIONAL MATCH (p)-[:HAS_EVIDENCE]->(v:VisualEvidence)
    RETURN p.title as title,
           count(DISTINCT e) as entities_mentioned,
           count(DISTINCT v) as visual_evidence,
           collect(DISTINCT e.type) as entity_types
    """
    result = graph_manager.graph.query(query, params={"pmc_id": pmc_id})
    
    if result:
        print(f"\n=== Paper Summary: {pmc_id} ===")
        print(f"Title: {result[0]['title']}")
        print(f"Entities mentioned: {result[0]['entities_mentioned']}")
        print(f"Visual evidence: {result[0]['visual_evidence']}")
        print(f"Entity types: {', '.join(result[0]['entity_types'])}")

def search_entities(search_term: str, limit: int = 10):
    """Search for entities containing a specific term"""
    query = """
    MATCH (n)
    WHERE toLower(n.id) CONTAINS toLower($term)
    RETURN n.id as entity, 
           n.type as type,
           size((n)--()) as connections
    ORDER BY connections DESC
    LIMIT $limit
    """
    results = graph_manager.graph.query(
        query, 
        params={"term": search_term, "limit": limit}
    )
    
    print(f"\n=== Search Results for '{search_term}' ===")
    for r in results:
        print(f"  {r['entity']} ({r['type']}) - {r['connections']} connections")

# Run validation
validate_graph_integrity()

# Example searches (uncomment to use)
# search_entities("radiation")
# search_entities("DNA")
# get_paper_summary("PMC8234567")  # Replace with actual PMC ID

print("\n✅ Pipeline setup complete and ready for use!")
print("="*60)
print("\nNOTE: This pipeline uses Google Gemini models exclusively:")
print(f"  - Text processing: {config.llm_model}")
print(f"  - Vision analysis: {config.vision_model}")
print("  - No HuggingFace models are used")
print("="*60)