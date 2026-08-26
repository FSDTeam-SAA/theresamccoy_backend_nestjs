import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';
import {
  Bookkeeper,
  BookkeeperDocument,
} from '../bookkeeper/entities/bookkeeper.entity';
import { Course, CourseDocument } from '../course/entities/course.entity';
import { CreateCertificateDto } from './dto/create-certificate.dto';
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

  async createCertificat(createCertificateDto: CreateCertificateDto) {
    const { bookkeeperId, courseId } = createCertificateDto;
    const bookkeeper = await this.bookkeeperModel.findById(bookkeeperId);
    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', 404);
    }
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new HttpException('Course not found', 404);
    }
    const certificate = await this.certificateModel.create({
      ...createCertificateDto,
      bookkeeperId: bookkeeper._id,
      courseId: course._id,
    });
    return certificate;
  }

  async getAllCertificates(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
  }
}
