import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import {
  SendMessageDto,
  ReadMessagesDto,
} from '../engagement/dto/create-engagement.dto';
import { SupportService } from './support.service';
@ApiTags('Platform support')
@ApiBearerAuth('access-token')
@Controller('support')
export class SupportController {
  constructor(private readonly service: SupportService) {}
  @Get('me')
  @UseGuards(AuthGuard('business', 'bookkeeper'))
  @ApiOperation({
    summary: 'My support messages; newest first, cursor pagination',
  })
  async mine(@Req() req: Request, @Query('before') before?: string) {
    return { data: await this.service.list(req.user!.id, before) };
  }
  @Get('me/unread')
  @UseGuards(AuthGuard('business', 'bookkeeper'))
  async unread(@Req() req: Request) {
    return { data: { unreadCount: await this.service.unread(req.user!.id) } };
  }
  @Post('me')
  @UseGuards(AuthGuard('business', 'bookkeeper'))
  async send(@Req() req: Request, @Body() dto: SendMessageDto) {
    return { data: await this.service.send(req.user!.id, req.user!, dto.text) };
  }
  @Patch('me/read')
  @UseGuards(AuthGuard('business', 'bookkeeper'))
  async read(@Req() req: Request, @Body() dto: ReadMessagesDto) {
    return {
      data: await this.service.read(req.user!.id, req.user!, dto.through),
    };
  }
  @Get('admin/inbox')
  @UseGuards(AuthGuard('admin'))
  async inbox() {
    return { data: await this.service.inbox() };
  }
  @Get('admin/:userId')
  @UseGuards(AuthGuard('admin'))
  async thread(@Param('userId') id: string, @Query('before') before?: string) {
    return { data: await this.service.list(id, before) };
  }
  @Post('admin/:userId')
  @UseGuards(AuthGuard('admin'))
  async reply(
    @Param('userId') id: string,
    @Req() req: Request,
    @Body() dto: SendMessageDto,
  ) {
    return { data: await this.service.send(id, req.user!, dto.text) };
  }
  @Patch('admin/:userId/read')
  @UseGuards(AuthGuard('admin'))
  async adminRead(
    @Param('userId') id: string,
    @Req() req: Request,
    @Body() dto: ReadMessagesDto,
  ) {
    return { data: await this.service.read(id, req.user!, dto.through) };
  }
}
