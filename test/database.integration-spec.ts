import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import request from 'supertest';
import path from 'path';

describe('isolated MongoDB API workflows', () => {
  let mongo: MongoMemoryServer;
  let app: INestApplication;
  let connection: Connection;
  let adminToken: string, businessToken: string, bookkeeperToken: string;
  let businessId: string, bookkeeperId: string;
  const model = (name: string): Model<any> => app.get(getModelToken(name));
  const api = () => request(app.getHttpServer());
  const auth = (token: string) => 'Bearer ' + token;
  beforeAll(async () => {
    process.env.MONGOMS_DOWNLOAD_DIR = path.join(
      process.cwd(),
      '.tmp',
      'mongodb-binaries',
    );
    mongo = await MongoMemoryServer.create();
    // These overrides precede all application imports: never use the user's configured database or services.
    process.env.MONGO_URI = mongo.getUri('backend_api_test');
    process.env.NODE_ENV = 'test';
    process.env.STRIPE_SECRET_KEY = '';
    process.env.STRIPE_WEBHOOK_SECRET = '';
    process.env.EMAIL_HOST = '';
    process.env.AWS_BUCKET_NAME = '';
    process.env.ACCESS_TOKEN_SECRET = 'isolated-test-access-secret';
    process.env.REFRESH_TOKEN_SECRET = 'isolated-test-refresh-secret';
    const { AppModule } = require('../src/app.module');
    const { UtilsInterceptor } = require('../src/app/utils/utils.interceptor');
    const {
      GlobalExceptionFilter,
    } = require('../src/app/middlewares/globalErrors.filter');
    const { HttpAdapterHost } = require('@nestjs/core');
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalInterceptors(new UtilsInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter(app.get(HttpAdapterHost)));
    await app.init();
    connection = app.get(getConnectionToken());
    await Promise.all(
      connection.modelNames().map((name) => connection.model(name).init()),
    );
    await model('User').create({
      firstName: 'Admin',
      lastName: 'Test',
      email: 'admin@example.com',
      password: 'Integration123!',
      role: 'admin',
    });
    for (const role of ['business', 'bookkeeper']) {
      const response = await api()
        .post('/api/v1/auth/register')
        .send({
          firstName: role,
          lastName: 'Test',
          email: role + '@example.com',
          password: 'Integration123!',
          role,
        })
        .expect(201);
      if (role === 'business') businessId = response.body.data._id;
      else bookkeeperId = response.body.data._id;
      expect(response.body.data).not.toHaveProperty('password');
    }
    const login = async (email: string) =>
      (
        await api()
          .post('/api/v1/auth/login')
          .send({ email, password: 'Integration123!' })
          .expect(200)
      ).body.data.accessToken;
    adminToken = await login('admin@example.com');
    businessToken = await login('business@example.com');
    bookkeeperToken = await login('bookkeeper@example.com');
  });
  afterAll(async () => {
    if (app) await app.close();
    if (mongo) await mongo.stop();
  });

  it('persists CMS content and keeps unpublished pages private', async () => {
    const page = {
      published: false,
      sections: [{ key: 'hero', title: 'Marketplace', items: [] }],
    };
    await api()
      .put('/api/v1/content/admin/home')
      .set('Authorization', auth(adminToken))
      .send(page)
      .expect(200);
    await api().get('/api/v1/content/home').expect(404);
    await api()
      .put('/api/v1/content/admin/home')
      .set('Authorization', auth(adminToken))
      .send({ ...page, published: true })
      .expect(200);
    const response = await api().get('/api/v1/content/home').expect(200);
    expect(response.body.data.sections[0].title).toBe('Marketplace');
  });
  it('enforces ownership and publishes only approved marketplace profiles', async () => {
    const response = await api()
      .post('/api/v1/bookkeeper')
      .set('Authorization', auth(bookkeeperToken))
      .send({
        firstName: 'Book',
        lastName: 'Keeper',
        email: 'bookkeeper@example.com',
      })
      .expect(201);
    const id = response.body.data._id;
    await api()
      .get('/api/v1/bookkeeper/' + id)
      .expect(404);
    await api()
      .patch('/api/v1/bookkeeper/' + id + '/review')
      .set('Authorization', auth(adminToken))
      .send({ status: 'approved' })
      .expect(200);
    await api()
      .get('/api/v1/bookkeeper/' + id)
      .expect(200);
    const other = await model('User').create({
      firstName: 'Other',
      lastName: 'User',
      email: 'other@example.com',
      password: 'Integration123!',
      role: 'bookkeeper',
    });
    const otherProfile = await model('Bookkeeper').create({
      userId: other._id,
    });
    await api()
      .post('/api/v1/bookkeeper/' + otherProfile._id + '/skills')
      .set('Authorization', auth(bookkeeperToken))
      .send({ xero: 'Advanced' })
      .expect(403);
    expect(
      (await model('Bookkeeper').findById(otherProfile._id)).xero,
    ).toBeUndefined();
  });
  it('scores quizzes, enforces enrollment and persists lesson progress', async () => {
    const course = await model('Course').create({
      name: 'Test Course',
      status: 'published',
      modules: [
        {
          name: 'Basics',
          lessons: [
            {
              name: 'Equation',
              quizzes: [{ question: '2+2?', options: ['4', '5'], answer: '4' }],
            },
          ],
        },
      ],
    });
    const lesson = course.modules[0].lessons[0];
    const quiz = lesson.quizzes[0];
    const base = '/api/v1/course/' + course._id;
    await api()
      .post(base + '/lesson/' + lesson._id + '/quiz/submit')
      .set('Authorization', auth(bookkeeperToken))
      .send({ answers: [{ quizId: String(quiz._id), answer: '4' }] })
      .expect(403);
    await api()
      .post(base + '/enroll')
      .set('Authorization', auth(bookkeeperToken))
      .expect(201);
    const list = await api()
      .get('/api/v1/course?page=1&limit=10')
      .set('Authorization', auth(bookkeeperToken))
      .expect(200);
    expect(list.body.meta.total).toBe(1);
    expect(list.body.data[0]).not.toHaveProperty('modules');
    const detail = await api()
      .get(base)
      .set('Authorization', auth(bookkeeperToken))
      .expect(200);
    expect(
      detail.body.data.modules[0].lessons[0].quizzes[0],
    ).not.toHaveProperty('answer');
    await api()
      .post(base + '/lesson/' + lesson._id + '/complete')
      .set('Authorization', auth(bookkeeperToken))
      .expect(400);
    const result = await api()
      .post(base + '/lesson/' + lesson._id + '/quiz/submit')
      .set('Authorization', auth(bookkeeperToken))
      .send({ answers: [{ quizId: String(quiz._id), answer: '4' }] })
      .expect(201);
    expect(result.body.data.score).toBe(100);
    await api()
      .post(base + '/lesson/' + lesson._id + '/complete')
      .set('Authorization', auth(bookkeeperToken))
      .expect(201);
    const progress = await api()
      .get(base + '/progress')
      .set('Authorization', auth(bookkeeperToken))
      .expect(200);
    expect(progress.body.data.percentage).toBe(100);
    const assignment = await model('AssignmentSubmission').create({
      userId: bookkeeperId,
      courseId: course._id,
      lessonId: lesson._id,
      file: 'https://example.com/test-assignment.pdf',
    });
    const reviewPath =
      '/api/v1/course/admin/assignments/' + assignment._id + '/review';
    await api()
      .patch(reviewPath)
      .set('Authorization', auth(bookkeeperToken))
      .send({ score: 90, feedback: 'Reviewed' })
      .expect(403);
    await api()
      .patch(reviewPath)
      .set('Authorization', auth(adminToken))
      .send({ score: 101 })
      .expect(400);
    await api()
      .patch(reviewPath)
      .set('Authorization', auth(adminToken))
      .send({ score: 90, feedback: 'Reviewed' })
      .expect(200);
    const submissions = await api()
      .get(base + '/submissions/me')
      .set('Authorization', auth(bookkeeperToken))
      .expect(200);
    expect(submissions.body.data[0]).toMatchObject({
      status: 'reviewed',
      score: 90,
      feedback: 'Reviewed',
    });
    const dashboard = await api()
      .get('/api/v1/dashboard/me')
      .set('Authorization', auth(bookkeeperToken))
      .expect(200);
    expect(JSON.stringify(dashboard.body.data.training)).not.toContain('2+2?');
  });
  it('supports private platform support, replies and read cursors', async () => {
    await api()
      .post('/api/v1/support/me')
      .set('Authorization', auth(businessToken))
      .send({ text: 'Help please' })
      .expect(201);
    const reply = await api()
      .post('/api/v1/support/admin/' + businessId)
      .set('Authorization', auth(adminToken))
      .send({ text: 'We can help' })
      .expect(201);
    const unread = await api()
      .get('/api/v1/support/me/unread')
      .set('Authorization', auth(businessToken))
      .expect(200);
    expect(unread.body.data.unreadCount).toBe(1);
    await api()
      .patch('/api/v1/support/me/read')
      .set('Authorization', auth(businessToken))
      .send({ through: reply.body.data._id })
      .expect(200);
    const other = await api()
      .get('/api/v1/support/me')
      .set('Authorization', auth(bookkeeperToken))
      .expect(200);
    expect(other.body.data).toEqual([]);
  });
  it('enforces contract order and payment-gated messaging with a simulated verified payment', async () => {
    const business = await model('Businesswoner').create({
      userId: businessId,
      status: 'approved',
    });
    const bookkeeper = await model('Bookkeeper').findOne({
      userId: bookkeeperId,
    });
    const req = await model('Request').create({
      businessId: business._id,
      bookkeeperId: bookkeeper._id,
      status: 'accepted',
    });
    const meeting = await model('MeetingSchedule').create({
      requestId: req._id,
      businessId: business._id,
      bookkeeperId: bookkeeper._id,
      status: 'completed',
      completedAt: new Date(),
      date: '2026-11-12',
      time: '12:00',
      meetingLink: 'https://example.com/meeting',
    });
    const response = await api()
      .post('/api/v1/engagement')
      .set('Authorization', auth(adminToken))
      .send({
        meetingId: String(meeting._id),
        projectTitle: 'Books',
        projectDetails: 'Monthly accounts',
        contractText: 'Agreed terms',
        projectValue: 1000,
        businessAgreed: true,
        bookkeeperAgreed: true,
      })
      .expect(201);
    const id = response.body.data._id;
    expect(response.body.data.platformFeeCents).toBe(10000);
    const base = '/api/v1/engagement/' + id;
    await api()
      .get(base + '/contacts')
      .set('Authorization', auth(businessToken))
      .expect(403);
    await api()
      .post(base + '/sign')
      .set('Authorization', auth(businessToken))
      .send({ signature: 'Business', accepted: true })
      .expect(409);
    await api()
      .post(base + '/sign')
      .set('Authorization', auth(bookkeeperToken))
      .send({ signature: 'Bookkeeper', accepted: true })
      .expect(201);
    await api()
      .post(base + '/sign')
      .set('Authorization', auth(businessToken))
      .send({ signature: 'Business', accepted: true })
      .expect(201);
    await api()
      .post(base + '/messages')
      .set('Authorization', auth(businessToken))
      .send({ text: 'Locked' })
      .expect(403);
    await api()
      .post(base + '/payment')
      .set('Authorization', auth(businessToken))
      .expect(503);
    // Test the existing webhook handler's business rule without contacting Stripe.
    await model('Engagement').updateOne(
      { _id: id },
      { $set: { stripePaymentIntentId: 'pi_test_fixture' } },
    );
    const {
      EngagementService,
    } = require('../src/app/module/engagement/engagement.service');
    const service = app.get<any>(EngagementService);
    const intent = {
      id: 'pi_test_fixture',
      status: 'succeeded',
      amount: 10000,
      amount_received: 10000,
      currency: 'usd',
      metadata: { engagementId: id, businessId, paymentType: 'platform_fee' },
    };
    await service.confirmPayment(intent);
    await service.confirmPayment(intent); // duplicate event is idempotent
    const message = await api()
      .post(base + '/messages')
      .set('Authorization', auth(businessToken))
      .send({ text: 'Accounts ready' })
      .expect(201);
    expect(await model('Engagement').findById(id).lean()).toMatchObject({
      status: 'active',
      paymentStatus: 'paid',
      contactUnlocked: true,
    });
    expect(String((await model('Engagement').findById(id)).bookkeeperId)).toBe(
      bookkeeperId,
    );
    expect(
      await service.inbox({ id: bookkeeperId, role: 'bookkeeper' }),
    ).toHaveLength(1);
    const inbox = await api()
      .get('/api/v1/engagement/inbox/me')
      .set('Authorization', auth(bookkeeperToken))
      .expect(200);
    expect(inbox.body).toMatchObject({ data: [{ unreadCount: 1 }] });
    await api()
      .patch(base + '/messages/read')
      .set('Authorization', auth(bookkeeperToken))
      .send({ through: message.body.data._id })
      .expect(200);
    await api()
      .patch(base + '/complete')
      .set('Authorization', auth(businessToken))
      .expect(200);
  });

  it('consumes OTP and reset proof once with real password hashing', async () => {
    const { createHash } = require('crypto');
    await model('User').updateOne(
      { _id: bookkeeperId },
      {
        $set: {
          otp: createHash('sha256').update('123456').digest('hex'),
          otpExpiry: new Date(Date.now() + 60000),
          otpAttempts: 0,
        },
      },
    );
    const verified = await api()
      .post('/api/v1/auth/verify')
      .send({ email: 'bookkeeper@example.com', otp: '123456' })
      .expect(200);
    const resetToken = verified.body.data.resetToken;
    expect(resetToken).toHaveLength(64);
    await api()
      .post('/api/v1/auth/verify')
      .send({ email: 'bookkeeper@example.com', otp: '123456' })
      .expect(400);
    const payload = {
      email: 'bookkeeper@example.com',
      newPassword: 'ResetPassword123!',
      resetToken,
    };
    await api().post('/api/v1/auth/reset-password').send(payload).expect(200);
    await api().post('/api/v1/auth/reset-password').send(payload).expect(400);
    await api()
      .get('/api/v1/user/profile')
      .set('Authorization', auth(bookkeeperToken))
      .expect(401);
    await api()
      .post('/api/v1/auth/login')
      .send({ email: 'bookkeeper@example.com', password: 'ResetPassword123!' })
      .expect(200);
  });

  it('invalidates existing access tokens after changing password', async () => {
    await api()
      .post('/api/v1/auth/change-password')
      .set('Authorization', auth(businessToken))
      .send({ oldPassword: 'Integration123!', newPassword: 'Changed123!' })
      .expect(200);
    await api()
      .get('/api/v1/user/profile')
      .set('Authorization', auth(businessToken))
      .expect(401);
    await api()
      .post('/api/v1/auth/login')
      .send({ email: 'business@example.com', password: 'Changed123!' })
      .expect(200);
  });
});
