import { Injectable, Logger, NotFoundException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalysisGateway } from './gateway/analysis.gateway';
import { Analysis, AnalysisDocument, AnalysisSchema, AnalysisStatus } from 'src/database/analysis.schema';

@Injectable()
export class AnalysisResultHandlerService {
  private readonly logger = new Logger(AnalysisResultHandlerService.name);

  constructor(private readonly gateway: AnalysisGateway, @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>) {}
  
  async memorizeResults(analysisId: string, summary: any) {
    this.logger.log(`Ricevuto risultato per analisi: ${analysisId}`);

    const analysis = await this.analysisModel.findOne({analysisId});
    const updatedAnalysis = await this.analysisModel.findOneAndUpdate(
      {analysisId},
      {
        status: AnalysisStatus.COMPLETED,
        summary,
      },
      {new: true},
    ).populate('userId', 'username email').populate('repoId');
    this.logger.log(
      'Analisi ${analysisId} completata - ' + 
      'User: ${updatedAnalysis.userId?.["username"]}' +
      'Repo: ${updatedAnalysis.repositoryId?.["fullName"]}'
    )
    this.gateway.notifyCompletion(analysisId, summary);
    return updatedAnalysis;
  }

  async getReport(analysisId: string) {
    const analysis = await this.analysisModel
      .findOne({ analysisId })
      .populate('userId', 'username email firstName lastName')
      .populate('repositoryId')
      .exec();

    if (!analysis) {
      throw new NotFoundException(`Report per analisi ${analysisId} non trovato`);
    }
    return {
      analysisId: analysis.analysisId,
      status: analysis.status,
      user: analysis.userId,
      repository: analysis.repositoryId,
      summary: analysis.summary,
      completedAt: analysis.completedAt,
      errorMessage: analysis.errorMessage,
      createdAt: analysis['createdAt'],
      updatedAt: analysis['updatedAt']
    };
  }
}
