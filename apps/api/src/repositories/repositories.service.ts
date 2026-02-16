import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../project.schema';
import { Analysis, AnalysisDocument, AnalysisStatus } from 'src/database/analysis.schema';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { UpdateRepositoryDto } from './dto/update-repository.dto';

@Injectable()
export class RepositoriesService {
  private readonly logger = new Logger(RepositoriesService.name);

  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
  ) {}

  async create(userId: string, createRepositoryDto: CreateRepositoryDto): Promise<any> {
    const project = await this.projectModel.create({
      name: createRepositoryDto.name,
      repo_url: createRepositoryDto.url,
      userId: new Types.ObjectId(userId),
    });

    const saved = await project.save();
    return {
      ...saved.toObject(),
      id: saved._id,
      url: saved.repo_url,
      description: createRepositoryDto.description || '',
      createdAt: (saved as any).created_at,
    };
  }

  async findAll(userId: string, search?: string): Promise<any[]> {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { repo_url: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await this.projectModel.find(query).sort({ created_at: -1 });

    const enrichedRepositories = await Promise.all(
      projects.map(async (project) => {
        const projectId = project._id;

        const totalAnalyses = await this.analysisModel.countDocuments({ projectId });

        const latestRun = await this.analysisModel
          .findOne({ projectId })
          .sort({ createdAt: -1 })
          .lean();

        let lastAnalysis: any = null;
        if (latestRun) {
          lastAnalysis = {
            id: latestRun.analysisId,
            date: latestRun.createdAt,
            status: latestRun.status,
            report: latestRun.report || null,
            executionMetrics: latestRun.executionMetrics || null,
          };
        }

        const projectObj = project.toObject();
        return {
          id: projectObj._id,
          name: projectObj.name,
          description: '', 
          url: projectObj.repo_url,
          created_at: (projectObj as any).created_at,
          totalAnalyses,
          lastAnalysis,
        };
      }),
    );

    return enrichedRepositories;
  }

  async findOne(id: string, userId: string): Promise<any> {
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!project) throw new NotFoundException('Repository not found');

    const runs = await this.analysisModel
      .find({ projectId: new Types.ObjectId(id) })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
      .exec();

    const analysisHistory = runs.map((run) => ({
      id: run.analysisId,
      date: run.createdAt,
      status: run.status,
      report: run.report || null,
      executionMetrics: run.executionMetrics || null,
    }));

    const projectObj = project.toObject();
    return {
      id: projectObj._id,
      name: projectObj.name,
      description: '',
      url: projectObj.repo_url,
      created_at: (projectObj as any).created_at,
      userId: projectObj.userId,
      totalAnalyses: analysisHistory.length,
      lastAnalysis: analysisHistory[0] || null,
      analysisHistory,
    };
  }

  async update(id: string, userId: string, updateRepositoryDto: UpdateRepositoryDto): Promise<any> {
    const updateData: any = { name: updateRepositoryDto.name };
    if (updateRepositoryDto.url) updateData.repo_url = updateRepositoryDto.url;

    const project = await this.projectModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      updateData,
      { new: true },
    );

    if (!project) throw new NotFoundException('Repository not found');

    const projectObj = project.toObject();
    return {
      id: projectObj._id,
      name: projectObj.name,
      url: projectObj.repo_url,
      createdAt: (projectObj as any).created_at,
    };
  }

  async remove(id: string, userId: string): Promise<void> {
    const projectId = new Types.ObjectId(id);
    const result = await this.projectModel.deleteOne({ _id: projectId, userId: new Types.ObjectId(userId) });

    if (result.deletedCount === 0) throw new NotFoundException('Repository not found');

    await this.analysisModel.deleteMany({ projectId });
  }

  async getRanking(userId: string): Promise<any[]> {
    return this.projectModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'analyses', // Nome della collezione del modello Analysis
          let: { projId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$projectId', '$$projId'] }, status: 'completed' } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: 'latestRun',
        },
      },
      { $addFields: { latestRun: { $arrayElemAt: ['$latestRun', 0] } } },
      {
        $addFields: {
          qualityScore: { $ifNull: ['$latestRun.summary.quality_score', 0] },
          securityScore: { $ifNull: ['$latestRun.summary.security_score', 0] },
          performanceScore: { $ifNull: ['$latestRun.summary.performance_score', 0] },
          averageScore: {
            $avg: [
              { $ifNull: ['$latestRun.summary.quality_score', 0] },
              { $ifNull: ['$latestRun.summary.security_score', 0] },
              { $ifNull: ['$latestRun.summary.performance_score', 0] },
            ],
          },
        },
      },
      { $sort: { averageScore: -1 } },
    ]);
  }

  async getStats(repoId: string, userId: string) {
    await this.findOne(repoId, userId); // Ownership check
    const projectId = new Types.ObjectId(repoId);

    const totalRuns = await this.analysisModel.countDocuments({ projectId });
    const completedRuns = await this.analysisModel.countDocuments({ projectId, status: 'completed' });

    return {
      totalRuns,
      completedRuns,
      failedRuns: totalRuns - completedRuns,
    };
  }

  async getRuns(repoId: string, userId: string) {
    await this.findOne(repoId, userId); 
    const runs = await this.analysisModel
      .find({ projectId: new Types.ObjectId(repoId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return runs.map((run) => ({
      id: run.analysisId,
      date: run.createdAt,
      status: run.status,
      report: run.summary ? {
        qualityScore: run.summary.quality_score || 0,
        summary: run.summary.summary || '',
        details: run.details || '',
      } : null,
    }));
  }
}
