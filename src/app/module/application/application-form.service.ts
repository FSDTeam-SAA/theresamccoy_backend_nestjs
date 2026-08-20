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
    @InjectModel(ApplicationForm.name)
    private readonly applicationFormModel: Model<ApplicationFormDocument>,
  ) {}

  /**
   * ADMIN
   * Create complete form
   */
  async create(dto: CreateApplicationFormDto) {
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
  async getPublishedForm(id: string) {
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

    return form;
  }

  /**
   * ADMIN
   * Update complete form
   */
  async update(id: string, dto: UpdateApplicationFormDto) {
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
