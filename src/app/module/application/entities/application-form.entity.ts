import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ApplicationFormDocument = HydratedDocument<ApplicationForm>;

export enum QuestionType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  SUB_QUESTION = 'sub_question',
  TABLE = 'table',
}

export enum FormStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  INACTIVE = 'inactive',
}

/**
 * =========================================
 * Options
 * =========================================
 */

@Schema({ _id: true })
export class QuestionOption {
  @Prop({ required: true })
  label!: string;

  @Prop({ required: true })
  value!: string;
}

export const QuestionOptionSchema =
  SchemaFactory.createForClass(QuestionOption);

/**
 * =========================================
 * Sub Question
 * =========================================
 *
 * Important:
 * _id false দিবে না।
 *
 * কারণ user subQuestionId ধরে answer পাঠাতে পারে।
 */

@Schema({ _id: true })
export class SubQuestion {
  @Prop({ required: true })
  label!: string;
  // a, b, c

  @Prop({ required: true })
  question!: string;

  @Prop({
    type: String,
    enum: [
      QuestionType.TEXT,
      QuestionType.TEXTAREA,
      QuestionType.NUMBER,
      QuestionType.SELECT,
      QuestionType.RADIO,
      QuestionType.CHECKBOX,
    ],
    default: QuestionType.TEXT,
  })
  type!: QuestionType;

  @Prop({ default: false })
  required!: boolean;

  @Prop({
    type: [QuestionOptionSchema],
    default: [],
  })
  options!: QuestionOption[];
}

export const SubQuestionSchema = SchemaFactory.createForClass(SubQuestion);

/**
 * =========================================
 * Table Column
 * =========================================
 */

@Schema({ _id: true })
export class TableColumn {
  @Prop({ required: true })
  key!: string;

  @Prop({ required: true })
  label!: string;

  @Prop({
    enum: ['text', 'number', 'currency', 'select', 'checkbox', 'readonly'],
    default: 'text',
  })
  inputType!: string;

  @Prop({ default: false })
  required!: boolean;

  @Prop({
    type: [String],
    default: [],
  })
  options!: string[];
}

export const TableColumnSchema = SchemaFactory.createForClass(TableColumn);

/**
 * =========================================
 * Table Cell
 * =========================================
 *
 * এখানে value হলো Admin দেওয়া initial/static value।
 *
 * User answer এখানে save হবে না।
 */

@Schema({ _id: false })
export class TableCell {
  @Prop({ required: true })
  key!: string;

  @Prop({
    type: Object,
    default: null,
  })
  value!: unknown;
}

export const TableCellSchema = SchemaFactory.createForClass(TableCell);

/**
 * =========================================
 * Table Row
 * =========================================
 */

@Schema({ _id: true })
export class TableRow {
  @Prop({ default: '' })
  label!: string;

  @Prop({
    type: [TableCellSchema],
    default: [],
  })
  cells!: TableCell[];
}

export const TableRowSchema = SchemaFactory.createForClass(TableRow);

/**
 * =========================================
 * Calculated Result
 * =========================================
 */

@Schema({ _id: true })
export class TableResult {
  @Prop({ required: true })
  key!: string;

  @Prop({ required: true })
  label!: string;

  @Prop({ default: '' })
  formula!: string;

  @Prop({ default: '' })
  suffix!: string;

  @Prop({ default: '' })
  prefix!: string;
}

export const TableResultSchema = SchemaFactory.createForClass(TableResult);

/**
 * =========================================
 * Question
 * =========================================
 *
 * Important:
 * প্রত্যেক question-এর MongoDB _id থাকবে।
 */

@Schema({ _id: true })
export class Question {
  @Prop({ required: true })
  number!: string;
  // 1A, 1B, 2A etc

  @Prop({ required: true })
  title!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({
    type: String,
    enum: QuestionType,
    required: true,
  })
  type!: QuestionType;

  @Prop({ default: false })
  required!: boolean;

  @Prop({ default: '' })
  placeholder!: string;

  /**
   * select/radio/checkbox এর জন্য
   */
  @Prop({
    type: [QuestionOptionSchema],
    default: [],
  })
  options!: QuestionOption[];

  /**
   * a,b,c question
   */
  @Prop({
    type: [SubQuestionSchema],
    default: [],
  })
  subQuestions!: SubQuestion[];

  /**
   * table
   */
  @Prop({
    type: [TableColumnSchema],
    default: [],
  })
  columns!: TableColumn[];

  @Prop({
    type: [TableRowSchema],
    default: [],
  })
  rows!: TableRow[];

  /**
   * subtotal / total
   */
  @Prop({
    type: [TableResultSchema],
    default: [],
  })
  results!: TableResult[];

  @Prop({ default: 0 })
  order!: number;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

/**
 * =========================================
 * Section
 * =========================================
 */

@Schema({ _id: true })
export class Section {
  @Prop({ required: true })
  sectionNumber!: number;

  @Prop({ required: true })
  title!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({
    type: [QuestionSchema],
    default: [],
  })
  questions!: Question[];

  @Prop({ default: 0 })
  order!: number;
}

export const SectionSchema = SchemaFactory.createForClass(Section);

/**
 * =========================================
 * Main Application Form
 * =========================================
 */

@Schema({
  timestamps: true,
  versionKey: false,
})
export class ApplicationForm {
  @Prop({ required: true })
  title!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({
    type: String,
    enum: FormStatus,
    default: FormStatus.DRAFT,
    index: true,
  })
  status!: FormStatus;

  @Prop({
    type: [SectionSchema],
    default: [],
  })
  sections!: Section[];

  /**
   * Admin form structure modify করলে
   * increment করা যাবে।
   */
  @Prop({
    type: Number,
    default: 1,
  })
  version!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const ApplicationFormSchema =
  SchemaFactory.createForClass(ApplicationForm);
