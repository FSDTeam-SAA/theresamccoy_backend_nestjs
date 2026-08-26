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
  CourseProgress,
  CourseProgressDocument,
  AssignmentSubmission,
  AssignmentSubmissionDocument,
  LessonDocument,
  ModuleDocument,
  QuizDocument,
} from './entities/course.entity';
import {
  UpdateCourseDto,
  UpdateLessonDto,
  UpdateModuleDto,
} from './dto/update-course.dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(CourseProgress.name)
    private readonly progressModel: Model<CourseProgressDocument>,
    @InjectModel(AssignmentSubmission.name)
    private readonly submissionModel: Model<AssignmentSubmissionDocument>,
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

  async getMyAllCourses(userId: string) {
    const [courses, progressList] = await Promise.all([
      this.courseModel.find({ status: 'published' }).sort({ createdAt: -1 }),
      this.progressModel.find({ userId }),
    ]);

    const progressMap = new Map(
      progressList.map((progress) => [progress.courseId.toString(), progress]),
    );

    return courses.map((course) => {
      const progress = progressMap.get(course._id.toString()) ?? null;
      const progressData = this.withProgressPercentage(course, progress);

      return {
        ...course.toObject(),
        progress: progressData.progress,
        totalLessons: progressData.totalLessons,
        completedLessons: progressData.completedLessons,
        progressPercentage: progressData.percentage,
      };
    });
  }

  async updateCourse(
    courseId: string,
    dto: UpdateCourseDto,
    photoFile?: Express.Multer.File,
  ) {
    const updateData = { ...dto };
    if (photoFile) {
      const photo = await fileUpload.uploadToCloudinary(photoFile);
      updateData.photo = photo.url;
    }
    const course = await this.courseModel.findByIdAndUpdate(
      courseId,
      { $set: updateData },
      { new: true, runValidators: true },
    );
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }
    return course;
  }

  async deleteCourse(courseId: string) {
    const course = await this.courseModel.findByIdAndDelete(courseId);
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }
    await Promise.all([
      this.progressModel.deleteMany({ courseId }),
      this.submissionModel.deleteMany({ courseId }),
    ]);
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

  async updateModule(courseId: string, moduleId: string, dto: UpdateModuleDto) {
    const course = await this.getCourseDocument(courseId);
    const module = this.findModule(course, moduleId);
    Object.assign(module, dto);
    await course.save();
    return module;
  }

  async deleteModule(courseId: string, moduleId: string) {
    const course = await this.getCourseDocument(courseId);
    const modules =
      course.modules as unknown as Types.DocumentArray<ModuleDocument>;
    const module = this.findModule(course, moduleId);
    modules.pull(module._id);
    await course.save();
    return module;
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

  async updateLesson(
    courseId: string,
    lessonId: string,
    dto: UpdateLessonDto,
    videoFile?: Express.Multer.File,
    resourceFile?: Express.Multer.File,
    thumbnailFile?: Express.Multer.File,
  ) {
    const course = await this.getCourseDocument(courseId);
    const lesson = this.findLesson(course, lessonId);
    const updateData = { ...dto };
    if (videoFile) {
      updateData.video = (await fileUpload.uploadToCloudinary(videoFile)).url;
    }
    if (resourceFile) {
      updateData.resource = (
        await fileUpload.uploadToCloudinary(resourceFile)
      ).url;
    }
    if (thumbnailFile) {
      updateData.thumbnail = (
        await fileUpload.uploadToCloudinary(thumbnailFile)
      ).url;
    }
    Object.assign(lesson, updateData);
    await course.save();
    return lesson;
  }

  async deleteLesson(courseId: string, moduleId: string, lessonId: string) {
    const course = await this.getCourseDocument(courseId);
    const module = this.findModule(course, moduleId);
    const lessons =
      module.lessons as unknown as Types.DocumentArray<LessonDocument>;
    const lesson = lessons.find((item) => item._id.toString() === lessonId);
    if (!lesson) {
      throw new HttpException('Lesson not found', HttpStatus.NOT_FOUND);
    }
    lessons.pull(lesson._id);
    await course.save();
    return lesson;
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

  async markLessonComplete(userId: string, courseId: string, lessonId: string) {
    const course = await this.getCourseDocument(courseId);
    this.findLesson(course, lessonId);
    const progress = await this.progressModel.findOneAndUpdate(
      { userId, courseId },
      {
        $addToSet: { completedLessonIds: lessonId },
        $set: { currentLessonId: lessonId },
      },
      { new: true, upsert: true, runValidators: true },
    );
    return this.withProgressPercentage(course, progress);
  }

  async getMyProgress(userId: string, courseId: string) {
    const course = await this.getCourseDocument(courseId);
    const progress = await this.progressModel.findOne({ userId, courseId });
    return this.withProgressPercentage(course, progress);
  }

  async submitAssignment(
    userId: string,
    courseId: string,
    lessonId: string,
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new HttpException(
        'Assignment file is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const course = await this.getCourseDocument(courseId);
    const lesson = this.findLesson(course, lessonId);
    if (!lesson.assignmentTitle) {
      throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
    }
    const uploaded = await fileUpload.uploadToCloudinary(file);
    return this.submissionModel.findOneAndUpdate(
      { userId, courseId, lessonId },
      { $set: { file: uploaded.url, status: 'submitted' } },
      { new: true, upsert: true, runValidators: true },
    );
  }

  async getMySubmissions(userId: string, courseId: string) {
    await this.getCourseDocument(courseId);
    return this.submissionModel.find({ userId, courseId });
  }

  private async getCourseDocument(courseId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }
    return course;
  }

  private findModule(course: CourseDocument, moduleId: string) {
    const modules =
      course.modules as unknown as Types.DocumentArray<ModuleDocument>;
    const module = modules.find((item) => item._id.toString() === moduleId);
    if (!module) {
      throw new HttpException('Module not found', HttpStatus.NOT_FOUND);
    }
    return module;
  }

  private findLesson(course: CourseDocument, lessonId: string) {
    const modules =
      course.modules as unknown as Types.DocumentArray<ModuleDocument>;
    for (const module of modules) {
      const lessons =
        module.lessons as unknown as Types.DocumentArray<LessonDocument>;
      const lesson = lessons.find((item) => item._id.toString() === lessonId);
      if (lesson) return lesson;
    }
    throw new HttpException('Lesson not found', HttpStatus.NOT_FOUND);
  }

  private withProgressPercentage(
    course: CourseDocument,
    progress: CourseProgressDocument | null,
  ) {
    const totalLessons = course.modules.reduce(
      (total, module) => total + module.lessons.length,
      0,
    );
    const completedLessons = progress?.completedLessonIds.length ?? 0;
    return {
      progress,
      totalLessons,
      completedLessons,
      percentage:
        totalLessons === 0
          ? 0
          : Math.round((completedLessons / totalLessons) * 100),
    };
  }
}
