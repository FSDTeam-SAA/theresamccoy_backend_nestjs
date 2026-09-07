import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
import { User, UserDocument } from '../user/entities/user.entity';
import { Request, RequestDocument } from './entities/request.entity';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(Request.name)
    private readonly requestModel: Model<RequestDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Businesswoner.name)
    private readonly businesswonerModel: Model<BusinesswonerDocument>,
    @InjectModel(Bookkeeper.name)
    private readonly bookkeeperModel: Model<BookkeeperDocument>,
  ) {}

  async createRequest(businessId: string, bookkeeperId: string) {
    const businessWoner = await this.businesswonerModel.findOne({
      userId: businessId,
    });
    if (!businessWoner) {
      throw new HttpException('Business owner not found', HttpStatus.NOT_FOUND);
    }
    const bookkeeper = await this.bookkeeperModel.findById(bookkeeperId);
    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }
    const bookkeperUser = await this.userModel.findById(bookkeeper.userId);
    if (!bookkeperUser) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }
    const request = await this.requestModel.create({
      bookkeeperId: bookkeeper._id,
      businessId: businessWoner._id,
      status: 'pending',
    });
    return request;
  }

  async getAllRequest(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const whenConditions = buildWhereConditions(params, ['status']);
    const request = await this.requestModel
      .find(whenConditions)
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
    const total = await this.requestModel.countDocuments(whenConditions);
    return {
      data: request,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async getRequest(requestId: string) {
    const populate = [
      {
        path: 'bookkeeperId',
        populate: {
          path: 'userId',
          select: '-password',
        },
      },
      {
        path: 'businessId',
        populate: {
          path: 'userId',
          select: '-password',
        },
      },
    ];
    const result = await this.requestModel
      .findById(requestId)
      .populate(populate);
    return result;
  }

  async getMyRequests(
    userId: string,
    params: IFilterParams,
    options: IOptions,
  ) {
    const isBookkeeper = await this.bookkeeperModel.findOne({
      userId: userId,
    });
    const isBusinessOwner = await this.businesswonerModel.findOne({
      userId: userId,
    });

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
      ['status'],
      extraConditions,
    );
    const request = await this.requestModel
      .find(whenConditions)
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
    const total = await this.requestModel.countDocuments(whenConditions);
    return {
      data: request,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async acceptRequest(requestId: string, bookkeeperId: string) {
    const request = await this.requestModel.findById(requestId);
    if (!request) {
      throw new HttpException('Request not found', HttpStatus.NOT_FOUND);
    }
    const bookkeeper = await this.bookkeeperModel.findOne({
      userId: bookkeeperId,
    });
    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }
    const bookkeperUser = await this.userModel.findById(bookkeeper.userId);
    if (!bookkeperUser) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }
    request.bookkeeperId = bookkeeper._id;
    request.status = 'accepted';
    await request.save();
    return request;
  }

  async rejectRequest(requestId: string, bookkeeperId: string) {
    const request = await this.requestModel.findById(requestId);
    if (!request) {
      throw new HttpException('Request not found', HttpStatus.NOT_FOUND);
    }
    const bookkeeper = await this.bookkeeperModel.findOne({
      userId: bookkeeperId,
    });
    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }
    const bookkeperUser = await this.userModel.findById(bookkeeper.userId);
    if (!bookkeperUser) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }
    request.bookkeeperId = bookkeeper._id;
    request.status = 'rejected';
    await request.save();
    return request;
  }
}
