# PoC Code Guardian

Repository specifica per il codice del PoC per il progetto Code Guardian.

## 🚀 Quick Start (Docker)

L'intero progetto (Frontend, Backend, Database, Redis, Agents) è containerizzato.
Requisito unico: **Docker Desktop**.

### 1. Avvio

```bash
./start-all.sh
```

Questo script:

- Verifica che Docker sia avviato
- Costruisce le immagini (la prima volta richiede qualche minuto)
- Avvia tutti i servizi
- Mostra i log e lo stato

### 2. Accesso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **MongoDB**: mongodb://localhost:27017
- **Redis**: localhost:6379

### 3. Stop

Per fermare tutto e rimuovere i container:

```bash
./stop-all.sh
```

---

## 🛠 Sviluppo

Il codice sorgente è montato nei container, quindi le modifiche si riflettono (quasi) in tempo reale, tranne per nuove dipendenze che richiedono un rebuild.

### API Test

Puoi testare l'API direttamente:

Health Check:

```bash
curl http://localhost:3000/health
```

Analisi Mock (Test):

```bash
curl -X POST http://localhost:3000/analysis \
  -H "Content-Type: application/json" \
  -d '{"repoURL": "https://github.com/Poian3k/TeXeneratorGUI"}'
```

---

## 📂 Struttura

- `apps/frontend`: React + Vite
- `apps/api`: NestJS
- `apps/agents`: Python Agents (AI)
- `infra/compose`: (Legacy, ora usa root `docker-compose.yml`)

## 📝 Note

- Assicurati che le porte 3000, 5173, 27017 e 6379 siano libere.
- Lo script `start-all.sh` gestisce automaticamente il file `.env`.


# Come avviare
# Rebuild (serve solo la prima volta o dopo una modifica)
```bash
docker-compose build
```
# Avvia
```bash
docker-compose up -d
```
# Verifica
```bash
docker-compose ps
```
# Genera troken nel container ed esportalo
```bash
#se utente è già registrato
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Password1!"
  }'

#se utente è ancora da registrare
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "mario_rossi",
    "email": "mario.rossi@nuovo.com",
    "password": "Password1!"
  }' | jq '.'

#esportare il token  di accesso ricevuto
export JWT_TOKEN="<copia_output_qui>"
```

# Test
```bash
curl -X POST http://localhost:3000/analysis/run \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"repoURL": "https://github.com/octocat/Hello-World"}' | jq '.'
  #PS: jq è un comando pwe trasformare i dati json
```

## Se non si ha jq installato non serve metterlo
```bash 
# Senza formattazione (JSON raw)
curl -X POST http://localhost:3000/analysis/run \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"repoURL": "https://github.com/octocat/Hello-World"}'
```

# Accesso al db da line a di comando
```bash 
docker-compose exec mongodb mongosh agenti_db
```

## Per navigare il database
```bash
show collections          # Mostra tabelle
db.users.find().pretty()  # Tutti gli utenti
db.projects.find().pretty()  # Tutti i progetti
db.orchestrator_runs.find().sort({createdAt:-1}).limit(1).pretty()  # Ultima analisi

# Conta documenti
db.users.countDocuments()
db.projects.countDocuments()
db.orchestrator_runs.countDocuments()

# Esci
exit
```

# Per vedere i log del server avviato tramite docker 
```bash 
docker-compose logs -f api
```