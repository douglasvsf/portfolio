import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ collection: "skillGroups" })
export class SkillGroup {
  @Prop({ required: true })
  category!: string;

  @Prop({ type: [String], required: true })
  items!: string[];
}

export const SkillGroupSchema = SchemaFactory.createForClass(SkillGroup);
