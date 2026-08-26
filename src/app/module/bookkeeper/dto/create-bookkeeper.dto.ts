import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateBookkeeperDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'NY' })
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '10001' })
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ example: 'https://www.linkedin.com/in/johndoe' })
  @IsString()
  @IsOptional()
  linkedInProfile?: string;
}
