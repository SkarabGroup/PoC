import{Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import{Document, Types} from 'mongoose';

export type AnalysisDocument = Analysis & Document;

export enum AnalysisStatus{
    PENDING = 'pending',
    RUNNING = 'running',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

@Schema({timestamps:true})
export class Analysis{
    @Prop({required:true, unique:true})
    analysisId:String
    @Prop({type:Types.ObjectId, ref: 'User', required: true})
    userId: Types.ObjectId;
    @Prop({type: Types.ObjectId, ref: 'Repository', required: true})
    repositoryId: Types.ObjectId;
    @Prop({type: String, enum: Object.values(AnalysisStatus), default: AnalysisStatus.PENDING})
    status: AnalysisStatus;
    @Prop({type: Object})
    summary?: Record<string,any>;   
    @Prop()
    errorMessage?:string;
    @Prop()
    createdAt?: Date;
    @Prop()
    completedAt?: Date;
    @Prop({type: Object})
    metadata?: {
        agentVersion?:string;
        dockerImage?:string;
        [key:string]:any;
    };
}

export const AnalysisSchema = SchemaFactory.createForClass(Analysis);

AnalysisSchema.index({userId:1, createdAt: -1});
AnalysisSchema.index({repositoryId:1, createdAt:-1});
AnalysisSchema.index({status:1});
AnalysisSchema.index({createdAt:-1});
