import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';


@Injectable()
export class AnalysisExecutorService {
    public startAnalysis(method: string, repoOwner: string, repoName: string) : void {
        if(method === 'docker') {
            this.startDockerAnalysis(repoOwner, repoName);
        } else if(method === 'aws') {
            this.startAWSAnalysis(repoOwner, repoName);
        } else {
            console.error('[ERRORE]: Metodologia di analisi non valida');
        }
    }

    private startDockerAnalysis(repoOwner: string, repoName: string) : void {
        const container = spawn('docker', [
            'run',
            '--rm',
            '--env-file', '.env',
            'analysis-agent:latest',
            `https://github.com/${repoOwner}/${repoName}`,
        ]);

        container.stdout.on('data', (data) => {
            console.log(`[AGENT OUTPUT]: ${data.toString().trim()}`)
        });

        container.stderr.on('data', (data) =>{
            console.log(`[AGENT ERROR]: ${data.toString().trim()}`)
        });

        container.on('close', (code) => {
            if(code === 0) {
                console.log(`Analisi di ${repoOwner}/${repoName} completata`);
            }
        });
        
        container.on('error', (err) => {
            console.error(`[Executor] Errore critico nel lancio di Docker: ${err.message}`);
        })
    }

    private startAWSAnalysis(repoOwner: string, repoName: string) : void {
        
    }
}
