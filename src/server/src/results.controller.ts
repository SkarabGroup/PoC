import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrchestratorRun } from './orchestrator-run.schema';
import { User } from './user.schema';
import { Project } from './project.schema';

@Controller('api/results')
export class ResultsController {
  constructor(
    @InjectModel(OrchestratorRun.name)
    private runModel: Model<OrchestratorRun>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Project.name)
    private projectModel: Model<Project>,
  ) {}

  // GET /api/results - tutti i risultati (con filtri opzionali)
  @Get()
  async getAllResults(
    @Query('userId') userId?: string,
    @Query('projectId') projectId?: string,
    @Query('limit') limit?: string,
  ) {
    const query: any = {};

    if (userId) {
      query.userId = userId;
    }

    if (projectId) {
      query.projectId = projectId;
    }

    const limitNum = limit ? parseInt(limit) : 50;

    return this.runModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .exec();
  }

  // GET /api/results/:id - risultato specifico
  @Get(':id')
  async getResultById(@Param('id') id: string) {
    return this.runModel.findById(id).exec();
  }

  // GET /api/results/user/:userId - risultati per utente
  @Get('user/:userId')
  async getResultsByUser(@Param('userId') userId: string) {
    return this.runModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  // GET /api/results/project/:projectId - risultati per progetto
  @Get('project/:projectId')
  async getResultsByProject(@Param('projectId') projectId: string) {
    return this.runModel
      .find({ projectId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }
}