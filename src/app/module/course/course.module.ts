import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import {
  Course,
  CourseSchema,
  CourseProgress,
  CourseProgressSchema,
  AssignmentSubmission,
  AssignmentSubmissionSchema,
  Lesson,
  LessonSchema,
  ModuleSchema,
  Quiz,
  QuizSchema,
} from './entities/course.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Module.name, schema: ModuleSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: CourseProgress.name, schema: CourseProgressSchema },
      {
        name: AssignmentSubmission.name,
        schema: AssignmentSubmissionSchema,
      },
      // { name: QuizOption.name, schema: QuizOptionSchema },
    ]),
  ],
  controllers: [CourseController],
  providers: [CourseService],
})
export class CourseModule {}
