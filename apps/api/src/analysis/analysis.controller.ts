import { 
  Body, 
  Controller, 
  Post, 
  Get, 
  UseGuards, 
  Query, 
  Logger, 
  NotFoundException 
} from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from '../dto/create-analysis.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrchestratorRun } from '../orchestrator-run.schema';
import { Project } from '../project.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('analysis')
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(
    private readonly analysis: AnalysisService,
    @InjectModel(OrchestratorRun.name) private runModel: Model<OrchestratorRun>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
  ) {}

  @Post()
  create(@Body() body: CreateAnalysisDto) {
    const { repoURL, repoOwner, repoName } = this.analysis.validateURL(
      body.repoURL,
    );
    return {
      ok: true,
      input: body.repoURL,
      repoURL,
      repo: { repoOwner, repoName },
    };
  }

  @Post('run')
  @UseGuards(JwtAuthGuard)
  async runAnalysis(
    @Body() body: CreateAnalysisDto,
    @CurrentUser() user: any,
  ) {
    const { repoURL } = this.analysis.validateURL(body.repoURL);
    
    // Fallback email se il token non la ha (utile per test o token vecchi)
    const userEmail = user?.email || body.email || 'unknown@user.com'; 
    
    try {
      // runAnalysis ritorna l'ID del job (stato pending)
      const runId = await this.analysis.runAnalysis(repoURL, userEmail);
      
      return {
        ok: true,
        message: 'Analysis started successfully. Results will be saved via Webhook.',
        data: {
          runId: runId,
          status: 'pending'
        },
      };
    } catch (error) {
      return {
        ok: false,
        message: 'Analysis failed to start',
        error: error.message,
      };
    }
  }

  @Post('webhook')
  async handleWebhook(@Body() result: any) {
    this.logger.log(`📥 Webhook ricevuto da Python. ID Analisi: ${result.analysis_id}`);
    
    if (!result.analysis_id) {
        this.logger.error('Webhook ricevuto senza analysis_id');
        return { ok: false };
    }

    // Aggiorna il record nel DB con i risultati veri
    const updated = await this.runModel.findByIdAndUpdate(
        result.analysis_id,
        {
            status: result.summary ? 'completed' : 'error',
            orchestrator_summary: result.summary || {},
            spell_agent_details: result.spelling_analysis || [],
            metadata: {
                ...result.execution_metrics, 
                updated_at: new Date()
            }
        },
        { new: true }
    );

    if (!updated) {
        throw new NotFoundException(`Analysis ID ${result.analysis_id} not found`);
    }

    this.logger.log(`✅ Risultati salvati per Run ID: ${result.analysis_id}`);
    return { ok: true };
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    const skip = (pageNum - 1) * limitNum;

    // Filtra per userId se presente nel token
    const filter = user?.userId ? { userId: user.userId } : {};

    const [analyses, total] = await Promise.all([
      this.runModel
        .find(filter)
        .sort({ timestamp: -1 }) // o 'metadata.created_at' se usi quello
        .skip(skip)
        .limit(limitNum)
        .exec(),
      this.runModel.countDocuments(filter),
    ]);

    const projectIds = [
      ...new Set(analyses.map((a) => a.projectId).filter(Boolean)),
    ];
    const projects = await this.projectModel
      .find({ _id: { $in: projectIds } })
      .select('name')
      .exec();

    const projectMap = new Map(projects.map((p) => [p._id.toString(), p.name]));

    const transformedAnalyses = analyses.map((analysis) => {
      const analysisObj: any = analysis.toObject();
      return {
        id: analysisObj._id,
        repoId: analysisObj.projectId,
        repoName: analysisObj.projectId
          ? projectMap.get(analysisObj.projectId.toString()) || 'Unknown'
          : 'Unknown',
        date: analysisObj.metadata?.created_at || analysisObj.timestamp, // Adatta al tuo schema
        status: analysisObj.status,
        report: analysisObj.orchestrator_summary
          ? {
              totalFiles: analysisObj.orchestrator_summary.total_files || 0,
              totalErrors: analysisObj.orchestrator_summary.total_errors || 0
            }
          : null,
      };
    });

    return {
      analyses: transformedAnalyses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }
}