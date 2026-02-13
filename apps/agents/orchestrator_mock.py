#!/usr/bin/env python3
"""
Mock Orchestrator - Simula un'analisi senza AWS Bedrock
Usato per PoC e testing quando non si hanno credenziali AWS
"""
import sys
import os
import json
import time
import requests
from datetime import datetime
from dotenv import load_dotenv
from tools.orchestratorTools import clone_repo_tool

def send_webhook(analysis_id: str, results: dict):
    """Send webhook notification to backend server"""
    webhook_url = 'http://host.docker.internal:3000/analysis/webhook'

    if not analysis_id:
        print("⚠️  No ANALYSIS_ID provided, skipping webhook", file=sys.stderr)
        return

    payload = {
        'analysis_id': analysis_id,
        'summary': results.get('orchestrator_summary'),
        'spelling_analysis': results.get('spell_agent_details'),
        'execution_metrics': {
            'completed_at': datetime.now().isoformat(),
            'mongodb_run_id': results.get('mongodb_run_id')
        }
    }

    try:
        print(f"DEBUG: Sending webhook to {webhook_url}...", file=sys.stderr)
        response = requests.post(
            webhook_url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        response.raise_for_status()
        print(f"✅ Webhook sent successfully to {webhook_url}", file=sys.stderr)
        print(f"DEBUG: Webhook response: {response.status_code} - {response.text}", file=sys.stderr)
    except Exception as e:
        print(f"❌ Failed to send webhook: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)

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

    # Get ANALYSIS_ID from environment variable
    analysis_id = os.getenv('ANALYSIS_ID')
    print(f"DEBUG: ANALYSIS_ID from env: {analysis_id}", file=sys.stderr)

    try:
        print(f"DEBUG: [MOCK MODE] Processing User: {user_email}", file=sys.stderr)

        # SKIP MongoDB - backend will handle DB via webhook
        # SKIP CLONE - not needed for mock, just simulate analysis
        print(f"DEBUG: Skipping repository clone for mock...", file=sys.stderr)

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

        # 8. SEND WEBHOOK (skip MongoDB, backend handles it)
        print(f"DEBUG: [MOCK] Analysis completed successfully", file=sys.stderr)

        if analysis_id:
            send_webhook(analysis_id, result)
        else:
            print("WARNING: No ANALYSIS_ID found, webhook not sent", file=sys.stderr)

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)

        # Try to send failure webhook
        if analysis_id:
            try:
                webhook_url = 'http://host.docker.internal:3000/analysis/webhook'
                error_payload = {
                    'analysis_id': analysis_id,
                    'summary': None,
                    'error': str(e),
                    'execution_metrics': {
                        'failed_at': datetime.now().isoformat()
                    }
                }
                requests.post(webhook_url, json=error_payload, timeout=5)
            except:
                pass

        sys.exit(1)

if __name__ == "__main__":
    main()
