import { PartialType } from '@nestjs/swagger';
import {
  AddLessonDto,
  AddModuleDto,
  CreateCourseDto,
} from './create-course.dto';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
export class UpdateModuleDto extends PartialType(AddModuleDto) {}
export class UpdateLessonDto extends PartialType(AddLessonDto) {}
