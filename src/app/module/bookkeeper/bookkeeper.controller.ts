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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import pick from 'src/app/helpers/pick';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { BookkeeperService } from './bookkeeper.service';
import { CreateBookkeeperDto } from './dto/create-bookkeeper.dto';
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
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper', 'admin'))
  @HttpCode(HttpStatus.OK)
  async updateByBookkeeper(
    @Param('id') id: string,
    @Body() updateBookkeeperDto: UpdateBookkeeperDto,
  ) {
    const result = await this.bookkeeperService.updateByBookkeeper(
      id,
      updateBookkeeperDto,
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
    const result = await this.bookkeeperService.removeByBookkeeper(id);
    return {
      message: 'Bookkeeper deleted successfully',
      data: result,
    };
  }
}
