import 'dotenv/config';
import express, { Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

// Create a base temporary path for cloned repositories
const BASE_TEMP_PATH = path.resolve(__dirname, '../tempCloned');

// Ensure the "tempCloned" folder exists at server startup
if (!fs.existsSync(BASE_TEMP_PATH)) {
    fs.mkdirSync(BASE_TEMP_PATH, { recursive: true });
}

interface AnalyzeRequest {
    repoUrl: string;
}

interface FinalResult {
    [key: string]: any;
}

app.post('/analyze', async (req: Request<{}, {}, AnalyzeRequest>, res: Response) => {
    const { repoUrl } = req.body;
    
    // SETUP: creation of a unique subfolder inside ../tempCloned
    const analysisId = uuidv4();
    const tempDir = path.join(BASE_TEMP_PATH, `repo-${analysisId}`);

    try {
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        console.log(`[Node] Setup: Folder created at ${tempDir}`);

        const pythonPath = path.join(__dirname, '../venv/bin/python');
        const scriptPath = path.join(__dirname, '../agents/orchestrator.py');

        // EXECUTION: Launch the orchestrator
        const pyProcess = spawn(pythonPath, [scriptPath, repoUrl, tempDir]);

        let stdoutData = "";
        let stderrData = "";

        pyProcess.stdout.on('data', (data: Buffer) => {
            stdoutData += data.toString();
        });

        pyProcess.stderr.on('data', (data: Buffer) => {
            stderrData += data.toString();
        });

        pyProcess.on('close', (code: number | null) => {
            // CLEANUP: deletion of the temporary folder
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
                console.log(`[Node] Cleanup: Folder ${tempDir} deleted`);
            }

            if (code !== 0) {
                console.log("Orchestrator failed", stderrData);
                return res.status(500).json({ 
                    error: "Orchestrator failed", 
                    details: stderrData 
                });
            }

            try {
                const finalResult: FinalResult = JSON.parse(stdoutData);
                console.log(finalResult);
                res.json(finalResult);
            } catch (parseError) {
                console.log("JSON Parse Error", stdoutData);
                res.status(500).json({ 
                    error: "JSON Parse Error", 
                    raw: stdoutData 
                });
            }
        });

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ 
            error: "Internal Server Error", 
            message: errorMessage 
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});