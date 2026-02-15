import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
<<<<<<< HEAD
import { AnalysisGateway } from './gateways/analysis.gateway';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Project, ProjectSchema } from '../project.schema';
import {
  OrchestratorRun,
  OrchestratorRunSchema,
} from '../orchestrator-run.schema';
=======
import { ValidationModule } from 'src/common/validation/validation.module';
import { GithubCommunicatorModule } from 'src/common/github-communicator/github-communicator.module';
import { AnalysisExecutorModule } from './analysis-executor/analysis-executor.module';
import { AnalysisResultHandlerModule } from './analysis-result-handler/analysis-result-handler.module';
>>>>>>> develop

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: OrchestratorRun.name, schema: OrchestratorRunSchema },
    ]),
  ],
  controllers: [AnalysisController],
<<<<<<< HEAD
  providers: [AnalysisService, AnalysisGateway],
  exports: [AnalysisService],
=======
  
  providers: [
      AnalysisService,
  ],
  
  imports: [
      ValidationModule, 
      GithubCommunicatorModule, 
      AnalysisExecutorModule, 
      AnalysisResultHandlerModule
  ]
>>>>>>> develop
})
export class AnalysisModule {}