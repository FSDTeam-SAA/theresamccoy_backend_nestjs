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
    app.setGlobalPrefix('api/v1', { exclude: [''] });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalInterceptors(new UtilsInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter(app.get(HttpAdapterHost)));
    const { createApiDocument } = require('../src/app/swagger/document');
    const { SwaggerModule } = require('@nestjs/swagger');
    SwaggerModule.setup('api/docs', app, createApiDocument(app));
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
  it('saves the Figma application documents as multipart and submits only complete profiles', async () => {
    await api()
      .post('/api/v1/bookkeeper/profile/me/application/submit')
      .set('Authorization', auth(bookkeeperToken))
      .expect(400);
    const { fileUpload } = require('../src/app/helpers/fileUploder');
    const upload = jest
      .spyOn(fileUpload, 'uploadToS3')
      .mockImplementation(async (file: any) => ({
        url: 'https://example.com/' + file.originalname,
        public_id: file.originalname,
      }));
    try {
      const response = await api()
        .patch('/api/v1/bookkeeper/profile/me')
        .set('Authorization', auth(bookkeeperToken))
        .field('skills', JSON.stringify(['Xero', 'Payroll']))
        .field('specializations', JSON.stringify(['Retail']))
        .field(
          'certifications',
          JSON.stringify([{ title: 'Xero Advisor', year: 2024 }]),
        )
        .field(
          'educationalQualification',
          'Bachelor of Business Administration',
        )
        .field('yearsOfExperience', '6')
        .attach('uploadResume', Buffer.from('%PDF-1.4 test'), {
          filename: 'resume.pdf',
          contentType: 'application/pdf',
        })
        .attach('coverLetter', Buffer.from('%PDF-1.4 cover'), {
          filename: 'cover.pdf',
          contentType: 'application/pdf',
        })
        .attach('certificationFiles', Buffer.from('%PDF-1.4 cert'), {
          filename: 'cert.pdf',
          contentType: 'application/pdf',
        })
        .expect(200);
      expect(response.body.data).toMatchObject({
        educationalQualification: 'Bachelor of Business Administration',
        yearsOfExperience: 6,
        uploadResume: 'https://example.com/resume.pdf',
        coverLetterUrl: 'https://example.com/cover.pdf',
      });
      expect(response.body.data.certifications[0].fileUrl).toBe(
        'https://example.com/cert.pdf',
      );
      expect(upload).toHaveBeenCalledTimes(3);
      const submitted = await api()
        .post('/api/v1/bookkeeper/profile/me/application/submit')
        .set('Authorization', auth(bookkeeperToken))
        .expect(201);
      expect(submitted.body.data).toMatchObject({
        applicationStatus: 'submitted',
        status: 'pending',
      });
      await api()
        .post('/api/v1/bookkeeper/profile/me/application/submit')
        .set('Authorization', auth(bookkeeperToken))
        .expect(409);
      upload.mockClear();
      await api()
        .patch('/api/v1/bookkeeper/profile/me')
        .set('Authorization', auth(bookkeeperToken))
        .attach('uploadResume', Buffer.from('not a PDF'), {
          filename: 'bad.png',
          contentType: 'image/png',
        })
        .expect(400);
      expect(upload).not.toHaveBeenCalled();
    } finally {
      upload.mockRestore();
    }
  });

  it('enforces assessment prerequisites on list, open and save; rejects cycles', async () => {
    const createForm = async (payload: any) =>
      (
        await api()
          .post('/api/v1/admin/application-forms')
          .set('Authorization', auth(adminToken))
          .send(payload)
          .expect(201)
      ).body.data;
    const first = await createForm({
      title: 'Core bookkeeping',
      status: 'published',
      durationMinutes: 45,
      sections: [],
    });
    const second = await createForm({
      title: 'Software proficiency',
      status: 'published',
      durationMinutes: 30,
      prerequisiteFormId: first._id,
      sections: [],
    });
    const list = await api()
      .get('/api/v1/applications/forms/published')
      .set('Authorization', auth(bookkeeperToken))
      .expect(200);
    expect(
      list.body.data.find((item: any) => item._id === second._id),
    ).toMatchObject({
      locked: true,
      durationMinutes: 30,
      assessmentStatus: 'locked',
    });
    await api()
      .get('/api/v1/applications/form/' + second._id)
      .set('Authorization', auth(bookkeeperToken))
      .expect(403);
    await api()
      .post('/api/v1/applications/save')
      .set('Authorization', auth(bookkeeperToken))
      .send({
        candidateName: 'Bookkeeper',
        date: '2026-11-12',
        positionName: 'Bookkeeper',
        time: 30,
        formId: second._id,
        answers: [],
      })
      .expect(403);
    await api()
      .patch('/api/v1/admin/application-forms/' + first._id)
      .set('Authorization', auth(adminToken))
      .send({ prerequisiteFormId: second._id })
      .expect(400);
    await model('ApplicationSubmission').create({
      userId: bookkeeperId,
      formId: first._id,
      formVersion: 1,
      status: 'approved',
      score: 82,
    });
    const unlocked = await api()
      .get('/api/v1/applications/forms/published')
      .set('Authorization', auth(bookkeeperToken))
      .expect(200);
    expect(
      unlocked.body.data.find((item: any) => item._id === second._id).locked,
    ).toBe(false);
    await api()
      .get('/api/v1/applications/form/' + second._id)
      .set('Authorization', auth(bookkeeperToken))
      .expect(200);
    const dashboard = await api()
      .get('/api/v1/dashboard/me')
      .set('Authorization', auth(bookkeeperToken))
      .expect(200);
    expect(dashboard.body.data.assessmentScore).toBe(82);
    expect(dashboard.body.data.profileCompletion.percentage).toBeGreaterThan(0);
  });

  it('allows assessment drafts but requires answers before final submission', async () => {
    const form = await model('ApplicationForm').create({
      title: 'Required assessment',
      status: 'published',
      sections: [
        {
          sectionNumber: 1,
          title: 'Basics',
          questions: [
            {
              number: '1',
              title: 'Explain double-entry',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    });
    const payload = {
      candidateName: 'Bookkeeper',
      date: '2026-11-12',
      positionName: 'Bookkeeper',
      time: 45,
      formId: String(form._id),
      answers: [] as any[],
    };
    const draft = await api()
      .post('/api/v1/applications/save')
      .set('Authorization', auth(bookkeeperToken))
      .send(payload)
      .expect(200);
    const submit = '/api/v1/applications/' + draft.body.data._id + '/submit';
    await api()
      .patch(submit)
      .set('Authorization', auth(bookkeeperToken))
      .expect(400);
    payload.answers = [
      {
        questionId: String(form.sections[0].questions[0]._id),
        value: 'Every transaction has balanced debits and credits.',
      },
    ];
    await api()
      .post('/api/v1/applications/save')
      .set('Authorization', auth(bookkeeperToken))
      .send({ ...payload, answers: [payload.answers[0], payload.answers[0]] })
      .expect(400);
    await api()
      .post('/api/v1/applications/save')
      .set('Authorization', auth(bookkeeperToken))
      .send(payload)
      .expect(200);
    await api()
      .patch(submit)
      .set('Authorization', auth(bookkeeperToken))
      .expect(200);
    await api()
      .patch(submit)
      .set('Authorization', auth(bookkeeperToken))
      .expect(400);
  });

  it('serves an importable Swagger contract with multipart fields, responses and valid references', async () => {
    const response = await api().get('/api/docs-json').expect(200);
    const spec = response.body;
    const multipart =
      spec.paths['/api/v1/bookkeeper/profile/me'].patch.requestBody.content[
        'multipart/form-data'
      ].schema;
    expect(multipart.properties.certifications.type).toBe('string');
    expect(multipart.properties.uploadResume.format).toBe('binary');
    expect(multipart.properties.coverLetter.format).toBe('binary');
    expect(multipart.properties.certificationFiles.items.format).toBe('binary');
    expect(
      spec.paths['/api/v1/bookkeeper/profile/me/application/submit'].post
        .security,
    ).toEqual([{ 'access-token': [] }]);
    const inspect = (value: any) => {
      if (!value || typeof value !== 'object') return;
      if (typeof value.$ref === 'string' && value.$ref.startsWith('#/')) {
        const target = value.$ref
          .slice(2)
          .split('/')
          .reduce(
            (current: any, key: string) =>
              current?.[key.replace(/~1/g, '/').replace(/~0/g, '~')],
            spec,
          );
        expect(target).toBeDefined();
      }
      Object.values(value).forEach(inspect);
    };
    inspect(spec);
    for (const [route, pathItem] of Object.entries(spec.paths) as any) {
      for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
        const operation = pathItem[method];
        if (!operation || route === '/api/v1/webhook') continue;
        const success = Object.keys(operation.responses).find((key) =>
          /^2\d\d$/.test(key),
        );
        expect(success).toBeDefined();
        expect(
          operation.responses[success!].content['application/json'].schema
            .properties.data,
        ).toBeDefined();
      }
    }
    if (process.env.EXPORT_OPENAPI === '1')
      require('fs').writeFileSync(
        path.join(process.cwd(), 'docs', 'openapi.json'),
        JSON.stringify(spec, null, 2) + '\n',
      );
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
