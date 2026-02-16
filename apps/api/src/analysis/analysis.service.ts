import { Injectable, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

import { GithubCommunicatorService } from 'src/common/github-communicator/github-communicator.service';
import { ValidationService } from 'src/common/validation/validation.service';
import { AnalysisExecutorService } from './analysis-executor/analysis-executor.service';

import { Analysis, AnalysisDocument } from 'src/database/analysis.schema';
import { Repository, RepositoryDocument } from 'src/database/repository.schema';
import { User } from 'src/database/users.schema';
import { Project } from '../project.schema';
import { OrchestratorRun } from '../orchestrator-run.schema';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
    @InjectModel(Repository.name) private repositoryModel: Model<RepositoryDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(OrchestratorRun.name) private runModel: Model<OrchestratorRun>,
    private readonly configuration: ConfigService,
    private readonly validationService: ValidationService,
    private readonly githubCommunicatorService: GithubCommunicatorService,
    private readonly analysisRunner: AnalysisExecutorService,
  ) {}

  public async analyzeRepository(URL: string, userId: string, email: string) {
    // 1. Validazione Input
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedException('UserId non valido');
    }

    const { repoOwner, repoName } = this.validationService.validateURL(URL);
    this.logger.log(`URL validato per GitHub: ${repoOwner}/${repoName}`);

    // 2. Controllo esistenza su GitHub
    const existRepository = await this.githubCommunicatorService.checkIfRepositoryExists(repoOwner, repoName);
    if (!existRepository) {
      this.logger.error(`Repository ${repoOwner}/${repoName} non trovata su GitHub`);
      throw new NotFoundException('Repository non trovata su GitHub');
    }

    // 3. Recupero o creazione entità correlate
    await this.findOrCreateRepository(repoOwner, repoName, URL);
    const projectId = await this.getOrCreateProject(userId, URL, repoName);

    // 4. Inizializzazione Identificativi e Configurazione
    const analysisId = uuidv4();
    const analysisMethod = this.configuration.get('ANALYSIS_METHOD');

    // 5. Creazione Record della Run (Stato iniziale: pending)
    const newRun = await this.runModel.create({
      userId,
      projectId,
      repository: URL,
      status: 'pending',
      metadata: {
        created_at: new Date(),
        user_email: email,
        triggered_by: 'orchestrator_v2',
        analysis_uuid: analysisId
      }
    });

    this.logger.log(`Run creata nel DB con ID: ${newRun._id} - Avvio Docker...`);

    // 6. Avvio effettivo dell'analisi (Asincrono)
    try {
      this.analysisRunner.startAnalysis(String(analysisMethod), repoOwner, repoName, analysisId);
      
      // Aggiorniamo la run a RUNNING
      await this.runModel.findByIdAndUpdate(newRun._id, { status: 'running' });
    } catch (error) {
      this.logger.error(`Errore durante l'avvio dell'analisi: ${error.message}`);
      await this.runModel.findByIdAndUpdate(newRun._id, { status: 'error' });
      throw error;
    }

    return {
      status: 'ok',
      analysisId: analysisId,
      runId: newRun._id,
      message: `Analisi di ${repoOwner}/${repoName} avviata correttamente`
    };
  }

  private async findOrCreateRepository(repoOwner: string, repoName: string, repoUrl: string): Promise<RepositoryDocument> {
    const fullName = `${repoOwner}/${repoName}`;
    let repository = await this.repositoryModel.findOne({ fullName });

    if (!repository) {
      repository = await this.repositoryModel.create({
        repoOwner,
        repoName,
        fullName,
        repoUrl,
        analysisCount: 0
      });
      this.logger.log(`Nuova repository ${fullName} aggiunta al database`);
    }
    return repository;
  }

  async getOrCreateUser(email: string): Promise<string> {
    let user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      const username = email.split('@')[0];
      const passwordHash = await bcrypt.hash('ANALYSIS_USER_NO_LOGIN_' + Date.now(), 10);
      
      user = await this.userModel.create({
        username,
        email,
        passwordHash,
        notificationsEnabled: true,
        criticalIssuesNotifications: true,
      });
      this.logger.log(`Creato utente per analisi: ${email}`);
    }

    return (user as any)._id.toString();
  }

  async getOrCreateProject(userId: string, repoUrl: string, repoName: string): Promise<string> {
    let project = await this.projectModel.findOne({ userId, repo_url: repoUrl }).exec();

    if (!project) {
      project = await this.projectModel.create({
        userId,
        repo_url: repoUrl,
        name: repoName,
        last_check: new Date(),
      });
      this.logger.log(`Creato nuovo progetto: ${repoName} per utente ${userId}`);
    }

    return (project as any)._id.toString();
  }

  public async getAnalysisById(analysisId: string) {
    const analysis = await this.analysisModel
      .findOne({ analysisId })
      .populate('userId', 'username email')
      .populate('repositoryId')
      .exec();

    if (!analysis) {
      throw new NotFoundException(`Analisi ${analysisId} non trovata`);
    }
    return analysis;
  }
}
