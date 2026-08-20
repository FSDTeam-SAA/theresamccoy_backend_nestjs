import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { QuestionType } from '../entities/application.entity';

/**
 * ========================================
 * Sub Question DTO
 * ========================================
 */
export class CreateSubQuestionDto {
  @ApiProperty({
    example: 'a',
    description: 'Sub question label',
  })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({
    example: 'Sum all values in column B, rows 2 through 50:',
    description: 'Sub question',
  })
  @IsString()
  @IsNotEmpty()
  question!: string;

  @ApiPropertyOptional({
    example: '=SUM(B2:B50)',
    description: 'Answer of the sub question',
  })
  @IsString()
  @IsOptional()
  answer?: string;
}

/**
 * ========================================
 * Table Column DTO
 * ========================================
 */
export class CreateTableColumnDto {
  @ApiProperty({
    example: 'amount',
    description: 'Unique key of the table column',
  })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({
    example: 'Amount',
    description: 'Table column label',
  })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiPropertyOptional({
    example: 'currency',
    description:
      'Input type such as text, number, select, currency, percentage etc.',
  })
  @IsString()
  @IsOptional()
  inputType?: string;

  @ApiPropertyOptional({
    example: ['T', 'E'],
    description: 'Options when inputType is select',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];
}

/**
 * ========================================
 * Table Cell DTO
 * ========================================
 */
export class CreateTableCellDto {
  @ApiProperty({
    example: 'amount',
    description: 'Column key associated with this cell',
  })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiPropertyOptional({
    example: '185.40',
    description: 'Cell value',
  })
  @IsString()
  @IsOptional()
  value?: string;
}

/**
 * ========================================
 * Table Row DTO
 * ========================================
 */
export class CreateTableRowDto {
  @ApiPropertyOptional({
    example: 'row-1',
    description: 'Table row label',
  })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({
    type: [CreateTableCellDto],
    description: 'Table row cells',
    example: [
      {
        key: 'item',
        value: 'Office supplies',
      },
      {
        key: 'amount',
        value: '185.40',
      },
      {
        key: 'tax',
        value: 'T',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTableCellDto)
  cells!: CreateTableCellDto[];
}

/**
 * ========================================
 * Table Result DTO
 * ========================================
 */
export class CreateTableResultDto {
  @ApiProperty({
    example: 'taxSubtotal',
    description: 'Unique result key',
  })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({
    example: 'Tax subtotal (7% on taxable)',
    description: 'Result label',
  })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiPropertyOptional({
    example: '16.48',
    description: 'Calculated result value',
  })
  @IsString()
  @IsOptional()
  value?: string;
}

/**
 * ========================================
 * Question DTO
 * ========================================
 */
export class CreateQuestionDto {
  @ApiProperty({
    example: '2A',
    description: 'Question number',
  })
  @IsString()
  @IsNotEmpty()
  number!: string;

  @ApiProperty({
    example: 'Write the correct Excel formula for each task below.',
    description: 'Main question title',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    enum: QuestionType,
    example: QuestionType.SUB_QUESTION,
    description: 'Question type',
  })
  @IsEnum(QuestionType)
  type!: QuestionType;

  /**
   * type = text
   */
  @ApiPropertyOptional({
    example: 'This is my answer',
    description: 'Used for normal text questions',
  })
  @IsString()
  @IsOptional()
  answer?: string;

  /**
   * type = sub_question
   */
  @ApiPropertyOptional({
    type: [CreateSubQuestionDto],
    description: 'Used when question type is sub_question',
    example: [
      {
        label: 'a',
        question: 'Sum all values in column B, rows 2 through 50:',
        answer: '=SUM(B2:B50)',
      },
      {
        label: 'b',
        question: 'Calculate the average of values in C2 through C20:',
        answer: '=AVERAGE(C2:C20)',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubQuestionDto)
  @IsOptional()
  subQuestions?: CreateSubQuestionDto[];

  /**
   * type = table
   */
  @ApiPropertyOptional({
    type: [CreateTableColumnDto],
    description: 'Table columns when question type is table',
    example: [
      {
        key: 'item',
        label: 'Item',
        inputType: 'text',
      },
      {
        key: 'amount',
        label: 'Amount',
        inputType: 'currency',
      },
      {
        key: 'tax',
        label: 'Tax?',
        inputType: 'select',
        options: ['T', 'E'],
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTableColumnDto)
  @IsOptional()
  columns?: CreateTableColumnDto[];

  @ApiPropertyOptional({
    type: [CreateTableRowDto],
    description: 'Table rows when question type is table',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTableRowDto)
  @IsOptional()
  rows?: CreateTableRowDto[];

  @ApiPropertyOptional({
    type: [CreateTableResultDto],
    description: 'Calculated results such as subtotal and total',
    example: [
      {
        key: 'taxSubtotal',
        label: 'Tax subtotal (7% on taxable)',
        value: '',
      },
      {
        key: 'totalDue',
        label: 'TOTAL DUE',
        value: '',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTableResultDto)
  @IsOptional()
  results?: CreateTableResultDto[];
}

/**
 * ========================================
 * Section DTO
 * ========================================
 */
export class CreateSectionDto {
  @ApiProperty({
    example: 2,
    description: 'Section number',
  })
  @IsInt()
  sectionNumber!: number;

  @ApiProperty({
    example: 'Excel Formula Knowledge',
    description: 'Section title',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    type: [CreateQuestionDto],
    description: 'Questions under this section',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions!: CreateQuestionDto[];
}

/**
 * ========================================
 * Main Create Assessment DTO
 * ========================================
 */
export class CreateAssessmentDto {
  @ApiProperty({
    type: [CreateSectionDto],
    description: 'Assessment sections',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSectionDto)
  sections!: CreateSectionDto[];
}
