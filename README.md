# PoC
Repository specifica per il codice del PoC per il progetto code guardian

API:
```bash
cd apps/api && npm run start:dev
curl -X GET http://localhost:3000/health
```

Test:
```bash
curl -X POST http://localhost:3000/analysis -H "Content-Type: application/json" -d '{"repoURL": "https://github.com/Poian3k/TeXeneratorGUI"}'
```
Dovrebbe restituire:
```bash

```

Provare anche:
```bash
curl -X POST http://localhost:3000/analysis -H "Content-Type: application/json" -d '{"repoURL": "https://github.com/bimbumbam/bambumbim"}'
curl -X POST http://localhost:3000/analysis -H "Content-Type: application/json" -d '{}'
```

Se tutto funziona:
```bash
cd infra/compose
docker compose up -d
```

Se genera un errore legato alle credenziali:
```bash
nano ~/.docker/config.json
```
e rimuovere la riga:
```bash
"credsStore": "desktop"
= .env
In .env.example é espressa la struttura del .env

3. Installare pymongo
```bash
pip install pymongo
```

4. Avviare MongoDB
localmente
```bash
sudo systemctl start mongodb (su ubuntu/debian)
```
con docker
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest 
```
da eseguire nel terminale della cartella agenti: 
```bash
docker build -t analyzer-agent -f Dockerfile.agents .
```