import { Injectable, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

import { GithubCommunicatorService } from 'src/common/github-communicator/github-communicator.service';
import { ValidationService } from 'src/common/validation/validation.service';
import { AnalysisExecutorService } from './analysis-executor/analysis-executor.service';

import { Analysis, AnalysisDocument, AnalysisStatus } from 'src/database/analysis.schema';
import { Repository, RepositoryDocument } from 'src/database/repository.schema';
import { User } from 'src/database/users.schema';
import { Project } from '../project.schema';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
    @InjectModel(Repository.name) private repositoryModel: Model<RepositoryDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
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
      // Assicurati che findOrCreateRepository restituisca l'oggetto repository completo
      const repository = await this.findOrCreateRepository(repoOwner, repoName, URL, userId);
      const projectId = await this.getOrCreateProject(userId, URL, repoName);

      // 4. Inizializzazione Identificativi e Configurazione
      const analysisUuid = uuidv4(); // Questo è l'ID che passeremo a Docker/AWS
      const analysisMethod = this.configuration.get('ANALYSIS_METHOD');

      // 5. Creazione Record Unico su Analysis (Stato iniziale: pending)
      const newAnalysis = await this.analysisModel.create({
        analysisId: analysisUuid, // UUID per il matching del webhook
        userId: new Types.ObjectId(userId),
        repositoryId: repository._id,
        projectId: new Types.ObjectId(projectId),
        status: AnalysisStatus.PENDING,
        metadata: {
          user_email: email,
          triggered_by: 'orchestrator_v2',
          docker_image: 'analyzer-agent:latest'
        }
      });

  this.logger.log(`Record analisi creato con UUID: ${analysisUuid}. Metodo: ${analysisMethod}`);

  // 6. Avvio effettivo dell'analisi (Asincrono)
  try {
    // IMPORTANTE: Passiamo l'UUID (analysisUuid) all'esecutore, 
    // così il webhook saprà a quale record riferirsi.
    this.analysisRunner.startAnalysis(String(analysisMethod), repoOwner, repoName, analysisUuid);
    
    // Aggiorniamo lo stato a RUNNING
    await newAnalysis.updateOne({ status: AnalysisStatus.RUNNING });
    
  } catch (error) {
    this.logger.error(`Errore durante l'avvio dell'analisi: ${error.message}`);
    await newAnalysis.updateOne({ 
      status: AnalysisStatus.FAILED, 
      errorMessage: error.message 
    });
    throw error;
  }

  return {
    status: 'ok',
    analysisId: analysisUuid,
    internalId: newAnalysis._id,
    message: `Analisi di ${repoOwner}/${repoName} avviata correttamente`
  };
}

    private async findOrCreateRepository(
      repoOwner: string, 
      repoName: string, 
      repoUrl: string, 
      userId: string
    ): Promise<RepositoryDocument> {
      const fullName = `${repoOwner}/${repoName}`;
      let repository = await this.repositoryModel.findOne({ fullName });

      if (!repository) {
        // Usiamo un oggetto esplicito per bypassare l'overload rigido
        const newRepoData = {
          repoOwner,
          repoName,
          fullName,
          repoUrl,
          userId: new Types.ObjectId(userId),
          analysisCount: 0
        };

        // Il cast 'as any' qui risolve l'errore "No overload matches"
        repository = await this.repositoryModel.create(newRepoData as any);
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

  return user._id.toString(); // Rimosso (user as any) se usi UserDocument
}

async getOrCreateProject(userId: string, repoUrl: string, repoName: string): Promise<string> {
  // 1. Prepariamo l'ObjectId una volta sola
  const userObjectId = new Types.ObjectId(userId);

  // 2. Cerchiamo il progetto
  let project = await this.projectModel.findOne({ 
    userId: userObjectId, 
    repo_url: repoUrl 
  }).exec();

  // 3. Se non esiste, lo creiamo
  if (!project) {
    // Usiamo una variabile temporanea per la creazione per gestire i tipi
    const newProject = await this.projectModel.create({
      userId: userObjectId,
      repo_url: repoUrl,
      name: repoName,
      last_check: new Date(),
    });
    
    this.logger.log(`Creato nuovo progetto: ${repoName} per utente ${userId}`);
    // Restituiamo direttamente l'ID del nuovo progetto
    return (newProject._id as Types.ObjectId).toString();
  }

  // 4. Restituiamo l'ID del progetto trovato
  return (project._id as Types.ObjectId).toString();
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

  async getAllAnalysisHistory(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [analyses, total] = await Promise.all([
    this.analysisModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('projectId', 'name repo_url')
      //lean to have clean objects without mongoose methods, easier to manipulate and return as API response
      .lean(),
    this.analysisModel.countDocuments({ userId: new Types.ObjectId(userId) }),
  ]);

  return {
    analyses: analyses.map((a) => ({
      id: a.analysisId,
      repoId: a.projectId ? (a.projectId as any)._id.toString() : null,
      repoName: a.projectId ? (a.projectId as any).name : 'Unknown',
      date: a.createdAt,
      status: a.status,
      report: a.report || null,
      executionMetrics: a.executionMetrics || null,
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
}