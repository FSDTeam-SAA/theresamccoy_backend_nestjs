import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import buildWhereConditions from 'src/app/helpers/buildWhereConditions';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';

import { User, UserDocument } from '../user/entities/user.entity';

import {
  CreateBookkeeperAssessmentDto,
  CreateBookkeeperAvailabilityDto,
  CreateBookkeeperDto,
  CreateBookkeeperSkillsDto,
  CreateExperienceDto,
} from './dto/create-bookkeeper.dto';

import { UpdateMyBookkeeperProfileDto } from './dto/bookkeeper-profile.dto';
import { UpdateBookkeeperDto } from './dto/update-bookkeeper.dto';

import { fileUpload } from 'src/app/helpers/fileUploder';
import {
  Bookkeeper,
  BookkeeperDocument,
  BookkeeperStatus,
} from './entities/bookkeeper.entity';

@Injectable()
export class BookkeeperService {
  constructor(
    @InjectModel(Bookkeeper.name)
    private readonly bookkeeperModel: Model<BookkeeperDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async assertOwner(id: string, actor: { id: string; role: string }) {
    const profile = await this.bookkeeperModel.findById(id);
    if (!profile) throw new HttpException('Bookkeeper not found', 404);
    if (actor.role !== 'admin' && String(profile.userId) !== actor.id)
      throw new HttpException('Forbidden', 403);
  }

  // Step 1 - Personal Information

  async createBookkeeper(
    userId: string,
    createBookkeeperDto: CreateBookkeeperDto,
  ) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const existingBookkeeper = await this.bookkeeperModel.findOne({
      userId: user._id,
    });

    if (existingBookkeeper) {
      throw new HttpException(
        'Bookkeeper profile already exists',
        HttpStatus.CONFLICT,
      );
    }

    return this.bookkeeperModel.create({
      ...createBookkeeperDto,
      userId: user._id,
    });
  }

  // Step 2 - Experience

