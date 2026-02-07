import { Injectable, NotFoundException } from '@nestjs/common';
import { GithubCommunicatorService } from 'src/common/github-communicator/github-communicator.service';
import { ValidationService } from 'src/common/validation/validation.service';
import { ConfigService } from '@nestjs/config';
import { AnalysisExecutorService } from './analysis-executor/analysis-executor.service';
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class AnalysisService {
    constructor(private readonly configuration: ConfigService,
                private readonly validationService: ValidationService,
                private readonly githubCommunicatorService: GithubCommunicatorService,
                private readonly analysisRunner: AnalysisExecutorService
               ) {}

    public async analyzeRepository(URL: string) {
        const { repoOwner, repoName } = this.validationService.validateURL(URL);

        console.log("\n[Log di Sistema]: L'URL ricevuto è valido per poter contattare GitHub");

        const existRepository = await this.githubCommunicatorService.checkIfRepositoryExists(repoOwner, repoName);
        if(!existRepository) {
            console.log('\n[Log di Sistema]: La repository non è stata trovata');
            throw new NotFoundException('[ERRORE] Repository non trovata');
        }

        console.log('\n[Log di Sistema]: La repository è valida per svolgere l\'analisi');
        const analysisId = uuidv4();
        const analysisMethod = this.configuration.get('ANALYSIS_METHOD');

        this.analysisRunner.startAnalysis(String(analysisMethod), repoOwner, repoName, analysisId);

        return {
            status: 'ok',
            analysisId: analysisId,
            message: `Analisi di ${repoOwner}/${repoName} avviata correttamente`
        }
    }
}
