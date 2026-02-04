import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import fs from 'fs';

export interface AnalysisResult {
    status: 'success' | 'error';
    repositoryURL: string;
    findings: any;
    timestamp: string;
}

@Injectable()
export class AnalysisService {
    private readonly logger = new Logger(AnalysisService.name);
    private readonly ROOT_PATH = path.resolve(process.cwd(), '..');
    private readonly ENV_PATH = path.join(this.ROOT_PATH, '../.env');

    private saveReport(analysisResult: AnalysisResult) {
        const reportDirectory = path.resolve(process.cwd(), 'reports');
        if(!fs.existsSync(reportDirectory)) fs.mkdirSync(reportDirectory, { recursive: true });

        const fileName = `report-${Date.now()}.json`;
        const filePath = path.join(reportDirectory, fileName);

        fs.writeFileSync(filePath, JSON.stringify(analysisResult, null, 2));
    }

    public async runAnalysis(repoURL: string) : Promise<AnalysisResult> {
        const envConfig = fs.existsSync(this.ENV_PATH) ? ['--env-file', this.ENV_PATH] : [];
        console.log('envPath: ', this.ENV_PATH);
        console.log('envConfig: ', envConfig);
        return new Promise((resolve, reject) => {
            const runAnalyzerAgent = spawn('docker', [
                'run', '--rm',
                ...envConfig,
                'analyzer-agent',
                repoURL,
                "tmp/analysis"
            ]);

            let output = '';
            let error = '';

            runAnalyzerAgent.stdout.on('data', (data : any) => output += data.toString());
            runAnalyzerAgent.stderr.on('data', (data : any) => error += data.toString());
            runAnalyzerAgent.on('close', (code : number | null) => {
                if(code === 0) {
                    try {
                        const agentResponse = JSON.parse(output);
                        const analysisResult : AnalysisResult = {
                            status: 'success',
                            repositoryURL: repoURL,
                            findings: agentResponse,
                            timestamp: new Date().toISOString()
                        }
                        this.saveReport(analysisResult);
                        resolve(analysisResult);
                    } catch(e) {
                        this.logger.error("L'output dell'agente non è un file JSON valido");
                        reject(new Error("Errore durante la formattazione dei dati dell'analisi"));
                    }
                } else {
                    this.logger.error(`Docker fallito. Codice errore: ${code} | ${error}`);
                    reject(new Error(`Errore durante l'analisi`));
                }
            })
        });
    }
}
