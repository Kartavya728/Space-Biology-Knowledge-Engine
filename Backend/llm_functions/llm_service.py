from dotenv import load_dotenv
import os
from langchain.chat_models import init_chat_model

def generate_text_with_gemini(user_input: str):
    """
    Stream responses from Gemini as SSE messages.
    """
    load_dotenv()

    api_key = os.getenv("GOOGLE_API_KEY")
    if api_key is None:
        yield "data: ERROR - GOOGLE_API_KEY not found in .env file!\n\n"
        return

    os.environ["GOOGLE_API_KEY"] = api_key

    model = init_chat_model(
        "gemini-2.5-flash",
        model_provider="google_genai",
        streaming=True
    )

    try:
        for chunk in model.stream(user_input):
            if hasattr(chunk, "content") and chunk.content:
                yield f"data: {chunk.content}\n\n"
        yield "data: [DONE]\n\n"   # signal end
    except Exception as e:
        yield f"data: ERROR - {str(e)}\n\n"
