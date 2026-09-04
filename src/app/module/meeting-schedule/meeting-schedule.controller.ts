import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MeetingScheduleService } from './meeting-schedule.service';
import { CreateMeetingScheduleDto } from './dto/create-meeting-schedule.dto';
import { UpdateMeetingScheduleDto } from './dto/update-meeting-schedule.dto';

@Controller('meeting-schedule')
export class MeetingScheduleController {
  constructor(private readonly meetingScheduleService: MeetingScheduleService) {}

  @Post()
  create(@Body() createMeetingScheduleDto: CreateMeetingScheduleDto) {
    return this.meetingScheduleService.create(createMeetingScheduleDto);
  }

  @Get()
  findAll() {
    return this.meetingScheduleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetingScheduleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMeetingScheduleDto: UpdateMeetingScheduleDto) {
    return this.meetingScheduleService.update(+id, updateMeetingScheduleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meetingScheduleService.remove(+id);
  }
}
