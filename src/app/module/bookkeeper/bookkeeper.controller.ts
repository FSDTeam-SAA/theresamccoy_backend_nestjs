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
  ApiConsumes,
  ApiOperation,
  ApiQuery,
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
    @Param('id') bookkeeperId: string,
    @Body() createExperienceDto: CreateExperienceDto,
  ) {
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
    @Param('id') bookkeeperId: string,
    @Body() createSkillsDto: CreateBookkeeperSkillsDto,
  ) {
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
    @Param('id') bookkeeperId: string,
    @Body() createAssessmentDto: CreateBookkeeperAssessmentDto,
    @UploadedFiles()
    files?: {
      uploadResume?: Express.Multer.File[];
      uploadAssessment?: Express.Multer.File[];
    },
  ) {
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
    @Param('id') bookkeeperId: string,
    @Body() createAvailabilityDto: CreateBookkeeperAvailabilityDto,
  ) {
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
    @Param('id') id: string,
    @Body() updateBookkeeperDto: UpdateBookkeeperDto,
    @UploadedFiles()
    files?: {
      uploadResume?: Express.Multer.File[];
      uploadAssessment?: Express.Multer.File[];
    },
  ) {
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
  async removeByBookkeeper(@Param('id') id: string) {
    const result = await this.bookkeeperService.removeBookkeeper(id);
    return {
      message: 'Bookkeeper deleted successfully',
      data: result,
    };
  }
}
