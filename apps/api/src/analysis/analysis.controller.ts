import { 
  Body, 
  Controller, 
  Post, 
  Get, 
  NotFoundException, 
  Param, 
  UseGuards, 
  Query, 
  HttpCode, 
  Logger 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { AnalysisResultHandlerService } from './analysis-result-handler/analysis-result-handler.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Analysis, AnalysisDocument, AnalysisStatus } from 'src/database/analysis.schema';

@Controller('analysis')
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly resultHandler: AnalysisResultHandlerService,
    @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>, // Iniettiamo il modello corretto
  ) {}

  @Post('run')
  // @UseGuards(JwtAuthGuard) // Riabilitalo quando hai i test pronti
  async runAnalysis(
    @Body() body: CreateAnalysisDto,
    @CurrentUser() user?: any,
  ) {
    const userEmail = user?.email || body.email || 'system_automated@analysis.com';
    const userId = user?.userId || body.userId;

    try {
      const result = await this.analysisService.analyzeRepository(body.repoURL, userId, userEmail);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      this.logger.error(`Analysis initiation failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

@Post('webhook')
@HttpCode(200)
async handleWebhook(@Body() result: any) {
  const analysisUuid = result.analysisId || result.analysis_id;

  if (!analysisUuid) {
    this.logger.error('Webhook ricevuto senza identificativo analisi');
    return { success: false, message: 'Missing analysis identification' };
  }

  try {
    // 1. Calcoliamo i dati per il campo "report" atteso dal frontend
    const totalErrors = result.summary?.total_errors || 0;
    const qualityScore = Math.max(0, 100 - totalErrors);

    // 2. Aggiornamento record Analysis
    const updatedAnalysis = await this.analysisModel.findOneAndUpdate(
      { analysisId: analysisUuid }, 
      {
        $set: {
          status: result.status === 'error' ? AnalysisStatus.FAILED : AnalysisStatus.COMPLETED,
          completedAt: new Date(),
          
          // MAPPIAMO QUI I DATI PER IL REPORT
          report: {
            qualityScore: qualityScore,
            securityScore: 100, // Default
            performanceScore: 100, // Default
            summary: `Trovati ${totalErrors} errori in ${result.summary?.total_files || 0} file.`,
            // Trasformiamo l'array di spelling in una stringa leggibile per il campo details
            details: result.spelling_analysis ? JSON.stringify(result.spelling_analysis) : '',
            criticalIssues: totalErrors,
          },

          // Manteniamo anche il summary originale se serve
          summary: result.summary,
          'metadata.execution_metrics': result.execution_metrics
        }
      },
      { new: true } 
    );

    if (!updatedAnalysis) {
      this.logger.error(`Analisi ${analysisUuid} non trovata`);
      return { success: false };
    }

    this.logger.log(`Analisi ${analysisUuid} aggiornata con ${totalErrors} errori.`);
    return { success: true };
  } catch (error) {
    this.logger.error(`Webhook processing error: ${error.message}`);
    return { success: false, error: error.message };
  }
}
  @Get('history')
  // @UseGuards(JwtAuthGuard)
  async getHistory(
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Assicurati che user.userId sia un ObjectId valido per il filtro
    const filter = { userId: new Types.ObjectId(user.userId || user.id) };

    const [analyses, total] = await Promise.all([
      this.analysisModel
        .find(filter)
        .populate('repositoryId') // Popoliamo i dati della repo per la history
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .exec(),
      this.analysisModel.countDocuments(filter),
    ]);

    return {
      data: analyses.map(analysis => ({
        id: analysis.analysisId,
        repository: analysis.repositoryId, // Ora contiene l'oggetto popolato
        status: analysis.status,
        createdAt: analysis.createdAt,
      })),
      pagination: {
        page: pageNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get('report/:id')
  // @UseGuards(JwtAuthGuard)
  public async getReport(@Param('id') id: string) {
    // Cerchiamo l'analisi popolata con tutto quello che serve
    const report = await this.analysisService.getAnalysisById(id);
    if (!report) {
      throw new NotFoundException(`Analysis report ${id} not found`);
    }
    return report;
  }
}
