import { Module } from '@nestjs/common';
import { AnalysisExecutorService } from './analysis-executor.service';

@Module({
    providers: [AnalysisExecutorService],
    exports: [AnalysisExecutorService]
})
export class AnalysisExecutorModule {}
