import { Controller } from '@nestjs/common';
import { MeetingScheduleService } from './meeting-schedule.service';

@Controller('meeting-schedule')
export class MeetingScheduleController {
  constructor(
    private readonly meetingScheduleService: MeetingScheduleService,
  ) {}
}
