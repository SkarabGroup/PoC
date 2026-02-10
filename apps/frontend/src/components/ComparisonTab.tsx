import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, Loader2, AlertCircle } from 'lucide-react';
import { Repository } from '../types';
import { analysisApi } from '../services/api';
import { toast } from 'sonner';

interface ComparisonTabProps {
  repository: Repository;
}

export function ComparisonTab({ repository }: ComparisonTabProps) {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Set default dates (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    setToDate(today.toISOString().split('T')[0]);
    setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Fetch analyses when dates change
  useEffect(() => {
    if (fromDate && toDate) {
      fetchComparison();
    }
  }, [fromDate, toDate, repository.id]);

  const fetchComparison = async () => {
    try {
      setIsLoading(true);
      const data = await analysisApi.compareAnalyses(
        repository.id,
        fromDate ? new Date(fromDate).toISOString() : undefined,
        toDate ? new Date(toDate + 'T23:59:59').toISOString() : undefined
      );
      setAnalyses(data);
    } catch (error: any) {
      toast.error(error.message || 'Errore nel caricamento dei confronti');
    } finally {
      setIsLoading(false);
    }
  };

  const getTrend = (current: number, previous: number) => {
    if (!previous) return null;
    const diff = current - previous;
    if (diff > 0) return { value: diff, direction: 'up' };
    if (diff < 0) return { value: Math.abs(diff), direction: 'down' };
    return { value: 0, direction: 'stable' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-12 text-center">
        <Loader2 className="w-12 h-12 text-[#2e3338] animate-spin mx-auto mb-4" />
        <p className="text-[#73787e]">Caricamento confronti...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-[#73787e]" />
          <h3 className="text-[#2e3338] font-medium">Periodo di Confronto</h3>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm text-[#73787e] mb-2">Data Inizio</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2e3338]"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm text-[#73787e] mb-2">Data Fine</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2e3338]"
            />
          </div>

          <button
            onClick={fetchComparison}
            disabled={!fromDate || !toDate}
            className="px-6 py-2 bg-[#2e3338] text-white rounded-lg hover:bg-[#1a1d20] transition-colors disabled:opacity-50 self-end"
          >
            Confronta
          </button>
        </div>
      </div>

      {analyses.length === 0 ? (
        <div className="bg-white border border-[#e5e5e5] rounded-lg p-12 text-center">
          <AlertCircle className="w-12 h-12 text-[#73787e] mx-auto mb-4" />
          <h3 className="text-[#2e3338] mb-2">Nessuna analisi nel periodo selezionato</h3>
          <p className="text-[#73787e]">
            Prova a modificare il range di date o avvia una nuova analisi
          </p>
        </div>
      ) : (
        <>
          {/* Trend Chart */}
          <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
            <h3 className="text-[#2e3338] mb-4 font-medium">Andamento Score nel Tempo</h3>

            <div className="space-y-6">
              {/* Quality Score Line */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#73787e]">Qualità Codice</span>
                  <span className="text-sm text-[#2e3338]">
                    {analyses[analyses.length - 1]?.report?.qualityScore || 0}/100
                  </span>
                </div>
                <div className="relative h-2 bg-[#f5f5f5] rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-green-500 rounded-full transition-all"
                    style={{
                      width: `${analyses[analyses.length - 1]?.report?.qualityScore || 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Security Score Line */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#73787e]">Sicurezza</span>
                  <span className="text-sm text-[#2e3338]">
                    {analyses[analyses.length - 1]?.report?.securityScore || 0}/100
                  </span>
                </div>
                <div className="relative h-2 bg-[#f5f5f5] rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: `${analyses[analyses.length - 1]?.report?.securityScore || 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Performance Score Line */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#73787e]">Performance</span>
                  <span className="text-sm text-[#2e3338]">
                    {analyses[analyses.length - 1]?.report?.performanceScore || 0}/100
                  </span>
                </div>
                <div className="relative h-2 bg-[#f5f5f5] rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-yellow-500 rounded-full transition-all"
                    style={{
                      width: `${analyses[analyses.length - 1]?.report?.performanceScore || 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#e5e5e5]">
              <h3 className="text-[#2e3338] font-medium">Tabella Comparativa</h3>
              <p className="text-sm text-[#73787e] mt-1">
                {analyses.length} analisi trovate nel periodo selezionato
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f5f5f5]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#73787e] uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#73787e] uppercase tracking-wider">
                      Qualità
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#73787e] uppercase tracking-wider">
                      Sicurezza
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#73787e] uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#73787e] uppercase tracking-wider">
                      Critici
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#73787e] uppercase tracking-wider">
                      Warning
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#73787e] uppercase tracking-wider">
                      Info
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#e5e5e5]">
                  {analyses.map((analysis, index) => {
                    const prevAnalysis = index > 0 ? analyses[index - 1] : null;
                    const qualityTrend = prevAnalysis
                      ? getTrend(analysis.report?.qualityScore || 0, prevAnalysis.report?.qualityScore || 0)
                      : null;
                    const securityTrend = prevAnalysis
                      ? getTrend(analysis.report?.securityScore || 0, prevAnalysis.report?.securityScore || 0)
                      : null;

                    return (
                      <tr key={analysis._id} className="hover:bg-[#fafafa]">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2e3338]">
                          {new Date(analysis.completedAt).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${getScoreColor(analysis.report?.qualityScore || 0)}`}>
                              {analysis.report?.qualityScore || 0}
                            </span>
                            {qualityTrend && qualityTrend.direction !== 'stable' && (
                              <span className="flex items-center gap-1">
                                {qualityTrend.direction === 'up' ? (
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                )}
                                <span className="text-xs text-[#73787e]">
                                  {qualityTrend.value}
                                </span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${getScoreColor(analysis.report?.securityScore || 0)}`}>
                              {analysis.report?.securityScore || 0}
                            </span>
                            {securityTrend && securityTrend.direction !== 'stable' && (
                              <span className="flex items-center gap-1">
                                {securityTrend.direction === 'up' ? (
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                )}
                                <span className="text-xs text-[#73787e]">
                                  {securityTrend.value}
                                </span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getScoreColor(analysis.report?.performanceScore || 0)}`}>
                            {analysis.report?.performanceScore || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-red-600 font-medium">
                            {analysis.report?.criticalIssues || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-yellow-600 font-medium">
                            {analysis.report?.warningIssues || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-blue-600 font-medium">
                            {analysis.report?.infoIssues || 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Stats */}
          {analyses.length >= 2 && (
            <div className="bg-white border border-[#e5e5e5] rounded-lg p-6">
              <h3 className="text-[#2e3338] mb-4 font-medium">Riepilogo Variazioni</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#f5f5f5] rounded-lg">
                  <p className="text-sm text-[#73787e] mb-1">Qualità Codice</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#2e3338]">
                      {analyses[analyses.length - 1]?.report?.qualityScore || 0}
                    </span>
                    {(() => {
                      const first = analyses[0]?.report?.qualityScore || 0;
                      const last = analyses[analyses.length - 1]?.report?.qualityScore || 0;
                      const diff = last - first;
                      return diff !== 0 ? (
                        <span className={`flex items-center gap-1 text-sm ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {diff > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {Math.abs(diff)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-[#73787e]">
                          <Minus className="w-4 h-4" />
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="p-4 bg-[#f5f5f5] rounded-lg">
                  <p className="text-sm text-[#73787e] mb-1">Sicurezza</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#2e3338]">
                      {analyses[analyses.length - 1]?.report?.securityScore || 0}
                    </span>
                    {(() => {
                      const first = analyses[0]?.report?.securityScore || 0;
                      const last = analyses[analyses.length - 1]?.report?.securityScore || 0;
                      const diff = last - first;
                      return diff !== 0 ? (
                        <span className={`flex items-center gap-1 text-sm ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {diff > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {Math.abs(diff)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-[#73787e]">
                          <Minus className="w-4 h-4" />
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="p-4 bg-[#f5f5f5] rounded-lg">
                  <p className="text-sm text-[#73787e] mb-1">Problemi Critici</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#2e3338]">
                      {analyses[analyses.length - 1]?.report?.criticalIssues || 0}
                    </span>
                    {(() => {
                      const first = analyses[0]?.report?.criticalIssues || 0;
                      const last = analyses[analyses.length - 1]?.report?.criticalIssues || 0;
                      const diff = last - first;
                      return diff !== 0 ? (
                        <span className={`flex items-center gap-1 text-sm ${diff < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {diff < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                          {Math.abs(diff)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-[#73787e]">
                          <Minus className="w-4 h-4" />
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
