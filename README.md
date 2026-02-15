Per avviare l'applicazione:
```bash
docker compose -f infra/compose/docker-compose.yml --build
```
Da qui, vengono create le immagini di analyzer-agent e di server.
Server viene poi containerizzato e rimane in ascolto su localhost:3000

Per verificare che il server sia correttamente attivo:
```bash
curl -X GET http://locahost:3000/health
```
Se tutto funziona, viene restituito ```ok true``` e dai log del server 
comparirà un messaggio:
```bash
[Sistema]: Il server è attivo e ha ricevuto una status request
```

Per avviare una analisi:
```bash
curl -X POST http://localhost:3000/analysis -H "Content-Type: application/json" -d '{"repoURL": "https://github.com/SkarabGroup/PoC_test_repo"}'
```
e dal server vengono visualizzati i log delle operazioni.

Per recuperare il risultato:
```bash
curl -X GET http://localhost:3000/analysis/report/id_analisi
```
