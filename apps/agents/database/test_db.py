#!/usr/bin/env python3
"""
Test Integrazione - Verifica che tutto funzioni
"""

import sys
sys.path.insert(0, 'database')

from mongodb_manager import MongoDBManager

def test():
    print("🧪 TEST INTEGRAZIONE UTENTI E PROGETTI\n")
    
    try:
        # Connetti
        print("1️⃣ Connessione MongoDB...")
        mongo = MongoDBManager()
        print(f"   ✅ Connesso: {mongo.db.name}\n")
        
        # Test utente
        print("2️⃣ Test Utente...")
        userId = mongo.get_or_create_user('test@integration.com')
        print(f"   ✅ User ID: {userId}")
        
        user = mongo.get_user('test@integration.com')
        print(f"   ✅ Username: {user['username']}\n")
        
        # Test GitHub link
        print("3️⃣ Test GitHub Link...")
        mongo.link_github(userId, '99999', 'test-gh-user')
        user = mongo.get_user('test@integration.com')
        print(f"   ✅ GitHub: {user['github']['username']}\n")
        
        # Test progetto
        print("4️⃣ Test Progetto...")
        projectId = mongo.get_or_create_project(userId, 'https://github.com/test/repo')
        print(f"   ✅ Project ID: {projectId}")
        
        project = mongo.get_project(userId, 'https://github.com/test/repo')
        print(f"   ✅ Name: {project['name']}\n")
        
        # Test save run
        print("5️⃣ Test Save Run...")
        result = {
            'status': 'completed',
            'orchestrator_summary': {'total_files': 5},
            'spell_agent_details': {'iterations': 3}
        }
        run_id = mongo.save_orchestrator_run(
            'https://github.com/test/repo',
            result,
            userId=userId,
            projectId=projectId
        )
        print(f"   ✅ Run ID: {run_id}\n")
        
        # Test last_check
        print("6️⃣ Test Last Check Update...")
        mongo.update_last_check(projectId)
        project = mongo.get_project(userId, 'https://github.com/test/repo')
        print(f"   ✅ Last check: {project['last_check']}\n")
        
        # Query
        print("7️⃣ Test Query...")
        from bson import ObjectId
        
        projects = list(mongo.projects.find({'userId': userId}))
        print(f"   ✅ Progetti trovati: {len(projects)}")
        
        runs = list(mongo.orchestrator_runs.find({'userId': userId}))
        print(f"   ✅ Run trovati: {len(runs)}\n")
        
        # Cleanup (opzionale)
        print("🗑️  Cleanup...")
        choice = input("Rimuovere dati di test? (s/n): ").strip().lower()
        if choice == 's':
            mongo.orchestrator_runs.delete_one({'_id': ObjectId(run_id)})
            mongo.projects.delete_one({'_id': ObjectId(projectId)})
            mongo.users.delete_one({'_id': ObjectId(userId)})
            print("   ✅ Dati rimossi\n")
        else:
            print("   ℹ️  Dati mantenuti\n")
        
        mongo.close()
        
        print("="*50)
        print("✅ TUTTI I TEST PASSATI!")
        print("="*50)
        print("\nL'integrazione funziona correttamente!")
        print("Puoi ora usare:")
        print("  python3 orchestrator.py <repo> <path> <email>")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ ERRORE: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(test())