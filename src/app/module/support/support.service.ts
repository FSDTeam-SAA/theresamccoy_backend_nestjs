import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../user/entities/user.entity';
import { SupportMessage } from './support.entity';
import { JwtPayload } from '../../middlewares/auth.guard';
@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportMessage.name)
    private readonly messages: Model<SupportMessage>,
    @InjectModel(User.name) private readonly users: Model<User>,
  ) {}
  private async target(userId: string) {
    if (!Types.ObjectId.isValid(userId))
      throw new BadRequestException('Invalid user ID');
    if (
      !(await this.users.exists({
        _id: userId,
        role: { $in: ['business', 'bookkeeper'] },
      }))
    )
      throw new NotFoundException('Support user not found');
  }
  async send(userId: string, actor: JwtPayload, text: string) {
    await this.target(userId);
    if (!text.trim()) throw new BadRequestException('Message is required');
    return this.messages.create({
      userId,
      senderId: actor.id,
      text: text.trim(),
      fromAdmin: actor.role === 'admin',
    });
  }
  async list(userId: string, before?: string) {
    await this.target(userId);
    if (before && !Types.ObjectId.isValid(before))
      throw new BadRequestException('Invalid cursor');
    return this.messages
      .find({
        userId,
        ...(before ? { _id: { $lt: new Types.ObjectId(before) } } : {}),
      })
      .sort({ _id: -1 })
      .limit(50);
  }
  async read(userId: string, actor: JwtPayload, through: string) {
    await this.target(userId);
    if (!Types.ObjectId.isValid(through))
      throw new BadRequestException('Invalid cursor');
    const result = await this.messages.updateMany(
      {
        userId,
        fromAdmin: actor.role !== 'admin',
        _id: { $lte: new Types.ObjectId(through) },
        readAt: { $exists: false },
      },
      { $set: { readAt: new Date() } },
    );
    return { markedRead: result.modifiedCount };
  }
  async inbox() {
    return this.messages.aggregate([
      { $sort: { _id: -1 } },
      {
        $group: {
          _id: '$userId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$fromAdmin', false] },
                    { $eq: [{ $ifNull: ['$readAt', null] }, null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { 'lastMessage._id': -1 } },
      { $limit: 100 },
    ]);
  }
  async unread(userId: string) {
    return this.messages.countDocuments({
      userId,
      fromAdmin: true,
      readAt: { $exists: false },
    });
  }
}
