import { Schema as MongooseSchema } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
@Schema({ timestamps: true })
export class SupportMessage {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  senderId!: Types.ObjectId;
  @Prop({ required: true, trim: true, maxlength: 5000 }) text!: string;
  @Prop({ required: true }) fromAdmin!: boolean;
  @Prop({ type: Date }) readAt?: Date;
}
export const SupportMessageSchema =
  SchemaFactory.createForClass(SupportMessage);
SupportMessageSchema.index({ userId: 1, _id: -1 });
