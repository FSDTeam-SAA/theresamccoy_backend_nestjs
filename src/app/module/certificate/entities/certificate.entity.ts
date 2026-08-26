import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type CertificateDocument = HydratedDocument<Certificate>;

@Schema({ timestamps: true })
export class Certificate {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Bookkeeper' })
  bookkeeperId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Course' })
  courseId?: Types.ObjectId;

  @Prop()
  title!: string;

  @Prop()
  issueData!: Date;

  @Prop()
  certificateID!: string;

  @Prop()
  certificateUrl?: string;
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);
