from tools.spellAgentTools import *
from strands import Agent, tool
from typing import Dict, Any
import os
import json

# Definisci i tools direttamente con il decoratore @tool


class SpellAgent:
    """
    Agent with Strands SDK
    """
    
    def __init__(self):
        """
        Initialize the SpellAgent with Strands SDK.
        AWS credentials are automatically taken from environment variables.
        """
        inference_profile_id = os.getenv("AGENT_MODEL_ID") 
        # Create the agent with the tools
        self.agent = Agent(tools=[find_docs_files,  analyze_spelling], model=os.getenv("AGENT_MODEL_ID"))
    
    def check_spelling(self, directory: str, permitted: set = None, languages: list = None) -> Dict[str, Any]:
        """
        Main method: uses the Strands agent to analyze spelling.
        The agent autonomously decides which tools to use and when.
        
        Args:
            directory: Root directory to analyze
            permitted: Set of words to ignore during spell checking
            languages: List of language codes for spell checking
            
        Returns:
            Complete analysis results
        """
        if languages is None:
            languages = ['en_US']
        if permitted is None:
            permitted = set()
        
        languages_str = json.dumps(languages)
        permitted_str = json.dumps(list(permitted))
        
        prompt = f"""You are a spell-checking agent. Your task is to check spelling in all document files in the directory: {directory}

                Please follow these steps:
                1. Find all document files in the directory using find_docs_files
                2. For each file, analyze spelling errors using analyze_spelling with languages={languages_str} and permitted={permitted_str}
                3. Return the results in a structured JSON format

                Use the available tools to complete this task."""

        try:
            print(f"Invoking Strands Agent for spell checking...", file=os.sys.stderr) # Log to stderr
            
           
            response = self.agent(prompt)
            
            final_message = response.message

            tool_executions = []
            iterations = 0

            for event in getattr(response, "trace", []):
                if event.get("type") == "tool_use":
                    tool_executions.append({
                        "tool": event.get("tool_name"),
                        "input": event.get("input"),
                        "result": event.get("output")
                    })
                if event.get("type") == "iteration":
                    iterations += 1

            
            return {
                "status": "completed",
                "summary": final_message,
                "tool_executions": tool_executions,
                "iterations": iterations if iterations > 0 else 1
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error during spell checking: {str(e)}",
                "tool_executions": [],
                "iterations": 0
            }