import { Body, Controller, Post } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';

@Controller('analysis')
export class AnalysisController {
    constructor(private readonly analysis: AnalysisService) {}

    @Post()
    public analyzeRepository(@Body() url : CreateAnalysisDto) {
        return this.analysis.analyzeRepository(url.repoURL);
    }
}
