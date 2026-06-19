import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 👇 BULLETPROOF CORS CONFIGURATION 👇
  app.enableCors({
    origin: '*', // Allow requests from any frontend (Vite, etc.)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // Explicitly allow OPTIONS
    allowedHeaders: 'Content-Type, Authorization, Accept, X-Requested-With',
  }); 

  await app.listen(3001);
  console.log(`Application is running on: http://localhost:3001`);
}
bootstrap();