  async createExperience(
    bookkeeperId: string,
    createExperienceDto: CreateExperienceDto,
  ) {
    const bookkeeper = await this.bookkeeperModel.findByIdAndUpdate(
      bookkeeperId,
      {
        $set: createExperienceDto,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }

    return bookkeeper;
  }

  // Step 3 - Skills

  async createSkills(
    bookkeeperId: string,
    createSkillsDto: CreateBookkeeperSkillsDto,
  ) {
    const bookkeeper = await this.bookkeeperModel.findByIdAndUpdate(
      bookkeeperId,
      {
        $set: createSkillsDto,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }

    return bookkeeper;
  }

  // Step 4 - Assessment

  async createAssessment(
    bookkeeperId: string,
    createAssessmentDto: CreateBookkeeperAssessmentDto,
    files?: {
      uploadResume?: Express.Multer.File[];
      uploadAssessment?: Express.Multer.File[];
    },
  ) {
    const assessmentData = { ...createAssessmentDto };
    const resumeFile = files?.uploadResume?.[0];
    const assessmentFile = files?.uploadAssessment?.[0];

    if (resumeFile) {
      const resume = await fileUpload.uploadToS3(resumeFile);
      assessmentData.uploadResume = resume.url;
    }
    if (assessmentFile) {
      const assessment = await fileUpload.uploadToS3(assessmentFile);
      assessmentData.uploadAssessment = assessment.url;
    }
    const bookkeeper = await this.bookkeeperModel.findByIdAndUpdate(
      bookkeeperId,
      {
        $set: assessmentData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }

    return bookkeeper;
  }

  // Step 5 - Availability

  async createAvailability(
    bookkeeperId: string,
    createAvailabilityDto: CreateBookkeeperAvailabilityDto,
  ) {
    const bookkeeper = await this.bookkeeperModel.findByIdAndUpdate(
      bookkeeperId,
      {
        $set: createAvailabilityDto,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }

    return bookkeeper;
  }

  // Get All

  async getAllBookkeepers(
    params: IFilterParams,
    options: IOptions,
    admin = false,
  ) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const whereCondition = buildWhereConditions(params, [
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'city',
      'state',
    ]);

    if (!admin)
      Object.assign(whereCondition, { status: BookkeeperStatus.APPROVED });
    const bookkeepers = await this.bookkeeperModel
      .find(whereCondition)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const total = await this.bookkeeperModel.countDocuments(whereCondition);

    return {
      data: bookkeepers,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  // Get Single - সব data একসাথে

  async getSingleBookkeeper(id: string) {
    const bookkeeper = await this.bookkeeperModel.findOne({
      _id: id,
      status: BookkeeperStatus.APPROVED,
    });

    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }

    return bookkeeper;
  }

  async reviewBookkeeper(
    id: string,
    adminId: string,
    status: BookkeeperStatus,
    rejectionReason?: string,
  ) {
    if (status === BookkeeperStatus.REJECTED && !rejectionReason?.trim()) {
      throw new HttpException(
        'Rejection reason is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const result = await this.bookkeeperModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason:
            status === BookkeeperStatus.REJECTED
              ? rejectionReason?.trim()
              : null,
        },
      },
      { new: true, runValidators: true },
    );
    if (!result)
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    return result;
  }

  async getMyProfile(userId: string) {
    const bookkeeper = await this.bookkeeperModel
      .findOne({ userId })
      .populate(
        'userId',
        'firstName lastName email phoneNumber profilePicture',
      );

    if (!bookkeeper) {
      throw new HttpException(
        'Bookkeeper profile not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return bookkeeper;
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateMyBookkeeperProfileDto,
    files?: {
      uploadResume?: Express.Multer.File[];
      coverLetter?: Express.Multer.File[];
      certificationFiles?: Express.Multer.File[];
      profilePicture?: Express.Multer.File[];
      portfolioFiles?: Express.Multer.File[];
    },
  ) {
    const bookkeeper = await this.bookkeeperModel.findOne({ userId });
    if (!bookkeeper) {
      throw new HttpException(
        'Bookkeeper profile not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const updateData: Record<string, unknown> = { ...dto };
    delete updateData.profilePicture;
    delete updateData.portfolioFiles;
    delete updateData.uploadResume;
    delete updateData.coverLetter;
    delete updateData.certificationFiles;
    // Validate all file groups before any remote uploads or database writes.
    const resume = files?.uploadResume?.[0];
    const cover = files?.coverLetter?.[0];
    const certificateFiles = files?.certificationFiles ?? [];
    const pdfFiles = [
      resume,
      cover,
      ...certificateFiles,
      ...(files?.portfolioFiles ?? []),
    ].filter((file): file is Express.Multer.File => !!file);

    if (pdfFiles.some((file) => file.mimetype !== 'application/pdf')) {
      throw new HttpException(
        'Resume, cover letter, certification and portfolio files must be PDF',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (certificateFiles.length > (dto.certifications?.length ?? 0)) {
      throw new HttpException(
        'Each certification file needs a matching certifications JSON item',
        HttpStatus.BAD_REQUEST,
      );
    }
    if ((files?.portfolioFiles?.length ?? 0) > (dto.portfolio?.length ?? 0)) {
      throw new HttpException(
        'Each portfolio file needs a matching portfolio JSON item',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      files?.profilePicture?.[0] &&
      !files.profilePicture[0].mimetype.startsWith('image/')
    ) {
      throw new HttpException(
        'Profile picture must be an image',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (resume) {
      updateData.uploadResume = (await fileUpload.uploadToS3(resume)).url;
    }
    if (cover) {
      updateData.coverLetterUrl = (await fileUpload.uploadToS3(cover)).url;
    }
    if (dto.certifications) {
      updateData.certifications = await Promise.all(
        dto.certifications.map(async (item, index) => ({
          ...item,
          fileUrl: certificateFiles[index]
            ? (await fileUpload.uploadToS3(certificateFiles[index])).url
            : item.fileUrl,
        })),
      );
    }

    const profilePicture = files?.profilePicture?.[0];
    if (profilePicture) {
      if (!profilePicture.mimetype.startsWith('image/')) {
        throw new HttpException(
          'Profile picture must be an image',
          HttpStatus.BAD_REQUEST,
        );
      }
      updateData.profilePicture = (
        await fileUpload.uploadToS3(profilePicture)
      ).url;
    }

    const uploadedFiles = files?.portfolioFiles ?? [];
    if (uploadedFiles.length && !dto.portfolio) {
      throw new HttpException(
        'Portfolio JSON is required when portfolio files are uploaded',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (dto.portfolio) {
      if (uploadedFiles.length > dto.portfolio.length) {
        throw new HttpException(
          'Each portfolio file must have a matching portfolio item',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (uploadedFiles.some((file) => file.mimetype !== 'application/pdf')) {
        throw new HttpException(
          'Portfolio files must be PDF documents',
          HttpStatus.BAD_REQUEST,
        );
      }
      updateData.portfolio = await Promise.all(
        dto.portfolio.map(async (item, index) => ({
          ...item,
          fileUrl: uploadedFiles[index]
            ? (await fileUpload.uploadToS3(uploadedFiles[index])).url
            : item.fileUrl,
        })),
      );
    }

    const updated = await this.bookkeeperModel.findOneAndUpdate(
      { _id: bookkeeper._id, userId },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    const userFields = [
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
    ] as const;
    const userUpdate: Record<string, unknown> = Object.fromEntries(
      userFields
        .filter((field) => dto[field] !== undefined)
        .map((field) => [field, dto[field]]),
    );
    if (updateData.profilePicture) {
      userUpdate.profilePicture = updateData.profilePicture;
    }
    if (Object.keys(userUpdate).length) {
      await this.userModel.findByIdAndUpdate(
        userId,
        { $set: userUpdate },
        {
          runValidators: true,
        },
      );
    }

    return updated?.populate(
      'userId',
      'firstName lastName email phoneNumber profilePicture',
    );
  }

  async submitApplication(userId: string) {
    const profile = await this.bookkeeperModel.findOne({ userId });
    if (!profile) {
      throw new HttpException(
        'Create a bookkeeper profile first',
        HttpStatus.NOT_FOUND,
      );
    }
    const missing: string[] = [];
    if (!profile.uploadResume) missing.push('uploadResume');
    if (!profile.skills?.length) missing.push('skills');
    if (profile.yearsOfExperience == null) missing.push('yearsOfExperience');
    if (!profile.educationalQualification?.trim())
      missing.push('educationalQualification');
    if (missing.length) {
      throw new HttpException(
        'Complete required fields: ' + missing.join(', '),
        HttpStatus.BAD_REQUEST,
      );
    }
    const submitted = await this.bookkeeperModel.findOneAndUpdate(
      {
        _id: profile._id,
        userId,
        $or: [
          { applicationStatus: { $ne: 'submitted' } },
          { status: BookkeeperStatus.REJECTED },
        ],
      },
      {
        $set: {
          applicationStatus: 'submitted',
          applicationSubmittedAt: new Date(),
          status: BookkeeperStatus.PENDING,
        },
        $unset: { rejectionReason: '', reviewedBy: '', reviewedAt: '' },
      },
      { new: true, runValidators: true },
    );
    if (!submitted) {
      throw new HttpException(
        'Application is already submitted',
        HttpStatus.CONFLICT,
      );
    }
    return submitted;
  }

  // Update - সব section এক method দিয়ে

  async updateBookkeeper(
    id: string,
    updateBookkeeperDto: UpdateBookkeeperDto,
    files?: {
      uploadResume?: Express.Multer.File[];
      uploadAssessment?: Express.Multer.File[];
    },
  ) {
    const updateData = { ...updateBookkeeperDto };
    const resumeFile = files?.uploadResume?.[0];
    const assessmentFile = files?.uploadAssessment?.[0];

    if (resumeFile) {
      const resume = await fileUpload.uploadToS3(resumeFile);
      updateData.uploadResume = resume.url;
    }

    if (assessmentFile) {
      const assessment = await fileUpload.uploadToS3(assessmentFile);
      updateData.uploadAssessment = assessment.url;
    }

    const bookkeeper = await this.bookkeeperModel.findByIdAndUpdate(
      id,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }

    return bookkeeper;
  }

  // Delete

  async removeBookkeeper(id: string) {
    const bookkeeper = await this.bookkeeperModel.findByIdAndDelete(id);

    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }

    return bookkeeper;
  }
}
