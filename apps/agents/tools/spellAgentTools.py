import os
import json
from pathlib import Path
from typing import Dict, List, Any
from strands import Agent, tool
from spellchecker import SpellChecker
import re


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