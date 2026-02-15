import sys
import os
import json
import time
from dotenv import load_dotenv
from strands import Agent
from tools.orchestratorTools import *
import requests

def main():
    # Start timer
    start_time = time.time()
    
    load_dotenv()
    
    if not os.getenv("AGENT_MODEL_ID"):
        print("ERROR: AGENT_MODEL_ID not found in .env", file=sys.stderr)
        sys.exit(1)

    if len(sys.argv) < 3:
        print("Usage: python3 orchestrator.py <repo_url> <temp_path> [permitted_words] [languages]", file=sys.stderr)
        sys.exit(1)
    
    repo_url = sys.argv[1]
    temp_path = sys.argv[2]
    permitted_words = sys.argv[3] if len(sys.argv) > 3 else ""
    languages = sys.argv[4].split(",") if len(sys.argv) > 4 else ["it_IT", "en_US"]

    print(f"[Timer] Process started at {time.strftime('%Y-%m-%d %H:%M:%S')}", file=sys.stderr)
    print(f"Repository: {repo_url}", file=sys.stderr)
    print(f"Permitted words: {permitted_words}", file=sys.stderr)
    print(f"Languages: {', '.join(languages)}", file=sys.stderr)
    print("-" * 50, file=sys.stderr)

    try:
        # 1. Initialization of the Orchestrator with Tools
        init_start = time.time()
        orchestrator = Agent(
            model=os.getenv("AGENT_MODEL_ID"),
            tools=[clone_repo_tool, analyze_spelling_tool],
            system_prompt="""You are a Senior Software Architect. 
            Your task is:
            1. Clone the repository using clone_repo_tool.
            2. Analyze the spelling using analyze_spelling_tool on the cloned path by using the specified languages.
            3. Return the results ONLY as a valid JSON object with this structure:
            {
              "spelling_analysis": [...],
              "summary": {
                "total_files": number,
                "total_errors": number
              }
            }
            DO NOT include any explanatory text before or after the JSON."""
        )
        init_time = time.time() - init_start
        print(f"[Timer] Orchestrator initialized in {init_time:.2f}s", file=sys.stderr)

        # 2. Autonomous Execution
        exec_start = time.time()
        print(f"Orchestrator starting task for: {repo_url}...", file=sys.stderr)

        task_description = f"""Analyze the repository {repo_url} saving it in {temp_path}. 
        Use permitted words: {permitted_words} and languages: {languages}.
        Return ONLY a valid JSON object, no other text."""
        
        response = orchestrator(task_description)
        
        exec_time = time.time() - exec_start
        print(f"[Timer] Task execution completed in {exec_time:.2f}s", file=sys.stderr)
        
        # Extract inner text from the response
        parse_start = time.time()
        raw_message = response.message
        inner_text = raw_message["content"][0]["text"]
        
        # Try to extract JSON from the text (in case there's extra text)
        try:
            # Try parsing as-is first
            final_output = json.loads(inner_text)
        except json.JSONDecodeError:
            # If that fails, try to find JSON in the text
            import re
            json_match = re.search(r'\{.*\}', inner_text, re.DOTALL)
            if json_match:
                final_output = json.loads(json_match.group())
            else:
                # If still no JSON, create a fallback structure
                print(f"[Warning] Could not parse JSON. Raw output:", file=sys.stderr)
                print(inner_text, file=sys.stderr)
                final_output = {
                    "error": "Failed to parse agent output as JSON",
                    "raw_output": inner_text
                }
        
        parse_time = time.time() - parse_start
        print(f"[Timer] Response parsed in {parse_time:.2f}s", file=sys.stderr)

        # Add timing information to the output
        total_time = time.time() - start_time
        analysis_id = os.getenv('ANALYSIS_ID', 'unknown_id')
        final_output_with_timing = {
            "analysis_id": analysis_id,
            **final_output,
            "execution_metrics": {
                "total_time_seconds": round(total_time, 2),
                "initialization_time_seconds": round(init_time, 2),
                "execution_time_seconds": round(exec_time, 2),
                "parsing_time_seconds": round(parse_time, 2),
                "started_at": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(start_time)),
                "completed_at": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time()))
            }
        }

        # sostituita la stampa con una comunicazione ad un endpoint di NestJs
        print("[Timer]: Sending results to NestJs: ", file = sys.stderr)
        nest_url = 'http://host.docker.internal:3000/analysis/webhook';

        try:
            response = requests.post(nest_url, json = final_output_with_timing, timeout = 30)
        except Exception as e:
            print(f'[CRITICAL]: Unable to communicate with NestJs Application. Error: {e}', file = sys.stderr)

    except Exception as e:
        elapsed = time.time() - start_time
        print(f"\n[Timer] FAILED after {elapsed:.2f}s", file=sys.stderr)
        print(f"CRITICAL ERROR: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)

        # Try to send failure webhook
        analysis_id = os.getenv('ANALYSIS_ID')
        if analysis_id:
            try:
                nest_url = 'http://host.docker.internal:3000/analysis/webhook'
                error_payload = {
                    'analysis_id': analysis_id,
                    'summary': None,
                    'error': str(e),
                    'execution_metrics': {
                        'failed_at': datetime.now().isoformat(),
                        'total_time_seconds': elapsed
                    }
                }
                requests.post(nest_url, json=error_payload, timeout=5)
                print(f"[Info] Failure webhook sent for analysis {analysis_id}", file=sys.stderr)
            except Exception as webhook_error:
                print(f"[Warning] Failed to send failure webhook: {webhook_error}", file=sys.stderr)

        sys.exit(1)
    finally:
        # Calculate total execution time
        total_time = time.time() - start_time
        minutes, seconds = divmod(total_time, 60)
        
        print("\n" + "=" * 50, file=sys.stderr)
        print(f"[Timer] TOTAL EXECUTION TIME: {int(minutes)}m {seconds:.2f}s ({total_time:.2f}s)", file=sys.stderr)
        print("=" * 50, file=sys.stderr)

if __name__ == "__main__":
    main()
