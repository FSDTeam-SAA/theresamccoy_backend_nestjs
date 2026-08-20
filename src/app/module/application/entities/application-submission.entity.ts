import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { ApplicationForm } from './application-form.entity';

export type ApplicationSubmissionDocument =
  HydratedDocument<ApplicationSubmission>;

export enum SubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * =========================================
 * Sub Question Answer
 * =========================================
 */

@Schema({ _id: false })
export class SubQuestionAnswer {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  })
  subQuestionId!: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: null,
  })
  value!: unknown;
}

export const SubQuestionAnswerSchema =
  SchemaFactory.createForClass(SubQuestionAnswer);

/**
 * =========================================
 * Table Cell Answer
 * =========================================
 */

@Schema({ _id: false })
export class TableCellAnswer {
  @Prop({ required: true })
  columnKey!: string;

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: null,
  })
  value!: unknown;
}

export const TableCellAnswerSchema =
  SchemaFactory.createForClass(TableCellAnswer);

/**
 * =========================================
 * Table Row Answer
 * =========================================
 */

@Schema({ _id: false })
export class TableRowAnswer {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  })
  rowId!: Types.ObjectId;

  @Prop({
    type: [TableCellAnswerSchema],
    default: [],
  })
  cells!: TableCellAnswer[];
}

export const TableRowAnswerSchema =
  SchemaFactory.createForClass(TableRowAnswer);

/**
 * =========================================
 * Question Answer
 * =========================================
 */

@Schema({ _id: false })
export class QuestionAnswer {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  })
  questionId!: Types.ObjectId;

  /**
   * text, number, select etc.
   */
  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: null,
  })
  value!: unknown;

  /**
   * sub_question type
   */
  @Prop({
    type: [SubQuestionAnswerSchema],
    default: [],
  })
  subAnswers!: SubQuestionAnswer[];

  /**
   * table type
   */
  @Prop({
    type: [TableRowAnswerSchema],
    default: [],
  })
  tableAnswers!: TableRowAnswer[];

  /**
   * Backend calculation result
   */
  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: null,
  })
  calculatedValue!: unknown;
}

export const QuestionAnswerSchema =
  SchemaFactory.createForClass(QuestionAnswer);

/**
 * =========================================
 * Main Submission
 * =========================================
 */

@Schema({
  timestamps: true,
  versionKey: false,
})
export class ApplicationSubmission {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: ApplicationForm.name,
    required: true,
    index: true,
  })
  formId!: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
  })
  formVersion!: number;

  @Prop({
    type: [QuestionAnswerSchema],
    default: [],
  })
  answers!: QuestionAnswer[];

  @Prop({
    type: String,
    enum: SubmissionStatus,
    default: SubmissionStatus.DRAFT,
    index: true,
  })
  status!: SubmissionStatus;

  @Prop({
    type: Number,
    default: 0,
  })
  score!: number;

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: null,
  })
  calculationResult!: unknown;

  @Prop({
    type: Date,
    default: null,
  })
  submittedAt!: Date | null;

  @Prop({
    type: String,
    default: '',
  })
  adminNote!: string;
}

export const ApplicationSubmissionSchema = SchemaFactory.createForClass(
  ApplicationSubmission,
);

ApplicationSubmissionSchema.index({
  userId: 1,
  formId: 1,
});
