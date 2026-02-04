#!/usr/bin/env python3
"""
Test con Repo Fake: Esegue l'orchestrator VERO su una repository di test

Questo script:
1. Crea una repository fake con file .txt contenenti errori di spelling
2. Esegue il tuo orchestrator.py VERO su questa repo
3. Verifica che i dati siano stati salvati in MongoDB
4. Pulisce tutto

Usage: python3 test_with_fake_repo.py
"""

import os
import sys
import tempfile
import shutil
import subprocess
from pathlib import Path
from database.mongodb_manager import MongoDBManager
import time

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text.center(70)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.YELLOW}➜ {text}{Colors.END}")

def create_fake_repo(base_path):
    """Crea una repository fake con file contenenti errori di spelling"""
    
    print_info("Creazione repository fake...")
    
    # Crea struttura directory
    repo_path = Path(base_path) / "fake-test-repo"
    repo_path.mkdir(parents=True, exist_ok=True)
    
    # File 1: README.txt (3 errori)
    readme = repo_path / "README.txt"
    readme.write_text("""
Welcome to our project!

This is a simple README file for testing purposes.
We have some intentional spelling errors here:
- teh quick brown fox (should be 'the')
- I will recieve your email (should be 'receive')
- An error occured yesterday (should be 'occurred')

Please ignore these errors, they are intentional for testing.
""")
    
    # File 2: docs/guide.txt (2 errori)
    docs_dir = repo_path / "docs"
    docs_dir.mkdir(exist_ok=True)
    guide = docs_dir / "guide.txt"
    guide.write_text("""
Installation Guide

Follow these steps carefuly:
1. Download the software
2. Run the installer
3. Configure your settings

If you have any questons, contact support.
""")
    
    # File 3: src/notes.txt (1 errore)
    src_dir = repo_path / "src"
    src_dir.mkdir(exist_ok=True)
    notes = src_dir / "notes.txt"
    notes.write_text("""
Development Notes

TODO:
- Fix the seperator function
- Update documentation
- Run tests
""")
    
    # File 4: CHANGELOG.txt (nessun errore - file pulito)
    changelog = repo_path / "CHANGELOG.txt"
    changelog.write_text("""
Changelog

Version 1.0.0
- Initial release
- Added basic features
- Fixed bugs

Version 0.9.0
- Beta release
""")
    
    print_success(f"Repository fake creata in: {repo_path}")
    print_info(f"File creati:")
    print(f"   • README.txt (3 errori)")
    print(f"   • docs/guide.txt (2 errori)")
    print(f"   • src/notes.txt (1 errore)")
    print(f"   • CHANGELOG.txt (0 errori)")
    print(f"   Totale atteso: ~6 errori in 4 file")
    
    return str(repo_path)

def count_records_before(mongo, test_marker):
    """Conta i record prima del test"""
    runs_before = mongo.orchestrator_runs.count_documents({"repository": {"$regex": test_marker}})
    tools_before = mongo.tool_executions.count_documents({})
    spells_before = mongo.spell_results.count_documents({})
    
    return runs_before, tools_before, spells_before

def run_orchestrator(repo_path, orchestrator_script="orchestrator.py"):
    """Esegue l'orchestrator vero sulla repo fake"""
    
    print_info("Esecuzione orchestrator...")
    print_info(f"Script: {orchestrator_script}")
    print_info(f"Repo: {repo_path}")
    
    # Verifica che l'orchestrator esista
    if not os.path.exists(orchestrator_script):
        print_error(f"Orchestrator non trovato: {orchestrator_script}")
        print_info("Assicurati di essere nella directory corretta")
        print_info("O specifica il path: python3 test_with_fake_repo.py /path/to/orchestrator.py")
        return False, None
    
    # Usa il path della repo come "URL" (per test locale)
    fake_repo_url = f"file://{repo_path}"
    
    try:
        # Esegui orchestrator
        print_info("Avvio orchestrator... (potrebbe richiedere alcuni minuti)")
        
        result = subprocess.run(
            ["python3", orchestrator_script, fake_repo_url, repo_path],
            capture_output=True,
            text=True,
            timeout=300  # 5 minuti max
        )
        
        print("\n" + "="*70)
        print("OUTPUT ORCHESTRATOR (stderr - log):")
        print("="*70)
        print(result.stderr)
        
        if result.returncode == 0:
            print_success("Orchestrator completato con successo!")
            
            print("\n" + "="*70)
            print("OUTPUT ORCHESTRATOR (stdout - risultato JSON):")
            print("="*70)
            print(result.stdout[:500])  # Primi 500 caratteri
            if len(result.stdout) > 500:
                print(f"\n... (output troncato, totale {len(result.stdout)} caratteri)")
            
            return True, result.stdout
        else:
            print_error(f"Orchestrator fallito con exit code: {result.returncode}")
            print("\nErrori:")
            print(result.stderr)
            return False, None
            
    except subprocess.TimeoutExpired:
        print_error("Orchestrator timeout (>5 minuti)")
        return False, None
    except Exception as e:
        print_error(f"Errore nell'esecuzione orchestrator: {e}")
        return False, None

