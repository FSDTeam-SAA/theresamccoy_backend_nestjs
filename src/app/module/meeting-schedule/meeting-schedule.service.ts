import { Injectable } from '@nestjs/common';
import { CreateMeetingScheduleDto } from './dto/create-meeting-schedule.dto';
import { UpdateMeetingScheduleDto } from './dto/update-meeting-schedule.dto';

@Injectable()
export class MeetingScheduleService {
  create(createMeetingScheduleDto: CreateMeetingScheduleDto) {
    return 'This action adds a new meetingSchedule';
  }

  findAll() {
    return `This action returns all meetingSchedule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} meetingSchedule`;
  }

  update(id: number, updateMeetingScheduleDto: UpdateMeetingScheduleDto) {
    return `This action updates a #${id} meetingSchedule`;
  }

  remove(id: number) {
    return `This action removes a #${id} meetingSchedule`;
  }
}
