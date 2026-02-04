from pathlib import Path
import os
import sys
from strands import tool
from spellAgent import SpellAgent
import json
from git import Repo


@tool
def clone_repo_tool(repo_url: str, temp_path: str) -> str:
    """
    Clones a GitHub repository into a local temporary folder.
    Returns a success or error message.
    """
    try:
        repo_name = repo_url.split("/")[-1].replace(".git", "")
        clone_path = Path(temp_path) / repo_name

        Repo.clone_from(repo_url, clone_path)
        return f"Successfully cloned repository to {clone_path}."

    except Exception as e:
        return f"Error: Failed to clone repository {repo_url}. {str(e)}"


@tool
def analyze_spelling_tool(temp_path: str) -> str:
    """
    Starts the specialized SpellAgent to analyze files in the specified path.
    Returns the spelling analysis results in JSON format.
    """
    spell_agent = SpellAgent()
    result = spell_agent.check_spelling(temp_path)
    return json.dumps(result)