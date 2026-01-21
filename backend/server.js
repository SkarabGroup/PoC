const express = require('express');
const app = express();

app.use(express.json());

app.post('/analyze', (req, res) => {
    const { repoUrl } = req.body;

    console.log(`[Mock Server] Ricevuta richiesta di analisi per: ${repoUrl}`);

    if (!repoUrl) {
        return res.status(400).json({ error: "URL della repository mancante" });
    }

    console.log("[Mock Server] Qui si chiamano gli agenti Python (simulato)...");

    const mockResponse = {
        //mock della risposta JSON dell'orchestratore
        orchestrator_status: "success",
        agent_results: {
            reviewer: {
                status: "success",
                repo_analyzed: repoUrl,
                folder_found: "Documentazione/",
                files_checked: ["README.md", "introduzione.txt"],
                typos_found: [
                    {
                        file: "README.md",
                        word: "tecnolofie",
                        suggestion: "tecnologie",
                        line: 5
                    }
                ]
            }
        },
        summary: "MOCK: Analisi completata con successo."
    };

    console.log("[Mock Server] Analisi completata. Invio risposta.");
    
    res.json(mockResponse);

});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`
    MOCK SERVER ATTIVO
    Endpoint: http://localhost:${PORT}/analyze
    Questo server NON chiama Python. Restituisce dati statici per test`);
});