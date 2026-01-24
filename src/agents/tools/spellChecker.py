"""
Spell Checker Tool
Scans .txt files in a directory and performs spell checking.
"""

import os
from pathlib import Path
from typing import Dict, List, Tuple
import re

try:
    from spellchecker import SpellChecker
    SPELLCHECKER_AVAILABLE = True
except ImportError:
    SPELLCHECKER_AVAILABLE = False
    print("WARNING: pyspellchecker not installed. Run: pip install pyspellchecker")


def find_txt_files(directory: str) -> List[str]:
    """
    Recursively find all .txt files in the given directory.
    
    Args:
        directory: Root directory to search
        
    Returns:
        List of paths to .txt files
    """
    txt_files = []
    try:
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith('.txt'):
                    txt_files.append(os.path.join(root, file))
    except Exception as e:
        print(f"Error scanning directory: {str(e)}")
    
    return txt_files


def read_file_content(file_path: str) -> str:
    """
    Read content from a text file.
    
    Args:
        file_path: Path to the file
        
    Returns:
        File content as string
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        # Try with different encoding
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                return f.read()
        except Exception as e:
            print(f"Error reading file {file_path}: {str(e)}")
            return ""
    except Exception as e:
        print(f"Error reading file {file_path}: {str(e)}")
        return ""


def extract_words(text: str) -> List[str]:
    """
    Extract words from text, ignoring punctuation and numbers.
    
    Args:
        text: Input text
        
    Returns:
        List of words
    """
    # Remove URLs
    text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
    
    # Remove email addresses
    text = re.sub(r'\S+@\S+', '', text)
    
    # Extract words (alphanumeric sequences)
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
    
    return words


def check_spelling(file_path: str, spell: SpellChecker) -> Dict:
    """
    Check spelling in a single file.
    
    Args:
        file_path: Path to the file to check
        spell: SpellChecker instance
        
    Returns:
        Dictionary with spelling check results
    """
    content = read_file_content(file_path)
    if not content:
        return {
            "file": file_path,
            "status": "error",
            "errors": 0,
            "misspelled_words": []
        }
    
    words = extract_words(content)
    if not words:
        return {
            "file": file_path,
            "status": "empty",
            "errors": 0,
            "misspelled_words": []
        }
    
    # Find misspelled words
    misspelled = spell.unknown(words)
    
    # Get suggestions for misspelled words (limit to avoid overhead)
    misspelled_with_suggestions = []
    for word in list(misspelled)[:20]:  # Limit to first 20 misspelled words
        suggestions = spell.candidates(word)
        misspelled_with_suggestions.append({
            "word": word,
            "suggestions": list(suggestions)[:3] if suggestions else []
        })
    
    return {
        "file": os.path.basename(file_path),
        "full_path": file_path,
        "status": "checked",
        "total_words": len(words),
        "unique_words": len(set(words)),
        "errors": len(misspelled),
        "misspelled_words": misspelled_with_suggestions
    }


def spell_check_directory(directory: str, language: str = 'en') -> Dict:
    """
    Perform spell checking on all .txt files in a directory.
    
    Args:
        directory: Root directory to search
        language: Language code for spell checking (default: 'en')
        
    Returns:
        Dictionary with comprehensive spell check results
    """
    if not SPELLCHECKER_AVAILABLE:
        return {
            "status": "error",
            "message": "No spell checker available",
            "files_checked": 0,
            "results": []
        }
    
    # Initialize spell checker
    spell = SpellChecker(language=language)
    
    # Find all .txt files
    txt_files = find_txt_files(directory)
    
    if not txt_files:
        return {
            "status": "completed",
            "message": "No .txt files found in the repository",
            "files_checked": 0,
            "results": []
        }
    
    # Check each file
    results = []
    total_errors = 0
    
    for file_path in txt_files:
        result = check_spelling(file_path, spell)
        results.append(result)
        total_errors += result.get("errors", 0)
    
    return {
        "status": "completed",
        "message": f"Spell check completed on {len(txt_files)} file(s)",
        "files_checked": len(txt_files),
        "total_errors": total_errors,
        "results": results
    }


def format_spell_check_summary(check_results: Dict) -> str:
    """
    Format spell check results into a human-readable summary.
    
    Args:
        check_results: Results from spell_check_directory
        
    Returns:
        Formatted summary string
    """
    if check_results["status"] == "error":
        return f"Error: {check_results['message']}"
    
    if check_results["files_checked"] == 0:
        return "No .txt files found in the repository"
    
    summary = f"Spell Check Summary\n"
    summary += f"Files checked: {check_results['files_checked']}\n"
    summary += f"Total spelling errors: {check_results['total_errors']}\n\n"
    
    for result in check_results["results"]:
        if result["status"] == "checked":
            summary += f"{result['file']}\n"
            summary += f"   Words: {result['total_words']} (unique: {result['unique_words']})\n"
            summary += f"   Errors: {result['errors']}\n"
            
            if result['misspelled_words']:
                summary += "   Misspelled words:\n"
                for item in result['misspelled_words'][:5]:  # Show max 5
                    suggestions = ", ".join(item['suggestions'][:3]) if item['suggestions'] else "no suggestions"
                    summary += f"      • {item['word']} → {suggestions}\n"
                
                if len(result['misspelled_words']) > 5:
                    summary += f"      ... and {len(result['misspelled_words']) - 5} more\n"
            
            summary += "\n"
    
    return summary