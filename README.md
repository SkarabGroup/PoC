# PoC
Repository specifica per il codice del PoC per il progetto code guardian

1. Installare le dipendenze backend e avviare il server 
Aprire una scheda del terminale
Da PoC/
```bash
cd src/backend
npm install uuid express dotenv
npx ts-node server.ts
```
Da Terminale dovrebbe comparire il messaggio
```bash
Server listening on port 3000
```
Tenerla attiva per tutta la esecuzione

2. Installare le dipendenze python
Aprendo una nuova scheda del terminale
Da PoC/
```bash
cd src/agents
python3 -m venv .venv
source .venv/bin/activate
pip install -r ../../requirements.txt
```
= Librerie da installare
== backend
dotenv express (.env ==> express.env)

= Comandi per settare l'ambiente virtuale

python3 -m venv venv 
source venv/bin/activate
pip install -r requirements.txt

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
