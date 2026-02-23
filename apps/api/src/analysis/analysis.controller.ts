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
  const analysisUuid = result.analysis_id || result.analysisId;
  this.logger.log(`Webhook ricevuto: ${JSON.stringify(result, null, 2)}`);

  if (!analysisUuid) {
    this.logger.error('Webhook ricevuto senza identificativo analisi');
    return { success: false, message: 'Missing analysis identification' };
  }

  try {
    let spellingAnalysis = result.spelling_analysis || [];

    if (spellingAnalysis.length === 0 && result.report?.details) {
      try {
        const parsed = JSON.parse(result.report.details);
        spellingAnalysis = Array.isArray(parsed) ? parsed : (parsed.files || []);
        this.logger.warn(`spelling_analysis recuperato da report.details (fallback)`);
      } catch (e) {
        this.logger.warn(`Impossibile parsare report.details: ${e.message}`);
      }
    }

    if (spellingAnalysis.length === 0) {
      this.logger.warn(`Nessun spelling_analysis trovato per ${analysisUuid}`);
    }

    const qualityIssues = this.transformer.transformSpellingToQualityIssues(spellingAnalysis);

    const severityCounts = this.transformer.categorizeIssuesBySeverity(qualityIssues);

    const qualityScore = this.transformer.calculateQualityScore(qualityIssues);

    const report = {
      qualityScore,
      securityScore: 100,
      performanceScore: 100,
      criticalIssues: severityCounts.criticalIssues,
      warningIssues: severityCounts.warningIssues,
      infoIssues: severityCounts.infoIssues,
      qualityIssues,
      securityIssues: [],
      bugIssues: [],
      remediations: []
    };

    const updatedAnalysis = await this.analysisModel.findOneAndUpdate(
      { analysisId: analysisUuid },
      {
        $set: {
          status: result.status === 'error' ? AnalysisStatus.FAILED : AnalysisStatus.COMPLETED,
          completedAt: new Date(),
          report,
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

    this.logger.log(`Analisi ${analysisUuid} aggiornata con ${qualityIssues.length} quality issues`);
    return { success: true };

  } catch (error) {
    this.logger.error(`Webhook processing error: ${error.message}`);
    return { success: false, error: error.message };
  }
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

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getAllHistory(
    @CurrentUser() user: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.analysisService.getAllAnalysisHistory(user.userId, +page, +limit);
  }
}
