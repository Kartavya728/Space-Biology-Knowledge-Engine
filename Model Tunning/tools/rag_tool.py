# tools/rag_tool.py
import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
# OLD: from langchain_community.embeddings import OllamaEmbeddings
# OLD: from langchain_community.llms import Ollama
# NEW:
from langchain_ollama import OllamaEmbeddings, OllamaLLM # Use the new package
from langchain_community.vectorstores import Chroma # This should still be correct
from langchain.chains import RetrievalQA
from langchain.agents import Tool

# Define the path to your research data set
# FIX THIS PATH:
# Assuming project_root is "F:\GenAI projects\Space-Biology-Knowledge-Engine\"
# And the Research Data Set is directly under it.
# The `ReAct.py` (main_agent.py) is in `Model Tunning`
# `tools` is in `Model Tunning`
# So, from `tools`, we need to go up two directories (`../..`) to reach `Space-Biology-Knowledge-Engine`
# then go into `Research Data Set`.

RESEARCH_DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Research Data Set'))
PERSIST_DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'chroma_db'))
# Note: Using os.path.abspath ensures we get a full, canonical path, which is safer.

def _load_documents(data_path):
    """Loads text documents from the specified directory."""
    print(f"Loading documents from: {data_path}")
    if not os.path.exists(data_path) or not os.listdir(data_path): # Also check if directory is empty
        print(f"Warning: Research Data Set directory not found or is empty at {data_path}. RAG tool might not have data.")
        return []
    loader = DirectoryLoader(data_path, glob="**/*.txt", loader_cls=TextLoader)
    documents = loader.load()
    return documents

def _split_documents(documents):
    """Splits documents into smaller chunks."""
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    texts = text_splitter.split_documents(documents)
    return texts

def _create_vector_store(texts, embeddings_model, persist_directory):
    """Creates or loads a Chroma vector store."""
    if os.path.exists(persist_directory) and len(os.listdir(persist_directory)) > 0:
        print(f"Loading existing Chroma DB from {persist_directory}")
        # When loading, you just need to pass the embedding_function once for queries
        vectorstore = Chroma(persist_directory=persist_directory, embedding_function=embeddings_model)
    else:
        print(f"Creating new Chroma DB in {persist_directory}")
        # Only create if texts are available, otherwise from_documents might fail on empty list
        if not texts:
            print("No documents to process for Chroma DB creation. Skipping.")
            return None # Or handle as appropriate
        vectorstore = Chroma.from_documents(documents=texts, embedding_function=embeddings_model, persist_directory=persist_directory)
    return vectorstore

def get_rag_tool():
    """
    Returns a LangChain Tool for querying a RAG model using local research data.
    Uses Ollama for embeddings and LLM.
    """
    llm = OllamaLLM(model="llama2") # Use OllamaLLM from the new package
    embeddings = OllamaEmbeddings(model="nomic-embed-text") # Use OllamaEmbeddings from the new package

    documents = _load_documents(RESEARCH_DATA_PATH)
    texts = _split_documents(documents)

    # Handle case where no documents are loaded
    if not documents:
        print("No documents were loaded for RAG. RAG tool might not be effective.")
        # Return a dummy tool or a tool that indicates no data
        def no_rag_data_func(query: str) -> str:
            return "RAG tool has no data loaded. Please check Research Data Set directory."
        return Tool(
            name="Research Data Query",
            func=no_rag_data_func,
            description="A tool for querying internal research data, but currently has no data loaded."
        )

    vectorstore = _create_vector_store(texts, embeddings, PERSIST_DIRECTORY)

    # Handle case where vectorstore couldn't be created (e.g., no texts)
    if vectorstore is None:
         def no_vectorstore_func(query: str) -> str:
            return "RAG tool failed to create a vector store. No internal data available."
         return Tool(
            name="Research Data Query",
            func=no_vectorstore_func,
            description="A tool for querying internal research data, but currently has no vector store created."
        )

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vectorstore.as_retriever(),
        return_source_documents=True
    )

    def run_rag_query(query: str) -> str:
        """
        Runs a query against the RAG model to retrieve information from local data.
        """
        result = qa_chain.invoke({"query": query})
        return result['result']

    return Tool(
        name="Research Data Query",
        func=run_rag_query,
        description="A tool for querying internal research data. Input should be a question relevant to the research data."
    )

if __name__ == "__main__":
    # Example usage:
    # To make this example runnable, create a directory '../Research Data Set'
    # and put some .txt files in it, e.g., a file named 'capital_info.txt'
    # with content like: "The capital of Madhya Pradesh is Bhopal."
    # Also ensure Ollama is running and models are pulled.

    # Create a dummy data directory and file for testing if they don't exist
    # Adjust this test path to match the new RESEARCH_DATA_PATH logic
    test_data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Research Data Set'))
    os.makedirs(test_data_dir, exist_ok=True)
    test_file_path = os.path.join(test_data_dir, 'test_info.txt')
    if not os.path.exists(test_file_path):
        with open(test_file_path, 'w') as f:
            f.write("The capital of Madhya Pradesh is Bhopal. Madhya Pradesh is a state in central India.\n")
            f.write("Bhopal is known for its lakes and green spaces.\n")

    print("Initializing RAG tool...")
    rag_tool = get_rag_tool()
    print("RAG tool initialized.")

    if "RAG tool has no data loaded" in rag_tool.description or "RAG tool failed to create a vector store" in rag_tool.description:
        print("RAG tool is not fully functional due to missing data or vector store issues.")
    else:
        print("\nQuerying RAG tool for capital of Madhya Pradesh:")
        rag_result = rag_tool.run("What is the capital of Madhya Pradesh?")
        print(f"RAG Result: {rag_result}")

        print("\nQuerying RAG tool for general info about Bhopal:")
        rag_result_bhopal = rag_tool.run("What is Bhopal known for?")
        print(f"RAG Result: {rag_result_bhopal}")