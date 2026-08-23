import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { ApplicationFormService } from './application-form.service';
import { ApplicationSubmissionService } from './application-submission.service';
import { CreateSubmissionDto } from './dto/user/create-submission.dto';

@ApiTags('Application')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('bookkeeper'))
@Controller('applications')
export class ApplicationController {
  constructor(
    private readonly formService: ApplicationFormService,

    private readonly submissionService: ApplicationSubmissionService,
  ) {}

  /**
   * User form open করবে
   */
  @Get('form/:formId')
  @ApiOperation({
    summary: 'Get published application form',
  })
  async getForm(@Param('formId') formId: string) {
    const data = await this.formService.getPublishedForm(formId);

    return {
      success: true,
      message: 'Application form retrieved successfully',
      data,
    };
  }

  /**
   * Save draft / autosave
   */
  @Post('save')
  @ApiOperation({
    summary: 'Save application form answers as draft',
  })
  @HttpCode(HttpStatus.OK)
  async save(
    @Req() req: Request,
    @Body()
    dto: CreateSubmissionDto,
  ) {
    const data = await this.submissionService.createOrUpdate(req.user!.id, dto);

    return {
      success: true,
      message: 'Application saved successfully',
      data,
    };
  }

  /**
   * User নিজের saved application দেখবে
   */
  @Get('my/:formId')
  async myApplication(
    @Req() req: Request,

    @Param('formId')
    formId: string,
  ) {
    const data = await this.submissionService.findMySubmission(
      req.user!.id,
      formId,
    );

    return {
      success: true,
      message: 'Application retrieved successfully',
      data,
    };
  }

  /**
   * Final submission
   */
  @Patch(':submissionId/submit')
  async submit(
    @Req() req: Request,

    @Param('submissionId')
    submissionId: string,
  ) {
    const data = await this.submissionService.submit(
      req.user!.id,
      submissionId,
    );

    return {
      success: true,
      message: 'Application submitted successfully',
      data,
    };
  }
}
