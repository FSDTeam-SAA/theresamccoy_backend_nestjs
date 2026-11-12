import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtPayload } from '../../middlewares/auth.guard';
import { Engagement } from '../engagement/entities/engagement.entity';
import { CreateReviewDto } from './dto/review.dto';
import { Review, ReviewDocument } from './entities/review.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private readonly reviews: Model<ReviewDocument>,
    @InjectModel(Engagement.name)
    private readonly engagements: Model<Engagement>,
  ) {}
  async create(dto: CreateReviewDto, actor: JwtPayload) {
    const engagement = await this.engagements.findById(dto.engagementId);
    if (!engagement) throw new NotFoundException('Engagement not found');
    if (engagement.status !== 'completed')
      throw new ConflictException('Complete the engagement before reviewing');
    const participants = [
      String(engagement.businessId),
      String(engagement.bookkeeperId),
    ];
    if (!participants.includes(actor.id)) throw new ForbiddenException();
    const revieweeId =
      String(engagement.businessId) === actor.id
        ? engagement.bookkeeperId
        : engagement.businessId;
    try {
      return await this.reviews.create({
        ...dto,
        reviewerId: actor.id,
        revieweeId,
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000)
        throw new ConflictException('You already reviewed this engagement');
      throw error;
    }
  }
  async listForUser(userId: string) {
    if (!Types.ObjectId.isValid(userId))
      throw new BadRequestException('Invalid user ID');
    const [data, summary] = await Promise.all([
      this.reviews
        .find({ revieweeId: userId })
        .populate('reviewerId', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 }),
      this.reviews.aggregate([
        {
          $match: {
            revieweeId: new Types.ObjectId(userId),
          },
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
    ]);
    return {
      data,
      summary: summary[0] ?? { averageRating: 0, totalReviews: 0 },
    };
  }
}
