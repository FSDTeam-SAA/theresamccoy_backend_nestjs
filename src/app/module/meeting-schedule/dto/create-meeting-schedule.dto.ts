import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMeetingScheduleDto {
  @ApiProperty({ example: '60d5f3e1f4f4b5d6a7e8b9c0', required: false })
  @IsString()
  @IsOptional()
  bookkeeperId?: string;

  @ApiProperty({ example: '60d5f3e1f4f4b5d6a7e8b9c1', required: false })
  @IsString()
  @IsOptional()
  businessId?: string;

  @ApiProperty({ example: '2026-10-01' })
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ example: '12:00 PM' })
  @IsString()
  @IsNotEmpty()
  time!: string;

  @ApiProperty({ example: 'https://meet.google.com/abc-def-ghi' })
  @IsString()
  @IsNotEmpty()
  meetingLink!: string;

  @ApiProperty({ example: 'Meeting note', required: false })
  @IsString()
  @IsOptional()
  meetingNote?: string;

  @ApiProperty({
    enum: ['pending', 'scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;
}
