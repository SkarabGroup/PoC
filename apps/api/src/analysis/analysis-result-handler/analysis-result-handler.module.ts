import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisResultHandlerService } from './analysis-result-handler.service';
import { AnalysisGateway } from './gateway/analysis.gateway';
import { Analysis, AnalysisSchema} from 'src/database/analysis.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            {name: Analysis.name, schema: AnalysisSchema}
        ])
    ],
    providers: [AnalysisResultHandlerService, AnalysisGateway],
    exports: [AnalysisResultHandlerService]
})
export class AnalysisResultHandlerModule {}
