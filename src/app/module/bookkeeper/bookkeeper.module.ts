import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/entities/user.entity';
import { BookkeeperController } from './bookkeeper.controller';
import { BookkeeperService } from './bookkeeper.service';
import { Bookkeeper, BookkeeperSchema } from './entities/bookkeeper.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bookkeeper.name, schema: BookkeeperSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BookkeeperController],
  providers: [BookkeeperService],
})
export class BookkeeperModule {}
