import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from  '@nestjs/common';
async function bootstrap() {
  // Set up the NestJS application
  const app = await NestFactory.create(AppModule);
  
  // Use global validation pipe for request validation
  app.enableCors(
    {
      origin: true,
      credentials: true,
    }
  );

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Start listening on the specified port or default to 3000
  const port = process.env.port || 3000;
  await app.listen(3000, '0.0.0.0');
  console.log(`Server in ascolto alla porta ${port}`)
}
bootstrap();
