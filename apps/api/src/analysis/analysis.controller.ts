import { Body, Controller, Post, Get, UseGuards, Query } from '@nestjs/common';
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

    const [analyses, total] = await Promise.all([
      this.runModel
        .find({ userId: user.userId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .exec(),
      this.runModel.countDocuments({ userId: user.userId }),
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
          ? projectMap.get(analysisObj.projectId) || 'Unknown'
          : 'Unknown',
        date: analysisObj.timestamp,
        status: analysisObj.status,
        report: analysisObj.orchestrator_summary
          ? {
              qualityScore: analysisObj.orchestrator_summary.quality_score || 0,
              securityScore:
                analysisObj.orchestrator_summary.security_score || 0,
              performanceScore:
                analysisObj.orchestrator_summary.performance_score || 0,
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
