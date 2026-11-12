import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
type ReferenceObject = { $ref: string };
type SchemaObject = Exclude<
  NonNullable<NonNullable<OpenAPIObject['components']>['schemas']>[string],
  ReferenceObject
>;
type OperationObject = NonNullable<OpenAPIObject['paths'][string]['get']>;
import config from '../config';

const objectId: SchemaObject = {
  type: 'string',
  pattern: '^[a-fA-F0-9]{24}$',
  example: '507f1f77bcf86cd799439011',
};
const nullableString: SchemaObject = { type: 'string', nullable: true };
const profile: SchemaObject = {
  type: 'object',
  additionalProperties: true,
  description:
    'Bookkeeper profile ID (_id) differs from account ID (userId). Private contact/documents appear only for the owner/admin.',
  properties: {
    _id: objectId,
    userId: {
      oneOf: [
        objectId,
        {
          type: 'object',
          properties: {
            _id: objectId,
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
      ],
    },
    status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
    applicationStatus: { type: 'string', enum: ['draft', 'submitted'] },
    applicationSubmittedAt: {
      type: 'string',
      format: 'date-time',
      nullable: true,
    },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    professionalTitle: nullableString,
    professionalBio: nullableString,
    educationalQualification: nullableString,
    hourlyRate: { type: 'number', minimum: 0 },
    yearsOfExperience: { type: 'number', minimum: 0 },
    projectsCompleted: { type: 'integer', minimum: 0 },
    availability: nullableString,
    uploadResume: { type: 'string', format: 'uri' },
    coverLetterUrl: { type: 'string', format: 'uri' },
    skills: { type: 'array', items: { type: 'string' } },
    languages: { type: 'array', items: { type: 'string' } },
    specializations: { type: 'array', items: { type: 'string' } },
    certifications: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          issuer: nullableString,
          year: { type: 'integer' },
          fileUrl: { type: 'string', format: 'uri' },
        },
      },
    },
    portfolio: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: nullableString,
          department: nullableString,
          fileUrl: { type: 'string', format: 'uri' },
        },
      },
    },
  },
};
const envelope = (data: SchemaObject | ReferenceObject): SchemaObject => ({
  type: 'object',
  required: ['statusCode', 'success', 'message', 'data'],
  properties: {
    statusCode: { type: 'integer', example: 200 },
    success: { type: 'boolean', example: true },
    message: nullableString,
    meta: {
      type: 'object',
      additionalProperties: true,
      description: 'Pagination for lists; rating summary for reviews',
      properties: {
        page: { type: 'integer' },
        limit: { type: 'integer' },
        total: { type: 'integer' },
      },
    },
    data,
  },
});

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
      .addCookieAuth(
        'refreshToken',
        { type: 'apiKey', in: 'cookie' },
        'refresh-cookie',
      )
      .build(),
  );
  document.components ??= {};
  document.components.schemas ??= {};
  document.components.schemas.BookkeeperProfileResponse = profile;
  document.components.schemas.ApiError = {
    type: 'object',
    required: ['success', 'statusCode', 'message', 'errorSources'],
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: { type: 'integer', example: 400 },
      message: { type: 'string', example: 'Validation failed' },
      errorSources: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { oneOf: [{ type: 'string' }, { type: 'number' }] },
            message: { type: 'string' },
          },
        },
      },
    },
  };
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
      let data: SchemaObject | ReferenceObject = {
        description:
          'Endpoint result; see screen-by-screen integration guide for field mapping.',
      };
      if (path.startsWith('/api/v1/bookkeeper')) {
        data =
          method === 'get' &&
          ['/api/v1/bookkeeper', '/api/v1/bookkeeper/admin/all'].includes(path)
            ? {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/BookkeeperProfileResponse',
                },
              }
            : { $ref: '#/components/schemas/BookkeeperProfileResponse' };
      }
      if (path === '/api/v1/dashboard/me')
        data = {
          type: 'object',
          properties: {
            profile: { $ref: '#/components/schemas/BookkeeperProfileResponse' },
            marketplaceStatus: { type: 'string' },
            profileCompletion: {
              type: 'object',
              nullable: true,
              properties: {
                percentage: { type: 'integer', minimum: 0, maximum: 100 },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      key: { type: 'string' },
                      complete: { type: 'boolean' },
                    },
                  },
                },
              },
            },
            assessmentScore: { type: 'number', nullable: true },
            unreadMessages: { type: 'integer' },
            activeEngagements: { type: 'integer' },
            assessments: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
            learning: {
              type: 'object',
              nullable: true,
              additionalProperties: true,
            },
            contracts: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
          },
          additionalProperties: true,
        };
      if (path === '/api/v1/auth/refresh')
        operation.security = [{ 'refresh-cookie': [] }];
      // Controllers use the global envelope except the manually handled Stripe webhook.
      if (path !== '/api/v1/webhook') {
        for (const status of Object.keys(operation.responses).filter((status) =>
          /^2\d\d$/.test(status),
        )) {
          operation.responses[status] = {
            description: 'Success; result is in data',
            content: { 'application/json': { schema: envelope(data) } },
          };
        }
        for (const status of ['400', '401', '403', '404', '409'])
          operation.responses[status] ??= {
            description: 'Error; inspect message and errorSources',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          };
      }
    }
  }
  // Swagger UI cannot reliably encode arrays of nested multipart objects: show JSON text inputs.
  const request =
    document.paths['/api/v1/bookkeeper/profile/me']?.patch?.requestBody;
  if (request && !('$ref' in request)) {
    const media = request.content['multipart/form-data'];
    const dto = document.components.schemas
      .UpdateMyBookkeeperProfileDto as SchemaObject;
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
