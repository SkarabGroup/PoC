from tools.spellAgentTools import find_text_files, read_file_content, analyze_spelling
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
        self.agent = Agent(tools=[find_text_files, read_file_content, analyze_spelling], model=os.getenv("AGENT_MODEL_ID"))
    
    def check_spelling(self, directory: str) -> Dict[str, Any]:
        """
        Main method: uses the Strands agent to analyze spelling.
        The agent autonomously decides which tools to use and when.
        
        Args:
            directory: Root directory to analyze
            
        Returns:
            Complete analysis results
        """
        prompt = f"""You are a spell-checking agent. Your task is to check spelling in all .txt files in the directory: {directory}

                Please follow these steps:
                1. Find all .txt files in the directory
                2. Read each file's content
                3. Analyze each file for spelling errors
                4. Provide a comprehensive json summary

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