import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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

  validateURL(inputURL: string): {
    repoURL: string;
    repoOwner: string;
    repoName: string;
  } {
    let url: URL;
    try {
      url = new URL(inputURL);
    } catch {
      throw new BadRequestException({
        code: 'INVALID_URL',
        message: 'Must be an URL',
      });
    }

    if (url.protocol !== 'https:') {
      throw new BadRequestException({
        code: 'INVALID_HTTPS_URL',
        message: 'Must have https protocol',
      });
    }

    if (url.hostname !== 'github.com') {
      throw new BadRequestException({
        code: 'INVALID_GITHUB_URL',
        message: 'Must be a github.com URL',
      });
    }

    const urlBodyParts = url.pathname.split('/').filter(Boolean);
    if (urlBodyParts.length < 2) {
      throw new BadRequestException({
        code: 'INVALID_GITHUB_URL',
        message: 'URL must be https://github.com/<owner>/<repo>',
      });
    }

    const repoOwner = urlBodyParts[0];
    let repoName = urlBodyParts[1];
    if (repoName.endsWith('.git')) {
      repoName = repoName.slice(0, -4);
    }

    const validCharacters = /^[A-Za-z0-9_.-]+$/;
    if (!validCharacters.test(repoOwner) || !validCharacters.test(repoName)) {
      throw new BadRequestException({
        code: 'INVALID_GITHUB_URL',
        message: 'repoOwner or repoName are not valid names',
      });
    }

    const repoURL = `https://github.com/${repoOwner}/${repoName}`;
    return { repoURL, repoOwner, repoName };
  }

  private saveReport(analysisResult: AnalysisResult) {
    const reportDirectory = path.resolve(process.cwd(), 'reports');
    if (!fs.existsSync(reportDirectory))
      fs.mkdirSync(reportDirectory, { recursive: true });

    const fileName = `report-${Date.now()}.json`;
    const filePath = path.join(reportDirectory, fileName);

    fs.writeFileSync(filePath, JSON.stringify(analysisResult, null, 2));
  }

  public async runAnalysis(
    repoURL: string,
    email: string,
  ): Promise<AnalysisResult> {
    this.logger.log(`🐳 Avvio Docker Agent per: ${repoURL} (User: ${email})`);

    return new Promise((resolve, reject) => {
      const runAnalyzerAgent = spawn('docker', [
        'run',
        '--rm',
        '--network',
        'poc_default', // Connect to the same network as MongoDB
        '-e',
        'MONGODB_URI=mongodb://mongodb:27017/codeguardian', // Use service name
        '-e',
        `USE_MOCK_ANALYSIS=${process.env.USE_MOCK_ANALYSIS || 'false'}`,
        '-e',
        `AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID || ''}`,
        '-e',
        `AWS_SECRET_ACCESS_KEY=${process.env.AWS_SECRET_ACCESS_KEY || ''}`,
        '-e',
        `AWS_SESSION_TOKEN=${process.env.AWS_SESSION_TOKEN || ''}`,
        '-e',
        `AWS_REGION=${process.env.AWS_REGION || 'eu-central-1'}`,
        '-e',
        `ORCHESTRATOR_BEDROCK_MODEL_ID=${process.env.ORCHESTRATOR_BEDROCK_MODEL_ID || ''}`,
        'poc-agents', // Use the image built by docker-compose
        repoURL,
        'tmp/analysis',
        email,
      ]);

      let output = '';
      let errorLog = '';

      runAnalyzerAgent.stdout.on('data', (data: any) => {
        const chunk = data.toString();
        // Logghiamo solo se non è il JSON finale per pulizia
        if (!chunk.trim().startsWith('{'))
          console.log(`[Docker]: ${chunk.trim()}`);
        output += chunk;
      });

      runAnalyzerAgent.stderr.on('data', (data: any) => {
        errorLog += data.toString();
        // Alcuni log normali finiscono in stderr, li stampiamo per debug
        console.error(`[Docker Log]: ${data.toString().trim()}`);
      });

      runAnalyzerAgent.on('close', (code: number | null) => {
        if (code === 0) {
          try {
            // Cerchiamo l'inizio del JSON (nel caso ci siano log prima)
            const jsonStartIndex = output.indexOf('{');
            const jsonPart = output.substring(jsonStartIndex);
            const agentResponse = JSON.parse(jsonPart);

            const analysisResult: AnalysisResult = {
              status: 'success',
              repositoryURL: repoURL,
              findings: agentResponse,
              timestamp: new Date().toISOString(),
              mongodb_run_id: agentResponse.mongodb_run_id, // Prendiamo l'ID da Python
            };

            this.saveReport(analysisResult);
            this.logger.log(
              `✅ Analisi conclusa. RunID: ${analysisResult.mongodb_run_id}`,
            );
            resolve(analysisResult);
          } catch (e) {
            this.logger.error("L'output dell'agente non è un file JSON valido");
            console.error('Output ricevuto:', output);
            reject(
              new Error(
                "Errore durante la formattazione dei dati dell'analisi",
              ),
            );
          }
        } else {
          this.logger.error(
            `Docker fallito. Codice: ${code} | Err: ${errorLog}`,
          );
          reject(new Error(`Errore durante l'analisi`));
        }
      });
    });
  }
}
