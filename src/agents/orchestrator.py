import sys
import os
import json
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from tools.orchestratorTools import cloneRepository

def main():

    load_dotenv()

    if len(sys.argv) < 3:
        print(f"ERROR: Insufficient arguments.", file=sys.stderr)
        print(f"Usage: python3 orchestrator.py <repo_url> <temp_path>", file=sys.stderr)
        sys.exit(1)
    repo_url = sys.argv[1]
    temp_path = sys.argv[2] # Received from Node.js

    cloned = cloneRepository(repo_url, temp_path)
    if not cloned:
        print(f"CRITICAL ERROR: Failed to clone repository {repo_url}", file=sys.stderr)
        sys.exit(1)


    # CLIENT INITIALIZATION (Engineering: Singleton-like initialization)
    try:

        aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
        aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        aws_session_token = os.getenv('AWS_SESSION_TOKEN') # Optional, needed if using temporary credentials     (Academy/SSO)
        region = os.getenv('AWS_REGION', 'eu-central-1')
        model_id = os.getenv('ORCHESTRATOR_BEDROCK_MODEL_ID')
        
        bedrock = boto3.client(
            service_name='bedrock-runtime',
            region_name=region,
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            aws_session_token=aws_session_token # Pass it even if it's None, boto3 handles it
        )
        prompt = f"You are an orchestrator. The repo {repo_url} has been cloned in {temp_path}. Searc the .txt files and check if they are spell correct. Provide a JSON output with the structure: {{'status': 'completed', 'output': '<spell_checked_texts>'}} where <spell_checked_texts> is a summary of the spell-checked texts."

        response = bedrock.converse(
            modelId=os.getenv('ORCHESTRATOR_BEDROCK_MODEL_ID'),
            messages=[{"role": "user", "content": [{"text": prompt}]}]
        )

        # Emit only the final JSON to stdout
        result = {
            "status": "completed",
            "output": response['output']['message']['content'][0]['text']
        }
        print(json.dumps(result))

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()