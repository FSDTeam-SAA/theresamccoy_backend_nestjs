import { ApplicationFormService } from './application-form.service';
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
  FormStatus,
  QuestionType,
} from './entities/application-form.entity';

import {
  ApplicationSubmission,
  ApplicationSubmissionDocument,
  SubmissionStatus,
} from './entities/application-submission.entity';

import { CreateSubmissionDto } from './dto/user/create-submission.dto';
import { ReviewApplicationDto } from './dto/admin/review-application.dto';

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
    private readonly forms: ApplicationFormService,
    @InjectModel(ApplicationSubmission.name)
    private readonly submissionModel: Model<ApplicationSubmissionDocument>,

    @InjectModel(ApplicationForm.name)
    private readonly formModel: Model<ApplicationFormDocument>,
  ) {}

  /**
   * Create / save application
   */
  async createOrUpdate(userId: string, dto: CreateSubmissionDto) {
    await this.forms.getPublishedForm(dto.formId, userId);
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
        section.questions.map((question: any) => question._id.toString()),
      ),
    );

    if (
      new Set(dto.answers.map((answer) => answer.questionId)).size !==
      dto.answers.length
    )
      throw new BadRequestException('Each question must be answered once');
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
      existing.formVersion = form.version;
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
      .sort({ createdAt: -1, _id: -1 })
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
    const form = await this.forms.getPublishedForm(
      String(submission.formId),
      userId,
    );
    if (form.version !== submission.formVersion)
      throw new BadRequestException(
        'Form changed; reload and save the current form before submitting',
      );
    const present = (value: unknown): boolean =>
      value !== null &&
      value !== undefined &&
      (typeof value !== 'string' || value.trim().length > 0) &&
      (!Array.isArray(value) || value.length > 0);
    for (const section of form.sections)
      for (const question of section.questions) {
        const answer = submission.answers.find(
          (item) =>
            String(item.questionId) ===
            String((question as unknown as { _id: unknown })._id),
        );
        const hasAnswer =
          question.type === QuestionType.SUB_QUESTION
            ? !!answer?.subAnswers?.length
            : question.type === QuestionType.TABLE
              ? !!answer?.tableAnswers?.some((row) =>
                  row.cells.some((cell) => present(cell.value)),
                )
              : present(answer?.value);
        if (question.required && !hasAnswer)
          throw new BadRequestException(
            'Required answer missing: ' + question.title,
          );
        if (answer?.subAnswers?.length)
          for (const sub of question.subQuestions) {
            if (
              sub.required &&
              !present(
                answer.subAnswers.find(
                  (item) =>
                    String(item.subQuestionId) ===
                    String((sub as unknown as { _id: unknown })._id),
                )?.value,
              )
            )
              throw new BadRequestException(
                'Required sub-answer missing: ' + sub.question,
              );
          }
      }
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

  async review(id: string, dto: ReviewApplicationDto) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid submission ID');
    const submission = await this.submissionModel.findById(id);
    if (!submission) throw new NotFoundException('Application not found');
    if (submission.status === SubmissionStatus.DRAFT)
      throw new BadRequestException('Draft applications cannot be reviewed');
    submission.status = dto.status;
    if (dto.score !== undefined) submission.score = dto.score;
    if (dto.adminNote !== undefined) submission.adminNote = dto.adminNote;
    return submission.save();
  }
}
