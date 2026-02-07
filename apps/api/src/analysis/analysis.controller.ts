import { Body, Controller, Post, Get, NotFoundException, Param } from '@nestjs/common';
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
    public analyzeRepository(@Body() url : CreateAnalysisDto) {
        return this.analysis.analyzeRepository(url.repoURL);
    }

    @Post('webhook')
    public async handleWebhook(@Body() results: any) {
        // 1. Log di debug per vedere cosa arriva dal Python
        console.log('[Webhook] Dati ricevuti dal container:', results);

        // 2. Estrazione dell'ID (assicurati che il Python lo invii o passalo come parametro)
        // Se il Python invia { "analysisId": "...", "summary": {...} }
        const { analysis_id, ...summary } = results;

        if (!analysis_id) {
            console.error('[Webhook] Errore: analysisId mancante nei dati ricevuti');
            return { status: 'error', message: 'analysisId is required' };
        }

        // 3. Chiamata al service che fa tutto il lavoro (Salvataggio + WebSocket)
        await this.resultHandler.memorizeResults(analysis_id, summary);

        return { 
            status: 'success', 
            message: `Risultati per l'analisi ${analysis_id} elaborati correttamente` 
        };
    }

    @Get('report/:id')
    public async getReport(@Param('id') id: string) {
        const filePath = path.join(process.cwd(), 'analysisResults', `analysis_${id}.json`);

        if (!fs.existsSync(filePath)) {
            throw new NotFoundException(`Il report con ID ${id} non è ancora pronto o non esiste.`);
        }

        const data = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(data);
    }
}
