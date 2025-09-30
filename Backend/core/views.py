from django.shortcuts import render
from django.http import StreamingHttpResponse
import json
import logging

from llm_functions.llm_service import generate_text_with_gemini

# Set up logging
logger = logging.getLogger(__name__)


def home(request):
    """
    Main view that handles both GET requests for streaming responses
    and renders the home page
    """
    # Handle streaming request
    if request.method == "GET" and request.GET.get("user_input"):
        user_input = request.GET.get("user_input", "").strip()
        
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
            return response
        
        # Log the request
        logger.info(f"Processing query: {user_input[:100]}...")
        
        try:
            # Create streaming response
            response = StreamingHttpResponse(
                generate_text_with_gemini(user_input),
                content_type="text/event-stream"
            )
            
            # Set ONLY these headers (DO NOT set Connection header)
            response["Cache-Control"] = "no-cache"
            response["X-Accel-Buffering"] = "no"
            
            return response
            
        except Exception as e:
            logger.error(f"Error in streaming response: {str(e)}")
            
            def error_stream():
                yield 'data: ' + json.dumps({"type": "error", "content": f"Server error: {str(e)}"}) + '\n\n'
                yield 'data: ' + json.dumps({"type": "done"}) + '\n\n'
            
            return StreamingHttpResponse(
                error_stream(),
                content_type="text/event-stream"
            )
    
    # Render the main page for regular GET requests
    return render(request, "core/home.html")