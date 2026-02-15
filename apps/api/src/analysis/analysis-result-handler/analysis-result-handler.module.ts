import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisResultHandlerService } from './analysis-result-handler.service';
import { Analysis, AnalysisSchema } from 'src/database/analysis.schema';
import { Repository, RepositorySchema } from 'src/database/repository.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
              { name: Analysis.name, schema: AnalysisSchema },
              { name: Repository.name, schema: RepositorySchema },
            ]),
    ],
    providers: [AnalysisResultHandlerService, Logger],
    exports: [AnalysisResultHandlerService]
})

export class AnalysisResultHandlerModule {}
