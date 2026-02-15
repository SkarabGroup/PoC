import { Body, Controller, Post, Get, NotFoundException, Param} from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { AnalysisResultHandlerService } from './analysis-result-handler/analysis-result-handler.service';

import path from 'path';
import fs from 'fs';

@Controller('analysis')
export class AnalysisController {
    constructor(private readonly analysis: AnalysisService,
                private readonly resultHandler: AnalysisResultHandlerService) {}

    @Post()
    public analyzeRepository(@Body() body : CreateAnalysisDto) {
        return this.analysis.analyzeRepository(body.repoURL, body.userId);
    }

    @Post('webhook')
    public async handleWebhook(@Body() results: any) {
        const { analysis_id, ...summary } = results;

        if (!analysis_id) {
            console.error('[Webhook] Errore: analysisId mancante nei dati ricevuti');
            return { status: 'error', message: 'analysisId is required' };
        }

        await this.resultHandler.memorizeResults(analysis_id, summary);

            return { 
                status: 'success', 
                message: `Risultati per l'analisi ${analysis_id} elaborati correttamente` 
            };

    }

    @Get('report/:id')
    public async getReport(@Param('id') id: string) {
        return await this.resultHandler.getReport(id);
    }
}
