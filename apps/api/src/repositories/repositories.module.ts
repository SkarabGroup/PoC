import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';
import { Project, ProjectSchema } from '../project.schema';
import { OrchestratorRun, OrchestratorRunSchema } from '../orchestrator-run.schema';
import { AnalysisModule } from '../analysis/analysis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: OrchestratorRun.name, schema: OrchestratorRunSchema },
    ]),
    AnalysisModule,
  ],
  controllers: [RepositoriesController],
  providers: [RepositoriesService],
  exports: [RepositoriesService],
})
export class RepositoriesModule {}
