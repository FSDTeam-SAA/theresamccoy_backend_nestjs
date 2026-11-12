import AuthGuard from './auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { UserDocument } from '../module/user/entities/user.entity';
describe('current account authorization', () => {
  it('rejects deleted accounts', async () => {
    const Guard = AuthGuard('admin');
    const guard = new Guard();
    // Nest supplies these dependencies in HTTP tests; assign here to test a deleted account.
    Object.assign(guard, {
      jwtService: {
        verify: () => ({ id: 'user', role: 'admin' }),
      } as unknown as JwtService,
      users: { findById: async () => null } as unknown as Model<UserDocument>,
    });
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: 'Bearer token' } }),
      }),
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(context)).rejects.toThrow(
      'User is unavailable',
    );
  });
});
