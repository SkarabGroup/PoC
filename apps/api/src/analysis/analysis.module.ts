import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { ValidationModule } from 'src/common/validation/validation.module';
import { GithubCommunicatorModule } from 'src/common/github-communicator/github-communicator.module';
import { AnalysisExecutorModule } from './analysis-executor/analysis-executor.module';

@Module({
  controllers: [AnalysisController],
  providers: [AnalysisService],
  imports: [ValidationModule, GithubCommunicatorModule, AnalysisExecutorModule]
})
export class AnalysisModule {}
