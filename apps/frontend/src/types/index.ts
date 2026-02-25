export type AnalysisStatus = 'not-analyzed' | 'pending' | 'running' | 'completed' | 'failed';

export type IssueSeverity = 'critical' | 'warning' | 'info';

export interface Issue {
  title: string;
  description: string;
  severity: IssueSeverity;
  file: string;
  line?: number;
}

export interface Remediation {
  id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  category: string;
  file: string;
  line: number;
  currentCode: string;
  suggestedCode: string;
  reason: string;
}

export interface ExecutionMetrics {
  total_time_seconds: number;
  initialization_time_seconds: number;
  execution_time_seconds: number;
  parsing_time_seconds: number;
  started_at: string;
  completed_at: string;
}

export interface AnalysisReport {
  qualityScore: number;
  securityScore: number;
  performanceScore: number;
  criticalIssues: number;
  warningIssues: number;
  infoIssues: number;
  qualityIssues: Issue[];
  securityIssues: Issue[];
  bugIssues: Issue[];
  remediations: Remediation[];
}

export interface Analysis {
  id: string;
  date: string;
  status: AnalysisStatus;
  report?: AnalysisReport;
  executionMetrics?: ExecutionMetrics;
}

export interface Repository {
  id: string;
  name: string;
  description: string;
  url: string;
  created_at?: string;
  lastAnalysis?: Analysis;
  totalAnalyses?: number;
  analysisHistory?: Analysis[];
}
