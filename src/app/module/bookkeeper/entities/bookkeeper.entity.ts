import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type BookkeeperDocument = HydratedDocument<Bookkeeper>;

@Schema({ _id: true, versionKey: false })
export class BookkeeperCertification {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  issuer?: string;

  @Prop({ min: 1900, max: 2200 })
  year?: number;
}

export const BookkeeperCertificationSchema = SchemaFactory.createForClass(
  BookkeeperCertification,
);

@Schema({ _id: true, versionKey: false })
export class BookkeeperPortfolio {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  department?: string;

  @Prop({ trim: true })
  fileUrl?: string;
}

export const BookkeeperPortfolioSchema =
  SchemaFactory.createForClass(BookkeeperPortfolio);

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

  @Prop({ trim: true })
  profilePicture?: string;

  @Prop({ trim: true })
  professionalTitle?: string;

  @Prop({ trim: true, maxlength: 2000 })
  professionalBio?: string;

  @Prop({ type: [String], default: [] })
  languages!: string[];

  @Prop({ type: [String], default: [] })
  skills!: string[];

  @Prop({ type: [BookkeeperCertificationSchema], default: [] })
  certifications!: BookkeeperCertification[];

  @Prop({ type: [BookkeeperPortfolioSchema], default: [] })
  portfolio!: BookkeeperPortfolio[];

  @Prop({ min: 0 })
  hourlyRate?: number;

  @Prop({ min: 0 })
  projectsCompleted?: number;

  @Prop({ min: 0 })
  yearsOfExperience?: number;

  @Prop({ trim: true })
  availability?: string;

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

BookkeeperSchema.index({ userId: 1 }, { unique: true });
