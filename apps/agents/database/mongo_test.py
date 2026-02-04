# test_mongo.py
from mongodb_manager import MongoDBManager

mongo = MongoDBManager()
print("Connessione MongoDB riuscita!")
print(f"Database: {mongo.db.name}")
print(f"Collections disponibili: {mongo.db.list_collection_names()}")
mongo.close()