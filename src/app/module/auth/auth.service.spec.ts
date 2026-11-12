import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAuthDto, ResetPasswordDto } from './dto/create-auth.dto';
import { UpdateMyUserProfileDto } from '../user/dto/update-user.dto';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { UserDocument } from '../user/entities/user.entity';

describe('authentication boundaries', () => {
  it.each([{ $ne: null }, { $regex: '.*' }, ['user@example.com'], null])(
    'rejects non-string email before any recovery query: %j',
    async (email) => {
      const findOne = jest.fn();
      const findOneAndUpdate = jest.fn();
      const updateOne = jest.fn();
      const service = new AuthService(
        {
          findOne,
          findOneAndUpdate,
          updateOne,
        } as unknown as Model<UserDocument>,
        {} as JwtService,
      );
      await expect(
        service.forgotPassword(email as unknown as string),
      ).rejects.toThrow('Email must be a string');
      await expect(
        service.verifyEmail(email as unknown as string, '123456'),
      ).rejects.toThrow('Email must be a string');
      await expect(
        service.resetPasswordChange(
          email as unknown as string,
          'secret123',
          'proof',
        ),
      ).rejects.toThrow('Email must be a string');
      expect(findOne).not.toHaveBeenCalled();
      expect(findOneAndUpdate).not.toHaveBeenCalled();
      expect(updateOne).not.toHaveBeenCalled();
    },
  );
  it('uses explicit email equality in both OTP verification queries', async () => {
    const findOneAndUpdate = jest.fn(async () => null);
    const updateOne = jest.fn(async () => ({}));
    const service = new AuthService(
      { findOneAndUpdate, updateOne } as unknown as Model<UserDocument>,
      {} as JwtService,
    );
    await expect(
      service.verifyEmail('user@example.com', '123456'),
    ).rejects.toThrow('Invalid, expired or exhausted OTP');
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ email: { $eq: 'user@example.com' } }),
      expect.any(Object),
      expect.any(Object),
    );
    expect(updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ email: { $eq: 'user@example.com' } }),
      { $inc: { otpAttempts: 1 } },
    );
  });
  it('rejects public admin registration and normalizes email', async () => {
    const dto = plainToInstance(CreateAuthDto, {
      firstName: 'Test',
      lastName: 'User',
      email: ' USER@EXAMPLE.COM ',
      password: 'secret123',
      role: 'admin',
    });
    expect(dto.email).toBe('user@example.com');
    expect(
      (await validate(dto)).some((error) => error.property === 'role'),
    ).toBe(true);
  });
  it('requires proof on password reset', async () => {
    const dto = plainToInstance(ResetPasswordDto, {
      email: 'user@example.com',
      newPassword: 'secret123',
    });
    expect(
      (await validate(dto)).some((error) => error.property === 'resetToken'),
    ).toBe(true);
  });
  it('strips privilege, password and recovery fields from profile edits', async () => {
    const dto = plainToInstance(UpdateMyUserProfileDto, {
      firstName: 'Updated',
      role: 'admin',
      password: 'secret123',
      verifiedForget: true,
      status: 'active',
    });
    await validate(dto, { whitelist: true });
    expect(dto).toEqual({ firstName: 'Updated' });
  });
  it('blocks admin registration even if the service is called directly', async () => {
    const create = jest.fn();
    const service = new AuthService(
      { create } as unknown as Model<UserDocument>,
      {} as JwtService,
    );
    await expect(
      service.register({ role: 'admin' } as CreateAuthDto),
    ).rejects.toThrow('Invalid registration role');
    expect(create).not.toHaveBeenCalled();
  });
  it('does not reset a password with missing, expired or already consumed proof', async () => {
    const findOneAndUpdate = jest.fn(async () => null);
    const service = new AuthService(
      { findOneAndUpdate } as unknown as Model<UserDocument>,
      {} as JwtService,
    );
    await expect(
      service.resetPasswordChange('u@example.com', 'secret123', ''),
    ).rejects.toThrow('Reset token is required');
    expect(findOneAndUpdate).not.toHaveBeenCalled();
    await expect(
      service.resetPasswordChange('u@example.com', 'secret123', 'consumed'),
    ).rejects.toThrow('Invalid or expired reset token');
    expect(findOneAndUpdate.mock.calls.length).toBe(1);
  });
});
