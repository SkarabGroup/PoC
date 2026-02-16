import { CheckCircle2, XCircle, Lightbulb, Code } from 'lucide-react';
import { Repository } from '../types';
import { useState } from 'react';

interface RemediationSectionProps {
  repository: Repository;
}

export function RemediationSection({ repository }: RemediationSectionProps) {
  const [acceptedRemediations, setAcceptedRemediations] = useState<Set<string>>(new Set());
  const [rejectedRemediations, setRejectedRemediations] = useState<Set<string>>(new Set());

  const report = repository.lastAnalysis?.report;

  if (!report || !report.remediations || report.remediations.length === 0) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-[#2e3338] mb-2">Nessuna remediation disponibile</h3>
        <p className="text-[#73787e]">
          Non sono stati rilevati problemi che richiedono interventi
        </p>
      </div>
    );
  }

  const handleAccept = (id: string) => {
    setAcceptedRemediations(new Set(acceptedRemediations).add(id));
    setRejectedRemediations(new Set([...rejectedRemediations].filter(r => r !== id)));
  };

  const handleReject = (id: string) => {
    setRejectedRemediations(new Set(rejectedRemediations).add(id));
    setAcceptedRemediations(new Set([...acceptedRemediations].filter(r => r !== id)));
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-blue-900 mb-1">Remediation Suggerite</h3>
          <p className="text-blue-700">
            Questi suggerimenti possono migliorare la qualità e la sicurezza del tuo codice. 
            Rivedi ogni suggerimento e decidi se implementarlo.
          </p>
        </div>
      </div>

      {report.remediations.map((remediation) => {
        const isAccepted = acceptedRemediations.has(remediation.id);
        const isRejected = rejectedRemediations.has(remediation.id);

        return (
          <div
            key={remediation.id}
            className={`bg-white border rounded-lg overflow-hidden transition-all ${
              isAccepted ? 'border-green-300' :
              isRejected ? 'border-red-300' :
              'border-[#e5e5e5]'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-white ${
                      remediation.severity === 'critical' ? 'bg-red-600' :
                      remediation.severity === 'warning' ? 'bg-yellow-600' :
                      'bg-blue-600'
                    }`}>
                      {remediation.severity === 'critical' ? 'Critico' :
                       remediation.severity === 'warning' ? 'Avvertimento' :
                       'Info'}
                    </span>
                    <span className="text-[#73787e]">{remediation.category}</span>
                  </div>
                  
                  <h3 className="text-[#2e3338] mb-2">{remediation.title}</h3>
                  <p className="text-[#73787e] mb-4">{remediation.description}</p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-[#2e3338] mb-2 flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        Codice attuale
                      </h4>
                      <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-lg p-4 overflow-x-auto">
                        <pre className="text-[#2e3338] font-mono">
                          <code>{remediation.currentCode}</code>
                        </pre>
                      </div>
                      <div className="mt-2 text-[#73787e]">
                        {remediation.file}:{remediation.line}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[#2e3338] mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Suggerimento
                      </h4>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-green-900 font-mono">
                          <code>{remediation.suggestedCode}</code>
                        </pre>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-blue-900 mb-1">Perché questo cambiamento?</h4>
                      <p className="text-blue-700">{remediation.reason}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-[#e5e5e5]">
                <button
                  onClick={() => handleAccept(remediation.id)}
                  disabled={isAccepted}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    isAccepted
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-[#e5e5e5] text-[#2e3338] hover:bg-green-50 hover:border-green-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isAccepted ? 'Accettata' : 'Accetta'}
                </button>
                
                <button
                  onClick={() => handleReject(remediation.id)}
                  disabled={isRejected}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    isRejected
                      ? 'bg-red-600 text-white'
                      : 'bg-white border border-[#e5e5e5] text-[#2e3338] hover:bg-red-50 hover:border-red-300'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  {isRejected ? 'Rifiutata' : 'Rifiuta'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
