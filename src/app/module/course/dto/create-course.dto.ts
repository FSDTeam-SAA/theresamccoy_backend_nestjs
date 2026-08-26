import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

// export class QuizOptionDto {
//   @ApiProperty({
//     example: "Assets = Liabilities + Owner's Equity",
//   })
//   @IsString()
//   option!: string;

//   @ApiPropertyOptional({
//     example: "Assets = Liabilities + Owner's Equity",
//   })
//   @IsOptional()
//   @IsString()
//   answer?: string;

//   // @ApiPropertyOptional({
//   //   example: 'https://example.com/images/option-1.png',
//   // })
//   // @IsOptional()
//   // @IsString()
//   // image?: string;
// }

// export class QuizDto {
//   @ApiProperty({
//     example: 'What is the fundamental accounting equation?',
//   })
//   @IsString()
//   question!: string;

//   @ApiProperty({
//     type: [String],
//     example: [
//       "Assets = Liabilities + Owner's Equity",
//       'Assets = Revenue - Expenses',
//       'Assets = Equity - Liabilities',
//       'Assets = Revenue + Expenses',
//     ],
//   })
//   @IsArray()
//   @IsString({ each: true })
//   options!: string[];

//   @ApiProperty({
//     example: "Assets = Liabilities + Owner's Equity",
//   })
//   @IsString()
//   answer!: string;

//   // @ApiPropertyOptional({
//   //   example: 'https://example.com/images/quiz-1.png',
//   // })
//   // @IsOptional()
//   // @IsString()
//   // image?: string;
// }

// export class LessonDto {
//   @ApiProperty({
//     example: 'Introduction to Accounts',
//   })
//   @IsString()
//   name!: string;

//   @ApiPropertyOptional({
//     example: 'https://example.com/videos/lesson-1.mp4',
//   })
//   @IsOptional()
//   @IsString()
//   video?: string;

//   @ApiPropertyOptional({
//     example: 'https://example.com/resources/lesson-1.pdf',
//   })
//   @IsOptional()
//   @IsString()
//   resource?: string;

//   @ApiPropertyOptional({
//     example: 'https://example.com/thumbnails/lesson-1.jpg',
//   })
//   @IsOptional()
//   @IsString()
//   thumbnail?: string;

//   @ApiProperty({
//     type: () => [QuizDto],
//   })
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => QuizDto)
//   quizzes!: QuizDto[];
// }

// export class ModuleDto {
//   @ApiProperty({
//     example: 'Module 1',
//   })
//   @IsString()
//   name!: string;

//   // @ApiPropertyOptional({
//   //   example: 'https://example.com/images/module-1.png',
//   // })
//   // @IsOptional()
//   // @IsString()
//   // image?: string;

//   @ApiProperty({
//     type: () => [LessonDto],
//   })
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => LessonDto)
//   lessons!: LessonDto[];
// }

export class CreateCourseDto {
  @ApiProperty({
    example: 'QuickBooks Fundamentals',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    example: 'Learn the fundamentals of QuickBooks and accounting.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 100,
  })
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  })
  price!: number;

  @ApiPropertyOptional({ enum: ['beginner', 'intermediate', 'advanced'] })
  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  level?: string;

  @ApiPropertyOptional({ enum: ['draft', 'published'] })
  @IsOptional()
  @IsEnum(['draft', 'published'])
  status?: string;

  @ApiPropertyOptional({
    example: 'Theresa May',
  })
  @IsOptional()
  @IsString()
  instructor?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  photo?: string;

  // @ApiPropertyOptional({
  //   type: () => [ModuleDto],
  // })
  // @IsOptional()
  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => ModuleDto)
  // @Transform(({ value }) => {
  //   if (value === null || value === undefined) {
  //     return [];
  //   }
  //   if (typeof value === 'string') {
  //     if (value.trim().length === 0) return [];
  //     try {
  //       return JSON.parse(value);
  //     } catch {
  //       return [];
  //     }
  //   }
  //   return value;
  // })
  // modules?: ModuleDto[];
}

export class AddModuleDto {
  @ApiProperty({
    example: 'Module 1',
  })
  @IsString()
  name!: string;
}

export class AddLessonDto {
  @ApiProperty({ example: 'Introduction to QuickBooks' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Basic QuickBooks concepts' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  durationMinutes?: number;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Video file upload ',
  })
  @IsOptional()
  video?: unknown;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Resource/PDF file upload ',
  })
  @IsOptional()
  resource?: unknown;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Lesson thumbnail image upload',
  })
  @IsOptional()
  thumbnail?: unknown;

  @ApiPropertyOptional({ example: 'Module 3 Practical Assignment' })
  @IsOptional()
  @IsString()
  assignmentTitle?: string;

  @ApiPropertyOptional({ example: 'Complete the tasks and upload a PDF.' })
  @IsOptional()
  @IsString()
  assignmentInstructions?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  assignmentDueDate?: string;
}

export class AddQuizDto {
  @ApiProperty({
    example: 'What is the fundamental accounting equation?',
  })
  @IsString()
  question!: string;

  @ApiProperty({
    type: [String],
    example: [
      "Assets = Liabilities + Owner's Equity",
      'Assets = Revenue - Expenses',
      'Assets = Equity - Liabilities',
      'Assets = Revenue + Expenses',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // ignore
      }
      return value
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    return value;
  })
  options!: string[];

  @ApiProperty({
    example: "Assets = Liabilities + Owner's Equity",
  })
  @IsString()
  answer!: string;
}

export class AddQuizOptionDto {
  @ApiProperty({
    example: 'Assets = Liabilities + Equity',
  })
  @IsString()
  option!: string;

  @ApiPropertyOptional({
    example: 'Assets = Liabilities + Equity',
  })
  @IsOptional()
  @IsString()
  answer?: string;
}
