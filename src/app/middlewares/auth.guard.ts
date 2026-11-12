import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../module/user/entities/user.entity';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  mixin,
  Type,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import config from '../config';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

export default function AuthGuard(...roles: string[]): Type<CanActivate> {
  @Injectable()
  class AuthGuardImpl implements CanActivate {
    constructor(
      readonly jwtService: JwtService,
      @InjectModel(User.name) readonly users: Model<UserDocument>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();
      const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
      if (scheme !== 'Bearer') throw new HttpException('Unauthorized', 401);
      if (!token) throw new HttpException('Unauthorized', 401);

      const decoded = this.jwtService.verify<JwtPayload>(token, {
        secret: config.jwt.accessTokenSecret,
      });
      if (!decoded) throw new HttpException('Unauthorized', 401);

      const user = await this.users.findById(decoded.id);
      if (
        !user ||
        user.status !== 'active' ||
        (decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)
      )
        throw new HttpException('User is unavailable', 401);
      decoded.role = user.role;
      decoded.email = user.email;
      if (roles.length && !roles.includes(decoded.role)) {
        throw new HttpException('Forbidden', 403);
      }
      request.user = decoded;
      return true;
    }
  }
  return mixin(AuthGuardImpl);
}
