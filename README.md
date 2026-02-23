# 0. Creazione .env
Creare un file .env nella cartella root basandosi sul file .env.example, per il PoC il metodo di analisi é docker, il metodo AWS sarà disponibile nell'MVP.

# 1. Avvio:
```bash
docker compose -f infra/compose/docker-compose.yml up --build
```


# 2. Accesso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **MongoDB**: mongodb://localhost:27017
- **Redis**: localhost:6379

# 3. Eliminazione immagini
```bash
cd infra/compose
docker compose down --rmi local
```