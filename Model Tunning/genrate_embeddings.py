import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
import pdfplumber

# Load environment variables
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found")
os.environ["GOOGLE_API_KEY"] = api_key

# Paths
persist_dir = os.path.abspath("./chroma_langchain_db")
os.makedirs(persist_dir, exist_ok=True)

pdf_folder = os.path.join(
    os.path.dirname(os.getcwd()),
    "Space-Biology-Knowledge-Engine",
    "Research Data set",
    "pdf-set-608"
)

# Initialize embeddings & Chroma vector store
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
vector_store = Chroma(
    collection_name="example_collection",
    embedding_function=embeddings,
    persist_directory=persist_dir,
)

# Load PDFs
all_texts = []
for f in os.listdir(pdf_folder):
    if f.lower().endswith(".pdf"):
        pdf_path = os.path.join(pdf_folder, f)
        with pdfplumber.open(pdf_path) as pdf:
            text = "".join([p.extract_text() + "\n" for p in pdf.pages if p.extract_text()])
            if text.strip():
                all_texts.append(text)
print(f"[INFO] Loaded {len(all_texts)} PDFs")

# Split into chunks
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
chunks = []
for t in all_texts:
    chunks.extend(text_splitter.split_text(t))
print(f"[INFO] Total chunks created: {len(chunks)}")

# Add chunks to Chroma (no persist needed)
batch_size = 10
for i in range(0, len(chunks), batch_size):
    batch = chunks[i:i+batch_size]
    vector_store.add_texts(batch)
    print(f"[INFO] Added batch {i//batch_size + 1} ({len(batch)} chunks)")

# Verify database content
try:
    total_vectors = vector_store._collection.count()
    print(f"[SUCCESS] Total vectors in Chroma DB: {total_vectors}")
except Exception as e:
    print(f"[WARN] Could not verify database: {e}")

print("[INFO] All done!")
