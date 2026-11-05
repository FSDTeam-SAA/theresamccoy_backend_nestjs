import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SubmissionStatus } from '../../entities/application-submission.entity';

export class ReviewApplicationDto {
  @ApiProperty({
    enum: [
      SubmissionStatus.REVIEWED,
      SubmissionStatus.APPROVED,
      SubmissionStatus.REJECTED,
    ],
  })
  @IsEnum([
    SubmissionStatus.REVIEWED,
    SubmissionStatus.APPROVED,
    SubmissionStatus.REJECTED,
  ])
  status!: SubmissionStatus;

  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiPropertyOptional({ example: 'Strong bookkeeping background.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string;
}
