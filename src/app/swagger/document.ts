import { INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import config from '../config';
import {
  swaggerOnComplete,
  swaggerRequestInterceptor,
  swaggerResponseInterceptor,
} from './auth-interceptors';
type ReferenceObject = { $ref: string };
type SchemaObject = Exclude<
  NonNullable<NonNullable<OpenAPIObject['components']>['schemas']>[string],
  ReferenceObject
>;
type OperationObject = NonNullable<OpenAPIObject['paths'][string]['get']>;

const objectId: SchemaObject = {
  type: 'string',
  pattern: '^[a-fA-F0-9]{24}$',
  example: '507f1f77bcf86cd799439011',
};
/** One document factory for the running server, exported handoff artifact and contract tests. */
export function createApiDocument(app: INestApplication): OpenAPIObject {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(`${config.appName} API`)
      .setVersion('1.1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Access token from POST /auth/login; do not enter the Bearer prefix twice',
        },
        'access-token',
      )
      .build(),
  );
  for (const [path, item] of Object.entries(document.paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const operation: OperationObject | undefined = item[method];
      if (!operation) continue;
      operation.summary ||= `${method.toUpperCase()} ${path}`;
      for (const parameter of operation.parameters ?? []) {
        if (!('$ref' in parameter) && parameter.in === 'path')
          parameter.schema =
            parameter.name === 'slug'
              ? {
                  type: 'string',
                  enum: ['home', 'about', 'training', 'apply', 'contact'],
                }
              : objectId;
      }
      if (path === '/api/v1/auth/refresh') operation.security = [];
    }
  }
  // Swagger UI cannot reliably encode arrays of nested multipart objects: show JSON text inputs.
  const request =
    document.paths['/api/v1/bookkeeper/profile/me']?.patch?.requestBody;
  if (request && !('$ref' in request)) {
    const media = request.content['multipart/form-data'];
    const dto = document.components?.schemas?.UpdateMyBookkeeperProfileDto as
      SchemaObject | undefined;
    if (media && dto) {
      const properties = { ...dto.properties };
      const examples: Record<string, unknown[]> = {
        languages: ['English'],
        skills: ['Xero', 'Payroll'],
        specializations: ['E-commerce'],
        certifications: [{ title: 'Xero Advisor', year: 2024 }],
        portfolio: [{ title: 'Monthly reconciliation', department: 'Retail' }],
      };
      for (const [field, example] of Object.entries(examples))
        properties[field] = {
          type: 'string',
          description:
            'JSON array encoded as text. Files align by index where applicable.',
          example: JSON.stringify(example),
        };
      media.schema = { ...dto, properties };
    }
  }
  return document;
}

export function setupApiDocumentation(app: INestApplication) {
  const document = createApiDocument(app);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      onComplete: swaggerOnComplete,
      withCredentials: true,
      requestInterceptor: swaggerRequestInterceptor,
      responseInterceptor: swaggerResponseInterceptor,
    },
  });
  return document;
}
