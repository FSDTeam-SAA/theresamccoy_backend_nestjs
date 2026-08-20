import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import {
  ApplicationForm,
  ApplicationFormDocument,
  FormStatus,
} from './entities/application-form.entity';

import {
  ApplicationSubmission,
  ApplicationSubmissionDocument,
  SubmissionStatus,
} from './entities/application-submission.entity';

import { CreateSubmissionDto } from './dto/user/create-submission.dto';

@Injectable()
export class ApplicationSubmissionService {
  constructor(
    @InjectModel(ApplicationSubmission.name)
    private readonly submissionModel: Model<ApplicationSubmissionDocument>,

    @InjectModel(ApplicationForm.name)
    private readonly formModel: Model<ApplicationFormDocument>,
  ) {}

  /**
   * Create / save application
   */
  async createOrUpdate(userId: string, dto: CreateSubmissionDto) {
    const form = await this.formModel.findOne({
      _id: dto.formId,
      status: FormStatus.PUBLISHED,
      isActive: true,
    });

    if (!form) {
      throw new NotFoundException('Application form not found');
    }

    /**
     * Question IDs validate
     */
    const validQuestionIds = new Set(
      form.sections.flatMap((section) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        section.questions.map((question: any) => question._id.toString()),
      ),
    );

    for (const answer of dto.answers) {
      if (!validQuestionIds.has(answer.questionId)) {
        throw new BadRequestException(
          `Invalid question ID: ${answer.questionId}`,
        );
      }
    }

    /**
     * User already draft করেছে কি না
     */
    const existing = await this.submissionModel.findOne({
      userId,
      formId: dto.formId,
      status: SubmissionStatus.DRAFT,
    });

    if (existing) {
      existing.answers = dto.answers as any;

      return existing.save();
    }

    return this.submissionModel.create({
      userId: new Types.ObjectId(userId),

      formId: new Types.ObjectId(dto.formId),

      formVersion: form.version,

      answers: dto.answers,

      status: SubmissionStatus.DRAFT,
    });
  }

  /**
   * User's application
   */
  async findMySubmission(userId: string, formId: string) {
    const submission = await this.submissionModel
      .findOne({
        userId,
        formId,
      })
      .lean();

    return submission;
  }

  /**
   * Submit final application
   */
  async submit(userId: string, submissionId: string) {
    const submission = await this.submissionModel.findOne({
      _id: submissionId,
      userId,
    });

    if (!submission) {
      throw new NotFoundException('Application submission not found');
    }

    if (submission.status !== SubmissionStatus.DRAFT) {
      throw new BadRequestException('Application already submitted');
    }

    /**
     * এখানে তোমার calculation function call হবে
     */
    const calculationResult = await this.calculateSubmission(submission);

    submission.calculationResult = calculationResult;

    submission.status = SubmissionStatus.SUBMITTED;

    submission.submittedAt = new Date();

    return submission.save();
  }

  /**
   * Example calculation
   *
   * এখানে পরে তোমার real business calculation বসাবে।
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async calculateSubmission(submission: ApplicationSubmissionDocument) {
    return {
      completedQuestions: submission.answers.length,

      calculatedAt: new Date(),
    };
  }

  /**
   * ADMIN
   * Get all submitted applications
   */
  async findAll() {
    return this.submissionModel
      .find()
      .populate('userId')
      .populate('formId')
      .sort({
        createdAt: -1,
      });
  }

  /**
   * ADMIN
   */
  async findOne(id: string) {
    const application = await this.submissionModel
      .findById(id)
      .populate('userId')
      .populate('formId');

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }
}
