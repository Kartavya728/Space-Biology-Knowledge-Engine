from django.conf import settings
import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.runnables import Runnable

def generate_text_with_gemini(user_input: str) -> dict:
    """
    Uses LangChain with Gemini 1.5 Flash to generate structured JSON output.
    Includes a system message that the AI is an astronaut.
    """

    api_key = getattr(settings, "GOOGLE_API_KEY", None)
    if not api_key:
        error_response = {
            "status": "error",
            "message": "GOOGLE_API_KEY not set in settings."
        }
        print("Gemini ERROR:", error_response)
        return error_response

    try:
        # Define structured output
        parser = JsonOutputParser()

        # Define prompt with system + user messages
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a helpful astronaut who explains things in a fun space-themed way."),
            ("human", "{input}"),
        ])

        # Create the model
        model = ChatGoogleGenerativeAI(
            model="gemini-pro",
            google_api_key=api_key,
            temperature=0.7
        )

        # Chain everything together using LCEL Runnable
        chain: Runnable = prompt | model | parser

        # Invoke chain with input
        result = chain.invoke({"input": user_input})

        final_output = {
            "status": "success",
            "input": user_input,
            "output": result  # Already JSON structured
        }

        # ✅ Print for debugging
        print("Gemini INPUT:", user_input)
        print("Gemini STRUCTURED OUTPUT:", json.dumps(result, indent=2))

        return final_output

    except Exception as e:
        error_response = {
            "status": "error",
            "message": str(e)
        }
        print("Gemini EXCEPTION:", error_response)
        return error_response
