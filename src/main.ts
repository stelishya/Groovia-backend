import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:5500',
    credentials: true,
  })
  
  await app.listen(process.env.BACKEND_PORT ?? 5000);
}
bootstrap();
