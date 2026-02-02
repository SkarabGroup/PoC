import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrchestratorRunDocument = HydratedDocument<OrchestratorRun>;

@Schema({ collection: 'orchestrator_runs', timestamps: true })
export class OrchestratorRun {
  @Prop()
  repository: string;

  @Prop()
  status: string;

  @Prop({ type: Object })
  orchestrator_summary: any;

  @Prop({ type: Object })
  spell_agent_details: any;

  @Prop({ type: Object })
  metadata: any;
}

export const OrchestratorRunSchema = SchemaFactory.createForClass(OrchestratorRun);