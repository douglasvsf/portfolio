import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ collection: "experience" })
export class ExperienceItem {
  @Prop({ required: true })
  role!: string;

  @Prop({ required: true })
  company!: string;

  @Prop({ required: true })
  period!: string;

  @Prop({ required: true })
  description!: string;
}

export const ExperienceItemSchema = SchemaFactory.createForClass(ExperienceItem);
