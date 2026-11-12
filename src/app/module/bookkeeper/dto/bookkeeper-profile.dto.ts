import { ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const parseJson = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
};

const toOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

const parseNestedArray = <T>(
  value: unknown,
  dtoClass: new () => T,
): unknown => {
  const parsed = parseJson({ value });
  return Array.isArray(parsed) ? plainToInstance(dtoClass, parsed) : parsed;
};

export class BookkeeperCertificationDto {
  @ApiPropertyOptional({ example: 'Xero Certified Advisor' })
  @IsString()
  @MaxLength(150)
  title!: string;

  @ApiPropertyOptional({ example: 'Xero' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  issuer?: string;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2200)
  year?: number;
}

export class BookkeeperPortfolioDto {
  @ApiPropertyOptional({ example: 'Shopify and Xero Integration' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Reduced monthly reconciliation time.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'E-commerce & Retail' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  department?: string;

  @ApiPropertyOptional({ example: 'https://example.com/case-study.pdf' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  fileUrl?: string;
}

export class UpdateMyBookkeeperProfileDto {
  @ApiPropertyOptional({ example: 'Sarah' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Chen' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: 'sarah.chen@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+61 412 345 678' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Sydney' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'NSW' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: 'Senior Bookkeeper - E-commerce Specialist' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  professionalTitle?: string;

  @ApiPropertyOptional({
    example: 'Experienced bookkeeper specialising in SaaS.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  professionalBio?: string;

  @ApiPropertyOptional({ type: [String], example: ['English', 'Mandarin'] })
  @Transform(parseJson)
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Bank Reconciliation', 'Month-end Close'],
  })
  @Transform(parseJson)
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ type: [BookkeeperCertificationDto] })
  @Transform(({ value }) => parseNestedArray(value, BookkeeperCertificationDto))
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  certifications?: BookkeeperCertificationDto[];

  @ApiPropertyOptional({ type: [BookkeeperPortfolioDto] })
  @Transform(({ value }) => parseNestedArray(value, BookkeeperPortfolioDto))
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  portfolio?: BookkeeperPortfolioDto[];

  @ApiPropertyOptional({ example: 85 })
  @Transform(toOptionalNumber)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ example: 63 })
  @Transform(toOptionalNumber)
  @IsOptional()
  @IsInt()
  @Min(0)
  projectsCompleted?: number;

  @ApiPropertyOptional({ example: 7 })
  @Transform(toOptionalNumber)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  yearsOfExperience?: number;

  @ApiPropertyOptional({ example: 'Full-time' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  availability?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  profilePicture?: unknown;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description:
      'Portfolio files in the same order as the portfolio JSON array',
  })
  @IsOptional()
  portfolioFiles?: unknown;
}
