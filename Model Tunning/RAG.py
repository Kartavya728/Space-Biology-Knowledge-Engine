import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from dotenv import load_dotenv

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

# --- Create a Retriever ---
retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 3})

# --- Function to get context for a query ---
def get_context(query: str):
    docs = retriever.get_relevant_documents(query)  # directly use retriever
    context = "\n\n".join([doc.page_content for doc in docs])
    return context

# --- Example usage ---
query = "who uses ISATab metadata specification"
context = get_context(query)

print("=== Retrieved Context ===")
print(context)
