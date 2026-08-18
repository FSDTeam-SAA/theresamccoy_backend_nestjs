import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import buildWhereConditions from 'src/app/helpers/buildWhereConditions';
import { fileUpload } from 'src/app/helpers/fileUploder';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';
import {
  AddLessonDto,
  AddModuleDto,
  AddQuizDto,
  AddQuizOptionDto,
  CreateCourseDto,
} from './dto/create-course.dto';
import {
  Course,
  CourseDocument,
  LessonDocument,
  ModuleDocument,
  QuizDocument,
} from './entities/course.entity';

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
  ) {}

  async createCourse(
    createCourseDto: CreateCourseDto,
    file?: Express.Multer.File,
  ) {
    const course = await this.courseModel.findOne({
      name: createCourseDto.name,
    });
    if (course) {
      throw new HttpException('Course already exists', HttpStatus.BAD_REQUEST);
    }

    if (file) {
      const uploadedFile = await fileUpload.uploadToCloudinary(file);
      createCourseDto.photo = uploadedFile.url;
    }

    const result = await this.courseModel.create(createCourseDto);
    return result;
  }

  async getAllCourse(params: IFilterParams, options: IOptions) {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions = buildWhereConditions(params, ['name']);
    const result = await this.courseModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec();
    const total = await this.courseModel.countDocuments(whereConditions);
    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  }

  async getSingleCourse(courseId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }
    return course;
  }

  async addModule(courseId: string, addModuleDto: AddModuleDto) {
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }

    const newModule = {
      _id: new Types.ObjectId(),
      ...addModuleDto,
      lessons: [],
    };

    const modules =
      course.modules as unknown as Types.DocumentArray<ModuleDocument>;
    modules.push(newModule);
    await course.save();
    return newModule;
  }

  async addLesson(
    courseId: string,
    moduleId: string,
    addLessonDto: AddLessonDto,
    videoFile?: Express.Multer.File,
    resourceFile?: Express.Multer.File,
    thumbnailFile?: Express.Multer.File,
  ) {
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }

    const modules =
      course.modules as unknown as Types.DocumentArray<ModuleDocument>;
    const mod = modules.find((m) => m._id.toString() === moduleId);
    if (!mod) {
      throw new HttpException('Module not found', HttpStatus.NOT_FOUND);
    }

    if (videoFile) {
      const videoUrl = await fileUpload.uploadToCloudinary(videoFile);
      addLessonDto.video = videoUrl.url;
    }
    if (resourceFile) {
      const resourceUrl = await fileUpload.uploadToCloudinary(resourceFile);
      addLessonDto.resource = resourceUrl.url;
    }
    if (thumbnailFile) {
      const thumbnailUrl = await fileUpload.uploadToCloudinary(thumbnailFile);
      addLessonDto.thumbnail = thumbnailUrl.url;
    }

    const newLesson = {
      _id: new Types.ObjectId(),
      ...addLessonDto,
      quizzes: [],
    };

    const lessons =
      mod.lessons as unknown as Types.DocumentArray<LessonDocument>;
    lessons.push(newLesson);
    await course.save();
    return newLesson;
  }

  async addQuiz(courseId: string, lessonId: string, addQuizDto: AddQuizDto) {
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }

    let targetLesson: LessonDocument | undefined;
    const modules =
      course.modules as unknown as Types.DocumentArray<ModuleDocument>;
    for (const mod of modules) {
      const lessons =
        mod.lessons as unknown as Types.DocumentArray<LessonDocument>;
      const lesson = lessons.find((l) => l._id.toString() === lessonId);
      if (lesson) {
        targetLesson = lesson;
        break;
      }
    }

    if (!targetLesson) {
      throw new HttpException('Lesson not found', HttpStatus.NOT_FOUND);
    }
    const newQuiz = {
      _id: new Types.ObjectId(),
      question: addQuizDto.question,
      options: addQuizDto.options,
      answer: addQuizDto.answer,
    };

    const quizzes =
      targetLesson.quizzes as unknown as Types.DocumentArray<QuizDocument>;
    quizzes.push(newQuiz);
    await course.save();
    return newQuiz;
  }

  async addQuizOption(
    courseId: string,
    quizId: string,
    addQuizOptionDto: AddQuizOptionDto,
  ) {
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }

    let targetQuiz: QuizDocument | undefined;
    const modules =
      course.modules as unknown as Types.DocumentArray<ModuleDocument>;
    for (const mod of modules) {
      const lessons =
        mod.lessons as unknown as Types.DocumentArray<LessonDocument>;
      for (const lesson of lessons) {
        const quizzes =
          lesson.quizzes as unknown as Types.DocumentArray<QuizDocument>;
        const quiz = quizzes.find((q) => q._id.toString() === quizId);
        if (quiz) {
          targetQuiz = quiz;
          break;
        }
      }
      if (targetQuiz) break;
    }

    if (!targetQuiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }

    targetQuiz.options.push(addQuizOptionDto.option);
    if (addQuizOptionDto.answer) {
      targetQuiz.answer = addQuizOptionDto.answer;
    }
    await course.save();
    return targetQuiz;
  }
}
