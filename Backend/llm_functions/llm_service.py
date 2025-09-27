from django.conf import settings
import os
import json
import os
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model

# Load variables from .env
# Removed unused imports to keep the code clean
# from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
# from langchain_core.output_parsers import JsonOutputParser
# from langchain_core.runnables import Runnable
# THIS IS THE CRUCIAL CHANGE: Import from langchain_google_genai directly

def generate_text_with_gemini(user_input: str) -> dict: 
    load_dotenv()  

    api_key = os.getenv("GOOGLE_API_KEY")
    if api_key is None:
        raise ValueError("GOOGLE_API_KEY not found in .env file!")

    os.environ["GOOGLE_API_KEY"] = api_key

    # Initialize the ChatGoogleGenerativeAI model directly
    model = init_chat_model(
    "gemini-2.5-flash",
    model_provider="google_genai",
    streaming=True
    )

    try:
        result = model.invoke(user_input)
        return {"status": "success", "output": result.content}
    except Exception as e:
        return {"status": "error", "message": str(e)}