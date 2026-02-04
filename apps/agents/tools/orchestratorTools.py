from pathlib import Path
import os
import sys
from strands import tool
from spellAgent import SpellAgent
import json

@tool
def clone_repo_tool(repo_url: str, temp_path: str) -> str:
    """
    Clones a GitHub repository into a local temporary folder.
    Returns a success or error message.
    """
    try:
        # 1. Create the target directory (if it doesn't exist)
        os.makedirs(temp_path, exist_ok=True)
        
        # 2. Create the "Documentation" subfolder
        doc_path = os.path.join(temp_path, "Documentation")
        os.makedirs(doc_path, exist_ok=True)
        
        # 3. Create the "test.txt" file inside "Documentation"
        file_path = os.path.join(doc_path, "test.txt")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write("This is a test file geeeeenerated by the mock agent.\n")
            f.write(f"Simulatted repository: {repo_url}")
        print(f"DEBUG: [MOCK] Structure successfully created in {temp_path}", file=sys.stderr)
        return f"Repository {repo_url} cloned successfully to {temp_path}."

    except Exception as e:
        return f"Error: Failed to clone repository {repo_url}."


@tool
def analyze_spelling_tool(temp_path: str) -> str:
    """
    Starts the specialized SpellAgent to analyze files in the specified path.
    Returns the spelling analysis results in JSON format.
    """
    spell_agent = SpellAgent()
    result = spell_agent.check_spelling(temp_path)
    return json.dumps(result)