import google.generativeai as genai  # type: ignore
from django.conf import settings


def generate_text_with_gemini(user_input: str) -> dict:
    """
    Calls Gemini 1.5 Flash with user input and returns a JSON response.
    """
    api_key = getattr(settings, "GOOGLE_API_KEY", None)
    if not api_key:
        return {
            "status": "error",
            "message": "GOOGLE_API_KEY not set in settings."
        }

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(user_input)

        # Extract text safely
        output_text = None
        if hasattr(response, "text"):
            output_text = response.text
        elif hasattr(response, "candidates") and response.candidates:
            output_text = response.candidates[0].content.parts[0].text
        else:
            output_text = str(response)

        return {
            "status": "success",
            "input": user_input,
            "output": output_text
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
