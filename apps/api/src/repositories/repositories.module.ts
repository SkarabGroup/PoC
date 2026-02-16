import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';
import { Project, ProjectSchema } from '../project.schema';
import { AnalysisModule } from '../analysis/analysis.module';
import { Analysis, AnalysisSchema } from 'src/database/analysis.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Analysis.name, schema: AnalysisSchema }, // Cambiato qui
    ]),
    AnalysisModule,
  ],
  controllers: [RepositoriesController],
  providers: [RepositoriesService],
  exports: [RepositoriesService],
})
export class RepositoriesModule {}
