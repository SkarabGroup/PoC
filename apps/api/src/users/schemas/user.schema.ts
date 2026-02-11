import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop()
  githubId?: string;

  @Prop()
  gitlabId?: string;

  @Prop({ default: true })
  notificationsEnabled: boolean;

  @Prop({ default: true })
  criticalIssuesNotifications: boolean;

  @Prop()
  apiKey?: string;

  // Timestamp fields (createdAt, updatedAt) are added automatically by { timestamps: true }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create indexes
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ githubId: 1 });
UserSchema.index({ gitlabId: 1 });
