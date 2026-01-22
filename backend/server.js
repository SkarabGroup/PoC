require('dotenv').config();
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// create a base temporary path for cloned repositories
const BASE_TEMP_PATH = path.resolve(__dirname, '../tempCloned');

// Ensure the "tempCloned" folder exists at server startup
if (!fs.existsSync(BASE_TEMP_PATH)) {
    fs.mkdirSync(BASE_TEMP_PATH, { recursive: true });
}

app.post('/analyze', async (req, res) => {
    const { repoUrl } = req.body;
    
    // SETUP: creation of a unique subfolder inside ../tempCloned
    const analysisId = uuidv4();
    const tempDir = path.join(BASE_TEMP_PATH, `repo-${analysisId}`);

    try {
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        console.log(`[Node] Setup: Folder created at ${tempDir}`);

        const pythonPath = path.join(__dirname, '../venv/bin/python');
        const scriptPath = path.join(__dirname, '../agents/orchestrator.py');

        // EXECUTION: Launch the orchestrator
        const pyProcess = spawn(pythonPath, [scriptPath, repoUrl, tempDir]);

        let stdoutData = "";
        let stderrData = "";

        pyProcess.stdout.on('data', (data) => { stdoutData += data.toString(); });
        pyProcess.stderr.on('data', (data) => { stderrData += data.toString(); });

        pyProcess.on('close', (code) => {
            // CLEANUP: deletion of the temporary folder
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
                console.log(`[Node] Cleanup: Folder ${tempDir} deleted`);
            }

            if (code !== 0) {
                return res.status(500).json({ error: "Orchestrator failed", details: stderrData });
            }

            try {
                const finalResult = JSON.parse(stdoutData);
                res.json(finalResult);
            } catch (parseError) {
                res.status(500).json({ error: "JSON Parse Error", raw: stdoutData });
            }
        });

    } catch (err) {
        res.status(500).json({ error: "Internal Server Error", message: err.message });
    }
});

app.listen(3000, () => console.log('Server listening on port 3000'));