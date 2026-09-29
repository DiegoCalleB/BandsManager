import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
  Layers,
  ShieldAlert,
  Loader2,
  Music,
  Zap,
  ExternalLink,
  Cpu,
  AlertCircle,
  CheckCircle2,
  Maximize2,
  Copy,
} from 'lucide-react';

const IrisPrismBanner: React.FC = () => {
  return (
    <div className="relative w-full h-20 bg-[var(--sunken)] overflow-hidden flex items-center justify-center border-b border-[var(--hair)]/10 select-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[var(--surface)] via-black to-black opacity-80" />
      <svg className="w-full h-full absolute inset-0 text-[var(--ink)]" viewBox="0 0 400 80" preserveAspectRatio="none">
        <path d="M 0,40 L 160,40" stroke="white" strokeWidth="2" strokeDasharray="4 2" opacity="0.6" className="animate-pulse" />
        <polygon points="160,15 220,65 160,65" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <polygon points="162,18 218,63 162,63" fill="rgba(255,255,255,0.05)" />
        <path d="M 195,43 L 400,10" stroke="#f43f5e" strokeWidth="2" opacity="0.8" />
        <path d="M 195,43 L 400,22" stroke="#f97316" strokeWidth="2" opacity="0.8" />
        <path d="M 195,43 L 400,34" stroke="#eab308" strokeWidth="2" opacity="0.8" />
        <path d="M 195,43 L 400,46" stroke="#22c55e" strokeWidth="2" opacity="0.8" />
        <path d="M 195,43 L 400,58" stroke="#06b6d4" strokeWidth="2" opacity="0.8" />
        <path d="M 195,43 L 400,70" stroke="#a855f7" strokeWidth="2" opacity="0.8" />
      </svg>
      <div className="relative z-10 flex items-center gap-2 px-3 py-1 rounded-[var(--r-pill)] bg-[var(--surface)]/60 border border-[var(--hair)]/10 text-[10px] font-mono text-[var(--ink-2)]">
        <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--acc)] animate-ping" />
        <span>Iris Espectro · Separación Multicapa por IA</span>
      </div>
    </div>
  );
};

interface SongStudioStemProgressModalProps {
  stemProgressModal: any;
  setStemProgressModal: (val: any) => void;
  handleRetryStemSeparation?: (idea: any) => void;
  handleOpenBillingModal?: () => void;
  handleSaveSeparatedStemsToIdea?: (idea: any, stems: any[]) => void;
}

