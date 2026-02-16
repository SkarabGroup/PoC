import { X, Code, FileCheck, TestTube, Shield } from 'lucide-react';
import { useState } from 'react';

interface AnalysisOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (areas: { code: boolean; documentation: boolean; tests: boolean; security: boolean }) => void;
  repositoryName: string;
}

export function AnalysisOptionsModal({ isOpen, onClose, onStart, repositoryName }: AnalysisOptionsModalProps) {
  const [areas, setAreas] = useState({
    code: true,
    documentation: true,
    tests: true,
    security: true,
  });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check at least one area is selected
    const hasSelectedArea = Object.values(areas).some(value => value);
    if (!hasSelectedArea) {
      setError('Seleziona almeno un\'area da analizzare');
      return;
    }

    onStart(areas);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[#2e3338]">Avvia Analisi</h2>
            <p className="text-sm text-[#73787e] mt-1">{repositoryName}</p>
          </div>
          <button onClick={onClose} className="text-[#73787e] hover:text-[#2e3338] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2e3338] mb-3">
              Seleziona le aree da analizzare <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-3 border border-[#e5e5e5] rounded-lg cursor-pointer hover:bg-[#f5f5f5] transition-colors">
                <input
                  type="checkbox"
                  checked={areas.code}
                  onChange={(e) => setAreas({ ...areas, code: e.target.checked })}
                  className="w-4 h-4 text-[#2e3338] border-[#e5e5e5] rounded focus:ring-2 focus:ring-[#2e3338]"
                />
                <Code className="w-5 h-5 text-[#73787e]" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[#2e3338]">Codice</span>
                  <p className="text-xs text-[#73787e]">Analisi qualità del codice, bug detection</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-[#e5e5e5] rounded-lg cursor-pointer hover:bg-[#f5f5f5] transition-colors">
                <input
                  type="checkbox"
                  checked={areas.documentation}
                  onChange={(e) => setAreas({ ...areas, documentation: e.target.checked })}
                  className="w-4 h-4 text-[#2e3338] border-[#e5e5e5] rounded focus:ring-2 focus:ring-[#2e3338]"
                />
                <FileCheck className="w-5 h-5 text-[#73787e]" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[#2e3338]">Documentazione</span>
                  <p className="text-xs text-[#73787e]">Spelling, completezza README, commenti</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-[#e5e5e5] rounded-lg cursor-pointer hover:bg-[#f5f5f5] transition-colors">
                <input
                  type="checkbox"
                  checked={areas.tests}
                  onChange={(e) => setAreas({ ...areas, tests: e.target.checked })}
                  className="w-4 h-4 text-[#2e3338] border-[#e5e5e5] rounded focus:ring-2 focus:ring-[#2e3338]"
                />
                <TestTube className="w-5 h-5 text-[#73787e]" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[#2e3338]">Test</span>
                  <p className="text-xs text-[#73787e]">Coverage, qualità test suite</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-[#e5e5e5] rounded-lg cursor-pointer hover:bg-[#f5f5f5] transition-colors">
                <input
                  type="checkbox"
                  checked={areas.security}
                  onChange={(e) => setAreas({ ...areas, security: e.target.checked })}
                  className="w-4 h-4 text-[#2e3338] border-[#e5e5e5] rounded focus:ring-2 focus:ring-[#2e3338]"
                />
                <Shield className="w-5 h-5 text-[#73787e]" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[#2e3338]">Sicurezza</span>
                  <p className="text-xs text-[#73787e]">Vulnerabilità OWASP, best practices</p>
                </div>
              </label>
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
              Avvia Analisi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
