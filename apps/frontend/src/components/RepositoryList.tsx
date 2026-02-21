import { Search, FolderGit2, Clock, CheckCircle2, AlertCircle, Loader2, Play, X, Link, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Repository, AnalysisStatus } from '../types';
import { repositoriesApi, analysisApi } from '../services/api';
import { toast } from 'sonner';

interface RepositoryListProps {
  onSelectRepo: (repo: Repository) => void;
}

export function RepositoryList({ onSelectRepo }: RepositoryListProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Form state
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        const repos = await repositoriesApi.getAll();
        setRepositories(repos);
      } catch (error: any) {
        toast.error('Errore caricamento repository');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepositories();
  }, []);

  // Polling per aggiornare lo stato di analisi in corso
  useEffect(() => {
    const hasInProgress = repositories.some((repo: Repository) => repo.lastAnalysis?.status === 'in-progress');
    if (!hasInProgress) return;

    const interval = setInterval(async () => {
      try {
        const repos = await repositoriesApi.getAll();
        setRepositories(repos);
      } catch (error) {
        console.error('Errore polling repository:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [repositories]);

  const filteredRepos = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddRepository = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName.trim() || !newUrl.trim()) {
      setFormError('Nome e URL sono obbligatori');
      return;
    }

    try {
      const newRepo = await repositoriesApi.create({
        name: newName,
        description: newDescription,
        url: newUrl,
      });

      setRepositories([newRepo, ...repositories]);
      toast.success('Repository aggiunta!');

      // Reset form
      setNewName('');
      setNewUrl('');
      setNewDescription('');
      setFormError('');
      setIsAddFormOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Errore aggiunta repository');
    }
  };

  const handleStartAnalysis = async (e: React.MouseEvent, repoId: string) => {
    e.stopPropagation();

    try {
      await analysisApi.startAnalysis(repoId);
      toast.success('Analisi avviata!');

      // Update status locale
      setRepositories(repositories.map(repo =>
        repo.id === repoId
          ? {
              ...repo,
              lastAnalysis: {
                ...(repo.lastAnalysis || {}),
                status: 'in-progress' as const,
                date: new Date().toISOString(),
              }
            }
          : repo
      ));
    } catch (error: any) {
      toast.error(error.message || 'Errore avvio analisi');
    }
  };

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
        <h1 className="text-[#2e3338] mb-2">Repository</h1>
        <p className="text-[#73787e]">
          Gestisci e analizza le tue repository GitHub
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#73787e]" />
            <input
              type="text"
              placeholder="Cerca repository..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e5e5e5] rounded-lg text-[#2e3338] placeholder:text-[#73787e] focus:outline-none focus:ring-2 focus:ring-[#2e3338] focus:ring-offset-0"
            />
          </div>
          <button 
            onClick={() => setIsAddFormOpen(!isAddFormOpen)}
            className={`px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-medium ${
              isAddFormOpen 
                ? 'bg-[#e5e5e5] text-[#2e3338]' 
                : 'bg-[#2e3338] text-white hover:bg-[#1a1d21]'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Aggiungi Repository</span>
            {isAddFormOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isAddFormOpen && (
          <div className="bg-white border border-[#e5e5e5] rounded-lg p-6 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-[#2e3338]">Nuova Repository</h3>
              <button onClick={() => setIsAddFormOpen(false)} className="text-[#73787e] hover:text-[#2e3338]">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddRepository} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2e3338] mb-1">
                    Nome Repository <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FolderGit2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#73787e]" />
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="es. code-guardian-webapp"
                      className="w-full pl-10 pr-4 py-2 bg-white border border-[#e5e5e5] rounded-lg text-[#2e3338] focus:outline-none focus:ring-2 focus:ring-[#2e3338]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2e3338] mb-1">
                    URL Repository <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#73787e]" />
                    <input
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full pl-10 pr-4 py-2 bg-white border border-[#e5e5e5] rounded-lg text-[#2e3338] focus:outline-none focus:ring-2 focus:ring-[#2e3338]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2e3338] mb-1">
                  Descrizione
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-[#73787e]" />
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Breve descrizione del progetto..."
                    rows={2}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#e5e5e5] rounded-lg text-[#2e3338] focus:outline-none focus:ring-2 focus:ring-[#2e3338] resize-none"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2e3338] text-white rounded-lg hover:bg-[#1a1d21] transition-colors font-medium"
                >
                  Salva Repository
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {filteredRepos.map((repo) => (
          <div
            key={repo.id}
            onClick={() => onSelectRepo(repo)}
            className="w-full bg-white border border-[#e5e5e5] rounded-lg p-5 hover:shadow-md transition-all text-left group cursor-pointer relative"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-[#f5f5f5] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#e5e5e5] transition-colors">
                  <FolderGit2 className="w-5 h-5 text-[#2e3338]" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#2e3338] mb-1 truncate font-medium">
                    {repo.name}
                  </h3>
                  <p className="text-[#73787e] mb-3 line-clamp-2 text-sm">
                    {repo.description || 'Nessuna descrizione'}
                  </p>
                  
                  <div className="flex items-center gap-4 flex-wrap text-sm">
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(repo.lastAnalysis?.status || 'not-analyzed')}
                      <span className={`${getStatusColor(repo.lastAnalysis?.status || 'not-analyzed')}`}>
                        {getStatusText(repo.lastAnalysis?.status || 'not-analyzed')}
                      </span>
                    </div>

                    <span className="text-[#73787e]">•</span>

                    <span className="text-[#73787e]">
                      {new Date(repo.lastAnalysis?.date || repo.created_at || Date.now()).toLocaleDateString('it-IT')}
                    </span>

                    <span className="text-[#73787e]">•</span>

                    <span className="text-[#73787e]">
                      {repo.totalAnalyses || 0} {repo.totalAnalyses === 1 ? 'analisi' : 'analisi'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                {repo.lastAnalysis?.status !== 'in-progress' && (
                  <button
                    onClick={(e) => handleStartAnalysis(e, repo.id)}
                    className="p-2 text-[#73787e] hover:text-[#2e3338] hover:bg-[#f5f5f5] rounded-lg transition-colors"
                    title="Avvia analisi"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRepos.length === 0 && (
        <div className="text-center py-12">
          <FolderGit2 className="w-12 h-12 text-[#b4b4b4] mx-auto mb-4" />
          <p className="text-[#73787e]">
            Nessuna repository trovata
          </p>
        </div>
      )}
    </div>
  );
}
