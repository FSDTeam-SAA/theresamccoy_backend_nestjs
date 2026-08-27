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

  // exprience
  @Prop()
  experience!: string;

  @Prop()
  highestBookkeeperCredential!: string;

  @Prop()
  resentEmployer!: string;

  @Prop()
  industryExperience!: string;

  @Prop()
  bookkeeperBackground!: string;

  //skills
  @Prop()
  quiceBooksOnline!: string;

  @Prop()
  quickBooksDesktop!: string;

  @Prop()
  xero!: string;

  @Prop()
  freshBooks!: string;

  @Prop()
  waveAccounting!: string;

  @Prop()
  excelSheets!: string;

  @Prop()
  billMemo!: string;

  @Prop()
  gusto!: string;

  @Prop()
  aiTools!: string;

  @Prop()
  bookkeepingselect!: string[];

  @Prop()
  specialyTrackInterest!: string;

  //assessment
  @Prop()
  downloadAssessment!: string;

  @Prop()
  uploadResume!: string;

  @Prop()
  uploadAssessment!: string;

  //availability
  @Prop()
  workArrangement!: string;

  @Prop()
  engagmentType!: string;

  @Prop()
  availabilityDays!: string[];

  @Prop()
  hourRateRange!: string;

  @Prop()
  mountlyInterest!: string;

  @Prop()
  referralSourse!: string;

  @Prop()
  referralName!: string;

  @Prop()
  additionalNote!: string;
}

export const BookkeeperSchema = SchemaFactory.createForClass(Bookkeeper);
