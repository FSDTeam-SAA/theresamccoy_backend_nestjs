import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { fileUpload } from 'src/app/helpers/fileUploder';
import type { IOptions } from 'src/app/helpers/pagenation';
import type { IFilterParams } from 'src/app/helpers/pick';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { MultipartJsonInterceptor } from 'src/app/utils/multipart-json.interceptor';
import { CourseService } from './course.service';
import {
  AddLessonDto,
  AddModuleDto,
  AddQuizDto,
  CreateCourseDto,
} from './dto/create-course.dto';

@ApiTags('Course')
@Controller('course')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new course (with cover photo upload)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'photo', maxCount: 1 }],
      fileUpload.uploadConfig,
    ),
    MultipartJsonInterceptor,
  )
  @HttpCode(HttpStatus.CREATED)
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFiles()
    files: {
      photo?: Express.Multer.File[];
    },
  ) {
    const photoFile = files?.photo?.[0];
    const result = await this.courseService.createCourse(
      createCourseDto,
      photoFile,
    );
    return {
      message: 'Course created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all courses with pagination and search',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'business', 'bookkeeper', 'user'))
  @HttpCode(HttpStatus.OK)
  async getAllCourse(
    @Query() params: IFilterParams,
    @Query() options: IOptions,
  ) {
    const result = await this.courseService.getAllCourse(params, options);
    return {
      message: 'Courses retrieved successfully',
      ...result,
    };
  }

  @Get(':courseId')
  @ApiOperation({
    summary: 'Get single course details',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'business', 'bookkeeper', 'user'))
  @HttpCode(HttpStatus.OK)
  async getSingleCourse(@Param('courseId') courseId: string) {
    const result = await this.courseService.getSingleCourse(courseId);
    return {
      message: 'Course retrieved successfully',
      data: result,
    };
  }

  @Post(':courseId/module')
  @ApiOperation({
    summary: 'Add a new module to a course',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.CREATED)
  async addModule(
    @Param('courseId') courseId: string,
    @Body() dto: AddModuleDto,
  ) {
    const result = await this.courseService.addModule(courseId, dto);
    return {
      message: 'Module added successfully',
      data: result,
    };
  }

  @Post(':courseId/module/:moduleId/lesson')
  @ApiOperation({
    summary:
      'Add a new lesson to a module (with video / resource PDF / thumbnail image upload)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'resource', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      fileUpload.uploadConfig,
    ),
  )
  @HttpCode(HttpStatus.CREATED)
  async addLesson(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() addLessonDto: AddLessonDto,
    @UploadedFiles()
    files: {
      video?: Express.Multer.File[];
      resource?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
  ) {
    const videoFile = files?.video?.[0];
    const resourceFile = files?.resource?.[0];
    const thumbnailFile = files?.thumbnail?.[0];
    const result = await this.courseService.addLesson(
      courseId,
      moduleId,
      addLessonDto,
      videoFile,
      resourceFile,
      thumbnailFile,
    );
    return {
      message: 'Lesson added successfully',
      data: result,
    };
  }

  @Post(':courseId/lesson/:lessonId/quiz')
  @ApiOperation({
    summary: 'Add a new quiz to a lesson (with question image upload)',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.CREATED)
  async addQuiz(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() addQuizDto: AddQuizDto,
  ) {
    const result = await this.courseService.addQuiz(
      courseId,
      lessonId,
      addQuizDto,
    );
    return {
      message: 'Quiz added successfully',
      data: result,
    };
  }
}