def verify_data_saved(mongo, test_marker):
    """Verifica che i dati siano stati salvati in MongoDB"""
    
    print_info("Verifica dati in MongoDB...")
    
    # Attendi un po' per essere sicuri che i dati siano scritti
    time.sleep(1)
    
    # Cerca run che contengono il marker nel repository
    recent_runs = list(mongo.orchestrator_runs.find(
        {"repository": {"$regex": test_marker}}
    ).sort("timestamp", -1).limit(1))
    
    if not recent_runs:
        print_error("Nessun run trovato in MongoDB!")
        print_info("L'orchestrator potrebbe non aver salvato i dati")
        print_info("Verifica che il tuo orchestrator.py chiami mongo.save_orchestrator_run()")
        return False
    
    run = recent_runs[0]
    run_id = str(run["_id"])
    
    print_success("Run trovato in MongoDB!")
    print(f"\n{'─'*70}")
    print(f"📊 DATI SALVATI:")
    print(f"{'─'*70}")
    print(f"Run ID: {run_id}")
    print(f"Repository: {run.get('repository')}")
    print(f"Status: {run.get('status')}")
    print(f"Timestamp: {run.get('timestamp')}")
    
    summary = run.get('orchestrator_summary', {})
    print(f"\n📈 Summary:")
    print(f"   • Files analyzed: {summary.get('total_files_analyzed', 'N/A')}")
    print(f"   • Errors found: {summary.get('total_errors_found', 'N/A')}")
    
    details = run.get('spell_agent_details', {})
    print(f"\n🤖 Agent Details:")
    print(f"   • Status: {details.get('status', 'N/A')}")
    print(f"   • Iterations: {details.get('iterations', 'N/A')}")
    print(f"   • Tools used: {details.get('tools_used', 'N/A')}")
    
    # Verifica tool executions
    tool_count = mongo.tool_executions.count_documents({"run_id": run_id})
    print(f"\n🔧 Tool Executions: {tool_count}")
    
    if tool_count > 0:
        tools = list(mongo.tool_executions.find({"run_id": run_id}))
        for i, tool in enumerate(tools[:3], 1):  # Mostra primi 3
            print(f"   {i}. {tool.get('tool_name')} - {'✓' if tool.get('success') else '✗'}")
        if tool_count > 3:
            print(f"   ... e altri {tool_count - 3}")
    
    # Verifica spell results
    spell_count = mongo.spell_results.count_documents({"run_id": run_id})
    print(f"\n📝 Spell Results: {spell_count}")
    
    if spell_count > 0:
        spells = list(mongo.spell_results.find({"run_id": run_id}))
        for i, spell in enumerate(spells[:3], 1):
            file_name = spell.get('file_path', '').split('/')[-1]
            print(f"   {i}. {file_name} - {spell.get('error_count', 0)} errori")
        if spell_count > 3:
            print(f"   ... e altri {spell_count - 3}")
    
    print(f"{'─'*70}\n")
    
    return True, run_id

