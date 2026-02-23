import os
import json
import threading
import re
from pathlib import Path
from typing import Dict, List, Any
from strands import Agent, tool
import enchant

# ── Singleton thread-safe per i dizionari enchant ──────────────────────────
_spell_lock = threading.Lock()
_spell_cache: Dict[str, enchant.Dict] = {}

def get_spell_checkers(languages: List[str]) -> List[enchant.Dict]:
    """Restituisce dizionari enchant cached, creandoli solo una volta."""
    checkers = []
    for lang in languages:
        with _spell_lock:
            if lang not in _spell_cache:
                try:
                    _spell_cache[lang] = enchant.Dict(lang)
                except enchant.errors.DictNotFoundError:
                    print(f"Warning: Dictionary for language '{lang}' not found, skipping")
                    _spell_cache[lang] = None  # Segna come non disponibile
            
            if _spell_cache[lang] is not None:
                checkers.append(_spell_cache[lang])
    
    return checkers


def check_words(words_to_check: List[str], languages: List[str], permitted: set) -> List[str]:
    """
    Core spell-checking: dato un elenco di parole pulite, restituisce quelle errate.
    Thread-safe grazie al lock su enchant.
    """
    checkers = get_spell_checkers(languages)
    if not checkers:
        raise ValueError(f"Nessun dizionario disponibile per: {languages}")
    
    misspelled = []
    with _spell_lock:  # hunspell non è thread-safe: un file alla volta
        for word in words_to_check:
            if word in permitted or word.isdigit() or re.match(r'^\d+[a-z]+$', word):
                continue
            if not any(spell.check(word) for spell in checkers):
                misspelled.append(word)
    
    return list(set(misspelled))


# ── Utility ────────────────────────────────────────────────────────────────

def clean_word(word: str) -> str:
    word = re.sub(r'^_+|_+$', '', word)
    word = re.sub(r'^\*+|\*+$', '', word)
    word = re.sub(r'^`+|`+$', '', word)
    return word


def extract_words(content: str, positions_to_ignore: list, permitted: set) -> List[str]:
    """Estrae e pulisce le parole da controllare, escludendo le posizioni ignorate."""
    words = []
    for match in re.finditer(r'\b\w+\b', content):
        word = match.group(0)
        pos = match.start()

        in_ignored = any(s <= pos < e for s, e in positions_to_ignore)
        if in_ignored or word.lower() in permitted:
            continue

        cleaned = clean_word(word).lower()
        if cleaned and cleaned not in permitted and not cleaned.isdigit():
            words.append(cleaned)

    return words


# ── Tools ──────────────────────────────────────────────────────────────────

@tool
def find_docs_files(directory: str) -> Dict[str, Any]:
    """
    Find all document files (.txt, .md, .tex, .typ) in a directory recursively.
    
    Args:
        directory: Root directory to search
        
    Returns:
        Dictionary with files_found count and file_paths list
    """
    try:
        doc_files = []
        skip_dirs = {'.git', 'node_modules', '__pycache__', 'venv', '.venv'}
        for root, dirs, files in os.walk(directory):
            dirs[:] = [d for d in dirs if d not in skip_dirs]
            for file in files:
                if file.endswith(('.txt', '.md', '.tex', '.typ')):
                    doc_files.append(os.path.join(root, file))
        return {"files_found": len(doc_files), "file_paths": doc_files}
    except Exception as e:
        return {"error": f"Error finding files: {str(e)}"}


@tool
def analyze_spelling(filepath: str, permitted: list = None, languages: List[str] = None) -> list:
    """
    Checks spelling in a file. Thread-safe.
    
    Args:
        filepath: Path of the file to check
        permitted: List of words to ignore
        languages: Language codes (default: ['en_US'])
        
    Returns:
        List of misspelled words
    """
    if languages is None:
        languages = ['en_US']
    if permitted is None:
        permitted = set()
    else:
        permitted = set(w.lower() for w in permitted)

    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")

    ext = os.path.splitext(filepath)[1].lower()
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    positions_to_ignore = []

    if ext == '.md':
        for pattern in [
            r'```.*?```',
            r'`[^`]+`',
            r'https?://[^\s\)]+',
            r'!\[.*?\]\(.*?\)',
        ]:
            for m in re.finditer(pattern, content, re.DOTALL):
                positions_to_ignore.append((m.start(), m.end()))
        for m in re.finditer(r'\[.*?\]\((.*?)\)', content):
            positions_to_ignore.append((m.start(1), m.end(1)))

    elif ext == '.tex':
        for pattern in [
            r'\\[a-zA-Z]+(\{[^}]*\})?',
            r'%.*?$',
            r'\$\$?.*?\$\$?',
            r'\\begin\{(equation|align|verbatim|lstlisting)\}.*?\\end\{\1\}',
        ]:
            flags = re.MULTILINE if pattern.startswith('%') else re.DOTALL
            for m in re.finditer(pattern, content, flags):
                positions_to_ignore.append((m.start(), m.end()))

    elif ext == '.typ':
        typst_keywords = ['size','margin','font','width','height','spacing',
                          'padding','radius','stroke','fill','align','weight',
                          'style','top','bottom','left','right']
        kw_pattern = '|'.join(typst_keywords)
        for m in re.finditer(rf'\b(?:{kw_pattern})\s*[:=]\s*([^\s,\)]+)', content, re.IGNORECASE):
            positions_to_ignore.append((m.start(1), m.end(1)))

    # .txt → nessuna posizione da ignorare

    if ext not in ('.md', '.tex', '.typ', '.txt'):
        raise ValueError(f"Extension '{ext}' not supported")

    words = extract_words(content, positions_to_ignore, permitted)
    return check_words(words, languages, permitted)