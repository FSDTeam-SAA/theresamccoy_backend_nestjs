import { SupportService } from '../support/support.service';
import { Bookkeeper } from '../bookkeeper/entities/bookkeeper.entity';
import { Businesswoner } from '../businesswoner/entities/businesswoner.entity';
import { CourseProgress } from '../course/entities/course.entity';
import { EngagementService } from '../engagement/engagement.service';
import { JwtPayload } from '../../middlewares/auth.guard';
import { BadRequestException, Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../payment/entities/payment.entity';
import {
  ApplicationSubmission,
  SubmissionStatus,
} from '../application/entities/application-submission.entity';
import { Course, CourseEnrollment } from '../course/entities/course.entity';
import { Engagement } from '../engagement/entities/engagement.entity';
import { Review } from '../review/entities/review.entity';
import { Request } from '../request/entities/request.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Bookkeeper.name)
    private readonly bookkeepers: Model<Bookkeeper>,
    @InjectModel(Businesswoner.name)
    private readonly businesses: Model<Businesswoner>,
    @InjectModel(CourseProgress.name)
    private readonly progress: Model<CourseProgress>,
    private readonly support: SupportService,
    private readonly engagementService: EngagementService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(ApplicationSubmission.name)
    private readonly applications: Model<ApplicationSubmission>,
    @InjectModel(Course.name) private readonly courses: Model<Course>,
    @InjectModel(CourseEnrollment.name)
    private readonly enrollments: Model<CourseEnrollment>,
    @InjectModel(Engagement.name)
    private readonly engagements: Model<Engagement>,
    @InjectModel(Review.name) private readonly reviews: Model<Review>,
    @InjectModel(Request.name) private readonly requests: Model<Request>,
  ) {}

  async myOverview(actor: JwtPayload) {
    const isBusiness = actor.role === 'business';
    const [profile, contracts, inbox, training, applications, supportUnread] =
      await Promise.all([
        isBusiness
          ? this.businesses.findOne({ userId: actor.id })
          : this.bookkeepers.findOne({ userId: actor.id }),
        this.engagements
          .find({ [isBusiness ? 'businessId' : 'bookkeeperId']: actor.id })
          .sort({ createdAt: -1 })
          .limit(100),
        this.engagementService.inbox(actor),
        isBusiness
          ? []
          : this.progress
              .find({ userId: actor.id })
              .populate(
                'courseId',
                'name modules._id modules.name modules.lessons._id',
              ),
        isBusiness
          ? []
          : this.applications
              .find({ userId: actor.id })
              .select('formId status score submittedAt')
              .sort({ createdAt: -1 })
              .limit(10),
        this.support.unread(actor.id),
      ]);
    return {
      profile,
      contracts,
      activeEngagements: contracts.filter((item) => item.status === 'active')
        .length,
      supportUnread,
      unreadMessages:
        supportUnread +
        inbox.reduce((sum, thread) => sum + thread.unreadCount, 0),
      recentMessages: inbox.filter((thread) => thread.lastMessage).slice(0, 5),
      training,
      applications,
    };
  }

  async dashboardOverView() {
    const [
      totalUser,
      activeUser,
      suspended,
      bookkeepers,
      businesses,
      admins,
      applications,
      pendingApplications,
      courses,
      enrollments,
      engagements,
      activeEngagements,
      reviews,
      requests,
      pendingRequests,
      recentApplications,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ status: 'active' }),
      this.userModel.countDocuments({ status: 'suspended' }),
      this.userModel.countDocuments({ role: 'bookkeeper' }),
      this.userModel.countDocuments({ role: 'business' }),
      this.userModel.countDocuments({ role: 'admin' }),
      this.applications.countDocuments({
        status: { $ne: SubmissionStatus.DRAFT },
      }),
      this.applications.countDocuments({ status: SubmissionStatus.SUBMITTED }),
      this.courses.countDocuments(),
      this.enrollments.countDocuments(),
      this.engagements.countDocuments(),
      this.engagements.countDocuments({ status: 'active' }),
      this.reviews.countDocuments(),
      this.requests.countDocuments(),
      this.requests.countDocuments({ status: 'pending' }),
      this.applications
        .find({ status: { $ne: SubmissionStatus.DRAFT } })
        .select('candidateName positionName status score submittedAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const totalEarning = await this.paymentModel.aggregate([
      {
        $match: {
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const placement = await this.engagements.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, cents: { $sum: '$platformFeeCents' } } },
    ]);
    const placementFees = (placement[0]?.cents ?? 0) / 100;
    return {
      subscriptionEarnings: totalEarning[0]?.total || 0,
      placementFees,
      totalUser,
      activeUser,
      suspended,
      totalEarning: (totalEarning[0]?.total || 0) + placementFees,
      users: {
        total: totalUser,
        active: activeUser,
        suspended,
        bookkeepers,
        businesses,
        admins,
      },
      applications: { total: applications, pending: pendingApplications },
      training: { courses, enrollments },
      engagements: { total: engagements, active: activeEngagements },
      reviews,
      requests: { total: requests, pending: pendingRequests },
      recentApplications,
    };
  }

  async getTotalEarningChart(year?: number) {
    const targetYear = year ?? new Date().getFullYear();
    if (!Number.isInteger(targetYear) || targetYear < 2000 || targetYear > 2200)
      throw new BadRequestException('Year must be between 2000 and 2200');

    const result = await this.paymentModel.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: {
            $gte: new Date(`${targetYear}-01-01`),
            $lt: new Date(`${targetYear + 1}-01-01T00:00:00Z`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          totalRevenue: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const placement = await this.engagements.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          paidAt: {
            $gte: new Date(Date.UTC(targetYear, 0, 1)),
            $lt: new Date(Date.UTC(targetYear + 1, 0, 1)),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$paidAt' } },
          totalRevenue: { $sum: { $divide: ['$platformFeeCents', 100] } },
        },
      },
    ]);
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const chartData = months.map((label, i) => {
      const found = result.find((r) => r._id.month === i + 1);
      const totalRevenue = found
        ? Number(Number(found.totalRevenue).toFixed(2))
        : 0;
      const feeRevenue =
        placement.find((item) => item._id.month === i + 1)?.totalRevenue ?? 0;
      return {
        month: label,
        totalRevenue: Number((totalRevenue + feeRevenue).toFixed(2)),
        subscriptionRevenue: totalRevenue,
        placementFeeRevenue: feeRevenue,
      };
    });

    const totalYearRevenue = chartData.reduce((s, d) => s + d.totalRevenue, 0);

    return {
      year: targetYear,
      summary: {
        totalRevenue: Number(totalYearRevenue.toFixed(2)),
      },
      chartData,
    };
  }
}
