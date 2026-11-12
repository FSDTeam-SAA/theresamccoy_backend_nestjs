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
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import pick from 'src/app/helpers/pick';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { fileUpload } from 'src/app/helpers/fileUploder';
import { BookkeeperService } from './bookkeeper.service';
import {
  CreateBookkeeperAssessmentDto,
  CreateBookkeeperAvailabilityDto,
  CreateBookkeeperDto,
  CreateBookkeeperSkillsDto,
  CreateExperienceDto,
} from './dto/create-bookkeeper.dto';
import { UpdateBookkeeperDto } from './dto/update-bookkeeper.dto';
import { UpdateMyBookkeeperProfileDto } from './dto/bookkeeper-profile.dto';
import { ReviewBookkeeperDto } from './dto/review-bookkeeper.dto';

@ApiTags('Bookkeeper')
@Controller('bookkeeper')
export class BookkeeperController {
  constructor(private readonly bookkeeperService: BookkeeperService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new bookkeeper',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper'))
  @HttpCode(HttpStatus.CREATED)
  async createBookkeeper(
    @Req() req: Request,
    @Body() createBookkeeperDto: CreateBookkeeperDto,
  ) {
    const result = await this.bookkeeperService.createBookkeeper(
      req.user!.id,
      createBookkeeperDto,
    );
    return {
      message: 'Bookkeeper created successfully',
      data: result,
    };
  }

  @Post(':id/experience')
  @ApiOperation({
    summary: 'Create experience for a bookkeeper',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper', 'admin'))
  @HttpCode(HttpStatus.CREATED)
  async createExperience(
    @Req() req: Request,
    @Param('id') bookkeeperId: string,
    @Body() createExperienceDto: CreateExperienceDto,
  ) {
    await this.bookkeeperService.assertOwner(bookkeeperId, req.user!);
    const result = await this.bookkeeperService.createExperience(
      bookkeeperId,
      createExperienceDto,
    );
    return {
      message: 'Experience created successfully',
      data: result,
    };
  }

  @Post(':id/skills')
  @ApiOperation({ summary: 'Create skills for a bookkeeper' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper', 'admin'))
  @HttpCode(HttpStatus.CREATED)
  async createSkills(
    @Req() req: Request,
    @Param('id') bookkeeperId: string,
    @Body() createSkillsDto: CreateBookkeeperSkillsDto,
  ) {
    await this.bookkeeperService.assertOwner(bookkeeperId, req.user!);
    const result = await this.bookkeeperService.createSkills(
      bookkeeperId,
      createSkillsDto,
    );
    return {
      message: 'Skills created successfully',
      data: result,
    };
  }

  @Post(':id/assessment')
  @ApiOperation({ summary: 'Create assessment for a bookkeeper' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper', 'admin'))
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'uploadResume', maxCount: 1 },
        { name: 'uploadAssessment', maxCount: 1 },
      ],
      fileUpload.uploadConfig,
    ),
  )
  @HttpCode(HttpStatus.CREATED)
  async createAssessment(
    @Req() req: Request,
    @Param('id') bookkeeperId: string,
    @Body() createAssessmentDto: CreateBookkeeperAssessmentDto,
    @UploadedFiles()
    files?: {
      uploadResume?: Express.Multer.File[];
      uploadAssessment?: Express.Multer.File[];
    },
  ) {
    await this.bookkeeperService.assertOwner(bookkeeperId, req.user!);
    const result = await this.bookkeeperService.createAssessment(
      bookkeeperId,
      createAssessmentDto,
      files,
    );
    return {
      message: 'Assessment created successfully',
      data: result,
    };
  }

  @Post(':id/availability')
  @ApiOperation({ summary: 'Create availability for a bookkeeper' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper', 'admin'))
  @HttpCode(HttpStatus.CREATED)
  async createAvailability(
    @Req() req: Request,
    @Param('id') bookkeeperId: string,
    @Body() createAvailabilityDto: CreateBookkeeperAvailabilityDto,
  ) {
    await this.bookkeeperService.assertOwner(bookkeeperId, req.user!);
    const result = await this.bookkeeperService.createAvailability(
      bookkeeperId,
      createAvailabilityDto,
    );
    return {
      message: 'Availability created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all bookkeepers',
  })
  @ApiQuery({
    name: 'searchTerm',
    required: false,
  })
  @ApiQuery({
    name: 'firstName',
    required: false,
  })
  @ApiQuery({
    name: 'lastName',
    required: false,
  })
  @ApiQuery({
    name: 'email',
    required: false,
  })
  @ApiQuery({
    name: 'phoneNumber',
    required: false,
  })
  @ApiQuery({
    name: 'city',
    required: false,
  })
  @ApiQuery({
    name: 'state',
    required: false,
  })
  @ApiQuery({
    name: 'zipCode',
    required: false,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
  })
  @ApiQuery({
    name: 'page',
    required: false,
  })
  @HttpCode(HttpStatus.OK)
  async getAllBookkeepers(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'city',
      'state',
      'zipCode',
    ]);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'sortOrder']);
    const result = await this.bookkeeperService.getAllBookkeepers(
      filters,
      options,
    );
    return {
      message: 'Bookkeepers retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('admin/all')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @ApiOperation({
    summary: 'Admin list including pending and rejected profiles',
  })
  async adminList(@Req() req: Request) {
    const result = await this.bookkeeperService.getAllBookkeepers(
      pick(req.query, ['searchTerm', 'status']),
      pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']),
      true,
    );
    return { data: result.data, meta: result.meta };
  }

  @Get('profile/me')
  @ApiOperation({
    summary: 'Get the authenticated bookkeeper Profile & Skills page data',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper'))
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@Req() req: Request) {
    const result = await this.bookkeeperService.getMyProfile(req.user!.id);
    return {
      message: 'Bookkeeper profile retrieved successfully',
      data: result,
    };
  }

  @Patch(':id/review')
  @ApiOperation({ summary: 'Admin approves or rejects a bookkeeper profile' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  async reviewBookkeeper(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: ReviewBookkeeperDto,
  ) {
    return {
      message: 'Bookkeeper review saved successfully',
      data: await this.bookkeeperService.reviewBookkeeper(
        id,
        req.user!.id,
        dto.status,
        dto.rejectionReason,
      ),
    };
  }

  @Patch('profile/me')
  @ApiOperation({
    summary:
      'Update personal information, skills, certifications, portfolio and other profile details',
  })
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateMyBookkeeperProfileDto })
  @UseGuards(AuthGuard('bookkeeper'))
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profilePicture', maxCount: 1 },
        { name: 'uploadResume', maxCount: 1 },
        { name: 'coverLetter', maxCount: 1 },
        { name: 'certificationFiles', maxCount: 10 },
        { name: 'portfolioFiles', maxCount: 10 },
      ],
      fileUpload.uploadConfig,
    ),
  )
  @HttpCode(HttpStatus.OK)
  async updateMyProfile(
    @Req() req: Request,
    @Body() dto: UpdateMyBookkeeperProfileDto,
    @UploadedFiles()
    files?: {
      uploadResume?: Express.Multer.File[];
      coverLetter?: Express.Multer.File[];
      certificationFiles?: Express.Multer.File[];
      profilePicture?: Express.Multer.File[];
      portfolioFiles?: Express.Multer.File[];
    },
  ) {
    const result = await this.bookkeeperService.updateMyProfile(
      req.user!.id,
      dto,
      files,
    );
    return {
      message: 'Bookkeeper profile updated successfully',
      data: result,
    };
  }

  @Post('profile/me/application/submit')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper'))
  @ApiOperation({
    summary: 'Submit saved bookkeeper application for admin review',
    description:
      'Save profile first. Requires a PDF resume, skills, yearsOfExperience and educationalQualification. A pending submission cannot be submitted twice.',
  })
  async submitApplication(@Req() req: Request) {
    return {
      message: 'Application submitted for review',
      data: await this.bookkeeperService.submitApplication(req.user!.id),
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single bookkeeper by ID',
  })
  @HttpCode(HttpStatus.OK)
  async getSingleBookkeeper(@Param('id') id: string) {
    const result = await this.bookkeeperService.getSingleBookkeeper(id);
    return {
      message: 'Bookkeeper retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a bookkeeper by ID',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper', 'admin'))
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'uploadResume', maxCount: 1 },
        { name: 'uploadAssessment', maxCount: 1 },
      ],
      fileUpload.uploadConfig,
    ),
  )
  @HttpCode(HttpStatus.OK)
  async updateByBookkeeper(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateBookkeeperDto: UpdateBookkeeperDto,
    @UploadedFiles()
    files?: {
      uploadResume?: Express.Multer.File[];
      uploadAssessment?: Express.Multer.File[];
    },
  ) {
    await this.bookkeeperService.assertOwner(id, req.user!);
    const result = await this.bookkeeperService.updateBookkeeper(
      id,
      updateBookkeeperDto,
      files,
    );
    return {
      message: 'Bookkeeper updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a bookkeeper by ID',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper', 'admin'))
  @HttpCode(HttpStatus.OK)
  async removeByBookkeeper(@Req() req: Request, @Param('id') id: string) {
    await this.bookkeeperService.assertOwner(id, req.user!);
    const result = await this.bookkeeperService.removeBookkeeper(id);
    return {
      message: 'Bookkeeper deleted successfully',
      data: result,
    };
  }
}
