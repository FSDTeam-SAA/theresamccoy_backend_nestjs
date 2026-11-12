import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  ApplicationSubmission,
  ApplicationSubmissionDocument,
  SubmissionStatus,
} from './entities/application-submission.entity';
import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import {
  ApplicationForm,
  ApplicationFormDocument,
  FormStatus,
} from './entities/application-form.entity';

import { CreateApplicationFormDto } from './dto/admin/create-application-form.dto';

import { UpdateApplicationFormDto } from './dto/admin/update-application-form.dto';

@Injectable()
export class ApplicationFormService {
  constructor(
    @InjectModel(ApplicationSubmission.name)
    private readonly submissions: Model<ApplicationSubmissionDocument>,
    @InjectModel(ApplicationForm.name)
    private readonly applicationFormModel: Model<ApplicationFormDocument>,
  ) {}

  /**
   * ADMIN
   * Create complete form
   */
  private async validatePrerequisite(
    prerequisiteId?: string,
    targetId?: string,
  ) {
    let current = prerequisiteId;
    const seen = new Set<string>(targetId ? [targetId] : []);
    for (let depth = 0; current; depth++) {
      if (depth > 100 || seen.has(current))
        throw new BadRequestException(
          'Assessment prerequisites cannot contain a cycle',
        );
      seen.add(current);
      const form = await this.applicationFormModel
        .findById(current)
        .select('prerequisiteFormId');
      if (!form) throw new BadRequestException('Prerequisite form not found');
      current = form.prerequisiteFormId
        ? String(form.prerequisiteFormId)
        : undefined;
    }
  }
  async create(dto: CreateApplicationFormDto) {
    await this.validatePrerequisite(dto.prerequisiteFormId);
    return this.applicationFormModel.create(dto);
  }

  /**
   * ADMIN
   * All forms
   */
  async findAll() {
    return this.applicationFormModel
      .find()
      .sort({
        createdAt: -1,
      })
      .lean();
  }

  /**
   * ADMIN / USER
   */
  async findOne(id: string) {
    const form = await this.applicationFormModel.findById(id).lean();

    if (!form) {
      throw new NotFoundException('Application form not found');
    }

    return form;
  }

  /**
   * USER
   * Only published active form
   */
  async publishedForms(userId: string) {
    const [forms, submissions] = await Promise.all([
      this.applicationFormModel
        .find({ status: FormStatus.PUBLISHED, isActive: true })
        .select('title description version durationMinutes prerequisiteFormId')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      this.submissions
        .find({ userId })
        .select('formId status score')
        .sort({ createdAt: -1, _id: -1 })
        .lean(),
    ]);
    return forms.map((form) => {
      const submission = submissions.find(
        (item) => String(item.formId) === String(form._id),
      );
      const locked =
        !!form.prerequisiteFormId &&
        !submissions.some(
          (item) =>
            String(item.formId) === String(form.prerequisiteFormId) &&
            item.status === SubmissionStatus.APPROVED,
        );
      return {
        ...form,
        locked,
        assessmentStatus: locked
          ? 'locked'
          : (submission?.status ?? 'available'),
        submissionId: submission?._id ?? null,
        score: submission?.score ?? null,
      };
    });
  }

  async getPublishedForm(id: string, userId: string) {
    const form = await this.applicationFormModel
      .findOne({
        _id: id,
        status: FormStatus.PUBLISHED,
        isActive: true,
      })
      .lean();

    if (!form) {
      throw new NotFoundException('Application form not found');
    }

    if (
      form.prerequisiteFormId &&
      !(await this.submissions.exists({
        userId,
        formId: form.prerequisiteFormId,
        status: SubmissionStatus.APPROVED,
      }))
    )
      throw new ForbiddenException(
        'Complete and obtain approval for the prerequisite assessment first',
      );
    return form;
  }

  /**
   * ADMIN
   * Update complete form
   */
  async update(id: string, dto: UpdateApplicationFormDto) {
    await this.validatePrerequisite(dto.prerequisiteFormId, id);
    const form = await this.applicationFormModel.findByIdAndUpdate(
      id,
      {
        $set: dto,
        $inc: {
          version: 1,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!form) {
      throw new NotFoundException('Application form not found');
    }

    return form;
  }

  /**
   * ADMIN
   */
  async publish(id: string) {
    const form = await this.applicationFormModel.findByIdAndUpdate(
      id,
      {
        status: FormStatus.PUBLISHED,
        isActive: true,
      },
      {
        new: true,
      },
    );

    if (!form) {
      throw new NotFoundException('Application form not found');
    }

    return form;
  }

  /**
   * ADMIN
   */
  async remove(id: string) {
    const form = await this.applicationFormModel.findByIdAndDelete(id);

    if (!form) {
      throw new NotFoundException('Application form not found');
    }

    return form;
  }
}
