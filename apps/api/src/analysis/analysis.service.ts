import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as bcrypt from 'bcrypt';
import { User } from '../users/schemas/user.schema';
import { Project } from '../project.schema';
import { OrchestratorRun } from '../orchestrator-run.schema';

export interface AnalysisResult {
  status: 'success' | 'error';
  repositoryURL: string;
  findings: any;
  timestamp: string;
  mongodb_run_id?: string;
  userId?: string;
  projectId?: string;
}

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(OrchestratorRun.name) private runModel: Model<OrchestratorRun>,
  ) {}

  /**
   * Get or create a user by email
   * Creates users with placeholder password (they cannot login)
   * Returns the userId (MongoDB _id as string)
   */
  async getOrCreateUser(email: string): Promise<string> {
    let user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      const username = email.split('@')[0];
      // Create placeholder password - user cannot login with this
      const passwordHash = await bcrypt.hash('ANALYSIS_USER_NO_LOGIN_' + Date.now(), 10);
      
      user = await this.userModel.create({
        username,
        email,
        passwordHash,
        notificationsEnabled: true,
        criticalIssuesNotifications: true,
      });
      this.logger.log(`Created analysis user: ${email} (cannot login)`);
    }

    return user._id.toString();
  }

  /**
   * Get or create a project by userId and repo_url
   * Returns the projectId (MongoDB _id as string)
   */
  async getOrCreateProject(userId: string, repoUrl: string, repoName: string): Promise<string> {
    let project = await this.projectModel.findOne({ 
      userId, 
      repo_url: repoUrl 
    }).exec();

    if (!project) {
      project = await this.projectModel.create({
        userId,
        repo_url: repoUrl,
        name: repoName,
        last_check: new Date(),
      });
      this.logger.log(`Created new project: ${repoName} for user ${userId}`);
    }

    return project._id.toString();
  }

  /**
   * Save orchestrator run to MongoDB
   */

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

  /**
   * Validates AWS credentials when USE_MOCK_ANALYSIS=false
   * Throws BadRequestException if credentials are missing or model ID is invalid
   */
  private validateAwsCredentials(): void {
    const useMock = process.env.USE_MOCK_ANALYSIS === 'true';

    // Skip validation in mock mode
    if (useMock) {
      return;
    }

    // Check AWS credentials presence
    const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
    const modelId = process.env.AGENT_MODEL_ID;

    if (!awsAccessKey || awsAccessKey.trim() === '') {
      throw new BadRequestException({
        code: 'MISSING_AWS_CREDENTIALS',
        message: 'AWS_ACCESS_KEY_ID is required when USE_MOCK_ANALYSIS=false',
      });
    }

    if (!awsSecretKey || awsSecretKey.trim() === '') {
      throw new BadRequestException({
        code: 'MISSING_AWS_CREDENTIALS',
        message: 'AWS_SECRET_ACCESS_KEY is required when USE_MOCK_ANALYSIS=false',
      });
    }

    // Validate Bedrock model ARN format
    if (!modelId || !modelId.startsWith('arn:aws:bedrock:')) {
      throw new BadRequestException({
        code: 'INVALID_BEDROCK_MODEL',
        message: 'AGENT_MODEL_ID must be a valid AWS Bedrock ARN (e.g., arn:aws:bedrock:...)',
        hint: 'Check .env.example for correct format',
      });
    }

    this.logger.log('✅ AWS credentials validated successfully');
  }

  /**
   * Avvia l'analisi in background.
   * 1. Crea il record nel DB in stato 'pending'.
   * 2. Lancia il processo Docker (Fire-and-Forget).
   * 3. Ritorna subito l'ID al controller.
   */
  public async runAnalysis(repoURL: string, email: string): Promise<string> {
    this.logger.log(`🚀 Preparazione analisi per: ${repoURL} (User: ${email})`);

    // Validazione e recupero ID
    const { repoName } = this.validateURL(repoURL);

    // Validazione AWS credentials (se non in mock mode)
    this.validateAwsCredentials();

    const userId = await this.getOrCreateUser(email);
    const projectId = await this.getOrCreateProject(userId, repoURL, repoName);

    // 1. Creiamo SUBITO il record nel DB in stato "pending"
    const newRun = await this.runModel.create({
        userId,
        projectId,
        repository: repoURL,
        status: 'pending',
        metadata: {
            created_at: new Date(),
            user_email: email,
            triggered_by: 'orchestrator_v2'
        }
    });

    const runId = newRun._id.toString();
    this.logger.log(`📝 Run creata nel DB con ID: ${runId} - Avvio Docker...`);

    // 2. Lancia Docker in background senza 'await' bloccante
    // Gestiamo solo l'errore di spawn immediato
    this.spawnDockerProcess(repoURL, email, runId).catch(err => {
        this.logger.error(`❌ Errore critico avvio Docker: ${err.message}`);
        // Se Docker non parte proprio, aggiorniamo il DB a failed
        this.runModel.findByIdAndUpdate(runId, { 
            status: 'failed', 
            error: err.message,
            metadata: { failed_at: new Date() }
        }).exec();
    });

    return runId;
  }

  /**
   * Metodo privato per gestire lo spawn di Docker.
   * Passa l'ID analisi a Python tramite var d'ambiente.
   */
  private async spawnDockerProcess(repoURL: string, email: string, runId: string) {
    return new Promise<void>((resolve, reject) => {
      const runAnalyzerAgent = spawn('docker', [
        'run',
        '--rm',
        // Fondamentale: Passiamo l'ID a Python così può chiamare il Webhook
        '-e', `ANALYSIS_ID=${runId}`,
        '-e', `USE_MOCK_ANALYSIS=${process.env.USE_MOCK_ANALYSIS || 'true'}`,
        '-e', `AGENT_MODEL_ID=${process.env.AGENT_MODEL_ID || 'gpt-4-turbo'}`,
        '-e', `AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID || ''}`,
        '-e', `AWS_SECRET_ACCESS_KEY=${process.env.AWS_SECRET_ACCESS_KEY || ''}`,
        '-e', `AWS_SESSION_TOKEN=${process.env.AWS_SESSION_TOKEN || ''}`,
        '-e', `AWS_REGION=${process.env.AWS_REGION || 'us-east-1'}`,
        // Fix per l'host: permette a Docker di vedere "host.docker.internal" su Linux/Docker Compose
        '--add-host', 'host.docker.internal:host-gateway',
        // Fix import python
        '-e', 'PYTHONPATH=/app',
        
        'poc-agents', // Nome della tua immagine Docker
        
        // Argomenti richiesti dal nuovo orchestrator.py:
        repoURL,           // sys.argv[1]
        'tmp/analysis',    // sys.argv[2]
        '',                // sys.argv[3] (permitted_words - opzionale)
        'it_IT,en_US'      // sys.argv[4] (languages - opzionale)
      ]);

      // Logghiamo stdout per debug (Python stampava i Timer su stderr)
      runAnalyzerAgent.stdout.on('data', (data) => {
          const msg = data.toString().trim();
          if (msg) console.log(`[Docker Agent]: ${msg}`);
      });

      // Logghiamo stderr (dove Python stampa i print di default e gli errori)
      runAnalyzerAgent.stderr.on('data', (data) => {
          const msg = data.toString().trim();
          if (msg) console.error(`[Docker Stderr]: ${msg}`);
      });

      runAnalyzerAgent.on('error', (err) => {
          reject(err);
      });

      runAnalyzerAgent.on('close', (code) => {
        if (code === 0) {
            this.logger.log(`✅ Docker terminato con successo (Python ha inviato i dati al Webhook)`);
            resolve();
        } else {
            this.logger.warn(`⚠️ Docker terminato con codice ${code} (Controlla i log per errori)`);
            reject(new Error(`Docker exited with code ${code}`));
        }
      });
    });
  }
}