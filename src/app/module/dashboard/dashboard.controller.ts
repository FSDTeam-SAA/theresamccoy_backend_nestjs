import type { Request } from 'express';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import AuthGuard from 'src/app/middlewares/auth.guard';

@ApiTags('Admin Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('business', 'bookkeeper'))
  @ApiOperation({
    summary: 'My dashboard: profile, contracts, training and unread messages',
  })
  async myOverview(@Req() req: Request) {
    return { data: await this.dashboardService.myOverview(req.user!) };
  }

  @Get('overview')
  @ApiOperation({
    summary: 'Get dashboard overview data',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async dashboardOverview() {
    const result = await this.dashboardService.dashboardOverView();

    return {
      message: 'Dashboard overview retrieved successfully',
      data: result,
    };
  }

  @Get('chart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Total earning chart — monthly revenue, commission & payout',
  })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2026 })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin'))
  async getTotalEarningChart(@Query('year') year?: string) {
    const data = await this.dashboardService.getTotalEarningChart(
      year ? Number(year) : undefined,
    );
    return { message: 'Total earning chart fetched successfully', data };
  }
}
