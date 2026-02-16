import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';

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
        const variablesToPass = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN', 'AGENT_MODEL_ID'];
        const envFlags = variablesToPass.flatMap(key => ['-e', `${key}=${process.env[key]}`]);
        const container = spawn('docker', [
            'run',
            '--rm',
            '--network', 'host',
            '--name', `analysis-${analysisId}`,
            ...envFlags,
            '-e', `ANALYSIS_ID=${analysisId}`,
            'analyzer-agent:latest',
            `https://github.com/${repoOwner}/${repoName}`,
            'temp/'
        ]);

        container.stderr.on('data', (data) => {
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

private startAWSAnalysis(repoOwner: string, repoName: string, analysisId: string): void {
    console.log(`[AWS MODE] Iniziando analisi su AWS per l'analisi: ${analysisId}`);

    const variablesToPass = [
        'AWS_ACCESS_KEY_ID', 
        'AWS_SECRET_ACCESS_KEY', 
        'AWS_SESSION_TOKEN', 
        'AWS_REGION',
        'AGENT_MODEL_ID'
    ];

    const envFlags = variablesToPass.flatMap(key => ['-e', `${key}=${process.env[key]}`]);

    // Lanciamo lo stesso container, ma il modello (definito in AGENT_MODEL_ID) 
    // istruirà l'orchestrator interno a usare Bedrock invece di logiche locali.
    const container = spawn('docker', [
        'run',
        '--rm',
        '--network', 'host',
        '--name', `aws-analysis-${analysisId}`,
        ...envFlags,
        '-e', `ANALYSIS_ID=${analysisId}`,
        'analyzer-agent:latest',
        `https://github.com/${repoOwner}/${repoName}`,
        'temp/'
    ]);

    container.stdout.on('data', (data) => {
        console.log(`[AWS AGENT ${analysisId}]: ${data.toString().trim()}`);
    });

    container.stderr.on('data', (data) => {
        console.error(`[AWS AGENT ERROR ${analysisId}]: ${data.toString().trim()}`);
    });

    container.on('close', (code) => {
        if (code === 0) {
            console.log(`[AWS Execution ${analysisId}]: Analisi completata con successo.`);
        } else {
            console.warn(`[AWS Execution ${analysisId}]: Il container è terminato con codice ${code}`);
        }
    });

    container.on('error', (err) => {
        console.error(`[AWS Execution ${analysisId}] Errore nel lancio del container: ${err.message}`);
    });
}
}
