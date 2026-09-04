import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ collection: "projects" })
export class Project {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ type: [String], required: true })
  tags!: string[];

  @Prop()
  link?: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
