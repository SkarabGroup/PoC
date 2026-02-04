import { Controller, Get, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from './project.schema';
import { OrchestratorRun } from './orchestrator-run.schema';

@Controller('api/projects')
export class ProjectsController {
  constructor(
    @InjectModel(Project.name)
    private projectModel: Model<Project>,
    @InjectModel(OrchestratorRun.name)
    private runModel: Model<OrchestratorRun>,
  ) {}

  // GET /api/projects - lista progetti
  @Get()
  async getAllProjects() {
    return this.projectModel.find().sort({ created_at: -1 }).limit(100).exec();
  }

  // GET /api/projects/:id - dettagli progetto
  @Get(':id')
  async getProjectById(@Param('id') id: string) {
    return this.projectModel.findById(id).exec();
  }

  // GET /api/projects/:id/runs - analisi del progetto
  @Get(':id/runs')
  async getProjectRuns(@Param('id') id: string) {
    return this.runModel
      .find({ projectId: id })
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();
  }

  // GET /api/projects/:id/stats - statistiche progetto
  @Get(':id/stats')
  async getProjectStats(@Param('id') id: string) {
    const project = await this.projectModel.findById(id).exec();

    if (!project) {
      return { error: 'Project not found' };
    }

    const totalRuns = await this.runModel.countDocuments({ projectId: id });
    const completedRuns = await this.runModel.countDocuments({
      projectId: id,
      status: 'completed'
    });

    const lastRun = await this.runModel
      .findOne({ projectId: id })
      .sort({ createdAt: -1 })
      .exec();

    return {
      projectId: id,
      name: project.name,
      repo_url: project.repo_url,
      totalRuns: totalRuns,
      completedRuns: completedRuns,
      lastCheck: project.last_check,
      lastRunStatus: lastRun?.status || null,
    };
  }
}