import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/entities/user.entity';
import { BusinesswonerController } from './businesswoner.controller';
import { BusinesswonerService } from './businesswoner.service';
import {
  Businesswoner,
  BusinesswonerSchema,
} from './entities/businesswoner.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Businesswoner.name, schema: BusinesswonerSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BusinesswonerController],
  providers: [BusinesswonerService],
})
export class BusinesswonerModule {}
