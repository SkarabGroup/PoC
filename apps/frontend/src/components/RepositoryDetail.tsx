import { useState, useEffect } from 'react';
import { Play, Download, CheckCircle2, AlertTriangle, Info, TrendingUp, FileCode, Shield, Bug, Zap } from 'lucide-react';
import { Repository } from '../types';
import { RemediationSection } from './RemediationSection';
import { HistorySection } from './HistorySection';
import { repositoriesApi } from '../services/api';
import { useAnalysisSocket } from '../hooks/useAnalysisSocket';
import { toast } from 'sonner';

interface RepositoryDetailProps {
  repository: Repository;
}

type TabType = 'overview' | 'details' | 'remediation' | 'history';

export function RepositoryDetail({ repository: initialRepo }: RepositoryDetailProps) {
  const [repository, setRepository] = useState<Repository>(initialRepo);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(repository.lastAnalysis?.status === 'in-progress');
  const { socket, isConnected } = useAnalysisSocket();

  // Load full repository details when component mounts
  const loadRepositoryDetails = async () => {
    setLoading(true);
    try {
      const fullRepo = await repositoriesApi.getOne(initialRepo.id);
      setRepository(fullRepo);
    } catch (error) {
      console.error('Error loading repository details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepositoryDetails();
  }, [initialRepo.id]);

  // Listen to WebSocket events for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on('analysis:complete', (data) => {
      console.log('[Socket] Analysis completed:', data);

      toast.success('Analysis completed!', {
        description: `Quality: ${data.summary.qualityScore || 'N/A'} | Security: ${data.summary.securityScore || 'N/A'}`,
        duration: 5000
      });

      // Stop analyzing state and reload repository data
      setIsAnalyzing(false);
      loadRepositoryDetails();
    });

    socket.on('analysis:failed', (data) => {
      console.error('[Socket] Analysis failed:', data);

      toast.error('Analysis failed', {
        description: data.error,
        duration: 5000
      });

      // Stop analyzing state
      setIsAnalyzing(false);
    });

    socket.on('analysis:progress', (data) => {
      console.log('[Socket] Analysis progress:', data);
      // Optional: Update progress indicator
    });

    return () => {
      socket.off('analysis:complete');
      socket.off('analysis:failed');
      socket.off('analysis:progress');
    };
  }, [socket]);

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    // Simulazione analisi
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  };

  const handleExport = () => {
    if (!repository.lastAnalysis) {
      alert('Nessuna analisi disponibile da esportare');
      return;
    }

    // Create export data with complete information
    const exportData = {
      repository: {
        name: repository.name,
        url: repository.url,
        description: repository.description,
      },
      analysis: {
        id: repository.lastAnalysis.id,
        date: repository.lastAnalysis.date,
        status: repository.lastAnalysis.status,
        report: repository.lastAnalysis.report,
        executionMetrics: repository.lastAnalysis.executionMetrics,
      },
      exportedAt: new Date().toISOString(),
      exportedBy: 'Code Guardian PoC',
      version: '1.0.0',
    };

    // Convert to JSON and download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis-${repository.name}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Panoramica' },
    { id: 'details' as TabType, label: 'Dettagli Analisi' },
    { id: 'remediation' as TabType, label: 'Remediation' },
    { id: 'history' as TabType, label: 'Storico' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-[#2e3338] mb-2">{repository.name}</h1>
            <p className="text-[#73787e]">{repository.description}</p>
            {isConnected && (
              <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                Real-time updates active
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white border border-[#e5e5e5] text-[#2e3338] rounded-lg hover:bg-[#f5f5f5] transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Esporta
            </button>
            
            <button
              onClick={handleStartAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-[#2e3338] text-white rounded-lg hover:bg-[#1a1d20] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              {isAnalyzing ? 'Analisi in corso...' : 'Avvia Analisi'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#e5e5e5]">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-[#2e3338] border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#2e3338]'
                    : 'border-transparent hover:border-[#e5e5e5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <OverviewTab repository={repository} isAnalyzing={isAnalyzing} />
      )}
      
      {activeTab === 'details' && (
        <DetailsTab repository={repository} />
      )}
      
      {activeTab === 'remediation' && (
        <RemediationSection repository={repository} />
      )}
      
      {activeTab === 'history' && (
        <HistorySection repository={repository} />
      )}
    </div>
  );
}

function OverviewTab({ repository, isAnalyzing }: { repository: Repository; isAnalyzing: boolean }) {
  if (isAnalyzing) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-12 text-center">
        <div className="w-12 h-12 border-4 border-[#e5e5e5] border-t-[#2e3338] rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-[#2e3338] mb-2">Analisi in corso</h3>
        <p className="text-[#73787e]">
          Gli agenti stanno analizzando la repository...
        </p>
      </div>
    );
  }

  if (!repository.lastAnalysis || repository.lastAnalysis.status === 'not-analyzed' || !repository.lastAnalysis.report) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-12 text-center">
        <Info className="w-12 h-12 text-[#73787e] mx-auto mb-4" />
        <h3 className="text-[#2e3338] mb-2">Nessuna analisi disponibile</h3>
        <p className="text-[#73787e]">
          Avvia la prima analisi per visualizzare i risultati
        </p>
      </div>
    );
  }

  const report = repository.lastAnalysis.report;

  return (
    <div className="space-y-6">
      {/* Score Cards */}
      <div className="w-full">
        <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#73787e]">Punteggio spell checking</span>
            <TrendingUp className="w-5 h-5 text-[#73787e]" />
          </div>
          <div className="text-[#2e3338] mb-1">{report.qualityScore}/100</div>
          <div className="w-full bg-[#f5f5f5] rounded-full h-2">
            <div
              className="bg-green-500 rounded-full h-2 transition-all"
              style={{ width: `${report.qualityScore}%` }}
            />
          </div>
        </div>

      </div>

      {/* Issues Summary */}
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
        <h3 className="text-[#2e3338] mb-4">Riepilogo Problemi</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <div className="text-red-600">{report.criticalIssues}</div>
              <div className="text-red-600">Critici</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <div className="text-yellow-600">{report.warningIssues}</div>
              <div className="text-yellow-600">Avvertimenti</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <div className="text-blue-600">{report.infoIssues}</div>
              <div className="text-blue-600">Informativi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Analysis Info */}
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
        <h3 className="text-[#2e3338] mb-4">Informazioni Analisi</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-[#73787e]">Data analisi</span>
            <span className="text-[#2e3338]">
              {new Date(repository.lastAnalysis?.date || Date.now()).toLocaleString('it-IT')}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-[#73787e]">Stato</span>
            <span className="text-green-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Completata
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#73787e]">Durata analisi</span>
            <span className="text-[#2e3338]">
              {repository.lastAnalysis?.executionMetrics?.total_time_seconds || 0} secondi
            </span>
          </div>
          
        </div>
      </div>
    </div>
  );
}

function DetailsTab({ repository }: { repository: Repository }) {
  const report = repository.lastAnalysis?.report;

  if (!report) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-12 text-center">
        <Info className="w-12 h-12 text-[#73787e] mx-auto mb-4" />
        <h3 className="text-[#2e3338] mb-2">Nessun dettaglio disponibile</h3>
        <p className="text-[#73787e]">
          Avvia un{'\''}analisi per visualizzare i dettagli
        </p>
      </div>
    );
  }

  const agents = [
    {
      id: 'quality',
      name: 'Code Quality Agent',
      icon: FileCode,
      description: 'Analisi della qualità del codice e best practices',
      issues: report.qualityIssues || [],
      score: report.qualityScore,
    },
    {
      id: 'security',
      name: 'Security Agent (OWASP)',
      icon: Shield,
      description: 'Analisi delle vulnerabilità di sicurezza',
      issues: report.securityIssues || [],
      score: report.securityScore,
    },
    {
      id: 'bugs',
      name: 'Bug Detection Agent',
      icon: Bug,
      description: 'Rilevamento di bug e potenziali errori',
      issues: report.bugIssues || [],
      score: 85,
    },
  ];

  return (
    <div className="space-y-4">
      {agents.map((agent) => {
        const Icon = agent.icon;
        
        return (
          <div key={agent.id} className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#e5e5e5]">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#f5f5f5] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#2e3338]" />
                  </div>
                  
                  <div>
                    <h3 className="text-[#2e3338] mb-1">{agent.name}</h3>
                    <p className="text-[#73787e]">{agent.description}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-[#2e3338] mb-1">Score: {agent.score}/100</div>
                  <div className="text-[#73787e]">
                    {agent.issues.length} {agent.issues.length === 1 ? 'problema' : 'problemi'}
                  </div>
                </div>
              </div>
            </div>

            {agent.issues.length > 0 ? (
              <div className="p-6">
                <div className="space-y-3">
                  {agent.issues.map((issue, index) => (
                    <div key={index} className="p-4 bg-[#fafafa] rounded-lg border border-[#e5e5e5]">
                      <div className="flex items-start gap-3 mb-2">
                        <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${
                          issue.severity === 'critical' ? 'text-red-600' :
                          issue.severity === 'warning' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                        <div className="flex-1">
                          <h4 className="text-[#2e3338] mb-1">{issue.title}</h4>
                          <p className="text-[#73787e] mb-2">{issue.description}</p>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-white border border-[#e5e5e5] rounded text-[#2e3338]">
                              {issue.file}:{issue.line}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-[#73787e]">Nessun problema rilevato</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
