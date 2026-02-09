import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from '../project.schema';
import { OrchestratorRun } from '../orchestrator-run.schema';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';

@Injectable()
export class RepositoriesService {
  constructor(
    @InjectModel(Project.name)
    private projectModel: Model<Project>,
    @InjectModel(OrchestratorRun.name)
    private runModel: Model<OrchestratorRun>,
  ) {}

  async create(
    userId: string,
    createRepositoryDto: CreateRepositoryDto,
  ): Promise<any> {
    const project = new this.projectModel({
      name: createRepositoryDto.name,
      repo_url: createRepositoryDto.url,
      userId: userId,
    });
    const saved = await project.save();
    // Transform to match API expectations
    return {
      ...saved.toObject(),
      id: saved._id,
      url: saved.repo_url,
      description: createRepositoryDto.description || '',
      createdAt: saved.created_at,
    };
  }

  async findAll(userId: string, search?: string): Promise<any[]> {
    const query: any = { userId: userId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { repo_url: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await this.projectModel.find(query).sort({ created_at: -1 });

    // Enrich each repository with analysis data from OrchestratorRun collection
    const enrichedRepositories = await Promise.all(
      projects.map(async (project) => {
        const projectId = project._id.toString();

        // Get total analyses count
        const totalAnalyses = await this.runModel.countDocuments({
          projectId: projectId,
        });

        // Get latest analysis
        const latestRun: any = await this.runModel
          .findOne({ projectId: projectId })
          .sort({ timestamp: -1 })
          .lean();

        let lastAnalysis: any = null;
        if (latestRun) {
          lastAnalysis = {
            id: latestRun._id,
            date: latestRun.timestamp,
            status: latestRun.status,
            report: latestRun.orchestrator_summary ? {
              qualityScore: latestRun.orchestrator_summary.quality_score || 0,
              securityScore: latestRun.orchestrator_summary.security_score || 0,
              performanceScore: latestRun.orchestrator_summary.performance_score || 0,
            } : null,
          };
        }

        const projectObj = project.toObject();
        return {
          id: projectObj._id,
          name: projectObj.name,
          description: '', // Project schema doesn't have description
          url: projectObj.repo_url,
          created_at: projectObj.created_at,
          totalAnalyses,
          lastAnalysis,
        };
      }),
    );

    return enrichedRepositories;
  }

  async findOne(id: string, userId: string): Promise<any> {
    const project = await this.projectModel.findOne({
      _id: id,
      userId: userId,
    });

    if (!project) {
      throw new NotFoundException('Repository not found');
    }

    // Get analysis history for this repository
    const runs = await this.runModel
      .find({ projectId: id })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean()
      .exec();

    const analysisHistory = runs.map((run: any) => ({
      id: run._id,
      date: run.timestamp,
      status: run.status,
      report: run.orchestrator_summary ? {
        qualityScore: run.orchestrator_summary.quality_score || 0,
        securityScore: run.orchestrator_summary.security_score || 0,
        performanceScore: run.orchestrator_summary.performance_score || 0,
        summary: run.orchestrator_summary.summary || '',
        details: run.orchestrator_summary.details || '',
        criticalIssues: 0,
        warningIssues: 0,
        infoIssues: 0,
      } : null,
    }));

    // Get latest analysis
    const lastAnalysis = analysisHistory.length > 0 ? analysisHistory[0] : null;

    const projectObj = project.toObject();
    return {
      id: projectObj._id,
      name: projectObj.name,
      description: '',
      url: projectObj.repo_url,
      created_at: projectObj.created_at,
      userId: projectObj.userId,
      totalAnalyses: analysisHistory.length,
      lastAnalysis,
      analysisHistory,
    };
  }

  async update(
    id: string,
    userId: string,
    updateRepositoryDto: UpdateRepositoryDto,
  ): Promise<any> {
    const updateData: any = {
      name: updateRepositoryDto.name,
    };
    if (updateRepositoryDto.url) {
      updateData.repo_url = updateRepositoryDto.url;
    }

    const project = await this.projectModel.findOneAndUpdate(
      { _id: id, userId: userId },
      updateData,
      { new: true },
    );

    if (!project) {
      throw new NotFoundException('Repository not found');
    }

    const projectObj = project.toObject();
    return {
      id: projectObj._id,
      name: projectObj.name,
      description: updateRepositoryDto.description || '',
      url: projectObj.repo_url,
      created_at: projectObj.created_at,
    };
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.projectModel.deleteOne({
      _id: id,
      userId: userId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Repository not found');
    }

    // Also delete all analyses for this repository
    await this.runModel.deleteMany({
      projectId: id,
    });
  }

  async getRanking(userId: string): Promise<any[]> {
    const result = await this.projectModel.aggregate([
      {
        $match: { userId: userId },
      },
      {
        $lookup: {
          from: 'orchestrator_runs',
          let: { projectId: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$projectId', '$$projectId'] },
                status: 'completed',
              },
            },
            { $sort: { timestamp: -1 } },
            { $limit: 1 },
          ],
          as: 'latestRun',
        },
      },
      {
        $addFields: {
          latestRun: { $arrayElemAt: ['$latestRun', 0] },
        },
      },
      {
        $addFields: {
          qualityScore: { $ifNull: ['$latestRun.orchestrator_summary.quality_score', 0] },
          securityScore: { $ifNull: ['$latestRun.orchestrator_summary.security_score', 0] },
          performanceScore: { $ifNull: ['$latestRun.orchestrator_summary.performance_score', 0] },
          averageScore: {
            $avg: [
              { $ifNull: ['$latestRun.orchestrator_summary.quality_score', 0] },
              { $ifNull: ['$latestRun.orchestrator_summary.security_score', 0] },
              { $ifNull: ['$latestRun.orchestrator_summary.performance_score', 0] },
            ],
          },
        },
      },
      {
        $sort: { averageScore: -1 },
      },
      {
        $project: {
          latestRun: 0,
        },
      },
    ]);

    return result;
  }

  async getStats(repoId: string, userId: string) {
    const repo = await this.findOne(repoId, userId);

    const totalRuns = await this.runModel.countDocuments({
      projectId: repoId,
    });

    const completedRuns = await this.runModel.countDocuments({
      projectId: repoId,
      status: 'completed',
    });

    return {
      totalRuns,
      completedRuns,
      failedRuns: totalRuns - completedRuns,
    };
  }

  async getRuns(repoId: string, userId: string) {
    await this.findOne(repoId, userId); // Verifica ownership

    const runs = await this.runModel
      .find({ projectId: repoId })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean()
      .exec();

    // Transform to match frontend expectations
    return runs.map((run: any) => ({
      id: run._id,
      date: run.timestamp,
      status: run.status,
      report: run.orchestrator_summary ? {
        qualityScore: run.orchestrator_summary.quality_score || 0,
        securityScore: run.orchestrator_summary.security_score || 0,
        performanceScore: run.orchestrator_summary.performance_score || 0,
        summary: run.orchestrator_summary.summary || '',
        details: run.orchestrator_summary.details || '',
      } : null,
    }));
  }
}
