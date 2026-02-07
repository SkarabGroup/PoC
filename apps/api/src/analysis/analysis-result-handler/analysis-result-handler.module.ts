import { Module } from '@nestjs/common';
import { AnalysisResultHandlerService } from './analysis-result-handler.service';
import { AnalysisGateway } from './gateway/analysis.gateway';

@Module({
    providers: [AnalysisResultHandlerService, AnalysisGateway],
    exports: [AnalysisResultHandlerService]
})
export class AnalysisResultHandlerModule {}
