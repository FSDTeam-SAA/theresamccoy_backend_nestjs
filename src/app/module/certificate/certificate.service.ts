import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import buildWhereConditions from 'src/app/helpers/buildWhereConditions';
import { fileUpload } from 'src/app/helpers/fileUploder';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';
import {
  Bookkeeper,
  BookkeeperDocument,
} from '../bookkeeper/entities/bookkeeper.entity';
import { Course, CourseDocument } from '../course/entities/course.entity';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import {
  Certificate,
  CertificateDocument,
} from './entities/certificate.entity';

@Injectable()
export class CertificateService {
  constructor(
    @InjectModel(Certificate.name)
    private readonly certificateModel: Model<CertificateDocument>,
    @InjectModel(Bookkeeper.name)
    private readonly bookkeeperModel: Model<BookkeeperDocument>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
  ) {}

  async createCertificate(
    createCertificateDto: CreateCertificateDto,
    file?: Express.Multer.File,
  ) {
    const { bookkeeperId, courseId } = createCertificateDto;
    const [bookkeeper, course, existingCertificate] = await Promise.all([
      this.bookkeeperModel.findById(bookkeeperId),
      this.courseModel.findById(courseId),
      this.certificateModel.findOne({
        certificateID: createCertificateDto.certificateID,
      }),
    ]);
    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }
    if (existingCertificate) {
      throw new HttpException(
        'Certificate ID already exists',
        HttpStatus.CONFLICT,
      );
    }
    const certificateData = { ...createCertificateDto };
    if (file) {
      const certificateUrl = await fileUpload.uploadToCloudinary(file);
      certificateData.certificateUrl = certificateUrl.url;
    }
    const certificate = await this.certificateModel.create({
      ...certificateData,
      bookkeeperId: bookkeeper._id,
      courseId: course._id,
    });
    return certificate;
  }

  async getAllCertificates(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whenCondition = buildWhereConditions(params, ['title']);
    const result = await this.certificateModel
      .find(whenCondition)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate('bookkeeperId')
      .populate('courseId');

    const total = await this.certificateModel.countDocuments(whenCondition);
    return { data: result, meta: { total, page, limit } };
  }

  async getCertificateById(id: string) {
    const certificateId = await this.certificateModel.findById(id);
    if (!certificateId) {
      throw new HttpException('Certificate not found', HttpStatus.NOT_FOUND);
    }
    const certificate = await this.certificateModel
      .findById(id)
      .populate('bookkeeperId')
      .populate('courseId');
    if (!certificate) {
      throw new HttpException('Certificate not found', HttpStatus.NOT_FOUND);
    }
    return certificate;
  }

  async updateCertificate(
    id: string,
    updateCertificateDto: UpdateCertificateDto,
    file?: Express.Multer.File,
  ) {
    const certificate = await this.certificateModel.findById(id);
    if (!certificate) {
      throw new HttpException('Certificate not found', HttpStatus.NOT_FOUND);
    }
    if (file) {
      const certificateurl = await fileUpload.uploadToCloudinary(file);
      updateCertificateDto.certificateUrl = certificateurl.url;
    }
    const result = await this.certificateModel.findByIdAndUpdate(
      id,
      updateCertificateDto,
      { new: true },
    );
    return result;
  }

  async deleteCertificate(id: string) {
    const certificate = await this.certificateModel.findById(id);
    if (!certificate) {
      throw new HttpException('Certificate not found', HttpStatus.NOT_FOUND);
    }
    const result = await this.certificateModel.findByIdAndDelete(id);
    return result;
  }
}
