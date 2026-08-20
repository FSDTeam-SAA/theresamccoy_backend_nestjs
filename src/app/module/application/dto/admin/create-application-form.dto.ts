import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';

import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import {
  FormStatus,
  QuestionType,
} from '../../entities/application-form.entity';

export class QuestionOptionDto {
  @ApiProperty({
    example: 'Yes',
  })
  @IsString()
  label!: string;

  @ApiProperty({
    example: 'yes',
  })
  @IsString()
  value!: string;
}

export class SubQuestionDto {
  @ApiProperty({
    example: 'a',
  })
  @IsString()
  label!: string;

  @ApiProperty({
    example: 'Sum values from B2 through B50',
  })
  @IsString()
  question!: string;

  @ApiProperty({
    enum: QuestionType,
    example: QuestionType.TEXT,
  })
  @IsEnum(QuestionType)
  type!: QuestionType;

  @ApiPropertyOptional({
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({
    type: [QuestionOptionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  @IsOptional()
  options?: QuestionOptionDto[];
}

export class TableColumnDto {
  @ApiProperty({
    example: 'amount',
  })
  @IsString()
  key!: string;

  @ApiProperty({
    example: 'Amount',
  })
  @IsString()
  label!: string;

  @ApiProperty({
    example: 'currency',
  })
  @IsString()
  inputType!: string;

  @ApiPropertyOptional({
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({
    example: ['T', 'E'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];
}

export class TableCellDto {
  @ApiProperty({
    example: 'item',
  })
  @IsString()
  key!: string;

  @ApiPropertyOptional({
    example: 'Office Supplies',
  })
  @IsOptional()
  value?: unknown;
}

export class TableRowDto {
  @ApiPropertyOptional({
    example: '1',
  })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({
    type: [TableCellDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TableCellDto)
  cells!: TableCellDto[];
}

export class TableResultDto {
  @ApiProperty({
    example: 'taxSubtotal',
  })
  @IsString()
  key!: string;

  @ApiProperty({
    example: 'Tax Subtotal',
  })
  @IsString()
  label!: string;

  @ApiPropertyOptional({
    example: 'taxableTotal * 0.07',
  })
  @IsString()
  @IsOptional()
  formula?: string;

  @ApiPropertyOptional({
    example: '$',
  })
  @IsString()
  @IsOptional()
  prefix?: string;

  @ApiPropertyOptional({
    example: '%',
  })
  @IsString()
  @IsOptional()
  suffix?: string;
}

export class QuestionDto {
  @ApiProperty({
    example: '2A',
  })
  @IsString()
  number!: string;

  @ApiProperty({
    example: 'Write the correct Excel formula for each task below.',
  })
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: QuestionType,
    example: QuestionType.SUB_QUESTION,
  })
  @IsEnum(QuestionType)
  type!: QuestionType;

  @ApiPropertyOptional({
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  placeholder?: string;

  @ApiPropertyOptional({
    type: [QuestionOptionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  @IsOptional()
  options?: QuestionOptionDto[];

  @ApiPropertyOptional({
    type: [SubQuestionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubQuestionDto)
  @IsOptional()
  subQuestions?: SubQuestionDto[];

  @ApiPropertyOptional({
    type: [TableColumnDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TableColumnDto)
  @IsOptional()
  columns?: TableColumnDto[];

  @ApiPropertyOptional({
    type: [TableRowDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TableRowDto)
  @IsOptional()
  rows?: TableRowDto[];

  @ApiPropertyOptional({
    type: [TableResultDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TableResultDto)
  @IsOptional()
  results?: TableResultDto[];

  @ApiPropertyOptional({
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  order?: number;
}

export class SectionDto {
  @ApiProperty({
    example: 1,
  })
  @IsInt()
  sectionNumber!: number;

  @ApiProperty({
    example: 'Core Accounting Knowledge',
  })
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: [QuestionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions!: QuestionDto[];

  @ApiPropertyOptional({
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  order?: number;
}

export class CreateApplicationFormDto {
  @ApiProperty({
    example: 'Bookkeeper Skills Assessment',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    example: 'Bookkeeper application assessment form',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    enum: FormStatus,
    example: FormStatus.DRAFT,
  })
  @IsEnum(FormStatus)
  @IsOptional()
  status?: FormStatus;

  @ApiProperty({
    type: [SectionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections!: SectionDto[];
}
