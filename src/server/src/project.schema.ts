import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ collection: 'projects', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Project {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  repo_url: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  last_check?: Date;

  created_at?: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);