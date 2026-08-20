import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type BusinesswonerDocument = HydratedDocument<Businesswoner>;

@Schema({ timestamps: true })
export class Businesswoner {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop()
  fullName!: string;

  @Prop()
  businessName!: string;

  @Prop()
  businessEmail!: string;

  @Prop()
  businessPhoneNumber!: string;

  @Prop()
  preherrenceLanguage!: string;

  @Prop()
  industry!: string;

  @Prop()
  entityType!: string;

  @Prop()
  yearInBusiness!: number;

  @Prop()
  numberEmployees!: number;

  @Prop()
  businessLocation!: string;

  @Prop()
  website!: string;

  @Prop()
  onsiteOnVirtual!: string;

  @Prop()
  whereDoYouStandToday!: string;

  @Prop()
  currentSystem!: string;

  @Prop()
  monthlyTransactions!: string;

  @Prop()
  serviceYouAreLookingFor!: string;

  @Prop()
  interestedIn!: string;

  @Prop()
  businessCouching!: string;

  @Prop()
  monthlyCouching!: string;

  @Prop()
  monthlyBudget!: string;

  @Prop()
  anythingElse!: string;
}

export const BusinesswonerSchema = SchemaFactory.createForClass(Businesswoner);
