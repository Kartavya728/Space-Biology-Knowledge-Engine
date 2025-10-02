import os
import re
import gc
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import List, Dict, Tuple
from collections import defaultdict

# Load environment variables
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found")
os.environ["GOOGLE_API_KEY"] = api_key

# Paths
persist_dir = os.path.abspath("./chroma_langchain_db")
os.makedirs(persist_dir, exist_ok=True)

text_folder = os.path.join(
    os.path.dirname(os.getcwd()),
    "Space-Biology-Knowledge-Engine",
    "Research Data set",
    "text"
)

def extract_media_with_positions(text: str) -> List[Tuple[str, int, int, str]]:
    """
    Extract media references with their positions in text.
    Returns: List of (media_id, start_pos, end_pos, media_type)
    """
    media_pattern = r'(img-[a-zA-Z0-9]+|table\d+)'
    matches = []
    
    for m in re.finditer(media_pattern, text):
        media_id = m.group(0)
        media_type = 'image' if media_id.startswith('img-') else 'table'
        matches.append((media_id, m.start(), m.end(), media_type))
    
    return matches

def create_contextual_chunks_with_extended_linking(
    text: str, 
    chunk_size: int = 1000, 
    chunk_overlap: int = 200,
    min_media_links: int = 3,
    context_window: int = 800
) -> List[Dict]:
    """
    Create chunks with extended media linking to ensure each media 
    reference appears in at least min_media_links chunks.
    
    Args:
        text: Input text
        chunk_size: Target chunk size
        chunk_overlap: Overlap between chunks
        min_media_links: Minimum number of chunks each media should be linked to
        context_window: Character window around chunk to search for media
    """
    # Extract all media references with positions
    media_matches = extract_media_with_positions(text)
    
    # Split text into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    
    chunks_text = text_splitter.split_text(text)
    
    # Map media to chunk indices
    media_to_chunks = defaultdict(set)
    enhanced_chunks = []
    current_pos = 0
    
    # First pass: identify natural associations
    for chunk_idx, chunk_text in enumerate(chunks_text):
        chunk_start = text.find(chunk_text, current_pos)
        if chunk_start == -1:
            chunk_start = current_pos
        chunk_end = chunk_start + len(chunk_text)
        
        # Extended context window for media association
        context_start = max(0, chunk_start - context_window)
        context_end = min(len(text), chunk_end + context_window)
        
        relevant_media = {
            'images': [],
            'tables': [],
            'direct_refs': []
        }
        
        for media_id, media_start, media_end, media_type in media_matches:
            # Check if media is within context window
            if context_start <= media_start <= context_end:
                media_to_chunks[media_id].add(chunk_idx)
                
                if media_type == 'image':
                    relevant_media['images'].append(media_id)
                else:
                    relevant_media['tables'].append(media_id)
                
                # Check if directly in chunk
                if chunk_start <= media_start <= chunk_end:
                    relevant_media['direct_refs'].append(media_id)
        
        # Remove duplicates while preserving order
        relevant_media['images'] = list(dict.fromkeys(relevant_media['images']))
        relevant_media['tables'] = list(dict.fromkeys(relevant_media['tables']))
        relevant_media['direct_refs'] = list(dict.fromkeys(relevant_media['direct_refs']))
        
        enhanced_chunks.append({
            'text': chunk_text,
            'media_refs': relevant_media,
            'chunk_idx': chunk_idx,
            'start_pos': chunk_start,
            'end_pos': chunk_end
        })
        
        current_pos = chunk_end
    
    # Second pass: ensure minimum linking
    for media_id, linked_chunks in media_to_chunks.items():
        if len(linked_chunks) < min_media_links:
            # Find media position
            media_pos = None
            media_type = None
            for m_id, m_start, m_end, m_type in media_matches:
                if m_id == media_id:
                    media_pos = m_start
                    media_type = m_type
                    break
            
            if media_pos is None:
                continue
            
            # Find nearest chunks to extend linking
            chunk_distances = []
            for chunk_data in enhanced_chunks:
                if chunk_data['chunk_idx'] not in linked_chunks:
                    # Calculate distance from media to chunk
                    chunk_mid = (chunk_data['start_pos'] + chunk_data['end_pos']) / 2
                    distance = abs(chunk_mid - media_pos)
                    chunk_distances.append((distance, chunk_data['chunk_idx'], chunk_data))
            
            # Sort by distance and add to nearest chunks
            chunk_distances.sort(key=lambda x: x[0])
            additional_needed = min_media_links - len(linked_chunks)
            
            for _, chunk_idx, chunk_data in chunk_distances[:additional_needed]:
                if media_type == 'image':
                    if media_id not in chunk_data['media_refs']['images']:
                        chunk_data['media_refs']['images'].append(media_id)
                else:
                    if media_id not in chunk_data['media_refs']['tables']:
                        chunk_data['media_refs']['tables'].append(media_id)
                
                media_to_chunks[media_id].add(chunk_idx)
                
                if len(media_to_chunks[media_id]) >= min_media_links:
                    break
    
    # Report linking statistics
    print(f"\n[INFO] Media Linking Statistics:")
    images_count = defaultdict(int)
    tables_count = defaultdict(int)
    
    for media_id, chunks in media_to_chunks.items():
        if media_id.startswith('img-'):
            images_count[len(chunks)] += 1
        else:
            tables_count[len(chunks)] += 1
    
    print(f"  Images: {sum(images_count.values())} unique")
    for link_count, num_images in sorted(images_count.items()):
        print(f"    - {num_images} images linked to {link_count} chunks")
    
    print(f"  Tables: {sum(tables_count.values())} unique")
    for link_count, num_tables in sorted(tables_count.items()):
        print(f"    - {num_tables} tables linked to {link_count} chunks")
    
    return enhanced_chunks

