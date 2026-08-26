import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type BookkeeperDocument = HydratedDocument<Bookkeeper>;

@Schema({ timestamps: true })
export class Bookkeeper {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop()
  firstName!: string;

  @Prop()
  lastName!: string;

  @Prop()
  email!: string;

  @Prop()
  phoneNumber!: string;

  @Prop()
  city!: string;

  @Prop()
  state!: string;

  @Prop()
  zipCode!: string;

  @Prop()
  linkedInProfile!: string;
}

export const BookkeeperSchema = SchemaFactory.createForClass(Bookkeeper);
