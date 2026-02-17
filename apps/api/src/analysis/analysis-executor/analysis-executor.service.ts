import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { join } from 'path';

@Injectable()
export class AnalysisExecutorService {
    public startAnalysis(method: string, repoOwner: string, repoName: string, analysisId: string) : void {
        if(method === 'docker') {
            this.startDockerAnalysis(repoOwner, repoName, analysisId);
        } else if(method === 'aws') {
            this.startAWSAnalysis(repoOwner, repoName, analysisId);
        } else {
            console.error('[ERRORE]: Metodologia di analisi non valida');
        }
    }

    private startDockerAnalysis(repoOwner: string, repoName: string, analysisId: string) : void {

        const container = spawn('docker', [
            'run',
            '--rm',
            '--env-file', '/agents/.env',
            '-e', `ANALYSIS_ID=${analysisId}`,
            'analyzer-agent:latest',
            `https://github.com/${repoOwner}/${repoName}`,
            'temp/'
        ]);

        container.stderr.on('data', (data) =>{
            console.log(`[AGENT ERROR in Analysis ${analysisId}]: ${data.toString().trim()}`)
        });

        container.on('close', (code) => {
            if(code === 0) {
                console.log(`[Execution of ${analysisId}]: Analisi di ${repoOwner}/${repoName} completata`);
            }
        });
        
        container.on('error', (err) => {
            console.error(`[Execution of ${analysisId}] Errore critico nel lancio di Docker: ${err.message}`);
        })
    }

    private startAWSAnalysis(repoOwner: string, repoName: string, analysisId: string) : void {
        
    }
}
