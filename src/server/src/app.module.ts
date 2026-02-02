import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResultsController } from './results.controller';
import { OrchestratorRun, OrchestratorRunSchema } from './orchestrator-run.schema';

@Module({
  imports: [
    // Carica .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
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
    ]),
  ],
  controllers: [
    AppController,
    ResultsController, // ← Nuovo controller
  ],
  providers: [AppService],
})
export class AppModule {}
