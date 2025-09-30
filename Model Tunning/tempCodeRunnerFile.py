import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_community.vectorstores.utils import filter_complex_metadata

# ---------------- Load Environment ----------------
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found")
os.environ["GOOGLE_API_KEY"] = api_key

# ---------------- Paths ----------------
persist_dir = os.path.abspath("./chroma_langchain_db")
os.makedirs(persist_dir, exist_ok=True)

text_folder = os.path.join(
    os.path.dirname(os.getcwd()),
    "Space-Biology-Knowledge-Engine",
    "Research Data set",
    "text"
)

# ---------------- Initialize Embeddings & Chroma ----------------
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
vector_store = Chroma(
    collection_name="example_collection",
    embedding_function=embeddings,
    persist_directory=persist_dir,
)

# ---------------- Load first 5 TXT files ----------------
txt_files = [f for f in os.listdir(text_folder) if f.lower().endswith(".txt")]
txt_files = sorted(txt_files)[:5]  # first 5 files only
print(f"[INFO] Processing {len(txt_files)} text files")

# ---------------- Process per file ----------------
chunk_id_global = 0
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)

for file_index, filename in enumerate(txt_files, 1):
    txt_path = os.path.join(text_folder, filename)
    with open(txt_path, "r", encoding="utf-8") as file:
        text = file.read()
    if not text.strip():
        continue

    # Split text into chunks
    split_chunks = text_splitter.split_text(text)
    documents = [
        Document(
            page_content=chunk,
            metadata={"source": filename, "id": f"{filename}_{i + chunk_id_global}"}
        )
        for i, chunk in enumerate(split_chunks)
    ]
    # Filter metadata to avoid Chroma errors
    documents = filter_complex_metadata(documents)

    # Add to Chroma
    vector_store.add_documents(documents)
    chunk_id_global += len(split_chunks)

    print(f"[INFO] Added {len(split_chunks)} chunks from {filename} ({file_index}/{len(txt_files)})")

# ---------------- Final persist ----------------
vector_store.persist()
print("[INFO] Database persist complete")

# ---------------- Verify ----------------
try:
    total_vectors = vector_store._collection.count()
    print(f"[SUCCESS] Total vectors in Chroma DB: {total_vectors}")
except Exception as e:
    print(f"[WARN] Could not verify database: {e}")

print("[INFO] All done! Data persisted successfully.")
