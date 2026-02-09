import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { OrchestratorRun, OrchestratorRunSchema } from '../orchestrator-run.schema';
import { Project, ProjectSchema } from '../project.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: OrchestratorRun.name, schema: OrchestratorRunSchema },
            { name: Project.name, schema: ProjectSchema },
        ]),
    ],
    controllers: [AnalysisController],
    providers: [AnalysisService],
    exports: [AnalysisService],
})
export class AnalysisModule {}
