import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsMongoId,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
export class CreateReviewDto {
  @ApiProperty()
  @IsMongoId()
  engagementId!: string;
  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
  @ApiProperty({ example: 'Professional, accurate and easy to work with.' })
  @IsString()
  @MaxLength(2000)
  comment!: string;
}