# Initialize embeddings & Chroma vector store
print("[INFO] Initializing embeddings and vector store...")
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
vector_store = Chroma(
    collection_name="example_collection",
    embedding_function=embeddings,
    persist_directory=persist_dir,
)

# Get list of text files
txt_files = [f for f in os.listdir(text_folder) if f.lower().endswith(".txt")]
txt_files = sorted(txt_files)[:5]
print(f"[INFO] Found {len(txt_files)} text files to process")

batch_size = 10
global_chunk_id = 0

for file_idx, filename in enumerate(txt_files, 1):
    print(f"\n{'='*60}")
    print(f"[INFO] Processing file {file_idx}/{len(txt_files)}: {filename}")
    print(f"{'='*60}")
    
    # Read file
    txt_path = os.path.join(text_folder, filename)
    with open(txt_path, "r", encoding="utf-8") as file:
        text = file.read()
    
    if not text.strip():
        print(f"[WARN] File is empty, skipping...")
        continue
    
    print(f"[INFO] File size: {len(text)} characters")
    
    # Create contextual chunks with extended linking
    enhanced_chunks = create_contextual_chunks_with_extended_linking(
        text, 
        chunk_size=1000, 
        chunk_overlap=200,
        min_media_links=3,
        context_window=800
    )
    
    print(f"[INFO] Created {len(enhanced_chunks)} chunks")
    
    # Prepare batch data
    chunks = []
    metadatas = []
    ids = []
    
    for chunk_data in enhanced_chunks:
        chunk_text = chunk_data['text']
        media_refs = chunk_data['media_refs']
        
        # Create rich metadata
        metadata = {
            "source": filename,
            "chunk_id": global_chunk_id,
            "file_chunk_idx": chunk_data['chunk_idx'],
            # Store media references as comma-separated strings
            "images": ",".join(media_refs['images']) if media_refs['images'] else "",
            "tables": ",".join(media_refs['tables']) if media_refs['tables'] else "",
            "direct_refs": ",".join(media_refs['direct_refs']) if media_refs['direct_refs'] else "",
            "has_images": len(media_refs['images']) > 0,
            "has_tables": len(media_refs['tables']) > 0,
            # Store counts
            "image_count": len(media_refs['images']),
            "table_count": len(media_refs['tables']),
            "total_media_count": len(media_refs['images']) + len(media_refs['tables'])
        }
        
        chunks.append(chunk_text)
        metadatas.append(metadata)
        ids.append(f"{filename}_{global_chunk_id}")
        global_chunk_id += 1
    
    # Add chunks to Chroma in batches
    print(f"[INFO] Adding {len(chunks)} chunks to vector store...")
    for i in range(0, len(chunks), batch_size):
        batch_texts = chunks[i:i+batch_size]
        batch_metas = metadatas[i:i+batch_size]
        batch_ids = ids[i:i+batch_size]
        
        vector_store.add_texts(
            texts=batch_texts, 
            metadatas=batch_metas, 
            ids=batch_ids
        )
        print(f"  - Batch {i//batch_size + 1}/{(len(chunks)-1)//batch_size + 1} added")
    
    # Clear memory after processing each file
    del text, enhanced_chunks, chunks, metadatas, ids
    gc.collect()
    print(f"[INFO] Memory cleared for {filename}")

