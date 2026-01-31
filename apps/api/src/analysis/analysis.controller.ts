import { Body, Controller, Post } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from 'src/dto/create-analysis.dto';

@Controller('analysis')
export class AnalysisController {
    constructor(private readonly analysis: AnalysisService) {}

    @Post()
    create(@Body() body: CreateAnalysisDto) {
        const { repoURL, repoOwner, repoName } = this.analysis.validateURL(body.repoURL);

        return {
            ok: true,
            input: body.repoURL,
            repoURL,
            repo: { repoOwner, repoName }
        }
    }
}
