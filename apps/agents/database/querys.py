# querys.py
from mongodb_manager import MongoDBManager

mongo = MongoDBManager()

# Ultimi 5 run per un repository
results = mongo.get_latest_results("https://github.com/user/repo", limit=5)
for r in results:
    print(f"Run: {r['timestamp']} - Status: {r['status']}")

# Statistiche errori
stats = mongo.get_error_summary("https://github.com/user/repo")
print(f"Total files: {stats['total_files']}, Total errors: {stats['total_errors']}")

mongo.close()