import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Engagement,
  EngagementSchema,
} from '../engagement/entities/engagement.entity';
import { Review, ReviewSchema } from './entities/review.entity';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Engagement.name, schema: EngagementSchema },
    ]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
