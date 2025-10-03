import os
from dotenv import load_dotenv
from pathlib import Path
from neo4j import GraphDatabase

print("--- Starting Diagnostic ---")

# --- Step 1: Load .env file ---
try:
    dotenv_path = Path('D:/Astro-NOTS/Space-Biology-Knowledge-Engine/Backend/.env')
    if dotenv_path.is_file():
        print(f"Found .env file at: {dotenv_path.resolve()}")
        load_dotenv(dotenv_path=dotenv_path)
    else:
        print(f"[FATAL] .env file not found at expected path: {dotenv_path.resolve()}")
        exit()
except Exception as e:
    print(f"[FATAL] Could not load .env file: {e}")
    exit()

# --- Step 2: Verify Each Environment Variable ---
uri = os.getenv("NEO4J_URI")
user = os.getenv("NEO4J_USERNAME")
password = os.getenv("NEO4J_PASSWORD")
google_key = os.getenv("GOOGLE_API_KEY")

print("\n--- Verifying Content ---")
print(f"NEO4J_URI:       {'Found' if uri else 'MISSING or EMPTY'}")
print(f"NEO4J_USERNAME:  {'Found' if user else 'MISSING or EMPTY'}")
print(f"NEO4J_PASSWORD:  {'Found' if password else 'MISSING or EMPTY'}")
print(f"GOOGLE_API_KEY:  {'Found' if google_key else 'MISSING or EMPTY'}")
print("-------------------------\n")


# --- Step 3: Validate and Attempt Connection ---
if not all([uri, user, password, google_key]):
    print("[FAILURE] One or more required variables are missing. Please correct your .env file.")
    exit()

try:
    print("All variables found. Attempting to connect to Neo4j...")
    driver = GraphDatabase.driver(uri, auth=(user, password))
    driver.verify_connectivity()
    print("\n[SUCCESS] Connection to Neo4j database verified successfully!")
    driver.close()

except Exception as e:
    print(f"\n[FAILURE] Connection failed. The credentials might be incorrect or the database is not running.")
    print(f"  Error details: {e}")