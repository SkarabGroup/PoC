import { Injectable } from '@nestjs/common';
import { SpellingAnalysisItem } from './dto/webhook-result.dto';

@Injectable()
export class AnalysisTransformerService {
  /**
   * Trasforma spelling_analysis in qualityIssues[]
   */
  transformSpellingToQualityIssues(spellingAnalysis: SpellingAnalysisItem[]): any[] {
    if (!spellingAnalysis || spellingAnalysis.length === 0) {
      return [];
    }

    return spellingAnalysis
      .filter(item => item.misspelled_words && item.misspelled_words.length > 0)
      .map(item => ({
        title: `Spelling errors in ${this.getFileName(item.file_path)}`,
        description: `Found ${item.misspelled_words.length} misspelled words: ${item.misspelled_words.slice(0, 5).join(', ')}${item.misspelled_words.length > 5 ? '...' : ''}`,
        severity: 'warning',
        file: item.file_path,
        line: 0, // Spelling analysis non fornisce line number
      }));
  }

  /**
   * Categorizza issue per severità
   */
  categorizeIssuesBySeverity(issues: any[]): {
    criticalIssues: number;
    warningIssues: number;
    infoIssues: number;
  } {
    return {
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      warningIssues: issues.filter(i => i.severity === 'warning').length,
      infoIssues: issues.filter(i => i.severity === 'info').length,
    };
  }

  /**
   * Calcola quality score basato sul numero di issue
   */
  calculateQualityScore(qualityIssues: any[]): number {
    // Ogni issue riduce lo score di 2 punti, minimo 0
    const penaltyPerIssue = 2;
    return Math.max(0, 100 - (qualityIssues.length * penaltyPerIssue));
  }

  private getFileName(filePath: string): string {
    return filePath.split('/').pop() || filePath;
  }
}
