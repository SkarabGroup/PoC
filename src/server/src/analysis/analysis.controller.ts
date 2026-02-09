import { Controller, Post, Get, Body, Query, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { AnalysisResult, AnalysisService } from './analysis.service';
import { AnalysisRequestDTO } from './dto/analysis-DTO';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrchestratorRun } from '../orchestrator-run.schema';
import { Project } from '../project.schema';

@Controller('analysis')
export class AnalysisController {
    constructor(
        private readonly analysisService: AnalysisService,
        @InjectModel(OrchestratorRun.name)
        private runModel: Model<OrchestratorRun>,
        @InjectModel(Project.name)
        private projectModel: Model<Project>,
    ) {}

    @Post()
    async run(@Body() body : AnalysisRequestDTO) : Promise<AnalysisResult> {
        try {
            const userEmail = body.email || 'unknown@user.com';
            return await this.analysisService.runAnalysis(body.repoURL, userEmail);
        } catch(error) {
            throw new HttpException(
                error.message || 'Errore durante l\'analisi',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
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
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .exec(),
            this.runModel.countDocuments({ userId: user.userId }),
        ]);

        // Get all unique projectIds to fetch repository names
        const projectIds = [...new Set(analyses.map(a => a.projectId).filter(Boolean))];
        const projects = await this.projectModel
            .find({ _id: { $in: projectIds } })
            .select('name')
            .exec();

        const projectMap = new Map(projects.map(p => [p._id.toString(), p.name]));

        // Transform analyses to match frontend expectations
        const transformedAnalyses = analyses.map(analysis => {
            const analysisObj: any = analysis.toObject();
            return {
                id: analysisObj._id,
                repoId: analysisObj.projectId,
                repoName: analysisObj.projectId ? (projectMap.get(analysisObj.projectId) || analysisObj.repository || 'Unknown') : (analysisObj.repository || 'Unknown'),
                date: analysisObj.timestamp || analysisObj.createdAt, // Python uses 'timestamp', Mongoose uses 'createdAt'
                status: analysisObj.status,
                report: analysisObj.orchestrator_summary ? {
                    qualityScore: analysisObj.orchestrator_summary.quality_score || 0,
                    securityScore: analysisObj.orchestrator_summary.security_score || 0,
                    performanceScore: analysisObj.orchestrator_summary.performance_score || 0,
                } : null,
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
