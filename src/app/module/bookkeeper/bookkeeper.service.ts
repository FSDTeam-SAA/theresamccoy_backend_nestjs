import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import buildWhereConditions from 'src/app/helpers/buildWhereConditions';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import { IFilterParams } from 'src/app/helpers/pick';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateBookkeeperDto } from './dto/create-bookkeeper.dto';
import { UpdateBookkeeperDto } from './dto/update-bookkeeper.dto';
import { Bookkeeper, BookkeeperDocument } from './entities/bookkeeper.entity';

@Injectable()
export class BookkeeperService {
  constructor(
    @InjectModel(Bookkeeper.name)
    private readonly bookkeeperModel: Model<BookkeeperDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async createBookkeeper(
    userId: string,
    createBookkeeperDto: CreateBookkeeperDto,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const bookkeeper = await this.bookkeeperModel.create({
      ...createBookkeeperDto,
      userId: user._id,
    });
    return bookkeeper;
  }

  async getAllBookkeepers(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);

    const whenCondition = buildWhereConditions(params, [
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'city',
      'state',
    ]);

    const bookkeepers = await this.bookkeeperModel
      .find(whenCondition)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await this.bookkeeperModel.countDocuments(whenCondition);

    return {
      data: bookkeepers,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async getSingleBookkeeper(id: string) {
    const bookkeeper = await this.bookkeeperModel.findById(id);
    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }
    return bookkeeper;
  }

  async updateByBookkeeper(
    id: string,
    updateBookkeeperDto: UpdateBookkeeperDto,
  ) {
    const bookkeeper = await this.bookkeeperModel.findById(id);
    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }
    const result = await this.bookkeeperModel.findByIdAndUpdate(
      id,
      { $set: updateBookkeeperDto },
      { new: true },
    );
    return result;
  }

  async removeByBookkeeper(id: string) {
    const bookkeeper = await this.bookkeeperModel.findByIdAndDelete(id);
    if (!bookkeeper) {
      throw new HttpException('Bookkeeper not found', HttpStatus.NOT_FOUND);
    }
    return bookkeeper;
  }
}
