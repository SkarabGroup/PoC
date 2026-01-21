require('dotenv').config();
const express = require('express');
const { spawn } = require('child_process'); //to spawn python process by running a command
const path = require('path');

const app = express();
app.use(express.json()); //to know how to read json data from request body

app.post('/analyze', (req, res) => {
    const { repoUrl } = req.body;

    // Paths: use the python from the venv and the absolute path of the script
    const pythonPath = path.join(__dirname, '../venv/bin/python'); //to use python from the virtual environment
    const scriptPath = path.join(__dirname, '../agents/orchestrator.py'); //absolute path of the script

    console.log(`[Node] Starting Python process for: ${repoUrl}`);
    // Actual command execution: python orchestrator.py [url]
    const pyProcess = spawn(pythonPath, [scriptPath, repoUrl]); //spawn a new child process to run the python script

    let stdoutData = "";
    let stderrData = "";

    // Reads the data that the orchestrator prints (the final JSON)
    pyProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
    });

    // Reads any debug logs or errors
    pyProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        console.log(`[Python Log]: ${data.toString().trim()}`); //log stderr data for debugging
    });

    pyProcess.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: "Python error", details: stderrData });
        }

        try {
            const finalResult = JSON.parse(stdoutData);
            res.json(finalResult);
        } catch (e) {
            res.status(500).json({ error: "Error parsing JSON from Python", raw: stdoutData });
        }
    });
});

app.listen(3000, () => console.log('Server listening on port 3000'));