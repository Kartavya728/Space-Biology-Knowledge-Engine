from django.shortcuts import render
from llm_functions.llm_service import generate_text_with_gemini

def home(request):
    output = None
    if request.method == "POST":
        user_input = request.POST.get("user_input")

        # Call Gemini function
        response = generate_text_with_gemini(user_input)

        if response["status"] == "success":
            output = response["output"]
        else:
            output = f"Error: {response['message']}"

    return render(request, "core/home.html", {"output": output})
