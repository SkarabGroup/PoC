import{Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import{Document} from 'mongoose';

export type RepositoryDocument = Repository & Document; 

@Schema({timestamps:true})
export class Repository{
    @Prop({requred:true})
    repoOwner: string;
    @Prop({required:true, unique:true})
    repoName:string
    @Prop({ required: true, unique: true })
    fullName: string;
    @Prop({required:true, unique:true})
    repoUrl:string
    @Prop()
    description?:string;
    @Prop({default: 0})
    analysisCount:number;
    @Prop()
    lastAnalyzed?:Date;
}

export const RepositorySchema = SchemaFactory.createForClass(Repository);
RepositorySchema.index({ repoOwner: 1, repoName: 1 });
RepositorySchema.index({ lastAnalyzedAt: -1 });