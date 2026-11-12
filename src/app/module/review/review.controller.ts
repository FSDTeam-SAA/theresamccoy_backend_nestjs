import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import { CreateReviewDto } from './dto/review.dto';
import { ReviewService } from './review.service';
@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly service: ReviewService) {}
  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('business', 'bookkeeper'))
  @ApiOperation({
    summary: 'Review the other participant after engagement completion',
  })
  create(@Body() dto: CreateReviewDto, @Req() req: Request) {
    return this.service.create(dto, req.user!);
  }
  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('bookkeeper', 'business'))
  @ApiOperation({ summary: 'My received reviews and rating summary in meta' })
  async mine(@Req() req: Request) {
    const result = await this.service.listForUser(req.user!.id);
    return { data: result.data, meta: result.summary };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get reviews and rating summary for a user' })
  async list(@Param('userId') userId: string) {
    const result = await this.service.listForUser(userId);
    return { data: result.data, meta: result.summary };
  }
}
