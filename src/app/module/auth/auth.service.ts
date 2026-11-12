import { randomInt, createHash, randomBytes } from 'crypto';
import { HttpException, Injectable } from '@nestjs/common';
import * as jwt from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { Model } from 'mongoose';
import sendMailer from 'src/app/helpers/sendMailer';
import config from '../../config';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateAuthDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: jwt.JwtService,
  ) {}

  async register(CreateAuthDto: CreateAuthDto) {
    if (!['bookkeeper', 'business'].includes(CreateAuthDto.role ?? 'business'))
      throw new HttpException('Invalid registration role', 400);
    const user = await this.userModel.findOne({ email: CreateAuthDto.email });
    if (user) {
      throw new HttpException('User already exists', 400);
    }
    const newUser = await this.userModel.create({
      firstName: CreateAuthDto.firstName,
      lastName: CreateAuthDto.lastName,
      email: CreateAuthDto.email,
      password: CreateAuthDto.password,
      role: CreateAuthDto.role ?? 'business',
    });
    return newUser;
  }

  async login(loginDto: { email: string; password: string }, res: Response) {
    const user = await this.userModel
      .findOne({ email: loginDto.email })
      .select('+password');
    if (!user) {
      throw new HttpException('User not found', 404);
    }

    if (user.status !== 'active')
      throw new HttpException('Account is suspended', 403);
    const isPasswordMatch = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordMatch) {
      throw new HttpException('Incorrect password', 401);
    }

    const accessToken = this.jwtService.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion ?? 0,
      },
      {
        secret: config.jwt.accessTokenSecret,
        expiresIn: config.jwt.accessTokenExpires as any,
      } as jwt.JwtSignOptions,
    );
    const refreshToken = this.jwtService.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion ?? 0,
      },
      {
        secret: config.jwt.refreshTokenSecret,
        expiresIn: config.jwt.refreshTokenExpires as any,
      } as jwt.JwtSignOptions,
    );
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'strict',
    });

    const safeUser = user.toObject() as unknown as Record<string, unknown>;
    for (const key of [
      'password',
      'otp',
      'otpExpiry',
      'verifiedForget',
      'resetTokenHash',
      'resetTokenExpiry',
      'otpAttempts',
      'tokenVersion',
    ])
      delete safeUser[key];
    return { accessToken, user: safeUser };
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken)
      throw new HttpException('Refresh token is required', 401);
    let payload: { id: string; tokenVersion?: number };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: config.jwt.refreshTokenSecret,
      });
    } catch {
      throw new HttpException('Invalid or expired refresh token', 401);
    }
    const user = await this.userModel.findById(payload.id);
    if (
      !user ||
      user.status !== 'active' ||
      (payload.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)
    )
      throw new HttpException('User is unavailable', 401);
    return {
      accessToken: this.jwtService.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role,
          tokenVersion: user.tokenVersion ?? 0,
        },
        {
          secret: config.jwt.accessTokenSecret,
          expiresIn: config.jwt.accessTokenExpires as any,
        } as jwt.JwtSignOptions,
      ),
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new HttpException('Email not found', 404);

    if (user.otpSentAt && Date.now() - user.otpSentAt.getTime() < 60000)
      throw new HttpException(
        'Wait 60 seconds before requesting another OTP',
        429,
      );
    user.otpSentAt = new Date();
    const generateOtpNumber = randomInt(100000, 1000000);

    user.otp = createHash('sha256')
      .update(generateOtpNumber.toString())
      .digest('hex');
    user.verifiedForget = false;
    user.resetTokenHash = undefined;
    user.resetTokenExpiry = undefined;
    user.otpAttempts = 0;
    user.otpExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const html = `
    <div style="font-family: Arial; text-align: center;">
      <h2 style="color:#4f46e5;">Password Reset OTP</h2>
      <p>Your OTP code is:</p>
      <h1 style="letter-spacing:4px;">${generateOtpNumber}</h1>
      <p>This code will expire in 1 hour.</p>
    </div>
  `;

    await sendMailer(user.email, 'Reset Password OTP', html);

    return { message: 'Check your email for OTP' };
  }

  async verifyEmail(email: string, otp: string) {
    const resetToken = randomBytes(32).toString('hex');
    // Consume OTP once, atomically. Concurrent verification cannot issue two proofs.
    const user = await this.userModel.findOneAndUpdate(
      {
        email,
        otp: createHash('sha256').update(otp).digest('hex'),
        otpExpiry: { $gt: new Date() },
        otpAttempts: { $lt: 5 },
      },
      {
        $unset: { otp: '', otpExpiry: '' },
        $set: {
          verifiedForget: true,
          resetTokenHash: createHash('sha256').update(resetToken).digest('hex'),
          resetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000),
        },
      },
      { new: true },
    );
    if (!user) {
      await this.userModel.updateOne(
        { email, otp: { $exists: true }, otpAttempts: { $lt: 5 } },
        { $inc: { otpAttempts: 1 } },
      );
      throw new HttpException(
        'Invalid, expired or exhausted OTP; request a new code',
        400,
      );
    }
    return {
      message: 'OTP verified successfully',
      resetToken,
      expiresInSeconds: 600,
    };
  }

  async resetPasswordChange(
    email: string,
    newPassword: string,
    resetToken: string,
  ) {
    if (!resetToken) throw new HttpException('Reset token is required', 400);
    const password = await bcrypt.hash(newPassword, config.bcryptSaltRounds);
    // Password and one-time proof change in one write; query updates do not run save hooks.
    const user = await this.userModel.findOneAndUpdate(
      {
        email,
        resetTokenHash: createHash('sha256').update(resetToken).digest('hex'),
        resetTokenExpiry: { $gt: new Date() },
      },
      {
        $unset: {
          resetTokenHash: '',
          resetTokenExpiry: '',
          otp: '',
          otpExpiry: '',
        },
        $set: { password, verifiedForget: false },
        $inc: { tokenVersion: 1 },
      },
      { new: true, runValidators: true },
    );
    if (!user) throw new HttpException('Invalid or expired reset token', 400);
    return { message: 'Password reset successfully' };
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.userModel.findById(userId).select('+password');
    if (!user) throw new HttpException('User not found', 404);
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) throw new HttpException('Invalid old password', 400);

    if (oldPassword === newPassword)
      throw new HttpException(
        'New password cannot be same as old password',
        400,
      );

    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }
}
