import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AnalysisResult, AnalysisService } from './analysis.service';
import { AnalysisRequestDTO } from './DTO/analysis-DTO';

@Controller('analysis')
export class AnalysisController {
    constructor(private readonly analysisService: AnalysisService) {}

    @Post()
    async run(@Body() body : AnalysisRequestDTO) : Promise<AnalysisResult> {
        try {
            return await this.analysisService.runAnalysis(body.repoURL);
        } catch(error) {
            throw new HttpException(
                error.message || 'Errore durante l\'analisi',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
