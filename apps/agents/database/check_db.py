from mongodb_manager import MongoDBManager
from dotenv import load_dotenv
import json
from bson import json_util  # Helper per stampare date e ObjectId correttamente

def print_collection_sample(name, data):
    print(f"\n{'='*20} ULTIMO RECORD IN: {name} {'='*20}")
    if data:
        # Usa json_util per gestire ObjectId e datetime
        print(json.dumps(data, indent=2, default=json_util.default))
    else:
        print("❌ Nessun record trovato in questa collezione.")

def main():
    load_dotenv()
    
    try:
        mongo = MongoDBManager()
        print(f"🔌 Connesso a DB: {mongo.db.name}")
        
        # 1. Cerca in orchestrator_runs (Esecuzioni generali)
        last_run = mongo.orchestrator_runs.find_one(sort=[('timestamp', -1)])
        print_collection_sample("orchestrator_runs", last_run)

        # 2. Cerca in spell_results (Risultati analisi file)
        last_spell = mongo.spell_results.find_one(sort=[('timestamp', -1)])
        print_collection_sample("spell_results", last_spell)

        # 3. Cerca in tool_executions (Log dei tool usati)
        last_tool = mongo.tool_executions.find_one(sort=[('timestamp', -1)])
        print_collection_sample("tool_executions", last_tool)

        # Statistiche rapide se ci sono dati
        if last_run:
            repo = last_run.get('repository')
            if repo:
                print(f"\n📊 Statistiche errori per repo '{repo}':")
                stats = mongo.get_error_summary(repo)
                print(json.dumps(stats, indent=2, default=json_util.default))

    except Exception as e:
        print(f"Errore durante la connessione o lettura: {e}")
    finally:
        if 'mongo' in locals():
            mongo.close()
            print("\n🔌 Connessione chiusa.")

if __name__ == "__main__":
    main()