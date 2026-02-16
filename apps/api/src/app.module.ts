import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { AnalysisModule } from './analysis/analysis.module';

@Module({
  imports: [
    // Configurazione globale delle variabili d'ambiente
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Connessione asincrona a MongoDB
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI') || configService.get<string>('MONGO_URI');
        const dbName = configService.get<string>('MONGODB_DB_NAME') || 'agenti_db';

        if (!uri) {
          throw new Error('Database connection string (MONGODB_URI or MONGO_URI) is missing in .env');
        }

        // Se l'URI non include già il database, lo concatena
        const connectionUri = uri.endsWith('/') ? `${uri}${dbName}` : uri;

        return {
          uri: connectionUri,
        };
      },
    }),

    // Moduli di dominio
    AuthModule,
    UsersModule,
    RepositoriesModule,
    AnalysisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}