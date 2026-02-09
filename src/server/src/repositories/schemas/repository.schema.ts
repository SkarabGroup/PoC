import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RepositoryDocument = Repository & Document;

@Schema({ timestamps: true })
export class Repository {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  url: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // Timestamp fields (createdAt, updatedAt) are added automatically by { timestamps: true }
}

export const RepositorySchema = SchemaFactory.createForClass(Repository);

// Create indexes
RepositorySchema.index({ userId: 1 });
RepositorySchema.index({ name: 1 });
RepositorySchema.index({ createdAt: -1 });
