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
    Handles POST requests with user_input and user_type
    """
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)
    
    try:
        # Parse JSON body
        body = json.loads(request.body.decode('utf-8'))
        user_input = body.get("query", "").strip()
        user_type = body.get("userType", "scientist").strip()
        
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
        logger.info(f"Processing query for {user_type}: {user_input[:100]}...")
        
        # Create streaming response
        response = StreamingHttpResponse(
            generate_text_with_gemini(user_input, user_type),
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
    """Handle OPTIONS requests for CORS"""
    response = JsonResponse({"status": "ok"})
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type"
    return response