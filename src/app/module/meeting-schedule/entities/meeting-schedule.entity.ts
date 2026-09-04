import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type MeetingScheduleDocument = HydratedDocument<MeetingSchedule>;

@Schema({ timestamps: true })
export class MeetingSchedule {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  bookkeeperId!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  businessId!: string;

  @Prop({ type: String, required: true })
  date!: string;

  @Prop({ type: String, required: true })
  time!: string;

  @Prop({ type: String, required: true })
  meetingLink!: string;

  @Prop()
  meetingNote!: string;
}

export const MeetingScheduleSchema =
  SchemaFactory.createForClass(MeetingSchedule);
