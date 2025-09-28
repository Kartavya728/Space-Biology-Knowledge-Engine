# tools/serper_search.py
import os
# OLD: from langchain_community.utilities.serper import SerperAPIWrapper
# NEW:
from langchain_community.tools import SerperDevWrapper # This is a common and often correct path now

from langchain.agents import Tool
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env

def get_serper_search_tool():
    """
    Returns a LangChain Tool for online searching using Serper API.
    Requires SERPER_API_KEY to be set in environment variables.
    """
    serper_api_key = os.getenv("SERPER_API_KEY")
    if not serper_api_key:
        raise ValueError("SERPER_API_KEY not found in environment variables. Please set it in your .env file.")

    # Initialize the wrapper. Note: SerperDevWrapper is often used directly as a tool.
    # We will wrap its functionality slightly differently here.
    serper_wrapper = SerperDevWrapper(serper_api_key=serper_api_key)

    return Tool(
        name="Serper Search",
        func=serper_wrapper.run, # Use the run method of the wrapper
        description="A useful tool for searching the internet and finding information. Input should be a search query."
    )

if __name__ == "__main__":
    # Example usage:
    search_tool = get_serper_search_tool()
    print(search_tool.run("current weather in London"))