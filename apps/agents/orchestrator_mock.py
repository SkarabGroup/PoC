#!/usr/bin/env python3
import sys
import os
import json
import time
import requests
from datetime import datetime

def main():
    start_time = time.time()
    
    # 1. Recupero parametri come l'originale
    if len(sys.argv) < 3:
        print("Usage: python3 mock_orchestrator.py <repo_url> <temp_path>", file=sys.stderr)
        sys.exit(1)
    
    repo_url = sys.argv[1]
    temp_path = sys.argv[2]
    analysis_id = os.getenv('ANALYSIS_ID', 'mock_id_12345')

    print(f"[Mock Timer] Starting fake analysis for: {repo_url}", file=sys.stderr)
    print(f"[Mock Timer] Analysis ID: {analysis_id}", file=sys.stderr)

    # 2. Simula il tempo di esecuzione (es. clone e analisi spelling)
    time.sleep(2) 

    # 3. Costruzione del finto risultato (stessa struttura del prompt di sistema)
    mock_results = {
        "spelling_analysis": [
            {
                "filepath": f"{temp_path}/README.md",
                "misspelled_words": ["exemple", "desined", "speling"]
            },
            {
                "filepath": f"{temp_path}/src/main.ts",
                "misspelled_words": ["funtion", "initilize"]
            }
        ],
        "summary": {
            "total_files": 2,
            "total_errors": 5
        }
    }

    # 4. Aggiunta metriche di esecuzione (esattamente come l'originale)
    total_time = time.time() - start_time
    final_payload = {
        "analysisId": analysis_id,  # Allineato al controller NestJS
        "analysis_id": analysis_id, # Fallback snake_case
        **mock_results,
        "execution_metrics": {
            "total_time_seconds": round(total_time, 2),
            "started_at": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(start_time)),
            "completed_at": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time()))
        },
        "status": "completed"
    }

    # 5. Invio al Webhook
    nest_url = 'http://host.docker.internal:3000/analysis/webhook'
    print(f"[Mock Timer]: Sending mock results to NestJs: {nest_url}", file=sys.stderr)

    try:
        response = requests.post(nest_url, json=final_payload, timeout=10)
        print(f"✅ Webhook response: {response.status_code}", file=sys.stderr)
    except Exception as e:
        print(f"❌ Webhook failed: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"\n[Mock Timer] TOTAL EXECUTION TIME: {total_time:.2f}s", file=sys.stderr)

if __name__ == "__main__":
    main()
