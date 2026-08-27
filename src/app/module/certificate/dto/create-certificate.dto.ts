import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateCertificateDto {
  @ApiProperty({
    example: '6417b9f4b9f4b9f4b9f4b9f4',
  })
  @IsMongoId()
  bookkeeperId!: string;

  @ApiProperty({
    example: '6417b9f4b9f4b9f4b9f4b9f4',
  })
  @IsMongoId()
  courseId!: string;

  @ApiProperty({
    example: 'Professional Bookkeeping Certificate',
  })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({
    example: '2026-08-26',
  })
  @Type(() => Date)
  @IsDate()
  issueDate!: Date;

  @ApiProperty({
    example: '12SASF456',
  })
  @IsString()
  @MinLength(1)
  certificateID!: string;

  @ApiPropertyOptional({
    type: String,
    format: 'binary',
  })
  @IsOptional()
  @IsString()
  certificateUrl?: string;
}
