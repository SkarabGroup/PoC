import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalysisModule } from './analysis/analysis.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
@Module({
  imports: [
      ConfigModule.forRoot({
          isGlobal: true,
      }),
      
      MongooseModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => {
            const baseUri = configService.get<string>('MONGODB_URI') || 'mongodb://mongodb:27017/';
            const dbName = configService.get<string>('MONGODB_DB_NAME') || 'agenti_db';
            
            return {
              uri: `${baseUri}${dbName}`, // Risulta in: mongodb://mongodb:27017/agenti_db
            };
          },
        }),

      AnalysisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
