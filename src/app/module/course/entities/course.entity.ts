import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CourseDocument = HydratedDocument<Course>;
export type ModuleDocument = HydratedDocument<Module>;
export type LessonDocument = HydratedDocument<Lesson>;
export type QuizDocument = HydratedDocument<Quiz>;
// export type QuizOptionDocument = HydratedDocument<QuizOption>;

// @Schema({ _id: true })
// export class QuizOption {
//   @Prop({ required: true })
//   option!: string;

//   @Prop()
//   answer?: string;

//   // @Prop()
//   // image?: string;
// }

@Schema({ _id: true })
export class Quiz {
  @Prop({ required: true })
  question!: string;

  @Prop({ type: [String], default: [] })
  options!: string[];

  @Prop({ required: true })
  answer!: string;
}

@Schema({ _id: true })
export class Lesson {
  @Prop()
  video?: string;

  @Prop()
  resource?: string;

  @Prop()
  thumbnail?: string;

  @Prop({ type: [Quiz], default: [] })
  quizzes!: Quiz[];
}

@Schema({ _id: true })
export class Module {
  @Prop({ required: true })
  name!: string;

  @Prop({ type: [Lesson], default: [] })
  lessons!: Lesson[];
}

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: 0 })
  price!: number;

  @Prop()
  instructor?: string;

  @Prop()
  photo?: string;

  @Prop({ type: [Module], default: [] })
  modules!: Module[];
}

export const CourseSchema = SchemaFactory.createForClass(Course);
export const ModuleSchema = SchemaFactory.createForClass(Module);
export const LessonSchema = SchemaFactory.createForClass(Lesson);
export const QuizSchema = SchemaFactory.createForClass(Quiz);
// export const QuizOptionSchema = SchemaFactory.createForClass(QuizOption);
