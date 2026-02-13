import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { AnalysisGateway } from './gateways/analysis.gateway';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Project, ProjectSchema } from '../project.schema';
import {
  OrchestratorRun,
  OrchestratorRunSchema,
} from '../orchestrator-run.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: OrchestratorRun.name, schema: OrchestratorRunSchema },
    ]),
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService, AnalysisGateway],
  exports: [AnalysisService],
})
export class AnalysisModule {}