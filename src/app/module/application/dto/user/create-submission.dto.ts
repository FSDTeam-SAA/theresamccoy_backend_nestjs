import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';

import {
  IsArray,
  IsMongoId,
  IsOptional,
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
  value!: unknown;
}

export class TableCellAnswerDto {
  @ApiProperty({
    example: 'amount',
  })
  columnKey!: string;

  @ApiProperty({
    example: 185.4,
  })
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
