import { Injectable } from '@nestjs/common';

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

    return {
      totalUser,
      activeUser,
      suspended,
      totalEarning: totalEarning[0]?.total || 0,
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

    const result = await this.paymentModel.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: {
            $gte: new Date(`${targetYear}-01-01`),
            $lte: new Date(`${targetYear}-12-31T23:59:59`),
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
      return { month: label, totalRevenue };
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
