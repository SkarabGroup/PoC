import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnalysisDocument = Analysis & Document;

export enum AnalysisStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ERROR = 'error'
}

@Schema({ timestamps: true })
export class Analysis {
  @Prop({ required: true, unique: true })
  analysisId: string; // Questo è l'UUID per l'agente esterno

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Repository', required: true })
  repositoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: false })
  projectId?: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(AnalysisStatus), default: AnalysisStatus.PENDING })
  status: AnalysisStatus;

  // Campi unificati dall'OrchestratorRun
  @Prop({ type: Object })
  summary?: Record<string, any>; // orchestrator_summary

  @Prop({ type: Object })
  details?: Record<string, any>; // spell_agent_details

  @Prop()
  errorMessage?: string;

  @Prop({ type: Object })
  metadata?: {
    user_email?: string;
    triggered_by?: string;
    execution_metrics?: any;
    [key: string]: any;
  };

  @Prop()
  createdAt? : Date;

  @Prop()
  completedAt?: Date;
}

export const AnalysisSchema = SchemaFactory.createForClass(Analysis);
AnalysisSchema.index({ userId: 1, createdAt: -1 });
