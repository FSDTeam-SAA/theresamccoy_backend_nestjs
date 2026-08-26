// create-certificate.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateCertificateDto {
  @ApiPropertyOptional({
    example: '6417b9f4b9f4b9f4b9f4b9f4',
  })
  @IsOptional()
  @IsMongoId()
  bookkeeperId?: string;

  @ApiPropertyOptional({
    example: '6417b9f4b9f4b9f4b9f4b9f4',
  })
  @IsOptional()
  @IsMongoId()
  courseId?: string;

  @ApiProperty({
    example: 'Professional Bookkeeping Certificate',
  })
  @IsString()
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
  certificateID!: string;

  @ApiPropertyOptional({
    type: String,
    format: 'binary',
  })
  @IsOptional()
  @IsString()
  certificateUrl?: string;
}
