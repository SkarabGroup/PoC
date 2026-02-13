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
          envFilePath: '.env'
      }),
      MongooseModule.forRootAsync({
           imports: [ConfigModule],
           useFactory: async (configService: ConfigService) => ({
           uri: configService.get<string>('MONGODB_URI') || 'mongodb://mongodb:27017/agenti_db',
      }),
      inject: [ConfigService],
    }),

      AnalysisModule,
      ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
