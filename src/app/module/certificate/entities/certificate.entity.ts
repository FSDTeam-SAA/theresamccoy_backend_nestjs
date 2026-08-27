import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type CertificateDocument = HydratedDocument<Certificate>;

@Schema({ timestamps: true })
export class Certificate {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bookkeeper',
    required: true,
  })
  bookkeeperId!: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true })
  courseId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true })
  issueDate!: Date;

  @Prop({ required: true, unique: true, trim: true })
  certificateID!: string;

  @Prop()
  certificateUrl?: string;
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);
