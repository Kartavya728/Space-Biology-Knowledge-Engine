import os
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model

# Load variables from .env
load_dotenv()  

# Retrieve the API key
api_key = os.getenv("GOOGLE_API_KEY")
if api_key is None:
    raise ValueError("GOOGLE_API_KEY not found in .env file!")

os.environ["GOOGLE_API_KEY"] = api_key

# Initialize Gemini model with streaming
model = init_chat_model(
    "gemini-2.5-flash",
    model_provider="google_genai",
    streaming=True
)

# Stream output
print("Streaming output:\n")
for chunk in model.stream("Explain the theory of relativity in simple terms."):
    if hasattr(chunk, "content") and chunk.content:
        print(chunk.content, end="", flush=True)

print("\n\nDone!")
