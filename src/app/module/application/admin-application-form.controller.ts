import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApplicationFormService } from './application-form.service';

import { CreateApplicationFormDto } from './dto/admin/create-application-form.dto';

import AuthGuard from 'src/app/middlewares/auth.guard';
import { UpdateApplicationFormDto } from './dto/admin/update-application-form.dto';

@ApiTags('Admin Application Form')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('admin'))
@Controller('admin/application-forms')
export class AdminApplicationFormController {
  constructor(
    private readonly applicationFormService: ApplicationFormService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Admin create application form',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateApplicationFormDto) {
    const data = await this.applicationFormService.create(dto);

    return {
      message: 'Application form created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Admin get all application forms',
  })
  async findAll() {
    const data = await this.applicationFormService.findAll();

    return {
      success: true,
      message: 'Application forms retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Admin get application form',
  })
  async findOne(@Param('id') id: string) {
    const data = await this.applicationFormService.findOne(id);

    return {
      success: true,
      message: 'Application form retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Admin update complete application form',
  })
  async update(
    @Param('id') id: string,

    @Body()
    dto: UpdateApplicationFormDto,
  ) {
    const data = await this.applicationFormService.update(id, dto);

    return {
      success: true,
      message: 'Application form updated successfully',
      data,
    };
  }

  @Patch(':id/publish')
  @ApiOperation({
    summary: 'Publish application form',
  })
  async publish(@Param('id') id: string) {
    const data = await this.applicationFormService.publish(id);

    return {
      success: true,
      message: 'Application form published successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete application form',
  })
  async remove(@Param('id') id: string) {
    const data = await this.applicationFormService.remove(id);

    return {
      success: true,
      message: 'Application form deleted successfully',
      data,
    };
  }
}
