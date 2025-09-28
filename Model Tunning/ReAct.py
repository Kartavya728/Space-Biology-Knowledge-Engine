from langchain import hub
from langchain.agents import AgentExecutor, create_react_agent
from langchain_community.tools.tavily_search import TavilySearchResults
import os
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model

load_dotenv()  

# Retrieve the API key
api_key = os.getenv("GOOGLE_API_KEY")
if api_key is None:
    raise ValueError("GOOGLE_API_KEY not found in .env file!")
os.environ["GOOGLE_API_KEY"] = api_key
tavily_key = os.getenv("TAVILY_API_KEY")
if api_key is None:
    raise ValueError("tavily not found in .env file!")
os.environ["TAVILY_API_KEY"] = tavily_key

tools = [TavilySearchResults(max_results=1)]

prompt = hub.pull("hwchase17/react")

llm = init_chat_model(
    "gemini-2.5-flash",
    model_provider="google_genai",
    streaming=True
)

# Construct the ReAct agent
agent = create_react_agent(llm, tools, prompt)

agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

agent_executor.invoke({"input": "what is LangChain?"})