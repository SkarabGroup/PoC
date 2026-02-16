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
import { Model } from 'mongoose';

import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { AnalysisResultHandlerService } from './analysis-result-handler/analysis-result-handler.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

import { OrchestratorRun } from '../orchestrator-run.schema';

@Controller('analysis')
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly resultHandler: AnalysisResultHandlerService,
    @InjectModel(OrchestratorRun.name) private runModel: Model<OrchestratorRun>,
  ) {}

  @Post()
  //@UseGuards(JwtAuthGuard)
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
    const analysisId = result.analysis_id || result.mongodb_run_id;

    if (!analysisId) {
      this.logger.error('Webhook received without analysis identification');
      return { success: false, message: 'Missing analysis identification' };
    }

    try {
      await this.resultHandler.memorizeResults(analysisId, result);
      
      await this.runModel.findByIdAndUpdate(analysisId, {
        status: result.status === 'error' ? 'error' : 'completed',
        'metadata.updated_at': new Date()
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter = { userId: user.userId };

    const [runs, total] = await Promise.all([
      this.runModel
        .find(filter)
        .sort({ 'metadata.created_at': -1 })
        .skip(skip)
        .limit(limitNum)
        .exec(),
      this.runModel.countDocuments(filter),
    ]);

    return {
      data: runs.map(run => ({
        id: run._id,
        repository: run.repository,
        status: run.status,
        createdAt: run.metadata?.created_at,
      })),
      pagination: {
        page: pageNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get('report/:id')
  @UseGuards(JwtAuthGuard)
  public async getReport(@Param('id') id: string) {
    const report = await this.resultHandler.getReport(id);
    if (!report) {
      throw new NotFoundException(`Analysis report ${id} not found`);
    }
    return report;
  }
}
