import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalysisModule } from './analysis/analysis.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
  imports: [
      ConfigModule.forRoot({
          isGlobal: true
      }),

      AnalysisModule,

      MongooseModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
              const uri = config.get<string>('MONGO_URI');
              if(!uri) {
                  throw new Error('MONGO_URI assente in .env');
              }
              return { uri };
          }
      })
      ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
