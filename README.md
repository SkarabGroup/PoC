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
