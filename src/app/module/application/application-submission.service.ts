import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';

import {
  ApplicationForm,
  ApplicationFormDocument,
  // FormStatus,
} from './entities/application-form.entity';

import {
  ApplicationSubmission,
  ApplicationSubmissionDocument,
  SubmissionStatus,
} from './entities/application-submission.entity';

import { CreateSubmissionDto } from './dto/user/create-submission.dto';

export interface SubmissionFilters {
  searchTerm?: string;
  status?: SubmissionStatus;
  formId?: string;
}

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
      // status: FormStatus.PUBLISHED,
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
      existing.candidateName = dto.candidateName;
      existing.date = dto.date;
      existing.positionName = dto.positionName;
      existing.time = dto.time;
      existing.answers = dto.answers as any;

      return existing.save();
    }

    return this.submissionModel.create({
      userId: new Types.ObjectId(userId),

      formId: new Types.ObjectId(dto.formId),

      formVersion: form.version,

      candidateName: dto.candidateName,

      date: dto.date,

      positionName: dto.positionName,

      time: dto.time,

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
  async findAll(filters: SubmissionFilters = {}, options: IOptions = {}) {
    const pagination = paginationHelper(options);
    const page = Math.max(pagination.page, 1);
    const limit = Math.min(Math.max(pagination.limit, 1), 100);
    const skip = (page - 1) * limit;
    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'candidateName',
      'status',
    ];
    const sortBy = allowedSortFields.includes(pagination.sortBy)
      ? pagination.sortBy
      : 'createdAt';
    const where: Record<string, unknown> = {};

    if (filters.searchTerm?.trim()) {
      const search = new RegExp(escapeRegex(filters.searchTerm.trim()), 'i');
      where.$or = [{ candidateName: search }, { positionName: search }];
    }

    if (filters.status) {
      if (!Object.values(SubmissionStatus).includes(filters.status)) {
        throw new BadRequestException('Invalid submission status');
      }
      where.status = filters.status;
    }

    if (filters.formId) {
      if (!Types.ObjectId.isValid(filters.formId)) {
        throw new BadRequestException('Invalid form ID');
      }
      where.formId = new Types.ObjectId(filters.formId);
    }

    const [total, data] = await Promise.all([
      this.submissionModel.countDocuments(where),
      this.submissionModel
        .find(where)
        .populate('userId')
        .populate('formId')
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: pagination.sortOrder }),
    ]);

    return {
      meta: { page, limit, total },
      data,
    };
  }

  /**
   * ADMIN
   */
  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid submission ID');
    }

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
