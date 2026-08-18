import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: '' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: '' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: '' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ enum: ['bookkeeper', 'business', 'admin'] })
  @IsOptional()
  @IsEnum(['bookkeeper', 'business', 'admin'])
  role?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  otpExpiry?: Date;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  verifiedForget?: boolean;

  @ApiPropertyOptional({ enum: ['active', 'suspended'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  stripeAccountId?: string;
}
