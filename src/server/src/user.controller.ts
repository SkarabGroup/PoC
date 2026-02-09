import { Controller, Get, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './users/schemas/user.schema';
import { Project } from './project.schema';
import { OrchestratorRun } from './orchestrator-run.schema';

@Controller('api/users')
export class UsersController {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Project.name)
    private projectModel: Model<Project>,
    @InjectModel(OrchestratorRun.name)
    private runModel: Model<OrchestratorRun>,
  ) {}

  // GET /api/users - lista utenti
  @Get()
  async getAllUsers() {
    return this.userModel
      .find()
      .select('-passwordHash') // Non restituire password
      .sort({ createdAt: -1 })
      .exec();
  }

  // GET /api/users/:id - dettagli utente
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.userModel.findById(id).select('-passwordHash').exec();
  }

  // GET /api/users/:id/projects - progetti dell'utente
  @Get(':id/projects')
  async getUserProjects(@Param('id') id: string) {
    return this.projectModel
      .find({ userId: id })
      .sort({ created_at: -1 })
      .exec();
  }

  // GET /api/users/:id/stats - statistiche utente
  @Get(':id/stats')
  async getUserStats(@Param('id') id: string) {
    const projectCount = await this.projectModel.countDocuments({ userId: id });
    const runCount = await this.runModel.countDocuments({ userId: id });
    const completedRuns = await this.runModel.countDocuments({
      userId: id,
      status: 'completed'
    });

    return {
      userId: id,
      projects: projectCount,
      totalRuns: runCount,
      completedRuns: completedRuns,
    };
  }
}