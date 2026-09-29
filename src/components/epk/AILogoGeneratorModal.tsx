import React, { useState } from 'react';
import { Sparkles, X, Loader2, Check, RefreshCw, Palette, Wand2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface AILogoGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLogo: (logoUrl: string) => void;
  bandName?: string;
  genre?: string;
}

const LOGO_STYLES = [
  {
    id: 'vintage_rock',
    name: 'Vintage Rock & Grunge',
    desc: 'Emblema retro setentero, textura rockera y tonos cálidos ámbar/dorado.',
    icon: '🎸',
  },
  {
    id: 'minimal_modern',
    name: 'Minimalista & Geométrico',
    desc: 'Líneas vectoriales depuradas, estética suiza y elegancia monocroma.',
    icon: '📐',
  },
  {
    id: 'neon_synth',
    name: 'Neón & Sintetizador',
    desc: 'Bordes luminosos cyber/synthwave con ondas de audio y contrastes intensos.',
    icon: '⚡',
  },
  {
    id: 'classic_badge',
    name: 'Escudo & Insignia Clásica',
    desc: 'Sello circular tradicional con tipografía curvada y detalles heráldicos.',
    icon: '🛡️',
  },
  {
    id: 'bold_typography',
    name: 'Tipográfico Impactante',
    desc: 'Letras rotundas de póster de festival con alta presencia visual.',
    icon: '🔤',
  },
];

export const AILogoGeneratorModal: React.FC<AILogoGeneratorModalProps> = ({ isOpen, onClose, onSelectLogo, bandName = '', genre = '' }) => {
  const [selectedStyle, setSelectedStyle] = useState('minimal_modern');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await api.generateBandLogo({
        style: selectedStyle,
        customPrompt,
        genre,
      });

      if (response && response.logoUrl) {
        setGeneratedLogo(response.logoUrl);
      } else {
        throw new Error('No se recibió la imagen generada.');
      }
    } catch (err: any) {
      console.error('Error generando logo:', err);
      setError(err?.response?.data?.error || err?.message || 'Error al generar el logo con IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyLogo = () => {
    if (generatedLogo) {
      onSelectLogo(generatedLogo);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--surface)]/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[var(--surface)] border border-[var(--hair)] rounded-[var(--r-l)] w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--hair)] flex items-center justify-between bg-[var(--surface)]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[var(--r-m)] bg-gradient-to-br from-[var(--acc)] to-[var(--acc)] flex items-center justify-center text-[var(--ink)] shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--ink)] flex items-center gap-2">
                Diseñador de Logotipos con IA
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/10 text-[var(--acc)] border border-[var(--hair)]">
                  Amateur & Indie
                </span>
              </h3>
              <p className="text-xs text-[var(--ink-2)]">Genera una identidad visual profesional para {bandName || 'tu banda'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--r-m)] hover:bg-[var(--surface)] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 bg-[var(--alert)]/80 border border-[var(--hair)] rounded-[var(--r-m)] text-[var(--alert)] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[var(--alert)] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Style Selector */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink-2)] block mb-2 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-[var(--acc)]" /> Selecciona el estilo visual
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {LOGO_STYLES.map((style) => {
                const isSelected = selectedStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-3 rounded-[var(--r-m)] border text-left transition flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-[var(--acc)]/10 border-[var(--acc)]/30 ring-1 ring-[var(--acc)]/40'
                        : 'bg-[var(--surface)]/60 border-[var(--hair)] hover:border-[var(--hair)] hover:bg-[var(--surface)]'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{style.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[var(--ink-2)]">{style.name}</div>
                      <div className="text-[11px] text-[var(--ink-2)] leading-tight mt-0.5 line-clamp-2">{style.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom prompt refinement */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink-2)] block mb-1.5 flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-[var(--acc)]" /> Indicaciones adicionales (opcional)
            </label>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ej: añadir forma de rayo, tonos dorados y negros, aire psicodélico..."
              className="w-full bg-[var(--surface)] border border-[var(--hair)] focus:border-[var(--ink-3)] rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink-2)] outline-none"
            />
          </div>

          {/* Preview Canvas */}
          {generatedLogo && (
            <div className="p-4 bg-[var(--surface)]/80 border border-[var(--hair)] rounded-[var(--r-l)] flex flex-col items-center gap-3">
              <div className="text-xs font-bold text-[var(--acc)] flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[var(--ok)]" /> Logotipo generado con éxito
              </div>
              <div className="relative group">
                <img
                  src={generatedLogo}
                  alt="Logo generado con IA"
                  className="w-44 h-44 rounded-[var(--r-l)] object-contain p-2 bg-[var(--surface)] border border-[var(--hair)] shadow-xl"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--hair)] bg-[var(--surface)]/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[var(--r-m)] text-xs font-semibold text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--acc)] font-bold text-xs flex items-center gap-2 transition disabled:opacity-50 border border-[var(--hair)]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Diseñando...
                </>
              ) : generatedLogo ? (
                <>
                  <RefreshCw className="w-4 h-4" /> Generar otra variante
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[var(--acc)]" /> Crear logotipo con IA
                </>
              )}
            </button>

            {generatedLogo && (
              <button
                type="button"
                onClick={handleApplyLogo}
                className="px-4 py-2.5 rounded-[var(--r-m)] bg-gradient-to-r from-[var(--acc)] to-[var(--acc)] hover:from-[var(--acc)] hover:to-[var(--acc)] text-[var(--ink)] font-bold text-xs flex items-center gap-1.5 transition shadow-lg"
              >
                <Check className="w-4 h-4" /> Aplicar al EPK
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
