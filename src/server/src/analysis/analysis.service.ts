import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface AnalysisResult {
    status: 'success' | 'error';
    repositoryURL: string;
    findings: any;
    timestamp: string;
    mongodb_run_id?: string;
}

@Injectable()
export class AnalysisService {
    private readonly logger = new Logger(AnalysisService.name);
    // Punta al file .env nella root del progetto (fuori da server e agenti)
    private readonly ENV_PATH = path.resolve(process.cwd(), '../../.env');
    private saveReport(analysisResult: AnalysisResult) {
        const reportDirectory = path.resolve(process.cwd(), 'reports');
        if(!fs.existsSync(reportDirectory)) fs.mkdirSync(reportDirectory, { recursive: true });

        const fileName = `report-${Date.now()}.json`;
        const filePath = path.join(reportDirectory, fileName);

        fs.writeFileSync(filePath, JSON.stringify(analysisResult, null, 2));
    }

    // MODIFICA 1: Aggiunto parametro email
    public async runAnalysis(repoURL: string, email: string) : Promise<AnalysisResult> {
        // Se il file .env esiste lo usiamo per le chiavi AWS, altrimenti array vuoto
        const envConfig = fs.existsSync(this.ENV_PATH) ? ['--env-file', this.ENV_PATH] : [];
        
        this.logger.log(`🐳 Avvio Docker Agent per: ${repoURL} (User: ${email})`);

        return new Promise((resolve, reject) => {
            const runAnalyzerAgent = spawn('docker', [
                'run', 
                '--rm', // Pulisce il container dopo l'uso
                
                // MODIFICA 2: Networking fondamentale
                // Permette al container di vedere il tuo PC come "host.docker.internal"
                '--add-host=host.docker.internal:host-gateway', 

                // MODIFICA 3: Override connessione Mongo
                // Diciamo allo script di non usare localhost, ma il gateway dell'host
                '-e', 'MONGODB_URI=mongodb://host.docker.internal:27017/agenti_db',

                ...envConfig, // Passa le chiavi AWS dal .env

                'analyzer-agent', // Nome immagine Docker
                
                repoURL,          // Arg 1: Repo
                "tmp/analysis",   // Arg 2: Path interno container
                email             // Arg 3: Email (MODIFICA 4)
            ]);

            let output = '';
            let errorLog = '';

            runAnalyzerAgent.stdout.on('data', (data : any) => {
                const chunk = data.toString();
                // Logghiamo solo se non è il JSON finale per pulizia
                if (!chunk.trim().startsWith('{')) console.log(`[Docker]: ${chunk.trim()}`);
                output += chunk;
            });

            runAnalyzerAgent.stderr.on('data', (data : any) => {
                errorLog += data.toString();
                // Alcuni log normali finiscono in stderr, li stampiamo per debug
                console.error(`[Docker Log]: ${data.toString().trim()}`);
            });

            runAnalyzerAgent.on('close', (code : number | null) => {
                if(code === 0) {
                    try {
                        // Cerchiamo l'inizio del JSON (nel caso ci siano log prima)
                        const jsonStartIndex = output.indexOf('{');
                        const jsonPart = output.substring(jsonStartIndex);
                        const agentResponse = JSON.parse(jsonPart);

                        const analysisResult : AnalysisResult = {
                            status: 'success',
                            repositoryURL: repoURL,
                            findings: agentResponse,
                            timestamp: new Date().toISOString(),
                            mongodb_run_id: agentResponse.mongodb_run_id // Prendiamo l'ID da Python
                        }
                        
                        this.saveReport(analysisResult);
                        this.logger.log(`✅ Analisi conclusa. RunID: ${analysisResult.mongodb_run_id}`);
                        resolve(analysisResult);
                    } catch(e) {
                        this.logger.error("L'output dell'agente non è un file JSON valido");
                        console.error("Output ricevuto:", output);
                        reject(new Error("Errore durante la formattazione dei dati dell'analisi"));
                    }
                } else {
                    this.logger.error(`Docker fallito. Codice: ${code} | Err: ${errorLog}`);
                    reject(new Error(`Errore durante l'analisi`));
                }
            })
        });
    }
}