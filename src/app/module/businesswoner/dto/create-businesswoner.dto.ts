import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateBusinesswonerDto {
  // @ApiPropertyOptional({
  //   description: 'User MongoDB ID',
  //   example: '66c42f918e12f96dd274bc11',
  // })
  // @IsMongoId()
  // @IsNotEmpty()
  // userId!: string;

  @ApiPropertyOptional({
    example: 'John Smith',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiPropertyOptional({
    example: 'Smith Consulting LLC',
  })
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @ApiPropertyOptional({
    example: 'john@smithconsulting.com',
  })
  @IsEmail()
  @IsNotEmpty()
  businessEmail!: string;

  @ApiPropertyOptional({
    example: '+1 555 123 4567',
  })
  @IsString()
  @IsNotEmpty()
  businessPhoneNumber!: string;

  @ApiPropertyOptional({
    example: 'English',
  })
  @IsString()
  @IsNotEmpty()
  preherrenceLanguage!: string;

  @ApiPropertyOptional({
    example: 'Technology',
  })
  @IsString()
  @IsNotEmpty()
  industry!: string;

  @ApiPropertyOptional({
    example: 'LLC',
  })
  @IsString()
  @IsNotEmpty()
  entityType!: string;

  @ApiPropertyOptional({
    example: 5,
  })
  @IsNumber()
  @Min(0)
  yearInBusiness!: number;

  @ApiPropertyOptional({
    example: 10,
  })
  @IsNumber()
  @Min(0)
  numberEmployees!: number;

  @ApiPropertyOptional({
    example: 'New York, USA',
  })
  @IsString()
  @IsNotEmpty()
  businessLocation!: string;

  @ApiPropertyOptional({
    example: 'https://smithconsulting.com',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    example: 'Full-time',
  })
  @IsString()
  @IsNotEmpty()
  supportType!: string;

  @ApiPropertyOptional({
    example: '$1000000 - $2000000',
  })
  @IsString()
  @IsNotEmpty()
  annualSales!: string;

  @ApiPropertyOptional({
    example: 'Hybrid',
    description: 'Example: Onsite, Virtual, Hybrid',
  })
  @IsString()
  @IsNotEmpty()
  onsiteOnVirtual!: string;

  @ApiPropertyOptional({
    example: 'Currently growing and looking to improve operations',
  })
  @IsString()
  @IsNotEmpty()
  whereDoYouStandToday!: string;

  @ApiPropertyOptional({
    example: 'QuickBooks and Excel',
  })
  @IsString()
  @IsNotEmpty()
  currentSystem!: string;

  @ApiPropertyOptional({
    example: '500-1000',
  })
  @IsString()
  @IsNotEmpty()
  monthlyTransactions!: string;

  @ApiPropertyOptional({
    example: 'Bookkeeping and financial management',
  })
  @IsString()
  @IsNotEmpty()
  serviceYouAreLookingFor!: string;

  @ApiPropertyOptional({
    example: 'Business growth and financial planning',
  })
  @IsString()
  @IsNotEmpty()
  interestedIn!: string;

  @ApiPropertyOptional({
    example: 'Yes',
  })
  @IsString()
  @IsNotEmpty()
  businessCouching!: string;

  @ApiPropertyOptional({
    example: '2 sessions per month',
  })
  @IsString()
  @IsNotEmpty()
  monthlyCouching!: string;

  @ApiPropertyOptional({
    example: '$1000 - $2000',
  })
  @IsString()
  @IsNotEmpty()
  monthlyBudget!: string;

  @ApiPropertyOptional({
    example: 'I would like to discuss tax planning as well.',
  })
  @IsOptional()
  @IsString()
  anythingElse?: string;
}