def cleanup(mongo, run_id, repo_path):
    """Pulisce dati di test"""
    
    print_info("Cleanup...")
    
    cleanup_choice = input("Vuoi rimuovere i dati di test? (s/n): ").strip().lower()
    
    if cleanup_choice == 's':
        try:
            from bson import ObjectId
            # Rimuovi run
            mongo.orchestrator_runs.delete_one({"_id": ObjectId(run_id)})
            # Rimuovi tool executions
            mongo.tool_executions.delete_many({"run_id": run_id})
            # Rimuovi spell results
            mongo.spell_results.delete_many({"run_id": run_id})
            print_success("Dati di test rimossi da MongoDB")
        except Exception as e:
            print_error(f"Errore durante cleanup MongoDB: {e}")
    else:
        print_info(f"Dati mantenuti in MongoDB (run_id: {run_id})")
    
    # Rimuovi repo fake
    if os.path.exists(repo_path):
        shutil.rmtree(repo_path)
        print_success("Repository fake rimossa")

def main():
    """Main test flow"""
    
    print_header("TEST ORCHESTRATOR CON REPOSITORY FAKE")
    
    # Path orchestrator (parametro opzionale)
    orchestrator_script = sys.argv[1] if len(sys.argv) > 1 else "orchestrator.py"
    
    # Step 0: Verifica MongoDB
    print_info("Verifica connessione MongoDB...")
    try:
        mongo = MongoDBManager()
        print_success(f"Connesso a MongoDB: {mongo.db.name}")
    except Exception as e:
        print_error(f"Impossibile connettersi a MongoDB: {e}")
        print_info("Assicurati che MongoDB sia avviato:")
        print_info("  sudo systemctl start mongodb")
        print_info("  oppure: docker start mongodb")
        return 1
    
    # Step 1: Crea repo fake
    print_header("STEP 1: Creazione Repository Fake")
    temp_dir = tempfile.mkdtemp(prefix="orchestrator_test_")
    repo_path = create_fake_repo(temp_dir)
    
    # Marker per identificare questo test
    test_marker = "fake-test-repo"
    
    # Step 2: Conta record prima
    print_header("STEP 2: Stato Database Prima del Test")
    runs_before, tools_before, spells_before = count_records_before(mongo, test_marker)
    print_info(f"Orchestrator runs con '{test_marker}': {runs_before}")
    print_info(f"Tool executions totali: {tools_before}")
    print_info(f"Spell results totali: {spells_before}")
    
    # Step 3: Esegui orchestrator
    print_header("STEP 3: Esecuzione Orchestrator")
    success, output = run_orchestrator(repo_path, orchestrator_script)
    
    if not success:
        print_error("Test fallito: orchestrator non completato")
        cleanup(mongo, None, temp_dir)
        mongo.close()
        return 1
    
    # Step 4: Verifica dati salvati
    print_header("STEP 4: Verifica Dati in MongoDB")
    data_saved, run_id = verify_data_saved(mongo, test_marker)
    
    if not data_saved:
        print_error("Test fallito: dati non trovati in MongoDB")
        cleanup(mongo, None, temp_dir)
        mongo.close()
        return 1
    
    # Step 5: Conta record dopo
    print_header("STEP 5: Stato Database Dopo il Test")
    runs_after, tools_after, spells_after = count_records_before(mongo, test_marker)
    print_success(f"Orchestrator runs aggiunti: {runs_after - runs_before}")
    print_success(f"Tool executions aggiunte: {tools_after - tools_before}")
    print_success(f"Spell results aggiunti: {spells_after - spells_before}")
    
    # Step 6: Cleanup
    print_header("STEP 6: Cleanup")
    cleanup(mongo, run_id, temp_dir)
    mongo.close()
    
    # Riepilogo finale
    print_header("✅ TEST COMPLETATO CON SUCCESSO!")
    print(f"{Colors.GREEN}Il tuo orchestrator:{Colors.END}")
    print(f"  ✓ Ha analizzato la repository fake")
    print(f"  ✓ Ha eseguito lo spell agent")
    print(f"  ✓ Ha salvato i risultati in MongoDB")
    print(f"  ✓ I dati sono leggibili correttamente")
    print(f"\n{Colors.YELLOW}Prossimi passi:{Colors.END}")
    print(f"  1. Usa l'orchestrator su repo vere")
    print(f"  2. Visualizza con: python3 dashboard.py")
    print(f"  3. Query con: python3 query_results.py\n")
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}⚠️  Test interrotto dall'utente{Colors.END}")
        sys.exit(1)
    except Exception as e:
        print_error(f"Errore imprevisto: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)