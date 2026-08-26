import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';

// Personal Information

export class CreateBookkeeperDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'NY' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '10001' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({
    example: 'https://www.linkedin.com/in/johndoe',
  })
  @IsOptional()
  @IsString()
  linkedInProfile?: string;
}

// Experience

export class CreateExperienceDto {
  @ApiPropertyOptional({ example: '5 years' })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiPropertyOptional({ example: 'CPA' })
  @IsOptional()
  @IsString()
  highestBookkeeperCredential?: string;

  @ApiPropertyOptional({ example: 'ABC Corp' })
  @IsOptional()
  @IsString()
  resentEmployer?: string;

  @ApiPropertyOptional({ example: 'Finance, Healthcare' })
  @IsOptional()
  @IsString()
  industryExperience?: string;

  @ApiPropertyOptional({
    example: '5 years of bookkeeping and accounting experience',
  })
  @IsOptional()
  @IsString()
  bookkeeperBackground?: string;
}

// Skills

export class CreateBookkeeperSkillsDto {
  @ApiPropertyOptional({ example: 'Advanced' })
  @IsOptional()
  @IsString()
  quiceBooksOnline?: string;

  @ApiPropertyOptional({ example: 'Intermediate' })
  @IsOptional()
  @IsString()
  quickBooksDesktop?: string;

  @ApiPropertyOptional({ example: 'Advanced' })
  @IsOptional()
  @IsString()
  xero?: string;

  @ApiPropertyOptional({ example: 'Intermediate' })
  @IsOptional()
  @IsString()
  freshBooks?: string;

  @ApiPropertyOptional({ example: 'Beginner' })
  @IsOptional()
  @IsString()
  waveAccounting?: string;

  @ApiPropertyOptional({ example: 'Advanced' })
  @IsOptional()
  @IsString()
  excelSheets?: string;

  @ApiPropertyOptional({ example: 'Intermediate' })
  @IsOptional()
  @IsString()
  billMemo?: string;

  @ApiPropertyOptional({ example: 'Advanced' })
  @IsOptional()
  @IsString()
  gusto?: string;

  @ApiPropertyOptional({ example: 'ChatGPT, Claude, Gemini' })
  @IsOptional()
  @IsString()
  aiTools?: string;

  @ApiPropertyOptional({
    type: [String],
    example: [
      'Accounts Payable',
      'Accounts Receivable',
      'Payroll',
      'Reconciliation',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bookkeepingselect?: string[];

  @ApiPropertyOptional({
    example: 'E-commerce and SaaS bookkeeping',
  })
  @IsOptional()
  @IsString()
  specialyTrackInterest?: string;
}

// Assessment

export class CreateBookkeeperAssessmentDto {
  @ApiPropertyOptional({
    example: 'https://example.com/assessment.pdf',
  })
  @IsOptional()
  @IsString()
  downloadAssessment?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  @IsString()
  uploadResume?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  @IsString()
  uploadAssessment?: string;
}

// Availability

export class CreateBookkeeperAvailabilityDto {
  @ApiPropertyOptional({
    example: 'Remote',
  })
  @IsOptional()
  @IsString()
  workArrangement?: string;

  @ApiPropertyOptional({
    example: 'Part-Time',
  })
  @IsOptional()
  @IsString()
  engagmentType?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availabilityDays?: string[];

  @ApiPropertyOptional({
    example: '$25 - $35',
  })
  @IsOptional()
  @IsString()
  hourRateRange?: string;

  @ApiPropertyOptional({
    example: '80 hours per month',
  })
  @IsOptional()
  @IsString()
  mountlyInterest?: string;

  @ApiPropertyOptional({
    example: 'LinkedIn',
  })
  @IsOptional()
  @IsString()
  referralSourse?: string;

  @ApiPropertyOptional({
    example: 'John Smith',
  })
  @IsOptional()
  @IsString()
  referralName?: string;

  @ApiPropertyOptional({
    example: 'Available to start immediately.',
  })
  @IsOptional()
  @IsString()
  additionalNote?: string;
}
