import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalysisModule } from './analysis/analysis.module';
import { AuthModule } from './auth/auth.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { UsersModule } from './users/users.module';
import { ResultsController } from './results.controller';
import { UsersController } from './user.controller';
import { ProjectsController } from './project.controller';
import { OrchestratorRun, OrchestratorRunSchema } from './orchestrator-run.schema';
import { Project, ProjectSchema } from './project.schema';
import { User, UserSchema } from './users/schemas/user.schema';

@Module({
  imports: [
    // Carica .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),

    // Connessione MongoDB
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGODB_URI', 'mongodb://localhost:27017/'),
        dbName: config.get('MONGODB_DB_NAME', 'agenti_db'),
      }),
      inject: [ConfigService],
    }),

    // Schema per leggere i dati
    MongooseModule.forFeature([
      { name: OrchestratorRun.name, schema: OrchestratorRunSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema },
    ]),

    // Moduli applicazione
    AnalysisModule,
    AuthModule,
    RepositoriesModule,
    UsersModule,
  ],
  controllers: [
    AppController,
    ResultsController,
    UsersController,
    ProjectsController,
  ],
  providers: [AppService],
})
export class AppModule {}