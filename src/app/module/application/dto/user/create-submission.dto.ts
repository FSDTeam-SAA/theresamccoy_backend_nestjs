import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';

import {
  Allow,
  IsArray,
  IsDate,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SubQuestionAnswerDto {
  @ApiProperty({
    example: '68a68d2709987428170d3333',
  })
  @IsMongoId()
  subQuestionId!: string;

  @ApiProperty({
    example: '=SUM(B2:B50)',
  })
  @Allow()
  value!: unknown;
}

export class TableCellAnswerDto {
  @ApiProperty({
    example: 'amount',
  })
  @IsString()
  columnKey!: string;

  @ApiProperty({
    example: 185.4,
  })
  @Allow()
  value!: unknown;
}

export class TableRowAnswerDto {
  @ApiProperty({
    example: '68a68e2709987428170d4444',
  })
  @IsMongoId()
  rowId!: string;

  @ApiProperty({
    type: [TableCellAnswerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TableCellAnswerDto)
  cells!: TableCellAnswerDto[];
}

export class UserQuestionAnswerDto {
  @ApiProperty({
    example: '68a68d1709987428170d2222',
  })
  @IsMongoId()
  questionId!: string;

  @ApiPropertyOptional({
    example: 'My answer',
  })
  @IsOptional()
  value?: unknown;

  @ApiPropertyOptional({
    type: [SubQuestionAnswerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubQuestionAnswerDto)
  @IsOptional()
  subAnswers?: SubQuestionAnswerDto[];

  @ApiPropertyOptional({
    type: [TableRowAnswerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TableRowAnswerDto)
  @IsOptional()
  tableAnswers?: TableRowAnswerDto[];
}

export class CreateSubmissionDto {
  @ApiProperty({
    example: 'Saurav',
  })
  @IsString()
  candidateName!: string;

  @ApiProperty({
    example: new Date(),
  })
  @Type(() => Date)
  @IsDate()
  date!: Date;

  @ApiProperty({
    example: 'Software Engineer',
  })
  @IsString()
  positionName!: string;

  @ApiProperty({
    example: 45,
  })
  @IsNumber()
  time!: number;

  @ApiProperty({
    example: '68a68cfc09987428170d1111',
  })
  @IsMongoId()
  formId!: string;

  @ApiProperty({
    type: [UserQuestionAnswerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserQuestionAnswerDto)
  answers!: UserQuestionAnswerDto[];
}
