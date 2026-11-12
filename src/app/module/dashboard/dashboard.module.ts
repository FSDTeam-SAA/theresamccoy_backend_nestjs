import { CourseModule } from '../course/course.module';
import { ApplicationFormModule } from '../application/application-form.module';
import { SupportModule } from '../support/support.module';
import {
  Bookkeeper,
  BookkeeperSchema,
} from '../bookkeeper/entities/bookkeeper.entity';
import {
  Businesswoner,
  BusinesswonerSchema,
} from '../businesswoner/entities/businesswoner.entity';
import {
  CourseProgress,
  CourseProgressSchema,
} from '../course/entities/course.entity';
import { EngagementModule } from '../engagement/engagement.module';
import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/entities/user.entity';
import { Payment, PaymentSchema } from '../payment/entities/payment.entity';
import {
  ApplicationSubmission,
  ApplicationSubmissionSchema,
} from '../application/entities/application-submission.entity';
import {
  Course,
  CourseSchema,
  CourseEnrollment,
  CourseEnrollmentSchema,
} from '../course/entities/course.entity';
import {
  Engagement,
  EngagementSchema,
} from '../engagement/entities/engagement.entity';
import { Review, ReviewSchema } from '../review/entities/review.entity';
import { Request, RequestSchema } from '../request/entities/request.entity';

@Module({
  imports: [
    CourseModule,
    ApplicationFormModule,
    SupportModule,
    EngagementModule,
    MongooseModule.forFeature([
      { name: Bookkeeper.name, schema: BookkeeperSchema },
      { name: Businesswoner.name, schema: BusinesswonerSchema },
      { name: CourseProgress.name, schema: CourseProgressSchema },
      { name: User.name, schema: UserSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: ApplicationSubmission.name, schema: ApplicationSubmissionSchema },
      { name: Course.name, schema: CourseSchema },
      { name: CourseEnrollment.name, schema: CourseEnrollmentSchema },
      { name: Engagement.name, schema: EngagementSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Request.name, schema: RequestSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
