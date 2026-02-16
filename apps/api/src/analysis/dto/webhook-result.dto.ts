export interface SpellingAnalysisItem {
  file_path: string;
  misspelled_words: string[];
}

export interface ExecutionMetrics {
  total_time_seconds: number;
  initialization_time_seconds: number;
  execution_time_seconds: number;
  parsing_time_seconds: number;
  started_at: string;
  completed_at: string;
}

export interface WebhookResultDto {
  analysisId: string;
  status: 'completed' | 'error';
  spelling_analysis?: SpellingAnalysisItem[];
  summary?: {
    total_files: number;
    total_errors: number;
  };
  execution_metrics?: ExecutionMetrics;
}
