import React, { useState } from 'react';
import { Sparkles, X, RotateCcw, Check, Zap } from 'lucide-react';
import { BAND_STYLE_PRESETS, ROCK_SYMBOLS, cleanToNormalText } from '../../utils/bandNameStyler';

interface BandNameStylerHelperProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
}

export const BandNameStylerHelper: React.FC<BandNameStylerHelperProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handleApplyPreset = (applyFn: (input: string) => string) => {
    const raw = value || 'Mi Banda';
    const transformed = applyFn(raw);
    onChange(transformed);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 1500);
  };

  const handleInsertSymbol = (symbol: string) => {
    onChange((value || '') + symbol);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 1200);
  };

  const handleClean = () => {
    if (!value) return;
    onChange(cleanToNormalText(value));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 1500);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
        title="Estilizar nombre de la banda con fuentes Rock, estilo KoЯn y símbolos"
      >
        <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
        <span>Estilos Rock & KoЯn</span>
      </button>

      {/* Floating Popover / Helper Modal */}
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-80 sm:w-96 rounded-2xl bg-[#181716] border border-amber-500/40 p-4 shadow-2xl z-50 text-neutral-200 animate-in fade-in zoom-in-95 duration-150 space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#2b2927] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                  Я
                </div>
                <div>
                  <h4 className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                    <span>Estilos de Banda & Tipografía</span>
                    <Zap className="w-3 h-3 text-amber-400" />
                  </h4>
                  <p className="text-[10px] text-neutral-400 font-mono">100% compatible con Supabase y móviles</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Badge */}
            {copiedNotification && (
              <div className="py-1 px-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>¡Estilo aplicado al nombre!</span>
              </div>
            )}

            {/* Presets Grid */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center justify-between">
                <span>Transformar Nombre Actual:</span>
                <span className="text-amber-400/80 font-normal">Clic para aplicar</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {BAND_STYLE_PRESETS.map((preset) => {
                  const sampleText = value ? preset.apply(value) : preset.previewSample;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.apply)}
                      className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-amber-500/60 hover:bg-neutral-900 text-left transition-all cursor-pointer group flex flex-col justify-between min-h-[52px]"
                    >
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono group-hover:text-amber-300">
                        <span>{preset.label}</span>
                        <span className="text-xs">{preset.icon}</span>
                      </div>
                      <div className="text-xs font-bold text-white truncate group-hover:text-amber-200 mt-0.5" title={sampleText}>
                        {sampleText}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Symbols Palette */}
            <div className="space-y-1.5 pt-1 border-t border-[#2b2927]">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center justify-between">
                <span>Insertar Carácter o Símbolo:</span>
                <span className="text-neutral-500 font-normal">Añadir al nombre</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ROCK_SYMBOLS.map((sym, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertSymbol(sym)}
                    className="w-7 h-7 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-amber-400 hover:bg-amber-500/20 text-neutral-200 hover:text-white font-bold text-xs flex items-center justify-center transition-all cursor-pointer active:scale-95"
                    title={`Insertar ${sym}`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer: Clean button + Close */}
            <div className="pt-2 border-t border-[#2b2927] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleClean}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-400 hover:text-rose-300 transition-colors cursor-pointer"
                title="Restaurar a texto estándar sin caracteres especiales"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar texto plano</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-[11px] font-bold transition-colors cursor-pointer"
              >
                Listo
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  );
};
