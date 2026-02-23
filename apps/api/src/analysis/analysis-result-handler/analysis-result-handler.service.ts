import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Analysis, AnalysisStatus } from 'src/database/analysis.schema';
import { Repository } from 'src/database/repository.schema';

@Injectable()
export class AnalysisResultHandlerService {
 constructor(
    @InjectModel(Analysis.name) private analysisModel: Model<Analysis>,
    @InjectModel(Repository.name) private repositoryModel: Model<Repository>,
    private readonly logger: Logger,
  ) {} 
  
  async memorizeResults(analysisId: string, summary: any) {
    this.logger.log(`Ricevuto risultato per analisi: ${analysisId}`);

    const updatedAnalysis = await this.analysisModel.findOneAndUpdate(
      {analysisId},
      {
        status: AnalysisStatus.COMPLETED,
        summary,
        completedAt: new Date()
      },
      {
          new: true
      },
    ).populate('userId', 'username email').populate('repositoryId');
    
    if (!updatedAnalysis) {
        this.logger.error(`Analisi ${analysisId} non trovata!`);
        return null;
    }
    
    if (updatedAnalysis && updatedAnalysis.repositoryId) {
        await this.repositoryModel.findByIdAndUpdate(updatedAnalysis.repositoryId._id, {
            $inc: { analysisCount: 1 },
            $set: { lastAnalyzed: new Date() }
        });
    }

    this.logger.log(
      `Analisi ${analysisId} completata - ` + 
      `User: ${updatedAnalysis.userId?.["username"]}` +
      `Repo: ${updatedAnalysis.repositoryId?.["fullName"]}`
    )
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
