# mongodb_manager.py
from pymongo import MongoClient
from datetime import datetime
from typing import Dict, Any, Optional
import os
import bcrypt  # <--- ERA MANCANTE
from bson import ObjectId

class MongoDBManager:
    """
    Manager per salvare i risultati degli agenti in MongoDB
    """
    
    def __init__(self, connection_string: Optional[str] = None):
        self.connection_string = connection_string or os.getenv(
            'MONGODB_URI', 
            'mongodb://localhost:27017/'
        )
        self.client = MongoClient(self.connection_string)
        self.db = self.client[os.getenv('MONGODB_DB_NAME', 'agenti_db')]
        
        # Collections Base
        self.spell_results = self.db['spell_results']
        self.tool_executions = self.db['tool_executions']
        self.orchestrator_runs = self.db['orchestrator_runs']
        
        # Collections Utenti & Progetti (AGGIUNTE)
        self.users = self.db['users']
        self.projects = self.db['projects']
        
        self._create_indexes()
    
    def _create_indexes(self):
        """Create indexes for efficient querying"""
        self.spell_results.create_index([('repository', 1), ('timestamp', -1)])
        self.tool_executions.create_index([('run_id', 1), ('tool_name', 1)])
        self.orchestrator_runs.create_index([('repository', 1), ('status', 1)])
        # Indici per utenti
        self.users.create_index("email", unique=True)
        self.users.create_index("username", unique=True)
        self.projects.create_index([("userId", 1), ("repo_url", 1)])
    
    def save_orchestrator_run(self, repo_url: str, result: Dict[str, Any], userId: str = None, projectId: str = None) -> str:
        """
        Save complete orchestrator run results.
        Updated to include linking to User and Project.
        """
        document = {
            'repository': repo_url,
            'timestamp': datetime.utcnow(),
            'status': result.get('status'),
            'orchestrator_summary': result.get('orchestrator_summary'),
            'spell_agent_details': result.get('spell_agent_details'),
            # --- LINKING CRITICO PER NESTJS ---
            'userId': userId,
            'projectId': projectId,
            # ----------------------------------
            'metadata': {
                'iterations': result.get('spell_agent_details', {}).get('iterations'),
                'tools_used': result.get('spell_agent_details', {}).get('tools_used')
            }
        }
        
        inserted = self.orchestrator_runs.insert_one(document)
        return str(inserted.inserted_id)
    
    def save_spell_result(self, repo_url: str, file_path: str, 
                         analysis: Dict[str, Any], run_id: Optional[str] = None) -> str:
        document = {
            'repository': repo_url,
            'file_path': file_path,
            'timestamp': datetime.utcnow(),
            'run_id': run_id,
            'has_errors': analysis.get('has_errors', False),
            'error_count': analysis.get('error_count', 0),
            'errors': analysis.get('errors', []),
            'summary': analysis.get('summary', '')
        }
        inserted = self.spell_results.insert_one(document)
        return str(inserted.inserted_id)
    
    def save_tool_execution(self, run_id: str, tool_name: str, 
                           tool_input: Dict[str, Any], result: Dict[str, Any]):
        document = {
            'run_id': run_id,
            'tool_name': tool_name,
            'timestamp': datetime.utcnow(),
            'input': tool_input,
            'result': result,
            'success': 'error' not in result
        }
        self.tool_executions.insert_one(document)
    
    def get_latest_results(self, repo_url: str, limit: int = 10):
        return list(self.orchestrator_runs.find(
            {'repository': repo_url}
        ).sort('timestamp', -1).limit(limit))
    
    def get_error_summary(self, repo_url: str):
        pipeline = [
            {'$match': {'repository': repo_url}},
            {'$group': {
                '_id': '$repository',
                'total_files': {'$sum': 1},
                'total_errors': {'$sum': '$error_count'},
                'files_with_errors': {
                    '$sum': {'$cond': ['$has_errors', 1, 0]}
                }
            }}
        ]
        result = list(self.spell_results.aggregate(pipeline))
        return result[0] if result else None
    
    # --- METODI USER ---

    def create_user(self, email: str, password: str, username: str) -> str:
       hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
       user = {
           'email': email.lower(),
           'password': hashed.decode('utf-8'),
           'username': username,
           'created_at': datetime.utcnow(),
           'github': None 
       }
       result = self.users.insert_one(user)
       return str(result.inserted_id)
   
    def get_user(self, email: str) -> Optional[Dict[str, Any]]:
        return self.users.find_one({'email': email.lower()})
    
    def link_github(self, userId: str, github_id: str, github_username: str, access_token: str = None):
        self.users.update_one(
            {'_id': ObjectId(userId)},
            {'$set': {
                'github': {
                    'id': github_id,
                    'username': github_username,
                    'token': access_token,
                    'linked_at': datetime.utcnow()
                }
            }}
        )

    # --- METODI PROJECT ---

    def create_project(self, userId: str, repo_url: str, name: str = None) -> str:
        project = {
            'userId': userId, # Salvato come stringa (corretto per coerenza con gli altri ID)
            'repo_url': repo_url,
            'name': name or repo_url.split('/')[-1],
            'created_at': datetime.utcnow(),
            'last_check': None
        }
        result = self.projects.insert_one(project)
        return str(result.inserted_id)
    
    def get_project(self, userId: str, repo_url: str) -> Optional[Dict[str, Any]]:
        return self.projects.find_one({'userId': userId, 'repo_url': repo_url})
    
    def update_last_check(self, projectId: str):
        self.projects.update_one(
            {'_id': ObjectId(projectId)},
            {'$set': {'last_check': datetime.utcnow()}}
        )

    # --- HELPER ---
    def get_or_create_user(self, email: str) -> str:
        user = self.get_user(email)
        if user:
            return str(user['_id'])
        return self.create_user(email, 'default', email.split('@')[0])
    
    def get_or_create_project(self, userId: str, repo_url: str) -> str:
        project = self.get_project(userId, repo_url)
        if project:
            return str(project['_id'])
        return self.create_project(userId, repo_url)

    def close(self):
        self.client.close()