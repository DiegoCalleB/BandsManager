import React, { useState } from "react";
import { Sparkles, X, RotateCcw, Check, Zap } from "lucide-react";
import {
  BAND_STYLE_PRESETS,
  ROCK_SYMBOLS,
  cleanToNormalText,
} from "../../utils/bandNameStyler";
import { ShowIcon } from '../ui/ShowIcon';

interface BandNameStylerHelperProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
}

export const BandNameStylerHelper: React.FC<BandNameStylerHelperProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handleApplyPreset = (applyFn: (input: string) => string) => {
    const raw = value || "Mi Banda";
    const transformed = applyFn(raw);
    onChange(transformed);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 1500);
  };

  const handleInsertSymbol = (symbol: string) => {
    onChange((value || "") + symbol);
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
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-m)] text-xs font-sans font-bold bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc)]/70 transition-ui cursor-pointer active:scale-[0.97]"
        title="Estilizar nombre de la banda con fuentes Rock, estilo KoЯn y símbolos"
      >
        <Sparkles className="w-3 h-3 text-[var(--acc)]" />
        <span>Estilos Rock & KoЯn</span>
      </button>

      {/* Floating Popover / Helper Modal */}
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 z-[9999] bg-[var(--scrim)]/40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-80 sm:w-96 rounded-[var(--r-l)] bg-[var(--surface)] p-4 z-50 text-[var(--ink-2)] animate-in fade-in zoom-in-95 duration-150 space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[var(--r-s)] bg-[var(--acc)]/20 flex items-center justify-center text-[var(--acc)] font-bold text-xs">
                  Я
                </div>
                <div>
                  <h4 className="text-xs font-bold font-sans text-[var(--ink)] flex items-center gap-1.5">
                    <span>Estilos de Banda & Tipografía</span>
                    <Zap className="w-3 h-3 text-[var(--acc)]" />
                  </h4>
                  <p className="text-micro text-[var(--ink-2)] font-sans">
                    100% compatible con Supabase y móviles
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Badge */}
            {copiedNotification && (
              <div className="py-1 px-2.5 rounded-[var(--r-s)] bg-[var(--ok)]/20 text-[var(--ink-2)] text-micro font-sans font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                <Check className="w-3 h-3 text-[var(--ok)]" />
                <span>¡Estilo aplicado al nombre!</span>
              </div>
            )}

            {/* Presets Grid */}
            <div className="space-y-1.5">
              <label className="text-micro font-sans text-[var(--ink-2)] font-bold flex items-center justify-between">
                <span>Transformar Nombre Actual:</span>
                <span className="text-[var(--acc)]/80 font-normal">
                  Clic para aplicar
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {BAND_STYLE_PRESETS.map((preset) => {
                  const sampleText = value
                    ? preset.apply(value)
                    : preset.previewSample;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.apply)}
                      className="p-2 rounded-[var(--r-m)] bg-[var(--surface)]/80  hover:bg-[var(--surface)] text-left transition-ui cursor-pointer group flex flex-col justify-between min-h-[52px]"
                    >
                      <div className="flex items-center justify-between text-micro text-[var(--ink-2)] font-sans group-hover:text-[var(--acc)]/70">
                        <span>{preset.label}</span>
                        <span className="text-xs"><ShowIcon inline emoji={preset.icon} /></span>
                      </div>
                      <div
                        className="text-xs font-bold text-[var(--ink)] truncate group-hover:text-[var(--ink)] mt-0.5"
                        title={sampleText}
                      >
                        {sampleText}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Symbols Palette */}
            <div className="space-y-1.5 pt-1">
              <label className="text-micro font-sans text-[var(--ink-2)] font-bold flex items-center justify-between">
                <span>Insertar Carácter o Símbolo:</span>
                <span className="text-[var(--ink-2)] font-normal">
                  Añadir al nombre
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ROCK_SYMBOLS.map((sym, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertSymbol(sym)}
                    className="w-7 h-7 rounded-[var(--r-s)] bg-[var(--sunken)] hover:hover:bg-[var(--acc)]/20 text-[var(--ink-2)] hover:text-[var(--ink)] font-bold text-xs flex items-center justify-center transition-ui cursor-pointer active:scale-[0.97]"
                    title={`Insertar ${sym}`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer: Clean button + Close */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleClean}
                className="inline-flex items-center gap-1 text-micro font-sans text-[var(--ink-2)] hover:text-[var(--ink-2)] transition-colors cursor-pointer"
                title="Restaurar a texto estándar sin caracteres especiales"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar texto plano</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-[var(--r-s)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] font-sans text-xs font-bold transition-colors cursor-pointer"
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
