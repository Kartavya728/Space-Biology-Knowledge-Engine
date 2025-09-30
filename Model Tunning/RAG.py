import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from dotenv import load_dotenv
from typing import Dict, List, Set
import json

load_dotenv()

# --- Setup Embeddings ---
api_key = os.getenv("GOOGLE_API_KEY")
if api_key is None:
    raise ValueError("GOOGLE_API_KEY not found in environment variables!")
os.environ["GOOGLE_API_KEY"] = api_key

embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

# --- Load the Vector Store ---
vector_store = Chroma(
    collection_name="example_collection",
    embedding_function=embeddings,
    persist_directory="./chroma_langchain_db",
)

# --- Create a Retriever with configurable parameters ---
def create_retriever(k: int = 5, filter_dict: Dict = None):
    """Create retriever with optional metadata filtering."""
    search_kwargs = {"k": k}
    if filter_dict:
        search_kwargs["filter"] = filter_dict
    
    return vector_store.as_retriever(
        search_type="similarity",
        search_kwargs=search_kwargs
    )

def parse_media_refs(metadata: Dict) -> Dict[str, List[str]]:
    """Parse media references from metadata."""
    refs = {
        'images': [],
        'tables': [],
        'direct_refs': []
    }
    
    # Parse comma-separated strings back to lists
    if metadata.get('images'):
        refs['images'] = [img.strip() for img in metadata['images'].split(',') if img.strip()]
    
    if metadata.get('tables'):
        refs['tables'] = [tbl.strip() for tbl in metadata['tables'].split(',') if tbl.strip()]
    
    if metadata.get('direct_refs'):
        refs['direct_refs'] = [ref.strip() for ref in metadata['direct_refs'].split(',') if ref.strip()]
    
    return refs

def format_context_with_media(docs: List, include_metadata: bool = True) -> str:
    """Format retrieved documents with media references clearly indicated."""
    formatted_blocks = []
    
    for i, doc in enumerate(docs, 1):
        block = f"--- Document {i} ---\n"
        
        if include_metadata:
            block += f"Source: {doc.metadata.get('source', 'Unknown')}\n"
        
        # Parse media references
        media_refs = parse_media_refs(doc.metadata)
        
        # Add media reference indicators
        if media_refs['images'] or media_refs['tables']:
            block += "Media References:\n"
            
            if media_refs['direct_refs']:
                block += f"  Direct: {', '.join(media_refs['direct_refs'])}\n"
            
            if media_refs['images']:
                block += f"  Images: {', '.join(media_refs['images'])}\n"
            
            if media_refs['tables']:
                block += f"  Tables: {', '.join(media_refs['tables'])}\n"
            
            block += "\n"
        
        # Add the actual content
        block += doc.page_content + "\n"
        formatted_blocks.append(block)
    
    return "\n".join(formatted_blocks)

def get_context_with_media(query: str, k: int = 5, 
                           require_media: bool = False) -> Dict:
    """
    Retrieve context for a query with comprehensive media reference tracking.
    
    Args:
        query: Search query
        k: Number of documents to retrieve
        require_media: If True, only retrieve chunks that have media references
    
    Returns:
        Dictionary containing context, unique media references, and metadata
    """
    # Optional: Filter for chunks with media
    filter_dict = None
    if require_media:
        filter_dict = {"$or": [
            {"has_images": True},
            {"has_tables": True}
        ]}
    
    retriever = create_retriever(k=k, filter_dict=filter_dict)
    docs = retriever.get_relevant_documents(query)
    
    # Aggregate all unique media references
    all_images: Set[str] = set()
    all_tables: Set[str] = set()
    direct_refs: Set[str] = set()
    
    doc_details = []
    
    for doc in docs:
        media_refs = parse_media_refs(doc.metadata)
        
        all_images.update(media_refs['images'])
        all_tables.update(media_refs['tables'])
        direct_refs.update(media_refs['direct_refs'])
        
        doc_details.append({
            'source': doc.metadata.get('source', 'Unknown'),
            'content': doc.page_content,
            'media': media_refs
        })
    
    # Format context
    context = format_context_with_media(docs, include_metadata=True)
    
    return {
        'context': context,
        'references': {
            'images': sorted(list(all_images)),
            'tables': sorted(list(all_tables)),
            'direct_refs': sorted(list(direct_refs))
        },
        'document_details': doc_details,
        'total_documents': len(docs)
    }

def display_results(result: Dict):
    """Pretty print the retrieval results."""
    print("=" * 80)
    print("RETRIEVED CONTEXT")
    print("=" * 80)
    print(result['context'])
    
    print("\n" + "=" * 80)
    print("MEDIA REFERENCES SUMMARY")
    print("=" * 80)
    
    refs = result['references']
    
    if refs['images']:
        print(f"\nImages Found ({len(refs['images'])}):")
        for img in refs['images']:
            print(f"  • {img}")
    else:
        print("\nImages Found: None")
    
    if refs['tables']:
        print(f"\nTables Found ({len(refs['tables'])}):")
        for tbl in refs['tables']:
            print(f"  • {tbl}")
    else:
        print("\nTables Found: None")
    
    if refs['direct_refs']:
        print(f"\nDirect References ({len(refs['direct_refs'])}):")
        for ref in refs['direct_refs']:
            print(f"  • {ref}")
    
    print(f"\n{'=' * 80}")
    print(f"Total Documents Retrieved: {result['total_documents']}")
    print("=" * 80)

# --- Example Usage ---
if __name__ == "__main__":
    # Example 1: General query
    print("\n### Example 1: General Query ###")
    query1 = "Tell me about the degree of amino acid similarity across all 13 Arabidopsis"
    result1 = get_context_with_media(query1, k=3)
    display_results(result1)

    
    # Export references for use with image/table loading
    print("\n\n### Media Reference Export (JSON) ###")