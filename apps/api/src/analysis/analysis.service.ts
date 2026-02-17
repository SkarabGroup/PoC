import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel} from '@nestjs/mongoose';
import { Model, Types} from 'mongoose';
import { GithubCommunicatorService } from 'src/common/github-communicator/github-communicator.service';
import { ValidationService } from 'src/common/validation/validation.service';
import { ConfigService } from '@nestjs/config';
import { AnalysisExecutorService } from './analysis-executor/analysis-executor.service';
import { Analysis, AnalysisDocument, AnalysisStatus} from 'src/database/analysis.schema'
import { Repository, RepositoryDocument, RepositorySchema } from 'src/database/repository.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AnalysisService {
    constructor(
                @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
                @InjectModel(Repository.name) private repositoryModel: Model<RepositoryDocument>,
                private readonly configuration: ConfigService,
                private readonly validationService: ValidationService,
                private readonly githubCommunicatorService: GithubCommunicatorService,
                private readonly analysisRunner: AnalysisExecutorService
               ) {}
               
    public async analyzeRepository(URL: string, userId:string) {

        if(!userId || !Types.ObjectId.isValid(userId)){
            throw new UnauthorizedException('UserId is not valid');
        }
        const { repoOwner, repoName } = this.validationService.validateURL(URL);

        console.log("\n[Log di Sistema]: L'URL ricevuto è valido per poter contattare GitHub");

        const existRepository = await this.githubCommunicatorService.checkIfRepositoryExists(repoOwner, repoName);
        if(!existRepository) {
            console.log('\n[Log di Sistema]: La repository non è stata trovata');
            throw new NotFoundException('[ERRORE] Repository non trovata');
        }

        console.log('\n[Log di Sistema]: La repository è valida per svolgere l\'analisi');
        const repository = await this.findOrCreateRepository(repoOwner, repoName, URL);
        const analysisId = uuidv4();
        const analysisMethod = this.configuration.get('ANALYSIS_METHOD');

        const analysis = await this.analysisModel.create({
            analysisId,
            userId: new Types.ObjectId(userId),
            status: AnalysisStatus.PENDING,
            repositoryId: repository._id,
            createdAt: new Date()
        });

        this.analysisRunner.startAnalysis(String(analysisMethod), repoOwner, repoName, analysisId);

        return {
            status: 'ok',
            analysisId: analysisId,
            message: `Analisi di ${repoOwner}/${repoName} avviata correttamente`
        }
        console.log(`[DEBUG] startAnalysis chiamato per ${analysisId}`);
        await this.analysisModel.findByIdAndUpdate(analysis._id, {
            status: AnalysisStatus.RUNNING
        });
    }

    private async findOrCreateRepository(repoOwner: string, repoName: string, repoUrl: string): Promise<RepositoryDocument> {
        const fullName = `${repoOwner}/${repoName}`;
        
        let repository = await this.repositoryModel.findOne({ fullName });

        if (!repository) {
            repository = await this.repositoryModel.create({repoOwner,repoName,fullName,repoUrl,analysisCount: 0});
            console.log(`\n[Log di Sistema]: Nuova repository ${fullName} aggiunta al database`);
        }
        return repository;
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
