from pathlib import Path
import os
import sys

def cloneRepository(repo_url, target_dir):
    """
    Mock of the clone function.
    Instead of git clone, creates a test folder and file structure.
    """
    try:
        # 1. Create the target directory (if it doesn't exist)
        os.makedirs(target_dir, exist_ok=True)
        
        # 2. Create the "Documentation" subfolder
        doc_path = os.path.join(target_dir, "Documentation")
        os.makedirs(doc_path, exist_ok=True)
        
        # 3. Create the "test.txt" file inside "Documentation"
        file_path = os.path.join(doc_path, "test.txt")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write("This is a test file geeeeenerated by the mock agent.\n")
            f.write(f"Simulatted repository: {repo_url}")
        print(f"DEBUG: [MOCK] Structure successfully created in {target_dir}", file=sys.stderr)
        return True

    except Exception as e:
        print(f"DEBUG: [MOCK] Structure creation error - {str(e)}", file=sys.stderr)
        return False
