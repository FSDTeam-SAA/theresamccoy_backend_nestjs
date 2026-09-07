import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import buildWhereConditions from 'src/app/helpers/buildWhereConditions';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';
import {
  Bookkeeper,
  BookkeeperDocument,
} from '../bookkeeper/entities/bookkeeper.entity';
import {
  Businesswoner,
  BusinesswonerDocument,
} from '../businesswoner/entities/businesswoner.entity';
import { Request, RequestDocument } from '../request/entities/request.entity';
import { CreateMeetingScheduleDto } from './dto/create-meeting-schedule.dto';
import {
  MeetingSchedule,
  MeetingScheduleDocument,
} from './entities/meeting-schedule.entity';

@Injectable()
export class MeetingScheduleService {
  constructor(
    @InjectModel(MeetingSchedule.name)
    private readonly meetingScheduleModel: Model<MeetingScheduleDocument>,
    @InjectModel(Request.name)
    private readonly requestModel: Model<RequestDocument>,
    @InjectModel(Businesswoner.name)
    private readonly businesswonerModel: Model<BusinesswonerDocument>,
    @InjectModel(Bookkeeper.name)
    private readonly bookkeeperModel: Model<BookkeeperDocument>,
  ) {}

  async scheduleMeeting(
    requestId: string,
    createMeetingScheduleDto: CreateMeetingScheduleDto,
  ) {
    const request = await this.requestModel.findById(requestId);
    if (!request) {
      throw new HttpException('Request not found', HttpStatus.NOT_FOUND);
    }

    if (request.status === 'rejected') {
      throw new HttpException(
        'Cannot schedule a meeting for a rejected request',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingMeeting = await this.meetingScheduleModel.findOne({
      requestId: request._id,
      status: { $in: ['pending', 'scheduled'] },
    });
    if (existingMeeting) {
      throw new HttpException(
        'A meeting is already scheduled for this request',
        HttpStatus.BAD_REQUEST,
      );
    }

    const meetingSchedule = await this.meetingScheduleModel.create({
      requestId: request._id,
      bookkeeperId: request.bookkeeperId,
      businessId: request.businessId,
      date: createMeetingScheduleDto.date,
      time: createMeetingScheduleDto.time,
      meetingLink: createMeetingScheduleDto.meetingLink,
      meetingNote: createMeetingScheduleDto.meetingNote,
      status: createMeetingScheduleDto.status || 'scheduled',
    });

    return meetingSchedule;
  }

  async getAllMeetingSchedules(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whenConditions = buildWhereConditions(params, [
      'status',
      'meetingNote',
    ]);
    const schedules = await this.meetingScheduleModel
      .find(whenConditions)
      .populate('requestId')
      .populate({
        path: 'bookkeeperId',
        populate: {
          path: 'userId',
          select: '-password',
        },
      })
      .populate({
        path: 'businessId',
        populate: {
          path: 'userId',
          select: '-password',
        },
      })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder });

    return {
      data: schedules,
      meta: {
        page,
        limit,
      },
    };
  }

  async getMyMeetingSchedules(
    userId: string,
    params: IFilterParams,
    options: IOptions,
  ) {
    const isBookkeeper = await this.bookkeeperModel.findOne({ userId });
    const isBusinessOwner = await this.businesswonerModel.findOne({ userId });

    if (!isBookkeeper && !isBusinessOwner) {
      throw new HttpException(
        'Bookkeeper or Business Owner profile not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const extraConditions: Record<string, any> = {};

    if (isBookkeeper && isBusinessOwner) {
      extraConditions.$or = [
        { bookkeeperId: isBookkeeper._id },
        { businessId: isBusinessOwner._id },
      ];
    } else if (isBookkeeper) {
      extraConditions.bookkeeperId = isBookkeeper._id;
    } else if (isBusinessOwner) {
      extraConditions.businessId = isBusinessOwner._id;
    }

    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whenConditions = buildWhereConditions(
      params,
      ['status', 'meetingNote'],
      extraConditions,
    );

    const schedules = await this.meetingScheduleModel
      .find(whenConditions)
      .populate('requestId')
      .populate({
        path: 'bookkeeperId',
        populate: {
          path: 'userId',
          select: '-password',
        },
      })
      .populate({
        path: 'businessId',
        populate: {
          path: 'userId',
          select: '-password',
        },
      })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder });

    const total =
      await this.meetingScheduleModel.countDocuments(whenConditions);
    return {
      data: schedules,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async getMeetingScheduleById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST);
    }

    const result = await this.meetingScheduleModel
      .findOne({
        $or: [{ _id: id }, { requestId: id }],
      })
      .populate('requestId')
      .populate({
        path: 'bookkeeperId',

        populate: {
          path: 'userId',
          select: '-password',
        },
      })
      .populate({
        path: 'businessId',
        populate: {
          path: 'userId',
          select: '-password',
        },
      });

    if (!result) {
      throw new HttpException(
        'Meeting schedule not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }

  async updateMeetingSchedule(
    id: string,
    updateMeetingScheduleDto: CreateMeetingScheduleDto,
  ) {
    const meetingSchedule = await this.meetingScheduleModel.findById(id);
    if (!meetingSchedule) {
      throw new HttpException(
        'Meeting schedule not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const updatedSchedule = await this.meetingScheduleModel.findByIdAndUpdate(
      meetingSchedule._id,
      updateMeetingScheduleDto,
      { new: true },
    );
    if (!updatedSchedule) {
      throw new HttpException(
        'Meeting schedule not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return updatedSchedule;
  }

  async deleteMeetingSchedule(id: string) {
    const meetingSchedule = await this.meetingScheduleModel.findById(id);
    if (!meetingSchedule) {
      throw new HttpException(
        'Meeting schedule not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const deletedSchedule = await this.meetingScheduleModel.findByIdAndDelete(
      meetingSchedule._id,
    );
    if (!deletedSchedule) {
      throw new HttpException(
        'Meeting schedule not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return deletedSchedule;
  }

  async changeMeetingStatus(id: string, status: string) {
    const meetingSchedule = await this.meetingScheduleModel.findById(id);
    if (!meetingSchedule) {
      throw new HttpException(
        'Meeting schedule not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const updatedSchedule = await this.meetingScheduleModel.findByIdAndUpdate(
      meetingSchedule._id,
      { status },
      { new: true },
    );
    if (!updatedSchedule) {
      throw new HttpException(
        'Meeting schedule not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return updatedSchedule;
  }
}
