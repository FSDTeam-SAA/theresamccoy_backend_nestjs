import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import request from 'supertest';
import { UserController } from '../src/app/module/user/user.controller';
import { UserService } from '../src/app/module/user/user.service';
import { AuthController } from '../src/app/module/auth/auth.controller';
import { AuthService } from '../src/app/module/auth/auth.service';
import { ContentController } from '../src/app/module/content/content.controller';
import { ContentService } from '../src/app/module/content/content.service';
import { UtilsInterceptor } from '../src/app/utils/utils.interceptor';
import config from '../src/app/config';

describe('HTTP authorization and validation (mocked persistence)', () => {
  let app: INestApplication;
  const jwt = new JwtService();
  const user = {
    _id: '507f1f77bcf86cd799439011',
    role: 'business',
    email: 'test@example.com',
    status: 'active',
    tokenVersion: 0,
  };
  const users = { findById: jest.fn(async () => user) };
  const userService = {
    updateMyProfile: jest.fn(async (_id, dto) => dto),
    getSingleUser: jest.fn(),
  };
  const authService = { register: jest.fn(), resetPasswordChange: jest.fn() };
  const contentService = {
    get: jest.fn(async () => ({ slug: 'home', sections: [] })),
    update: jest.fn(async (_slug, dto) => dto),
  };
  const token = (role = 'business', tokenVersion = 0) =>
    jwt.sign(
      { id: user._id, email: user.email, role, tokenVersion },
      { secret: config.jwt.accessTokenSecret },
    );
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController, AuthController, ContentController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: AuthService, useValue: authService },
        { provide: ContentService, useValue: contentService },
        { provide: JwtService, useValue: jwt },
        { provide: getModelToken('User'), useValue: users },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalInterceptors(new UtilsInterceptor());
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    user.role = 'business';
    user.status = 'active';
  });
  it('rejects public admin signup before calling service', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        firstName: 'T',
        lastName: 'U',
        email: 'test@example.com',
        password: 'secret123',
        role: 'admin',
      })
      .expect(400);
    expect(authService.register).not.toHaveBeenCalled();
  });
  it('requires a reset token at the HTTP boundary', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({ email: 'test@example.com', newPassword: 'secret123' })
      .expect(400);
    expect(authService.resetPasswordChange).not.toHaveBeenCalled();
  });
  it('removes privileged fields from a self profile update', async () => {
    const response = await request(app.getHttpServer())
      .put('/api/v1/user/profile')
      .set('Authorization', 'Bearer ' + token())
      .send({
        firstName: 'Changed',
        role: 'admin',
        status: 'active',
        password: 'injected',
        verifiedForget: true,
      })
      .expect(200);
    expect(response.body.data).toEqual({ firstName: 'Changed' });
    expect(userService.updateMyProfile.mock.calls[0][1]).toEqual({
      firstName: 'Changed',
    });
  });
  it('protects private user details and uses current database role over stale JWT claims', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/user/' + user._id)
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/user/' + user._id)
      .set('Authorization', 'Bearer ' + token('admin'))
      .expect(403);
    expect(userService.getSingleUser).not.toHaveBeenCalled();
  });
  it('blocks suspended accounts and invalidated sessions', async () => {
    user.status = 'suspended';
    await request(app.getHttpServer())
      .put('/api/v1/user/profile')
      .set('Authorization', 'Bearer ' + token())
      .send({ firstName: 'T' })
      .expect(401);
    user.status = 'active';
    await request(app.getHttpServer())
      .put('/api/v1/user/profile')
      .set('Authorization', 'Bearer ' + token('business', 9))
      .send({ firstName: 'T' })
      .expect(401);
  });
  it('allows public content reads but restricts editing to admin', async () => {
    await request(app.getHttpServer()).get('/api/v1/content/home').expect(200);
    await request(app.getHttpServer())
      .put('/api/v1/content/admin/home')
      .send({ sections: [], published: true })
      .expect(401);
    await request(app.getHttpServer())
      .put('/api/v1/content/admin/home')
      .set('Authorization', 'Bearer ' + token())
      .send({ sections: [], published: true })
      .expect(403);
    user.role = 'admin';
    await request(app.getHttpServer())
      .put('/api/v1/content/admin/home')
      .set('Authorization', 'Bearer ' + token('admin'))
      .send({ sections: [], published: true })
      .expect(200);
  });
  it('rejects duplicate page section keys', async () => {
    user.role = 'admin';
    const section = { key: 'hero', title: 'Heading', items: [] };
    await request(app.getHttpServer())
      .put('/api/v1/content/admin/home')
      .set('Authorization', 'Bearer ' + token('admin'))
      .send({ sections: [section, section], published: true })
      .expect(400);
    expect(contentService.update).not.toHaveBeenCalled();
  });
});
