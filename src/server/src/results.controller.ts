import { Controller, Get, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrchestratorRun } from './orchestrator-run.schema';

@Controller('api/results')
export class ResultsController {
  constructor(
    @InjectModel(OrchestratorRun.name)
    private runModel: Model<OrchestratorRun>,
  ) {}

  // GET /api/results - tutti i risultati
  @Get()
  async getAllResults() {
    return this.runModel.find().sort({ createdAt: -1 }).limit(50).exec();
  }

  // GET /api/results/:id - risultato specifico
  @Get(':id')
  async getResultById(@Param('id') id: string) {
    return this.runModel.findById(id).exec();
  }

  // GET /api/results/stats - statistiche
  @Get('stats/summary')
  async getStats() {
    const total = await this.runModel.countDocuments();
    const results = await this.runModel.aggregate([
      {
        $group: {
          _id: null,
          totalErrors: { $sum: '$orchestrator_summary.total_errors_found' },
          totalFiles: { $sum: '$orchestrator_summary.total_files_analyzed' },
        },
      },
    ]);

    return {
      totalRuns: total,
      totalErrors: results[0]?.totalErrors || 0,
      totalFiles: results[0]?.totalFiles || 0,
    };
  }
}
