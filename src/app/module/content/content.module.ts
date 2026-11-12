import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PageContent, PageContentSchema } from './content.entity';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PageContent.name, schema: PageContentSchema },
    ]),
  ],
  controllers: [ContentController],
  providers: [ContentService],
})
export class ContentModule {}
