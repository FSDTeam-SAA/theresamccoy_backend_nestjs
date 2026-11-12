import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
export type PageContentDocument = HydratedDocument<PageContent>;
export const PAGE_SLUGS = [
  'home',
  'about',
  'training',
  'apply',
  'contact',
] as const;

@Schema({ _id: false })
export class ContentItem {
  @Prop({ required: true }) title!: string;
  @Prop() description?: string;
  @Prop() imageUrl?: string;
  @Prop() linkUrl?: string;
}
const ItemSchema = SchemaFactory.createForClass(ContentItem);
@Schema({ _id: false })
export class ContentSection {
  @Prop({ required: true }) key!: string;
  @Prop({ required: true }) title!: string;
  @Prop() description?: string;
  @Prop() imageUrl?: string;
  @Prop({ type: [ItemSchema], default: [] }) items!: ContentItem[];
}
const SectionSchema = SchemaFactory.createForClass(ContentSection);
@Schema({ timestamps: true })
export class PageContent {
  @Prop({ required: true, unique: true, enum: PAGE_SLUGS }) slug!: string;
  @Prop({ type: [SectionSchema], default: [] }) sections!: ContentSection[];
  @Prop({ default: false }) published!: boolean;
}
export const PageContentSchema = SchemaFactory.createForClass(PageContent);
