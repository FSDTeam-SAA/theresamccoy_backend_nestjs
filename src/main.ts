import { createApiDocument } from './app/swagger/document';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import dotenv from 'dotenv';
import { UtilsInterceptor } from './app/utils/utils.interceptor';
import { GlobalExceptionFilter } from './app/middlewares/globalErrors.filter';
import config from './app/config';
import { validateProductionEnvironment } from './app/config/validate-production';
dotenv.config();

async function bootstrap() {
  validateProductionEnvironment(process.env);
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
    rawBody: true,
  });

  app.use(cookieParser());
  app.enableCors({
    origin:
      config.corsOrigin === '*'
        ? true
        : config.corsOrigin.split(',').map((origin) => origin.trim()),
    credentials: true,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: [''],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new UtilsInterceptor());
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost));

  const document = createApiDocument(app);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
    console.log(`Swagger: http://localhost:${config.port}/api/docs`);
  });
}
bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
