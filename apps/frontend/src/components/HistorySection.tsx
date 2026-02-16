import { CheckCircle2, AlertCircle, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Repository } from '../types';

interface HistorySectionProps {
  repository: Repository;
}

export function HistorySection({ repository }: HistorySectionProps) {
  const history = repository.analysisHistory || [];

  if (history.length === 0) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-12 text-center">
        <Clock className="w-12 h-12 text-[#73787e] mx-auto mb-4" />
        <h3 className="text-[#2e3338] mb-2">Nessuno storico disponibile</h3>
        <p className="text-[#73787e]">
          Le analisi precedenti verranno visualizzate qui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trend Chart */}
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
        <h3 className="text-[#2e3338] mb-4">Evoluzione nel Tempo</h3>
        
        <div className="w-full">
          <div className="p-4 bg-[#fafafa] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#73787e]">Qualità del Codice</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-[#2e3338]">
              {history[0].report?.qualityScore || 0} 
              <span className="text-green-600 ml-2">+5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis History Table */}
      <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
        <div className="p-6 border-b border-[#e5e5e5]">
          <h3 className="text-[#2e3338]">Storico Analisi</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#fafafa] border-b border-[#e5e5e5]">
              <tr>
                <th className="px-6 py-3 text-left text-[#2e3338]">Data</th>
                <th className="px-6 py-3 text-left text-[#2e3338]">Stato</th>
                <th className="px-6 py-3 text-left text-[#2e3338]">Qualità</th>
                <th className="px-6 py-3 text-left text-[#2e3338]">Problemi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {history.map((analysis, index) => (
                <tr key={analysis.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-6 py-4 text-[#2e3338]">
                    {new Date(analysis.date).toLocaleString('it-IT')}
                  </td>
                  <td className="px-6 py-4">
                    {analysis.status === 'completed' ? (
                      <span className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        Completata
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        Fallita
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[#2e3338]">
                    {analysis.report?.qualityScore || '-'}
                  </td>
                  
                  <td className="px-6 py-4">
                    {analysis.report ? (
                      <span className="text-[#2e3338]">
                        {(analysis.report.criticalIssues || 0) + 
                         (analysis.report.warningIssues || 0) + 
                         (analysis.report.infoIssues || 0)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
