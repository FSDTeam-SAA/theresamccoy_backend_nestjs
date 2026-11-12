import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import AuthGuard from '../../middlewares/auth.guard';
import { ContentService } from './content.service';
import { UpdatePageContentDto } from './content.dto';
@ApiTags('Website content')
@Controller('content')
export class ContentController {
  constructor(private readonly service: ContentService) {}
  @Get(':slug')
  @SetMetadata('publicContent', true)
  @ApiOperation({
    summary: 'Published website content: home, about, training, apply, contact',
  })
  async get(@Param('slug') slug: string) {
    return { data: await this.service.get(slug) };
  }
  @Get('admin/:slug')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  async preview(@Param('slug') slug: string) {
    return { data: await this.service.get(slug, true) };
  }
  @Put('admin/:slug')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({ summary: 'Replace page sections and publish/unpublish' })
  async update(@Param('slug') slug: string, @Body() dto: UpdatePageContentDto) {
    return {
      message: 'Page content saved',
      data: await this.service.update(slug, dto),
    };
  }
}
