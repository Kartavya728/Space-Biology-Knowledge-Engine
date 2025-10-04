from django.shortcuts import render
from django.http import StreamingHttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import logging

from llm_functions.llm_service import generate_text_with_gemini

logger = logging.getLogger(__name__)


def home(request):
    """Main view that renders the home page"""
    return render(request, "core/home.html")


@csrf_exempt
def chat_api(request):
    """
    API endpoint for streaming chat responses
    Handles POST requests with user_input, user_type, and deep_think
    """
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)
    
    try:
        # Parse JSON body
        body = json.loads(request.body.decode('utf-8'))
        user_input = body.get("query", "").strip()
        user_type = body.get("userType", "scientist").strip()
        deep_think = body.get("deepThink", False)  # <-- Add this line

        # Validate user_type
        valid_types = ['scientist', 'investor', 'mission-architect']
        if user_type not in valid_types:
            user_type = 'scientist'  # Default fallback
        
        # Validate input
        if not user_input:
            def error_stream():
                yield 'data: ' + json.dumps({"type": "error", "content": "Empty query received"}) + '\n\n'
                yield 'data: ' + json.dumps({"type": "done"}) + '\n\n'
            
            response = StreamingHttpResponse(
                error_stream(),
                content_type="text/event-stream"
            )
            response["Cache-Control"] = "no-cache"
            response["X-Accel-Buffering"] = "no"
            response["Access-Control-Allow-Origin"] = "*"
            return response
        
        # Log the request
        logger.info(f"Processing query for {user_type}: {user_input[:100]}... DeepThink: {deep_think}")
        if deep_think:
            print("DeepThink mode is ON")  # <-- Print to terminal

        # Create streaming response
        response = StreamingHttpResponse(
            generate_text_with_gemini(user_input, user_type, deep_think),  # <-- Pass deep_think
            content_type="text/event-stream"
        )
        
        # Set headers for SSE
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        
        return response
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    
    except Exception as e:
        logger.error(f"Error in streaming response: {str(e)}")
        
        def error_stream():
            yield 'data: ' + json.dumps({"type": "error", "content": f"Server error: {str(e)}"}) + '\n\n'
            yield 'data: ' + json.dumps({"type": "done"}) + '\n\n'
        
        response = StreamingHttpResponse(
            error_stream(),
            content_type="text/event-stream"
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        response["Access-Control-Allow-Origin"] = "*"
        return response


@csrf_exempt
def chat_options(request):
    """Handle simple chat questions about the analysis"""
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)
    
    try:
        # Parse JSON body
        body = json.loads(request.body.decode('utf-8'))
        question = body.get("question", "").strip()
        context = body.get("context", "").strip()
        user_type = body.get("userType", "scientist").strip()
        
        # Validate input
        if not question:
            return JsonResponse({"error": "Question is required"}, status=400)
        
        # Create a simple, direct query for the chat
        simple_question = f"""You are a helpful assistant. Based on the following analysis context, please provide a clear and direct answer to this question: {question}

Analysis Context:
{context}

Please give a direct, conversational answer without any special formatting or structure."""
        
        # Simple streaming response
        def simple_chat_stream():
            try:
                # Import the LLM directly for simple responses
                from langchain.chat_models import init_chat_model
                import os
                
                llm = init_chat_model(
                    "gemini-2.0-flash-exp",
                    model_provider="google_genai",
                    streaming=True,
                    temperature=0.7
                )
                
                # Stream the response directly
                for chunk in llm.stream(simple_question):
                    if hasattr(chunk, 'content') and chunk.content:
                        yield 'data: ' + json.dumps({"type": "text", "content": chunk.content}) + '\n\n'
                
                yield 'data: ' + json.dumps({"type": "done"}) + '\n\n'
                
            except Exception as e:
                yield 'data: ' + json.dumps({"type": "error", "content": f"Error processing question: {str(e)}"}) + '\n\n'
                yield 'data: ' + json.dumps({"type": "done"}) + '\n\n'
        
        response = StreamingHttpResponse(
            simple_chat_stream(),
            content_type="text/event-stream"
        )
        
        # Set headers for SSE
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        
        return response
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    
    except Exception as e:
        logger.error(f"Error in chat options: {str(e)}")
        return JsonResponse({"error": f"Server error: {str(e)}"}, status=500)