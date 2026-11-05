import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
export type ReviewDocument = HydratedDocument<Review>;

@Schema({ timestamps: true })
export class Review {
  @Prop({
    type: Types.ObjectId,
    ref: 'Engagement',
    required: true,
    index: true,
  })
  engagementId!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  reviewerId!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  revieweeId!: Types.ObjectId;
  @Prop({ required: true, min: 1, max: 5 })
  rating!: number;
  @Prop({ required: true, trim: true, maxlength: 2000 })
  comment!: string;
}
export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index({ engagementId: 1, reviewerId: 1 }, { unique: true });
