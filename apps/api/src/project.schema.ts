import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ collection: 'projects', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Project {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  repo_url: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  last_check?: Date;

  created_at?: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
