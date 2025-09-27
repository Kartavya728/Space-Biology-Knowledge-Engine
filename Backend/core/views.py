from django.shortcuts import render
# Corrected import path: Assuming llm_functions is at the same level as core,
# or directly under the Backend root.
# If llm_functions is a separate Django app, you might import it like:
# from llm_functions.llm_service import generate_text_with_gemini
# If llm_functions is a simple Python package/directory at the Backend root:
from llm_functions.llm_service import generate_text_with_gemini 


def home(request):
    output = None
    if request.method == "POST":
        user_input = request.POST.get("user_input")

        response = generate_text_with_gemini(user_input)

        if response["status"] == "success":
            output = response["output"]
        else:
            output = f"Error: {response['message']}"

    return render(request, "core/home.html", {"output": output})