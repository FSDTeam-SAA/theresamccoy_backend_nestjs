import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsMongoId,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
class QuizAnswerDto {
  @ApiProperty() @IsMongoId() quizId!: string;
  @ApiProperty() @IsString() @MaxLength(5000) answer!: string;
}
export class SubmitQuizDto {
  @ApiProperty({ type: [QuizAnswerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique((item: QuizAnswerDto) => item.quizId)
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers!: QuizAnswerDto[];
}
