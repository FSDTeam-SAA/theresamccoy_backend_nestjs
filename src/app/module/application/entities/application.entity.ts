import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AssessmentDocument = HydratedDocument<Assessment>;

export enum QuestionType {
  TEXT = 'text',
  SUB_QUESTION = 'sub_question',
  TABLE = 'table',
}

/**
 * ========================================
 * Sub Question
 * ========================================
 */

@Schema({ _id: false })
export class SubQuestion {
  @Prop({ required: true })
  label!: string; // a, b, c

  @Prop({ required: true })
  question!: string;

  @Prop({ default: '' })
  answer!: string;
}

export const SubQuestionSchema = SchemaFactory.createForClass(SubQuestion);

/**
 * ========================================
 * Table Column
 * ========================================
 */

@Schema({ _id: false })
export class TableColumn {
  @Prop({ required: true })
  key!: string;

  @Prop({ required: true })
  label!: string;

  @Prop({ default: 'text' })
  inputType!: string;
  // text | number | select | currency

  @Prop({ type: [String], default: [] })
  options!: string[];
}

export const TableColumnSchema = SchemaFactory.createForClass(TableColumn);

/**
 * ========================================
 * Table Cell
 * ========================================
 */

@Schema({ _id: false })
export class TableCell {
  @Prop({ required: true })
  key!: string;

  @Prop({ default: '' })
  value!: string;
}

export const TableCellSchema = SchemaFactory.createForClass(TableCell);

/**
 * ========================================
 * Table Row
 * ========================================
 */

@Schema({ _id: false })
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
 * ========================================
 * Table Result
 * ========================================
 */

@Schema({ _id: false })
export class TableResult {
  @Prop({ required: true })
  key!: string;

  @Prop({ required: true })
  label!: string;

  @Prop({ default: '' })
  value!: string;
}

export const TableResultSchema = SchemaFactory.createForClass(TableResult);

/**
 * ========================================
 * Main Question
 * ========================================
 */

@Schema({ _id: false })
export class Question {
  @Prop({ required: true })
  number!: string;
  // 1, 2A, 2B etc.

  @Prop({ required: true })
  title!: string;

  @Prop({
    type: String,
    enum: QuestionType,
    required: true,
  })
  type!: QuestionType;

  /**
   * Normal answer
   */
  @Prop({ default: '' })
  answer!: string;

  /**
   * a), b), c)
   */
  @Prop({
    type: [SubQuestionSchema],
    default: [],
  })
  subQuestions!: SubQuestion[];

  /**
   * Table columns
   */
  @Prop({
    type: [TableColumnSchema],
    default: [],
  })
  columns!: TableColumn[];

  /**
   * Table data
   */
  @Prop({
    type: [TableRowSchema],
    default: [],
  })
  rows!: TableRow[];

  /**
   * subtotal / total / calculated result
   */
  @Prop({
    type: [TableResultSchema],
    default: [],
  })
  results!: TableResult[];
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

/**
 * ========================================
 * Section
 * ========================================
 */

@Schema({ _id: false })
export class Section {
  @Prop({ required: true })
  sectionNumber!: number;

  @Prop({ required: true })
  title!: string;

  @Prop({
    type: [QuestionSchema],
    default: [],
  })
  questions!: Question[];
}

export const SectionSchema = SchemaFactory.createForClass(Section);

/**
 * ========================================
 * Main Assessment
 * ========================================
 */

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Assessment {
  @Prop({
    type: [SectionSchema],
    default: [],
  })
  sections!: Section[];
}

export const AssessmentSchema = SchemaFactory.createForClass(Assessment);
