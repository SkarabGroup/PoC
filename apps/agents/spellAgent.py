import os
import json
from pathlib import Path
from typing import Dict, List, Any
from strands import Agent, tool
from spellchecker import SpellChecker
import re

# Definisci i tools direttamente con il decoratore @tool
@tool
def find_text_files(directory: str) -> Dict[str, Any]:
    """
    Find all .txt files in a directory recursively, excluding common directories 
    like .git, node_modules, __pycache__, venv, .venv.
    
    Args:
        directory: Root directory to search for text files
        
    Returns:
        Dictionary with files_found count and file_paths list
    """
    try:
        text_files = []
        for root, dirs, files in os.walk(directory):
            # Skip common directories
            dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '__pycache__', 'venv', '.venv']]
            
            for file in files:
                if file.endswith('.txt'):
                    text_files.append(os.path.join(root, file))
        
        return {
            "files_found": len(text_files),
            "file_paths": text_files
        }
    except Exception as e:
        return {
            "error": f"Error finding files: {str(e)}"
        }


@tool
def read_file_content(file_path: str) -> Dict[str, Any]:
    """
    Read the complete content of a specific file.
    
    Args:
        file_path: Full path to the file to read
        
    Returns:
        Dictionary with file_path, content, and content_length
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return {
            "file_path": file_path,
            "content": content,
            "content_length": len(content)
        }
    except Exception as e:
        return {
            "error": f"Error reading file: {str(e)}"
        }

@tool
def analyze_spelling(file_path: str, content: str) -> dict:
    """
    Analyze text content for spelling errors using pyspellchecker.
    """
    try:
        spell = SpellChecker(language='en')                                                 #------------------------------------------------#CAN BE PARAMETERIZED
        words = re.findall(r'\b\w+\b', content.lower())
        
        misspelled = spell.unknown(words)
        

        errors = []
        #for word in misspelled:
         #   start_index = content.lower().find(word)
          #  context = content[max(0, start_index-20) : min(len(content), start_index+20)]  #-------------------------------------------------# Get context around the misspelled word
            
            #errors.append({
               #"word": word,
             ##  "context": f"...{context}..."
            #})
            
        misspelled = spell.unknown(words)
    
        return {
            "has_errors": len(misspelled) > 0,
            "error_count": len(misspelled),
            "errors": list(misspelled), 
            "summary": f"Found {len(misspelled)} spelling errors in {file_path}."
        }
            
    except Exception as e:
        return {
            "error": f"Error analyzing file locally: {str(e)}"
        }

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
                4. Provide a comprehensive summary

                Use the available tools to complete this task."""

        try:
            print(f"Invoking Strands Agent for spell checking...", file=os.sys.stderr) # Log to stderr
            
           
            response = self.agent(prompt)
            
            final_message = response.last_message
            
            tool_executions = []
            iterations = 0
            
            # Strands provides access to the execution trace so we can extract tool usage details
            if hasattr(response, 'trace'):
                for event in response.trace:
                    if event.get('type') == 'tool_use':
                        tool_executions.append({
                            "tool": event.get('tool_name'),
                            "input": event.get('input'),
                            "result": event.get('output')
                        })
                    if event.get('type') == 'iteration':
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