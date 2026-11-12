import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PAGE_SLUGS, PageContent, PageContentDocument } from './content.entity';
import { UpdatePageContentDto } from './content.dto';
@Injectable()
export class ContentService {
  constructor(
    @InjectModel(PageContent.name)
    private readonly pages: Model<PageContentDocument>,
  ) {}
  private checkSlug(slug: string) {
    if (!(PAGE_SLUGS as readonly string[]).includes(slug))
      throw new BadRequestException('Unknown page slug');
  }
  async get(slug: string, admin = false) {
    this.checkSlug(slug);
    const page = await this.pages.findOne({
      slug,
      ...(admin ? {} : { published: true }),
    });
    if (!page) throw new NotFoundException('Page content not found');
    return page;
  }
  async update(slug: string, dto: UpdatePageContentDto) {
    this.checkSlug(slug);
    return this.pages.findOneAndUpdate(
      { slug },
      { $set: dto },
      { new: true, upsert: true, runValidators: true },
    );
  }
}
