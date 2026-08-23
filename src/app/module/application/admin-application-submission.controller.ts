import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import pick from 'src/app/helpers/pick';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { ApplicationSubmissionService } from './application-submission.service';
import { SubmissionStatus } from './entities/application-submission.entity';

@ApiTags('Admin Application Submissions')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('admin'))
@Controller('admin/application-submissions')
export class AdminApplicationSubmissionController {
  constructor(
    private readonly submissionService: ApplicationSubmissionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Search and filter application submissions' })
  @ApiQuery({
    name: 'searchTerm',
    required: false,
    description: 'Search by candidate name or position name',
  })
  @ApiQuery({ name: 'status', required: false, enum: SubmissionStatus })
  @ApiQuery({ name: 'formId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'updatedAt', 'candidateName', 'status'],
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @HttpCode(HttpStatus.OK)
  async findAll(@Req() req: Request) {
    const filters = pick(req.query, ['searchTerm', 'status', 'formId']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.submissionService.findAll(filters, options);

    return {
      success: true,
      message: 'Application submissions retrieved successfully',
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one application submission' })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const data = await this.submissionService.findOne(id);

    return {
      success: true,
      message: 'Application submission retrieved successfully',
      data,
    };
  }
}