# Final verification
print(f"\n{'='*60}")
print("[INFO] Verifying database content...")
print(f"{'='*60}")

try:
    total_vectors = vector_store._collection.count()
    print(f"[SUCCESS] Total vectors in Chroma DB: {total_vectors}")
    
    # Sample chunks with media
    print("\n[INFO] Sampling chunks with media references:")
    sample_results = vector_store.similarity_search(
        "spaceflight study table", 
        k=3,
        filter={"has_tables": True}
    )
    
    for idx, doc in enumerate(sample_results, 1):
        print(f"\nSample {idx}:")
        print(f"  Source: {doc.metadata.get('source')}")
        print(f"  Images: {doc.metadata.get('images', 'None')}")
        print(f"  Tables: {doc.metadata.get('tables', 'None')}")
        print(f"  Direct refs: {doc.metadata.get('direct_refs', 'None')}")
        print(f"  Preview: {doc.page_content[:150]}...")
    
    # Check media distribution
    print("\n[INFO] Checking media reference distribution:")
    all_docs = vector_store.get()
    
    if all_docs and 'metadatas' in all_docs:
        media_link_counts = defaultdict(int)
        
        for meta in all_docs['metadatas']:
            images = meta.get('images', '').split(',') if meta.get('images') else []
            tables = meta.get('tables', '').split(',') if meta.get('tables') else []
            
            for img in images:
                if img.strip():
                    media_link_counts[img.strip()] += 1
            
            for tbl in tables:
                if tbl.strip():
                    media_link_counts[tbl.strip()] += 1
        
        print(f"\n  Total unique media items: {len(media_link_counts)}")
        
        # Count by link frequency
        link_distribution = defaultdict(int)
        for media_id, count in media_link_counts.items():
            link_distribution[count] += 1
        
        print("\n  Link distribution:")
        for link_count in sorted(link_distribution.keys()):
            print(f"    {link_distribution[link_count]} media items linked to {link_count} chunks")
        
        # Verify minimum linking requirement
        under_linked = sum(1 for count in media_link_counts.values() if count < 3)
        if under_linked > 0:
            print(f"\n  [WARN] {under_linked} media items linked to fewer than 3 chunks")
        else:
            print(f"\n  [SUCCESS] All media items linked to at least 3 chunks!")

except Exception as e:
    print(f"[ERROR] Could not verify database: {e}")
    import traceback
    traceback.print_exc()

# Final cleanup
gc.collect()
print("\n[INFO] All done! Data persisted successfully with extended media linking.")
print(f"[INFO] Database location: {persist_dir}")