export const SongStudioStemProgressModal: React.FC<SongStudioStemProgressModalProps> = ({
  stemProgressModal,
  setStemProgressModal,
  handleRetryStemSeparation,
  handleOpenBillingModal,
  handleSaveSeparatedStemsToIdea,
}) => {
  const [copiedStemError, setCopiedStemError] = useState(false);

  if (!stemProgressModal || !stemProgressModal.isOpen) return null;

  const idea = stemProgressModal.targetIdea;
  const terminado = stemProgressModal.stage === 'completed' || stemProgressModal.stage === 'error';
  const esError = stemProgressModal.stage === 'error';

  if (stemProgressModal.minimized) {
    return (
      <button
        type="button"
        onClick={() => setStemProgressModal((prev: any) => (prev ? { ...prev, minimized: false } : null))}
        className={`fixed bottom-20 right-3 sm:right-6 z-[1150] w-56 rounded-[var(--r-l)] bg-[var(--surface)]/95 p-3 text-left cursor-pointer transition-colors animate-in fade-in slide-in-from-bottom-2 duration-200 ${
          !terminado
            ? 'border border-[var(--hair)] hover:border-[var(--ink-3)]'
            : esError
              ? 'border-2 border-[var(--alert)]/30 hover:border-[var(--ink-3)] animate-pulse'
              : 'border-2 border-[var(--ok)]/30 hover:border-[var(--ink-3)] animate-pulse'
        }`}
        title={terminado ? 'Iris ha terminado — toca para ver el resultado' : 'Reabrir el progreso de Iris'}
      >
        <div className="flex items-center gap-2">
          {!terminado ? (
            <Cpu className="w-4 h-4 text-[var(--acc)] animate-pulse shrink-0" />
          ) : esError ? (
            <AlertCircle className="w-4 h-4 text-[var(--alert)] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p
              className={`text-[11px] font-mono font-bold truncate ${!terminado ? 'text-[var(--ink)]' : esError ? 'text-[var(--alert)]' : 'text-[var(--ok)]'}`}
            >
              {!terminado ? 'Iris separando pistas…' : esError ? '¡Iris ha tenido un error!' : '¡Pistas listas!'}
            </p>
            <p className="text-[10px] font-mono text-[var(--ink-2)] truncate">{stemProgressModal.ideaTitle}</p>
          </div>
          {!terminado && (
            <span className="font-mono text-xs font-bold text-[var(--acc)] shrink-0">{Math.round(stemProgressModal.progressPct || 0)}%</span>
          )}
          <Maximize2 className="w-3 h-3 text-[var(--ink-2)] shrink-0" />
        </div>
        <div className="mt-2 w-full h-1.5 bg-[var(--surface)] rounded-[var(--r-pill)] overflow-hidden border border-[var(--hair)]/10">
          <div
            className={`h-full rounded-[var(--r-pill)] transition-all duration-300 ${
              !terminado ? 'bg-[var(--acc)] ' : esError ? 'bg-[var(--alert)]' : 'bg-[var(--ok)]'
            }`}
            style={{ width: `${terminado ? 100 : Math.max(5, stemProgressModal.progressPct || 0)}%` }}
          />
        </div>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-[var(--scrim)]/85 z-[9999] flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] border border-[var(--hair)] rounded-[var(--r-l)] max-w-md md:max-w-2xl w-full p-6 text-[var(--ink)] space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {!terminado && (
          <div className="-mx-6">
            <IrisPrismBanner />
          </div>
        )}

        <div className="flex items-center justify-between pb-3 border-b border-[var(--hair)]/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-[var(--r-m)] flex items-center justify-center relative ${
                terminado
                  ? esError
                    ? 'bg-[var(--alert)]/20 border-[var(--hair)]'
                    : 'bg-[var(--ok)]/20 border-[var(--ok)]/30'
                  : 'bg-[var(--acc)]/20 border-[var(--acc)]/30'
              }`}
            >
              {terminado ? (
                esError ? (
                  <AlertTriangle className="w-5 h-5 text-[var(--alert)]" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-[var(--ok)]" />
                )
              ) : (
                <Cpu className="w-5 h-5 text-[var(--acc)] animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm font-mono">
                {terminado ? (esError ? 'Error en separación de Iris' : '¡Pistas separadas con éxito!') : 'Iris Espectro en proceso...'}
              </h3>
              <p className="text-[11px] text-[var(--ink-2)] font-mono">{stemProgressModal.ideaTitle || 'Pista de Audio'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStemProgressModal((prev: any) => (prev ? { ...prev, minimized: true } : null))}
            className="p-1 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--r-m)] hover:bg-[var(--ink)]/10 transition-colors"
            title="Minimizar a segundo plano"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs font-mono">
          {!terminado && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--acc)] font-bold">Progreso: {Math.round(stemProgressModal.progressPct || 0)}%</span>
                <span className="text-[var(--ink-2)] animate-pulse">Procesando frecuencia de audio...</span>
              </div>
              <div className="w-full h-2.5 bg-[var(--surface)] rounded-[var(--r-pill)] overflow-hidden border border-[var(--hair)]">
                <div
                  className="h-full bg-[var(--acc)]  transition-all duration-300"
                  style={{ width: `${Math.max(5, stemProgressModal.progressPct || 0)}%` }}
                />
              </div>
            </div>
          )}

          {terminado && !esError && (
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--ok)]/40 border border-[var(--hair)] space-y-3">
              <p className="text-[var(--ok)] font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Las pistas aisladas ya están disponibles en la vista multicanal.
              </p>
              <p className="text-[11px] text-[var(--ink-2)] font-sans leading-relaxed">
                Puedes ajustar el volumen, silenciar o aislar cada instrumento de forma independiente para ensayar o transcribir.
              </p>
            </div>
          )}

          {esError && (
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--alert)]/40 border border-[var(--hair)] space-y-3">
              <p className="text-[var(--alert)] font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--alert)]" />
                {stemProgressModal.errorType === 'billing_required' ? 'Plan o cuota agotada' : 'No se pudo completar la separación'}
              </p>
              <p className="text-[11px] text-[var(--ink-2)] font-sans leading-relaxed">
                {stemProgressModal.errorDetail || 'Ocurrió un error inesperado al comunicarse con el servidor de Iris Espectro.'}
              </p>
              {stemProgressModal.errorDetail && (
                <div className="pt-2 border-t border-[var(--hair)]">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(stemProgressModal.errorDetail);
                      setCopiedStemError(true);
                      setTimeout(() => setCopiedStemError(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded bg-[var(--alert)]/40 hover:bg-[var(--alert)]/60 text-[var(--alert)] text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedStemError ? '¡Copiado!' : 'Copiar detalle del error'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[var(--hair)]/10">
          <button
            type="button"
            onClick={() => setStemProgressModal((prev: any) => (prev ? { ...prev, minimized: true } : null))}
            className="px-4 py-2 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] font-mono text-xs font-bold cursor-pointer"
          >
            Seguir en segundo plano
          </button>
          <button
            type="button"
            onClick={() => setStemProgressModal(null)}
            className="px-4 py-2 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--ink)] font-mono text-xs font-black cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
