import sys
import os
import json
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from tools.orchestratorTools import cloneRepository
from spellAgent import SpellAgent
from database.mongodb_manager import MongoDBManager

def main():
    # 1. Carica variabili d'ambiente
    load_dotenv()

    # 2. Controllo argomenti: Repo, Path, Email
    if len(sys.argv) < 3:
        print(f"ERROR: Insufficient arguments.", file=sys.stderr)
        print(f"Usage: python3 orchestrator.py <repo_url> <temp_path> <email>", file=sys.stderr)
        sys.exit(1)
    
    repo_url = sys.argv[1]
    temp_path = sys.argv[2]
    # L'email serve per collegare l'utente nel DB
    user_email = sys.argv[3] if len(sys.argv) > 3 else 'unknown@docker.com'

    mongo = None

    try:
        # 3. INIZIALIZZA MONGO (PRIMA DI USARLO!)
        # Questo crea la connessione al DB (tramite host.docker.internal se siamo in docker)
        mongo = MongoDBManager()

        # 4. RECUPERA/CREA UTENTE E PROGETTO
        # Ora possiamo usare 'mongo' perché è stato inizializzato sopra
        print(f"DEBUG: Processing User: {user_email}", file=sys.stderr)
        userId = mongo.get_or_create_user(user_email)
        projectId = mongo.get_or_create_project(userId, repo_url)

        # 5. CLONE REPOSITORY
        cloned = cloneRepository(repo_url, temp_path)
        if not cloned:
            print(f"CRITICAL ERROR: Failed to clone repository {repo_url}", file=sys.stderr)
            sys.exit(1)

        # 6. CLIENT INITIALIZATION (AWS BEDROCK)
        aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
        aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        aws_session_token = os.getenv('AWS_SESSION_TOKEN')
        region = os.getenv('AWS_REGION', 'eu-central-1')
        model_id = os.getenv('ORCHESTRATOR_BEDROCK_MODEL_ID')
        
        if not model_id:
            raise ValueError("ORCHESTRATOR_BEDROCK_MODEL_ID must be set in environment variables")
        
        bedrock = boto3.client(
            service_name='bedrock-runtime',
            region_name=region,
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            aws_session_token=aws_session_token
        )

        # 7. RUN SPELL AGENT
        print("Initializing SpellAgent with tool calling...", file=sys.stderr)
        spell_agent = SpellAgent(bedrock, model_id)
        
        print(f"Starting spell check analysis on {temp_path}...", file=sys.stderr)
        spell_result = spell_agent.check_spelling(temp_path)
        print(f"Spell check completed in {spell_result.get('iterations', 0)} iterations.", file=sys.stderr)

        # 8. ORCHESTRATOR SUMMARY (LLM)
        prompt = f"""You are an orchestrator managing code analysis tasks.
                
        Repository: {repo_url}
        Cloned to: {temp_path}

        The SpellAgent has autonomously analyzed the repository using tool calling.
        
        Analysis Results:
        {json.dumps(spell_result, indent=2)}

        Provide a comprehensive summary of the spell-checking results in JSON format with this structure:
        {{
            "status": "completed",
            "repository": "{repo_url}",
            "total_files_analyzed": <number>,
            "total_errors_found": <number>,
            "summary": "<overall_summary>",
            "details": "<detailed_findings>"
        }}"""

        print("Generating final summary...", file=sys.stderr)
        response = bedrock.converse(
            modelId=model_id,
            messages=[{"role": "user", "content": [{"text": prompt}]}]
        )

        orchestrator_output = response['output']['message']['content'][0]['text']
        
        # Parse JSON
        try:
            if '```json' in orchestrator_output:
                orchestrator_output = orchestrator_output.split('```json')[1].split('```')[0].strip()
            elif '```' in orchestrator_output:
                orchestrator_output = orchestrator_output.split('```')[1].split('```')[0].strip()
            
            orchestrator_summary = json.loads(orchestrator_output)
        except json.JSONDecodeError:
            orchestrator_summary = {
                "status": "completed",
                "summary": orchestrator_output
            }

        # 9. PREPARA RISULTATO FINALE
        result = {
            "status": "completed",
            "repository": repo_url,
            "orchestrator_summary": orchestrator_summary,
            "spell_agent_details": {
                "status": spell_result.get("status"),
                "iterations": spell_result.get("iterations"),
                "tools_used": len(spell_result.get("tool_executions", [])),
                "full_results": spell_result
            }
        }

        # 10. SALVA SU MONGODB (Linkando User e Project)
        # Qui usiamo userId e projectId recuperati all'inizio
        run_id = mongo.save_orchestrator_run(repo_url, result, userId=userId, projectId=projectId)
        print(f"Results saved to MongoDB with run_id: {run_id}", file=sys.stderr)
        
        # Save individual tool executions
        for tool_exec in spell_result.get("tool_executions", []):
            mongo.save_tool_execution(
                run_id=run_id,
                tool_name=tool_exec.get("tool"),
                tool_input=tool_exec.get("input"),
                result=tool_exec.get("result")
            )
        mongo.update_last_check(projectId)
        
        # 11. OUTPUT FINALE (STDOUT)
        # Aggiungiamo gli ID al JSON che Docker restituirà a Node.js
        result['mongodb_run_id'] = run_id
        result['userId'] = userId
        result['projectId'] = projectId
        
        print(json.dumps(result, indent=2))

    except ValueError as ve:
        print(f"CONFIGURATION ERROR: {str(ve)}", file=sys.stderr)
        sys.exit(1)
    except ClientError as ce:
        print(f"AWS CLIENT ERROR: {str(ce)}", file=sys.stderr)
        sys.exit(1)
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