#!/usr/bin/env python3
"""
Mock Orchestrator - Simula un'analisi senza AWS Bedrock
Usato per PoC e testing quando non si hanno credenziali AWS
"""
import sys
import os
import json
import time
from dotenv import load_dotenv
from tools.orchestratorTools import cloneRepository
from database.mongodb_manager import MongoDBManager

def main():
    # 1. Carica variabili d'ambiente
    load_dotenv()

    # 2. Controllo argomenti: Repo, Path, Email
    if len(sys.argv) < 3:
        print(f"ERROR: Insufficient arguments.", file=sys.stderr)
        print(f"Usage: python3 orchestrator_mock.py <repo_url> <temp_path> <email>", file=sys.stderr)
        sys.exit(1)

    repo_url = sys.argv[1]
    temp_path = sys.argv[2]
    user_email = sys.argv[3] if len(sys.argv) > 3 else 'unknown@docker.com'

    mongo = None

    try:
        print(f"DEBUG: [MOCK MODE] Processing User: {user_email}", file=sys.stderr)

        # 3. INIZIALIZZA MONGO
        mongo = MongoDBManager()

        # 4. RECUPERA/CREA UTENTE E PROGETTO
        userId = mongo.get_or_create_user(user_email)
        projectId = mongo.get_or_create_project(userId, repo_url)

        # 5. CLONE REPOSITORY
        print(f"DEBUG: Cloning repository {repo_url}...", file=sys.stderr)
        cloned = cloneRepository(repo_url, temp_path)
        if not cloned:
            print(f"CRITICAL ERROR: Failed to clone repository {repo_url}", file=sys.stderr)
            sys.exit(1)

        # 6. SIMULA ANALISI (senza AWS)
        print("DEBUG: [MOCK] Running simulated analysis...", file=sys.stderr)
        time.sleep(2)  # Simula tempo di elaborazione

        # Dati mock realistici
        mock_spell_result = {
            "status": "completed",
            "iterations": 3,
            "files_analyzed": 12,
            "errors_found": 5,
            "tool_executions": [
                {
                    "tool": "scan_directory",
                    "input": {"directory": temp_path},
                    "result": {"files_found": 12, "extensions": [".py", ".js", ".md", ".txt"]}
                },
                {
                    "tool": "check_file_spelling",
                    "input": {"file": "README.md"},
                    "result": {"errors": ["teh -> the", "recieve -> receive"]}
                },
                {
                    "tool": "check_file_spelling",
                    "input": {"file": "docs/guide.txt"},
                    "result": {"errors": ["occured -> occurred"]}
                }
            ],
            "detailed_errors": [
                {
                    "file": "README.md",
                    "line": 5,
                    "error": "teh",
                    "suggestion": "the",
                    "context": "teh quick brown fox"
                },
                {
                    "file": "README.md",
                    "line": 12,
                    "error": "recieve",
                    "suggestion": "receive",
                    "context": "I will recieve your email"
                },
                {
                    "file": "docs/guide.txt",
                    "line": 8,
                    "error": "occured",
                    "suggestion": "occurred",
                    "context": "error occured yesterday"
                },
                {
                    "file": "src/utils.py",
                    "line": 23,
                    "error": "seperator",
                    "suggestion": "separator",
                    "context": "use the seperator function"
                },
                {
                    "file": "CHANGELOG.txt",
                    "line": 15,
                    "error": "intial",
                    "suggestion": "initial",
                    "context": "intial release"
                }
            ]
        }

        orchestrator_summary = {
            "status": "completed",
            "repository": repo_url,
            "total_files_analyzed": 12,
            "total_errors_found": 5,
            "summary": "Mock analysis completed successfully. Found 5 spelling errors across 4 files.",
            "details": "Analyzed 12 files in the repository. Spelling issues detected in README.md (2 errors), docs/guide.txt (1 error), src/utils.py (1 error), and CHANGELOG.txt (1 error). Common mistakes include 'teh' instead of 'the', 'recieve' instead of 'receive', and 'occured' instead of 'occurred'.",
            "quality_score": 85,
            "suggestions": [
                "Fix spelling errors in documentation files",
                "Consider adding a spell checker to CI/CD pipeline",
                "Review technical terms for consistency"
            ]
        }

        # 7. PREPARA RISULTATO FINALE
        result = {
            "status": "completed",
            "repository": repo_url,
            "mock_mode": True,
            "orchestrator_summary": orchestrator_summary,
            "spell_agent_details": {
                "status": mock_spell_result.get("status"),
                "iterations": mock_spell_result.get("iterations"),
                "tools_used": len(mock_spell_result.get("tool_executions", [])),
                "full_results": mock_spell_result
            }
        }

        # 8. SALVA SU MONGODB
        print(f"DEBUG: Saving results to MongoDB...", file=sys.stderr)
        run_id = mongo.save_orchestrator_run(repo_url, result, userId=userId, projectId=projectId)
        print(f"Results saved to MongoDB with run_id: {run_id}", file=sys.stderr)

        # Save individual tool executions
        for tool_exec in mock_spell_result.get("tool_executions", []):
            mongo.save_tool_execution(
                run_id=run_id,
                tool_name=tool_exec.get("tool"),
                tool_input=tool_exec.get("input"),
                result=tool_exec.get("result")
            )
        mongo.update_last_check(projectId)

        # 9. OUTPUT FINALE
        result['mongodb_run_id'] = run_id
        result['userId'] = userId
        result['projectId'] = projectId

        print(json.dumps(result, indent=2))
        print(f"DEBUG: [MOCK] Analysis completed successfully", file=sys.stderr)

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
    finally:
        if mongo:
            mongo.close()

if __name__ == "__main__":
    main()
