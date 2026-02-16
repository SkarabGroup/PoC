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
import { AnalysisTransformerService } from './analysis-transformer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Analysis, AnalysisDocument, AnalysisStatus } from 'src/database/analysis.schema';

@Controller('analysis')
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly resultHandler: AnalysisResultHandlerService,
    private readonly transformer: AnalysisTransformerService,
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
    // 1. Trasformare spelling_analysis in qualityIssues
    const qualityIssues = this.transformer.transformSpellingToQualityIssues(
      result.spelling_analysis || []
    );

    // 2. Categorizzare issue per severità
    const severityCounts = this.transformer.categorizeIssuesBySeverity(qualityIssues);

    // 3. Calcolare qualityScore
    const qualityScore = this.transformer.calculateQualityScore(qualityIssues);

    // 4. Creare report completo
    const report = {
      qualityScore: qualityScore,
      securityScore: 100, // Default - nessun agente security attivo
      performanceScore: 100, // Default
      criticalIssues: severityCounts.criticalIssues,
      warningIssues: severityCounts.warningIssues,
      infoIssues: severityCounts.infoIssues,
      qualityIssues: qualityIssues,
      securityIssues: [],
      bugIssues: [],
      remediations: []
    };

    // 5. Aggiornare record con tutti i dati
    const updatedAnalysis = await this.analysisModel.findOneAndUpdate(
      { analysisId: analysisUuid },
      {
        $set: {
          status: result.status === 'error' ? AnalysisStatus.FAILED : AnalysisStatus.COMPLETED,
          completedAt: new Date(),
          report: report,
          summary: result.summary,
          executionMetrics: result.execution_metrics
        }
      },
      { new: true }
    );

    if (!updatedAnalysis) {
      this.logger.error(`Analisi ${analysisUuid} non trovata`);
      return { success: false };
    }

    this.logger.log(
      `Analisi ${analysisUuid} aggiornata con ${qualityIssues.length} quality issues`
    );
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
