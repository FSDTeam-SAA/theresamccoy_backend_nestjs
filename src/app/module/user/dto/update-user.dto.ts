import { CreateUserDto } from './create-user.dto';
import { OmitType, PartialType, PickType } from '@nestjs/swagger';

// Password and recovery state are changed only through authentication flows.
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, [
    'password',
    'otp',
    'otpExpiry',
    'verifiedForget',
    'stripeAccountId',
  ] as const),
) {}
export class UpdateMyUserProfileDto extends PartialType(
  PickType(CreateUserDto, [
    'firstName',
    'lastName',
    'phoneNumber',
    'profilePicture',
    'address',
  ] as const),
) {}
