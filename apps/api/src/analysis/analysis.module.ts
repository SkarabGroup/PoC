import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { ValidationModule } from 'src/common/validation/validation.module';
import { GithubCommunicatorModule } from 'src/common/github-communicator/github-communicator.module';
import { AnalysisExecutorModule } from './analysis-executor/analysis-executor.module';
import { AnalysisResultHandlerModule } from './analysis-result-handler/analysis-result-handler.module';

@Module({
  controllers: [AnalysisController],
  
  providers: [
      AnalysisService,
  ],
  
  imports: [
      ValidationModule, 
      GithubCommunicatorModule, 
      AnalysisExecutorModule, 
      AnalysisResultHandlerModule
  ]
})
export class AnalysisModule {}
