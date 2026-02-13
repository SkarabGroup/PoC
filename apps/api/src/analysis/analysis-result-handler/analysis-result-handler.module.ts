import { Module } from '@nestjs/common';
import { AnalysisResultHandlerService } from './analysis-result-handler.service';

@Module({
    providers: [AnalysisResultHandlerService],
    exports: [AnalysisResultHandlerService]
})
export class AnalysisResultHandlerModule {}
