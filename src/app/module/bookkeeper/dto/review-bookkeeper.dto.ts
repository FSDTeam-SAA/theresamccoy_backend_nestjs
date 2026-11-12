import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { BookkeeperStatus } from '../entities/bookkeeper.entity';

export class ReviewBookkeeperDto {
  @ApiProperty({ enum: [BookkeeperStatus.APPROVED, BookkeeperStatus.REJECTED] })
  @IsEnum([BookkeeperStatus.APPROVED, BookkeeperStatus.REJECTED])
  status!: BookkeeperStatus;

  @ApiPropertyOptional({ example: 'Additional verification is required.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string;
}
