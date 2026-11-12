import { CourseService } from './course.service';
import { Model, Types } from 'mongoose';
describe('quiz scoring and training progression', () => {
  const quizId = new Types.ObjectId();
  const course = {
    status: 'published',
    modules: [
      {
        lessons: [
          {
            _id: new Types.ObjectId(),
            quizzes: [{ _id: quizId, answer: 'correct' }],
          },
        ],
      },
    ],
  };
  const lessonId = String(course.modules[0].lessons[0]._id);
  const create = jest.fn(async (value) => value);
  const exists = jest.fn(async () => null);
  const service = new CourseService(
    { create, exists } as unknown as Model<any>,
    { findById: jest.fn(async () => course) } as unknown as Model<any>,
    {} as Model<any>,
    { findOne: jest.fn(async () => ({})) } as unknown as Model<any>,
    {} as Model<any>,
    {} as Model<any>,
  );
  beforeEach(() => jest.clearAllMocks());
  it('scores answers on the server and returns no answer key', async () => {
    const result = await service.submitQuiz('user', 'course', lessonId, {
      answers: [{ quizId: String(quizId), answer: 'correct' }],
    });
    expect(result).toMatchObject({
      score: 100,
      passed: true,
      correctAnswers: 1,
    });
    expect(result).not.toHaveProperty('answers');
  });
  it('records failed attempts', async () => {
    await expect(
      service.submitQuiz('user', 'course', lessonId, {
        answers: [{ quizId: String(quizId), answer: 'wrong' }],
      }),
    ).resolves.toMatchObject({ score: 0, passed: false });
  });
  it('rejects missing and duplicate answers', async () => {
    await expect(
      service.submitQuiz('user', 'course', lessonId, { answers: [] }),
    ).rejects.toThrow('Answer every quiz');
    const answer = { quizId: String(quizId), answer: 'correct' };
    await expect(
      service.submitQuiz('user', 'course', lessonId, {
        answers: [answer, answer],
      }),
    ).rejects.toThrow('Answer every quiz');
    expect(create).not.toHaveBeenCalled();
  });
  it('blocks lesson completion before a passing attempt', async () => {
    await expect(
      service.markLessonComplete('user', 'course', lessonId),
    ).rejects.toThrow('Pass the lesson quiz');
  });
});
