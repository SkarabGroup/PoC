import os
import json
from pathlib import Path
from typing import Dict, List, Any
from strands import Agent, tool
from spellchecker import SpellChecker
import re


@tool
def find_docs_files(directory: str) -> Dict[str, Any]:
    """
    Find all document files in a directory recursively, excluding common directories 
    like .git, node_modules, __pycache__, venv, .venv.
    
    Args:
        directory: Root directory to search for document files
        
    Returns:
        Dictionary with files_found count and file_paths list
    """
    try:
        doc_files = []
        for root, dirs, files in os.walk(directory):
            # Skip common directories
            dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '__pycache__', 'venv', '.venv']]
            
            for file in files:
                if file.endswith(('.txt', '.md', '.tex', '.typ')):
                    doc_files.append(os.path.join(root, file))
        
        return {
            "files_found": len(doc_files),
            "file_paths": doc_files
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
def analyze_spelling(filepath: str, permitted: set = None) -> list:
    """
    Checks the spelling of words in a file.
    
    Args:
        filepath: Path of the file to check
        permitted: Set of words to ignore during spell checking

        
    Returns:
        list of misspelled words
        
    Raises:
        ValueError: If the file extension is not supported
        FileNotFoundError: If the file does not exist
    """
    import os
    
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"The file {filepath} does not exist")
    
    _, extension = os.path.splitext(filepath)
    extension = extension.lower()
    
    if extension == '.typ':
        return check_typ(filepath, permitted)
    elif extension == '.md':
        return {}
    elif extension == '.tex':
        return {}
    elif extension == '.txt':
        return {}
    else:
        raise ValueError(f"Extension {extension} not supported. Use .typ, .md, .tex, or .txt")


def clean_word(word: str) -> str:
    """
    Clean a single word by removing Typst formatting markers.
    
    Args:
        word: Word to clean
        
    Returns:
        Cleaned word
    """
    # Remove surrounding underscores (italic: _word_ -> word)
    word = re.sub(r'^_+|_+$', '', word)
    
    # Remove surrounding asterisks (bold: *word* -> word)
    word = re.sub(r'^\*+|\*+$', '', word)
    
    # Remove backticks (code: `word` -> word)
    word = re.sub(r'^`+|`+$', '', word)
    
    return word


def check_typ(filepath: str, permitted: set = None) -> list:
    """Convert a Typst (.typ) file to a clean string."""
    with open(filepath, 'r', encoding='utf-8') as f:
        original_content = f.read()

    if permitted is None:
        permitted = set()

    # 1. Define Typst keywords whose values should be ignored during spell checking
    typst_keywords = [
        'size', 'margin', 'font', 'width', 'height', 
        'spacing', 'padding', 'radius', 'stroke', 'fill',
        'align', 'weight', 'style', 'top', 'bottom', 'left', 'right'
    ]
    
    # Create a regex pattern to match the keywords followed by : or =
    keywords_pattern = '|'.join(typst_keywords)
    
    # Find all occurrences of the keywords and store the positions of their values
    pattern = rf'\b(?:{keywords_pattern})\s*[:=]\s*([^\s,\)]+)'
    positions_to_ignore = []  # list of (start, end) tuples for positions to ignore
    
    matches = re.finditer(pattern, original_content, re.IGNORECASE)
    
    for match in matches:
        # Store the position of the ENTIRE VALUE in the original content
        value_start = match.start(1)  # Start of group 1 (the value)
        value_end = match.end(1)      # End of group 1
        positions_to_ignore.append((value_start, value_end))
    
    # 2. Extract words to check
    raw_words = []
    for match in re.finditer(r'\b\w+\b', original_content): #find all WORDS
        word = match.group(0)
        position = match.start()
        
        # Check if this word is in a position to ignore
        # (i.e., inside a value after a Typst keyword)
        in_ignored_position = any(
            start <= position < end 
            for start, end in positions_to_ignore
        )
        
        # Add word only if it's NOT in an ignored position AND not in permitted set
        if not in_ignored_position and word.lower() not in permitted:
            raw_words.append(word)
    
    # 3. Apply regex cleaning to each word
    words_to_check = []
    for word in raw_words:
        # Clean the word (remove formatting markers)
        cleaned_word = clean_word(word).lower()
        
        # Skip if empty after cleaning
        if not cleaned_word:
            continue
        
        # Skip if in permitted set
        if cleaned_word in permitted:
            continue
        
        # Skip pure numbers
        if cleaned_word.isdigit():
            continue
        
        # Skip measurement units (e.g., 5cm, 10px)
        if re.match(r'^\d+[a-z]+$', cleaned_word):
            continue
        
        # Skip very short words (optional)
        if len(cleaned_word) < 2:
            continue
        
        words_to_check.append(cleaned_word)
    
    # 4. Spell checking
    spell = SpellChecker(language='en')
    return spell.unknown(words_to_check)



