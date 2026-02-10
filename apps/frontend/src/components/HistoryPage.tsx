import { History, CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react';
import { AnalysisStatus } from '../types';
import { analysisApi } from '../services/api';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function HistoryPage() {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { analyses: history } = await analysisApi.getAllAnalysisHistory();
        setAnalyses(history);
      } catch (error) {
        toast.error('Errore caricamento storico');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getStatusIcon = (status: AnalysisStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'in-progress':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-[#73787e]" />;
    }
  };

  const getStatusText = (status: AnalysisStatus) => {
    switch (status) {
      case 'completed':
        return 'Completata';
      case 'in-progress':
        return 'In analisi';
      case 'failed':
        return 'Fallita';
      default:
        return 'Non analizzata';
    }
  };

  const getStatusColor = (status: AnalysisStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in-progress':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-[#73787e]';
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-[#b4b4b4] mx-auto mb-4 animate-spin" />
          <p className="text-[#73787e]">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-[#2e3338] mb-2">Storico Analisi</h1>
        <p className="text-[#73787e]">
          Visualizza lo storico completo delle analisi effettuate su tutte le repository
        </p>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f5f5f5] border-b border-[#e5e5e5]">
              <tr>
                <th className="px-6 py-3 font-medium text-[#73787e]">Data</th>
                <th className="px-6 py-3 font-medium text-[#73787e]">Repository</th>
                <th className="px-6 py-3 font-medium text-[#73787e]">Stato</th>
                <th className="px-6 py-3 font-medium text-[#73787e]">Punteggi (Q/S/P)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {analyses.map((analysis) => (
                <tr key={`${analysis.repoId}-${analysis.id}`} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-6 py-4 text-[#2e3338]">
                    {new Date(analysis.date).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 font-medium text-[#2e3338]">
                    {analysis.repoName}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(analysis.status)}
                      <span className={getStatusColor(analysis.status)}>
                        {getStatusText(analysis.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#73787e]">
                    {analysis.report ? (
                      <div className="flex gap-3">
                        <span title="Qualità">Q: {analysis.report.qualityScore}%</span>
                        <span title="Sicurezza">S: {analysis.report.securityScore}%</span>
                        <span title="Performance">P: {analysis.report.performanceScore}%</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {analyses.length === 0 && (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-[#b4b4b4] mx-auto mb-4" />
            <p className="text-[#73787e]">
              Nessuna analisi trovata nello storico
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
