# mongodb_manager.py
from pymongo import MongoClient
from datetime import datetime
from typing import Dict, Any, Optional
import os

class MongoDBManager:
    """
    Manager per salvare i risultati degli agenti in MongoDB
    """
    
    def __init__(self, connection_string: Optional[str] = None):
        """
        Initialize MongoDB connection.
        
        Args:
            connection_string: MongoDB URI (default: from env var MONGODB_URI)
        """
        self.connection_string = connection_string or os.getenv(
            'MONGODB_URI', 
            'mongodb://localhost:27017/'
        )
        self.client = MongoClient(self.connection_string)
        self.db = self.client[os.getenv('MONGODB_DB_NAME', 'agenti_db')]
        
        # Collections
        self.spell_results = self.db['spell_results']
        self.tool_executions = self.db['tool_executions']
        self.orchestrator_runs = self.db['orchestrator_runs']
        
        # Create indexes for better query performance
        self._create_indexes()
    
    def _create_indexes(self):
        """Create indexes for efficient querying"""
        self.spell_results.create_index([('repository', 1), ('timestamp', -1)])
        self.tool_executions.create_index([('run_id', 1), ('tool_name', 1)])
        self.orchestrator_runs.create_index([('repository', 1), ('status', 1)])
    
    def save_orchestrator_run(self, repo_url: str, result: Dict[str, Any]) -> str:
        """
        Save complete orchestrator run results.
        
        Args:
            repo_url: Repository URL
            result: Complete result dictionary
            
        Returns:
            Inserted document ID
        """
        document = {
            'repository': repo_url,
            'timestamp': datetime.utcnow(),
            'status': result.get('status'),
            'orchestrator_summary': result.get('orchestrator_summary'),
            'spell_agent_details': result.get('spell_agent_details'),
            'metadata': {
                'iterations': result.get('spell_agent_details', {}).get('iterations'),
                'tools_used': result.get('spell_agent_details', {}).get('tools_used')
            }
        }
        
        inserted = self.orchestrator_runs.insert_one(document)
        return str(inserted.inserted_id)
    
    def save_spell_result(self, repo_url: str, file_path: str, 
                         analysis: Dict[str, Any], run_id: Optional[str] = None) -> str:
        """
        Save individual spell check result.
        
        Args:
            repo_url: Repository URL
            file_path: File that was analyzed
            analysis: Analysis results
            run_id: Optional orchestrator run ID for linking
            
        Returns:
            Inserted document ID
        """
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
        """
        Save individual tool execution for audit trail.
        
        Args:
            run_id: Orchestrator run ID
            tool_name: Name of the tool executed
            tool_input: Input parameters
            result: Execution result
        """
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
        """Get latest results for a repository"""
        return list(self.orchestrator_runs.find(
            {'repository': repo_url}
        ).sort('timestamp', -1).limit(limit))
    
    def get_error_summary(self, repo_url: str):
        """Get aggregated error statistics for a repository"""
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
    
    def close(self):
        """Close MongoDB connection"""
        self.client.close()