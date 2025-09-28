from django.shortcuts import render
from django.http import StreamingHttpResponse
from llm_functions.llm_service import generate_text_with_gemini


def home(request):
    if request.method == "GET" and request.GET.get("user_input"):
        user_input = request.GET.get("user_input")
        response = StreamingHttpResponse(
            generate_text_with_gemini(user_input),
            content_type="text/event-stream"
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response

    return render(request, "core/home.html")

