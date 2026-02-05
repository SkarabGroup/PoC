import sys
import os
import json
from dotenv import load_dotenv
from strands import Agent
from tools.orchestratorTools import *
#from database.mongodb_manager import MongoDBManager


# --- MAIN ORCHESTRATOR LOGIC ---

def main():
    load_dotenv()
    
   
    
    if not os.getenv("AGENT_MODEL_ID"):
        print("ERROR: AGENT_MODEL_ID not found in .env", file=sys.stderr)
        sys.exit(1)

    if len(sys.argv) < 3:
        print("Usage: python3 orchestrator.py <repo_url> <temp_path>", file=sys.stderr)
        sys.exit(1)
    
    repo_url = sys.argv[1]
    temp_path = sys.argv[2]
    #mongo = MongoDBManager()

    try:
        # 1. Initialization of the Orchestrator with Tools
        orchestrator = Agent(
            model=os.getenv("AGENT_MODEL_ID"), # Example: "gpt-4" (ensure this is set in your environment)
            tools=[clone_repo_tool, analyze_spelling_tool],
            system_prompt="""You are a Senior Software Architect. 
            Your task is:
            1. Clone the repository using clone_repo_tool.
            2. Analyze the spelling using analyze_spelling_tool on the cloned path by using ["it","en_US"] as languages.
            3. Return the results in a structured JSON format."""
        )

        print(f"Orchestrator starting task for: {repo_url}...", file=sys.stderr)

        # 2. Autonomous Execution
        task_description = f"Analyze the repository {repo_url} saving it in {temp_path}. Tell me how many errors you found"
        response = orchestrator(task_description) 
        
        raw_message = response.message

        # Extract inner text from the response
        #{
        #"role": "assistant",
        #"content": [
        #    {
        #    "text": ...
        #    }
        # ]
        #}
        inner_text = raw_message["content"][0]["text"]
        final_output = json.loads(inner_text)

        print("final output:\n")
        print(json.dumps(final_output, indent=2))

        # 3. Saving to MongoDB (Persistence Layer)
        # Retrieve the history of tool calls for the audit trail
        run_data = {
            "repository": repo_url,
            "final_report": final_output
        }
        
        #run_id = mongo.save_orchestrator_run(repo_url, run_data)
        #print(f"Process completed. RunID: {run_id}")
        print("-" * 30)


    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)
    finally:
        pass#mongo.close()

if __name__ == "__main__":
    main()