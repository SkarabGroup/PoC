import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AnalysisGateway } from './gateway/analysis.gateway';

@Injectable()
export class AnalysisResultHandlerService {
  private readonly logger = new Logger(AnalysisResultHandlerService.name);
  private readonly resultsPath = path.join(process.cwd(), 'analysisResults');

  constructor(private readonly gateway: AnalysisGateway) {
    // Crea la cartella se non esiste all'avvio
    if (!fs.existsSync(this.resultsPath)) {
      fs.mkdirSync(this.resultsPath);
    }
  }

  async memorizeResults(analysisId: string, summary: any) {
    this.logger.log(`Ricevuto risultato per analisi: ${analysisId}`);

    // 1. Salvataggio su file
    const filePath = path.join(this.resultsPath, `analysis_${analysisId}.json`);
    const data = {
      analysisId,
      timestamp: new Date().toISOString(),
      summary,
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    this.logger.log(`File salvato in: ${filePath}`);

    // 2. Notifica via WebSocket
    this.gateway.notifyCompletion(analysisId, summary);
    
    return data;
  }

  getReport(analysisId: string) {
    const filePath = path.join(this.resultsPath, `analysis_${analysisId}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
}
