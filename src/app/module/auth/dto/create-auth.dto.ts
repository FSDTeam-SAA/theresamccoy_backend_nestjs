import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAuthDto {
  @ApiProperty({ example: 'Saurav' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Sarkar' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 'saurav@gmail.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  @ApiPropertyOptional({ enum: ['bookkeeper', 'business', 'admin'] })
  @IsOptional()
  @IsEnum(['bookkeeper', 'business', 'admin'])
  role?: string;
}

export class LoginAuthDto {
  @ApiProperty({ example: 'saurav@gmail.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'saurav@gmail.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  email!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'saurav@gmail.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'saurav@gmail.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'newsecret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldsecret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  oldPassword!: string;

  @ApiProperty({ example: 'newsecret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  newPassword!: string;
}
