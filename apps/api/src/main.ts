import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 👇 BULLETPROOF CORS CONFIGURATION FOR DEPLOYMENT 👇
  app.enableCors({
    origin: '*', // Allows your Vercel frontend (or Postman) to talk to this backend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Keeps your DTO validation working perfectly in production
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // ⚠️ CRITICAL FOR RENDER: Listen on the port Render provides, fallback to 3001 locally
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on port: ${port}`);
}

bootstrap();