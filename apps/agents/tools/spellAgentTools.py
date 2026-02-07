import os
import json
from pathlib import Path
from typing import Dict, List, Any
from strands import Agent, tool
import enchant
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
def analyze_spelling(filepath: str, permitted: set = None, languages: List[str] = None) -> list:
    """
    Checks the spelling of words in a file using multiple languages.
    
    Args:
        filepath: Path of the file to check
        permitted: Set of words to ignore during spell checking
        languages: List of language codes for spell checking (default: ['en_US'])
        
    Returns:
        list of misspelled words
        
    Raises:
        ValueError: If the file extension is not supported
        FileNotFoundError: If the file does not exist
    """
    if languages is None:
        languages = ['en_US']
    
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"The file {filepath} does not exist")
    
    _, extension = os.path.splitext(filepath)
    extension = extension.lower()
    
    if extension == '.typ':
        return check_typ(filepath, permitted, languages)
    elif extension == '.md':
        return check_md(filepath, permitted, languages)
    elif extension == '.tex':
        return check_tex(filepath, permitted, languages)
    elif extension == '.txt':
        return check_txt(filepath, permitted, languages)
    else:
        raise ValueError(f"Extension {extension} not supported. Use .typ, .md, .tex, or .txt")
    

def clean_word(word: str) -> str:
    """
    Clean a single word by removing formatting markers.
    
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


def check_typ(filepath: str, permitted: set = None, languages: List[str] = None) -> list:
    """Check spelling in a Typst (.typ) file using multiple languages."""
    if languages is None:
        languages = ['en_US']
    
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
    for match in re.finditer(r'\b\w+\b', original_content):
        word = match.group(0)
        position = match.start()
        
        # Check if this word is in a position to ignore
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
        cleaned_word = clean_word(word).lower()
        
        if not cleaned_word:
            continue
        
        if cleaned_word in permitted:
            continue
        
        if cleaned_word.isdigit():
            continue
        
        if re.match(r'^\d+[a-z]+$', cleaned_word):
            continue
        
        words_to_check.append(cleaned_word)
    
    # 4. Spell checking with enchant
    try:
        # Create dictionary objects for all languages
        spell_checkers = []
        for lang in languages:
            try:
                spell_checkers.append(enchant.Dict(lang))
            except enchant.errors.DictNotFoundError:
                print(f"Warning: Dictionary for language '{lang}' not found, skipping it")
        
        if not spell_checkers:
            raise ValueError(f"None of the specified languages are available: {languages}")
        
        # A word is misspelled only if it's wrong in ALL languages
        misspelled = []
        for word in words_to_check:
            is_correct_in_any_language = any(spell.check(word) for spell in spell_checkers)
            if not is_correct_in_any_language:
                misspelled.append(word)
        
        return list(set(misspelled))  # Remove duplicates
        
    except enchant.errors.DictNotFoundError as e:
        raise ValueError(f"Error loading dictionaries: {str(e)}")

def check_md(filepath: str, permitted: set = None, languages: List[str] = None) -> list:
    """Check spelling in a Markdown (.md) file using multiple languages."""
    if languages is None:
        languages = ['en_US']
    
    with open(filepath, 'r', encoding='utf-8') as f:
        original_content = f.read()

    if permitted is None:
        permitted = set()

    positions_to_ignore = []
    
    # Ignore code blocks (``` ... ```)
    for match in re.finditer(r'```.*?```', original_content, re.DOTALL):
        positions_to_ignore.append((match.start(), match.end()))
    
    # Ignore inline code (`...`)
    for match in re.finditer(r'`[^`]+`', original_content):
        positions_to_ignore.append((match.start(), match.end()))
    
    # Ignore URLs
    for match in re.finditer(r'https?://[^\s\)]+', original_content):
        positions_to_ignore.append((match.start(), match.end()))
    
    # Ignore image paths ![alt](path)
    for match in re.finditer(r'!\[.*?\]\(.*?\)', original_content):
        positions_to_ignore.append((match.start(), match.end()))
    
    # Ignore link URLs [text](url)
    for match in re.finditer(r'\[.*?\]\((.*?)\)', original_content):
        positions_to_ignore.append((match.start(1), match.end(1)))
    
    # Extract words to check
    raw_words = []
    for match in re.finditer(r'\b\w+\b', original_content):
        word = match.group(0)
        position = match.start()
        
        in_ignored_position = any(
            start <= position < end 
            for start, end in positions_to_ignore
        )
        
        if not in_ignored_position and word.lower() not in permitted:
            raw_words.append(word)
    
    # Clean and filter words
    words_to_check = []
    for word in raw_words:
        cleaned_word = clean_word(word).lower()
        
        if not cleaned_word:
            continue
        
        if cleaned_word in permitted:
            continue
        
        if cleaned_word.isdigit():
            continue
        
        if re.match(r'^\d+[a-z]+$', cleaned_word):
            continue
        
        words_to_check.append(cleaned_word)
    
    # Spell checking with enchant
    try:
        # Create dictionary objects for all languages
        spell_checkers = []
        for lang in languages:
            try:
                spell_checkers.append(enchant.Dict(lang))
            except enchant.errors.DictNotFoundError:
                print(f"Warning: Dictionary for language '{lang}' not found, skipping it")
        
        if not spell_checkers:
            raise ValueError(f"None of the specified languages are available: {languages}")
        
        # A word is misspelled only if it's wrong in ALL languages
        misspelled = []
        for word in words_to_check:
            is_correct_in_any_language = any(spell.check(word) for spell in spell_checkers)
            if not is_correct_in_any_language:
                misspelled.append(word)
        
        return list(set(misspelled))  # Remove duplicates
        
    except enchant.errors.DictNotFoundError as e:
        raise ValueError(f"Error loading dictionaries: {str(e)}")


def check_tex(filepath: str, permitted: set = None, languages: list = ['en_US']) -> list:
    """Check spelling in a Markdown (.md) file using multiple languages."""
    if languages is None:
        languages = ['en_US']
    
    with open(filepath, 'r', encoding='utf-8') as f:
        original_content = f.read()

    if permitted is None:
        permitted = set()

    positions_to_ignore = []
    
    # Ignore LaTeX commands (\command{...} or \command)
    for match in re.finditer(r'\\[a-zA-Z]+(\{[^}]*\})?', original_content):
        positions_to_ignore.append((match.start(), match.end()))
    
    # Ignore comments (% ...)
    for match in re.finditer(r'%.*?$', original_content, re.MULTILINE):
        positions_to_ignore.append((match.start(), match.end()))
    
    # Ignore math mode ($ ... $ or $$ ... $$)
    for match in re.finditer(r'\$\$?.*?\$\$?', original_content, re.DOTALL):
        positions_to_ignore.append((match.start(), match.end()))
    
    # Ignore environments that typically contain code/math
    for match in re.finditer(r'\\begin\{(equation|align|verbatim|lstlisting)\}.*?\\end\{\1\}', original_content, re.DOTALL):
        positions_to_ignore.append((match.start(), match.end()))
    
    # Extract words to check
    raw_words = []
    for match in re.finditer(r'\b\w+\b', original_content):
        word = match.group(0)
        position = match.start()
        
        in_ignored_position = any(
            start <= position < end 
            for start, end in positions_to_ignore
        )
        
        if not in_ignored_position and word.lower() not in permitted:
            raw_words.append(word)
    
    # Clean and filter words
    words_to_check = []
    for word in raw_words:
        cleaned_word = clean_word(word).lower()
        
        if not cleaned_word:
            continue
        
        if cleaned_word in permitted:
            continue
        
        if cleaned_word.isdigit():
            continue
        
        if re.match(r'^\d+[a-z]+$', cleaned_word):
            continue
        
        words_to_check.append(cleaned_word)
    
    # Spell checking with enchant
    try:
        # Create dictionary objects for all languages
        spell_checkers = []
        for lang in languages:
            try:
                spell_checkers.append(enchant.Dict(lang))
            except enchant.errors.DictNotFoundError:
                print(f"Warning: Dictionary for language '{lang}' not found, skipping it")
        
        if not spell_checkers:
            raise ValueError(f"None of the specified languages are available: {languages}")
        
        # A word is misspelled only if it's wrong in ALL languages
        misspelled = []
        for word in words_to_check:
            is_correct_in_any_language = any(spell.check(word) for spell in spell_checkers)
            if not is_correct_in_any_language:
                misspelled.append(word)
        
        return list(set(misspelled))  # Remove duplicates
        
    except enchant.errors.DictNotFoundError as e:
        raise ValueError(f"Error loading dictionaries: {str(e)}")


def check_txt(filepath: str, permitted: set = None, languages: list = ['en_US']) -> list:
    """Check spelling in a Markdown (.md) file using multiple languages."""
    if languages is None:
        languages = ['en_US']
    
    with open(filepath, 'r', encoding='utf-8') as f:
        original_content = f.read()

    if permitted is None:
        permitted = set()

    # For plain text, we don't ignore any positions (no special syntax)
    # Extract all words
    raw_words = []
    for match in re.finditer(r'\b\w+\b', original_content):
        word = match.group(0)
        
        if word.lower() not in permitted:
            raw_words.append(word)
    
    # Clean and filter words
    words_to_check = []
    for word in raw_words:
        cleaned_word = clean_word(word).lower()
        
        if not cleaned_word:
            continue
        
        if cleaned_word in permitted:
            continue
        
        if cleaned_word.isdigit():
            continue
        
        if re.match(r'^\d+[a-z]+$', cleaned_word):
            continue
        
        words_to_check.append(cleaned_word)
    
    # Spell checking with enchant
    try:
        # Create dictionary objects for all languages
        spell_checkers = []
        for lang in languages:
            try:
                spell_checkers.append(enchant.Dict(lang))
            except enchant.errors.DictNotFoundError:
                print(f"Warning: Dictionary for language '{lang}' not found, skipping it")
        
        if not spell_checkers:
            raise ValueError(f"None of the specified languages are available: {languages}")
        
        # A word is misspelled only if it's wrong in ALL languages
        misspelled = []
        for word in words_to_check:
            is_correct_in_any_language = any(spell.check(word) for spell in spell_checkers)
            if not is_correct_in_any_language:
                misspelled.append(word)
        
        return list(set(misspelled))  # Remove duplicates
        
    except enchant.errors.DictNotFoundError as e:
        raise ValueError(f"Error loading dictionaries: {str(e)}")