import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { AnalysisTransformerService } from './analysis-transformer.service';
import { ValidationModule } from 'src/common/validation/validation.module';
import { GithubCommunicatorModule } from 'src/common/github-communicator/github-communicator.module';
import { AnalysisExecutorModule } from './analysis-executor/analysis-executor.module';
import { AnalysisResultHandlerModule } from './analysis-result-handler/analysis-result-handler.module';

import { Analysis, AnalysisSchema } from 'src/database/analysis.schema';
import { Repository, RepositorySchema } from 'src/database/repository.schema';
import { User, UserSchema } from 'src/database/users.schema';
import { Project, ProjectSchema } from '../project.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Analysis.name, schema: AnalysisSchema },
      { name: Repository.name, schema: RepositorySchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    ValidationModule,
    GithubCommunicatorModule,
    AnalysisExecutorModule,
    AnalysisResultHandlerModule,
  ],
  controllers: [AnalysisController],
  providers: [
    AnalysisService,
    AnalysisTransformerService,
  ],
  exports: [AnalysisService],
})
export class AnalysisModule {}
