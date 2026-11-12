import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
class ContentItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(300) title!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  imageUrl?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  linkUrl?: string;
}
class ContentSectionDto {
  @ApiProperty({ example: 'hero' })
  @IsString()
  @Matches(/^[a-z][a-z0-9-]{0,59}$/)
  key!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(300) title!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  imageUrl?: string;
  @ApiProperty({ type: [ContentItemDto] })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ContentItemDto)
  items!: ContentItemDto[];
}
export class UpdatePageContentDto {
  @ApiProperty({
    type: [ContentSectionDto],
    description: 'Replaces all sections for this page. Keys must be unique.',
  })
  @IsArray()
  @ArrayMaxSize(30)
  @ArrayUnique((section: ContentSectionDto) => section.key)
  @ValidateNested({ each: true })
  @Type(() => ContentSectionDto)
  sections!: ContentSectionDto[];
  @ApiProperty() @IsBoolean() published!: boolean;
}
