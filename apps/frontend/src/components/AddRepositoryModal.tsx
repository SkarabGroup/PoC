import { X, FolderGit2, Link, FileText } from 'lucide-react';
import { useState } from 'react';

interface AddRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; description: string; url: string }) => void;
}

export function AddRepositoryModal({ isOpen, onClose, onAdd }: AddRepositoryModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !url.trim()) {
      setError('Nome e URL sono obbligatori');
      return;
    }

    onAdd({ name, description, url });
    setName('');
    setDescription('');
    setUrl('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#2e3338]">Aggiungi Repository</h2>
          <button onClick={onClose} className="text-[#73787e] hover:text-[#2e3338] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2e3338] mb-1">
              Nome Repository <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FolderGit2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#73787e]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#e5e5e5] rounded-lg text-[#2e3338] focus:outline-none focus:ring-2 focus:ring-[#2e3338]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2e3338] mb-1">
              Descrizione
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-[#73787e]" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrizione del progetto..."
                rows={3}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#e5e5e5] rounded-lg text-[#2e3338] focus:outline-none focus:ring-2 focus:ring-[#2e3338] resize-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#73787e] hover:bg-[#f5f5f5] rounded-lg transition-colors font-medium"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2e3338] text-white rounded-lg hover:bg-[#1a1d21] transition-colors font-medium"
            >
              Salva Repository
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
