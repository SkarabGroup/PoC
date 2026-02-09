import { useState, useEffect } from "react";
import {
  Trophy,
  TrendingUp,
  Shield,
  Zap,
  AlertCircle,
  ArrowUpDown,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { repositoriesApi } from "../services/api";
import { toast } from "sonner";

type SortCriteria = "average" | "quality" | "security" | "performance";
type SortOrder = "desc" | "asc";

interface RankedRepository {
  id: string;
  name: string;
  description?: string;
  averageScore: number;
  qualityScore: number;
  securityScore: number;
  performanceScore: number;
  lastAnalysisStatus: string;
}

export function RankingPage() {
  const [sortBy, setSortBy] = useState<SortCriteria>("average");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [rankedRepos, setRankedRepos] = useState<RankedRepository[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setIsLoading(true);
        const data = await repositoriesApi.getRanking();
        setRankedRepos(data);
      } catch (error: any) {
        toast.error(error.message || 'Errore nel caricamento della classifica');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRanking();
  }, []);

  // Check if any analysis is in progress
  const hasActiveAnalysis = rankedRepos.some(
    (repo) => repo.lastAnalysisStatus === "in-progress"
  );

  // Sort repositories based on current criteria
  const sortedRepos = [...rankedRepos].sort((a, b) => {
    let aValue: number, bValue: number;

    switch (sortBy) {
      case "quality":
        aValue = a.qualityScore;
        bValue = b.qualityScore;
        break;
      case "security":
        aValue = a.securityScore;
        bValue = b.securityScore;
        break;
      case "performance":
        aValue = a.performanceScore;
        bValue = b.performanceScore;
        break;
      default:
        aValue = a.averageScore;
        bValue = b.averageScore;
    }

    return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
  });

  const getMedalColor = (index: number) => {
    if (sortOrder === "asc") return "text-[#73787e]"; // No medals for ascending
    switch (index) {
      case 0:
        return "text-yellow-500"; // Gold
      case 1:
        return "text-gray-400"; // Silver
      case 2:
        return "text-amber-700"; // Bronze
      default:
        return "text-[#73787e]";
    }
  };

  const sortOptions: { id: SortCriteria; label: string }[] = [
    { id: "average", label: "Media Totale" },
    { id: "quality", label: "Qualità" },
    { id: "security", label: "Sicurezza" },
    { id: "performance", label: "Performance" },
  ];

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-[#2e3338] mb-2">Classifica Repository</h1>
        <p className="text-[#73787e]">
          Ranking dei progetti basato su qualità, sicurezza e performance
        </p>
      </div>

      {/* Active Analysis Warning */}
      {hasActiveAnalysis && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-amber-800 text-sm font-medium">
              Analisi in corso
            </p>
            <p className="text-amber-700 text-xs">
              La classifica potrebbe cambiare al termine delle analisi attive.
            </p>
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#73787e]">Ordina per:</span>
          <div className="flex gap-1 bg-[#f5f5f5] rounded-lg p-1">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  sortBy === option.id
                    ? "bg-white text-[#2e3338] shadow-sm"
                    : "text-[#73787e] hover:text-[#2e3338]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f5] transition-colors"
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortOrder === "desc" ? "Decrescente" : "Crescente"}
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-12 text-center">
          <Loader2 className="w-12 h-12 text-[#2e3338] animate-spin mx-auto mb-4" />
          <p className="text-[#73787e]">Caricamento classifica...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedRepos.map((repo, index) => (
          <div
            key={repo.id}
            className="bg-white border border-[#e5e5e5] rounded-xl p-6 flex items-center gap-6 relative overflow-hidden group hover:shadow-md transition-all"
          >
            {/* Rank Position */}
            <div
              className={`flex flex-col items-center justify-center w-16 h-16 rounded-full bg-[#f5f5f5] ${getMedalColor(
                index
              )}`}
            >
              {index < 3 && sortOrder === "desc" ? (
                <Trophy className="w-8 h-8" />
              ) : (
                <span className="text-2xl font-bold">#{index + 1}</span>
              )}
            </div>

            {/* Repo Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-medium text-[#2e3338] mb-1">
                {repo.name}
              </h3>
              <p className="text-[#73787e] text-sm line-clamp-1 mb-3">
                {repo.description}
              </p>

              <div className="flex items-center gap-6 text-sm">
                <div
                  className={`flex items-center gap-2 ${
                    sortBy === "quality" ? "font-bold" : ""
                  }`}
                >
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-[#73787e]">Qualità:</span>
                  <span className="font-medium text-[#2e3338]">
                    {repo.qualityScore}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    sortBy === "security" ? "font-bold" : ""
                  }`}
                >
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-[#73787e]">Sicurezza:</span>
                  <span className="font-medium text-[#2e3338]">
                    {repo.securityScore}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    sortBy === "performance" ? "font-bold" : ""
                  }`}
                >
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="text-[#73787e]">Performance:</span>
                  <span className="font-medium text-[#2e3338]">
                    {repo.performanceScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Score */}
            <div className="text-right">
              <div className="text-3xl font-bold text-[#2e3338]">
                {sortBy === "average"
                  ? repo.averageScore
                  : sortBy === "quality"
                  ? repo.qualityScore
                  : sortBy === "security"
                  ? repo.securityScore
                  : repo.performanceScore}
              </div>
              <div className="text-xs text-[#73787e] uppercase tracking-wider font-medium">
                {sortOptions.find((o) => o.id === sortBy)?.label}
              </div>
            </div>

            {/* Progress Bar Background (Subtle) */}
            <div
              className="absolute bottom-0 left-0 h-1 bg-[#2e3338] opacity-5"
              style={{ width: `${repo.averageScore}%` }}
            />
          </div>
          ))}

          {sortedRepos.length === 0 && (
            <div className="text-center py-12 bg-white border border-[#e5e5e5] rounded-xl">
              <AlertCircle className="w-12 h-12 text-[#b4b4b4] mx-auto mb-4" />
              <h3 className="text-[#2e3338] mb-2">
                Nessuna classifica disponibile
              </h3>
              <p className="text-[#73787e]">
                Avvia l'analisi su almeno una repository per generare la
                classifica.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
