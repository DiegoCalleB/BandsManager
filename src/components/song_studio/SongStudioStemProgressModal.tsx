import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
import { Button, IconButton } from '../ui';

const IRIS_PRISM_RAYS = [
  { d: 'M 195,43 L 400,10', color: '#f43f5e' },
  { d: 'M 195,43 L 400,22', color: '#f97316' },
  { d: 'M 195,43 L 400,34', color: '#eab308' },
  { d: 'M 195,43 L 400,46', color: '#22c55e' },
  { d: 'M 195,43 L 400,58', color: '#06b6d4' },
  { d: 'M 195,43 L 400,70', color: '#a855f7' },
];

const IrisPrismBanner: React.FC = () => {
  return (
    <div className="relative w-full h-20 bg-[var(--sunken)] overflow-hidden flex items-center justify-center border-b border-[var(--hair)]/10 select-none">
      <svg className="w-full h-full absolute inset-0 text-[var(--ink)]" viewBox="0 0 400 80" preserveAspectRatio="none">
        {/* Rayo de luz blanco entrante animado */}
        <motion.path
          d="M 0,40 L 160,40"
          stroke="white"
          strokeWidth="2.5"
          strokeDasharray="6 3"
          opacity={0.85}
          animate={{ strokeDashoffset: [0, -18] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        />
        {/* Partícula de energía viajando hacia el prisma */}
        <motion.circle
          cy={40}
          r={3}
          fill="white"
          animate={{ cx: [0, 160], opacity: [0.1, 1, 0.1] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        />
        {/* Prisma óptico de cristal */}
        <polygon points="160,15 220,65 160,65" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <motion.polygon
          points="162,18 218,63 162,63"
          fill="rgba(255,255,255,0.08)"
          animate={{ opacity: [0.05, 0.25, 0.05] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        />
        {/* Destello focal de refracción */}
        <motion.circle
          cx={195}
          cy={43}
          r={4}
          fill="white"
          animate={{ scale: [0.8, 1.6, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        />
        {/* Rayos del espectro multicolor descompuesto flotando/fluyendo en cascada */}
        {IRIS_PRISM_RAYS.map((ray, i) => (
          <motion.path
            key={i}
            d={ray.d}
            stroke={ray.color}
            strokeWidth="2.5"
            strokeDasharray="8 4"
            opacity={0.85}
            animate={{ strokeDashoffset: [0, -24], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'linear', delay: i * 0.12 }}
          />
        ))}
      </svg>
      <div className="relative z-10 flex items-center gap-2 px-3 py-1 rounded-[var(--r-pill)] bg-[var(--sunken)]/85 text-micro font-mono text-[var(--ink-2)]">
        <motion.span
          className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--acc)]"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
        />
        <span>Iris Prism · Separar pistas</span>
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
            ? ''
            : esError
              ? 'border-2 '
              : 'border-2 '
        } bg-[var(--alert)]/10 hover:brightness-95`}
        title={terminado ? 'Iris ha terminado — toca para ver el resultado' : 'Reabrir el progreso de Iris'}
      >
        <div className="flex items-center gap-2">
          {!terminado ? (
            <Cpu className="w-4 h-4 text-[var(--acc)] shrink-0" />
          ) : esError ? (
            <AlertCircle className="w-4 h-4 text-[var(--alert)] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p
              className={`text-xs font-mono font-bold truncate ${!terminado ? 'text-[var(--ink)]' : esError ? 'text-[var(--alert)]' : 'text-[var(--ok)]'}`}
            >
              {!terminado ? 'Iris separando pistas…' : esError ? '¡Iris ha tenido un error!' : '¡Pistas listas!'}
            </p>
            <p className="text-micro font-mono text-[var(--ink-2)] truncate">{stemProgressModal.ideaTitle}</p>
          </div>
          {!terminado && (
            <span className="font-mono text-xs font-bold text-[var(--acc)] shrink-0">{Math.round(stemProgressModal.progressPct || 0)}%</span>
          )}
          <Maximize2 className="w-3 h-3 text-[var(--ink-2)] shrink-0" />
        </div>
        <div className="mt-2 w-full h-1.5 bg-[var(--sunken)] rounded-[var(--r-pill)] overflow-hidden ">
          <div
            className={`h-full rounded-[var(--r-pill)] transition-ui duration-300 ${
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
      <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-md md:max-w-2xl w-full p-6 text-[var(--ink)] space-y-5 animate-in fade-in zoom-in-95 duration-200">
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
                    ? 'bg-[var(--alert)]/20 '
                    : 'bg-[var(--ok)]/20 '
                  : 'bg-[var(--acc)]/20 '
              }`}
            >
              {terminado ? (
                esError ? (
                  <AlertTriangle className="w-5 h-5 text-[var(--alert)]" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-[var(--ok)]" />
                )
              ) : (
                <Cpu className="w-5 h-5 text-[var(--acc)]" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm font-mono">
                {terminado ? (esError ? 'Error en separación de Iris' : '¡Pistas separadas con éxito!') : 'Iris Espectro en proceso...'}
              </h3>
              <p className="text-xs text-[var(--ink-2)] font-mono">{stemProgressModal.ideaTitle || 'Pista de Audio'}</p>
            </div>
          </div>
          <IconButton
            label="Minimizar a segundo plano"
            size="icon-xs"
            type="button"
            onClick={() => setStemProgressModal((prev: any) => (prev ? { ...prev, minimized: true } : null))}
          >
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        <div className="space-y-4 text-xs font-mono">
          {!terminado && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--acc)] font-bold">Progreso: {Math.round(stemProgressModal.progressPct || 0)}%</span>
                <span className="text-[var(--ink-2)] animate-pulse">Procesando frecuencia de audio…</span>
              </div>
              <div className="w-full h-2.5 bg-[var(--sunken)] rounded-[var(--r-pill)] overflow-hidden ">
                <div
                  className="h-full bg-[var(--acc)]  transition-ui duration-300"
                  style={{ width: `${Math.max(5, stemProgressModal.progressPct || 0)}%` }}
                />
              </div>
            </div>
          )}

          {terminado && !esError && (
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--ok)]/40 space-y-3">
              <p className="text-[var(--ok)] font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Las pistas aisladas ya están disponibles en la vista multicanal.
              </p>
              <p className="text-xs text-[var(--ink-2)] font-sans leading-relaxed">
                Puedes ajustar el volumen, silenciar o aislar cada instrumento de forma independiente para ensayar o transcribir.
              </p>
            </div>
          )}

          {esError && (
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--alert)]/40 space-y-3">
              <p className="text-[var(--alert)] font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--alert)]" />
                {stemProgressModal.errorType === 'billing_required' ? 'Plan o cuota agotada' : 'No se pudo completar la separación'}
              </p>
              <p className="text-xs text-[var(--ink-2)] font-sans leading-relaxed">
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
                    className="px-2.5 py-1 rounded bg-[var(--alert)]/40 hover:bg-[var(--alert)]/60 text-[var(--ink)] text-micro font-mono flex items-center gap-1 cursor-pointer"
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
          <Button
            variant="neutral"
            size="sm"
            type="button"
            onClick={() => setStemProgressModal((prev: any) => (prev ? { ...prev, minimized: true } : null))}
          >
            Seguir en segundo plano
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={() => setStemProgressModal(null)}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
