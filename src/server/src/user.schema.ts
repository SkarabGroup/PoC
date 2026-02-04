import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

// GitHub account sub-schema
class GitHubAccount {
  @Prop()
  id: string;

  @Prop()
  username: string;

  @Prop()
  token?: string;

  @Prop()
  linked_at: Date;
}

@Schema({ collection: 'users', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ type: GitHubAccount, required: false })
  github?: GitHubAccount;

  created_at?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);