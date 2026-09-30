import React from "react";
import {
  Type,
  Check,
  X,
  Sparkles,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import {
  FONT_PRESETS,
  FontPresetKey,
  applyFontPreset,
  getStoredFontPreset,
} from "../utils/typography";
import { ModalPortal } from "./common/ModalPortal";
import { IconButton } from './ui';

interface FontSelectorModalProps {
  onClose: () => void;
  currentFont: FontPresetKey;
  onSelectFont: (fontKey: FontPresetKey) => void;
}

export const FontSelectorModal: React.FC<FontSelectorModalProps> = ({
  onClose,
  currentFont,
  onSelectFont,
}) => {
  return (
    <ModalPortal isOpen={true} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain animate-in fade-in duration-300">
        <div
          className={`w-full max-w-xl rounded-[var(--r-l)] overflow-hidden flex flex-col my-auto max-h-[85vh] ${"bg-[var(--surface)] text-[var(--ink)]"}`}
        >
          {/* Header */}
          <div
            className={`px-6 py-4 flex justify-between items-center shrink-0 ${" bg-[var(--bg)]"}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-[var(--r-m)] flex items-center justify-center font-bold shrink-0 ${"bg-[var(--acc)]/15 text-[var(--acc-ink)] -[var(--acc)]/20"}`}
              >
                <Type className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span>Selección de tipografía y fuente</span>
                  <span className="text-micro font-sans font-normal px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--surface)]/15 text-[var(--ok)] ">
                    En tiempo real
                  </span>
                </h3>
                <p className="text-xs text-[var(--ink-2)] font-sans">
                  Elige la fuente que mejor se adapte a tu gusto visual
                </p>
              </div>
            </div>

            <IconButton
              label="Cerrar"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </IconButton>
          </div>

          {/* Informative banner */}
          <div
            className={`px-6 py-3 text-xs flex items-center gap-2.5 ${"bg-[var(--tentative)]/5 text-[var(--tentative)]"}`}
          >
            <Info className="w-4 h-4 text-[var(--acc)] shrink-0" />
            <p className="text-xs leading-relaxed font-sans">
              ¿La fuente original te resultaba demasiado intensa o pesada?
              Prueba con{" "}
              <strong className="text-[var(--acc)]">Plus Jakarta Sans</strong> u{" "}
              <strong className="text-[var(--acc)]">Outfit</strong> para una
              lectura mucho más suave y ligera.
            </p>
          </div>

          {/* Font List */}
          <div className="p-6 overflow-y-auto space-y-3 scrollbar-thin">
            {FONT_PRESETS.map((preset) => {
              const isSelected = currentFont === preset.id;

              return (
                <div
                  key={preset.id}
                  onClick={() => onSelectFont(preset.id)}
                  className={`p-4 rounded-[var(--r-m)] transition-ui cursor-pointer relative group ${
                    isSelected
                      ? "bg-[var(--acc)]/10 ring-2 ring-[var(--acc)]/20"
                      : "bg-[var(--bg)] hover:-neutral-300 hover:bg-[var(--sunken)]/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="font-bold text-sm tracking-tight"
                          style={{ fontFamily: preset.displayFont }}
                        >
                          {preset.name}
                        </span>
                        <span
                          className={`text-micro font-sans font-bold px-2 py-0.5 rounded-[var(--r-pill)] ${
                            preset.id === "plus_jakarta"
                              ? "bg-[var(--surface)]/15 text-[var(--ok)] "
                              : preset.isSoft
                                ? "bg-[var(--acc)]/15 text-[var(--ink)] "
                                : "bg-[var(--acc)]/15 text-[var(--acc-ink)] -[var(--acc)]/25"
                          }`}
                        >
                          {preset.badge}
                        </span>
                      </div>
                      <span className="text-micro text-[var(--ink-2)] font-sans block mt-0.5">
                        {preset.subtitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <span
                          className={`w-6 h-6 rounded-[var(--r-pill)] flex items-center justify-center font-bold text-xs ${"bg-[var(--acc)] text-[var(--on-acc)]"}`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--ink-2)] leading-relaxed mb-3 font-sans">
                    {preset.description}
                  </p>

                  {/* Live Preview Sample */}
                  <div
                    className={`p-3 rounded-[var(--r-s)] text-sm transition-ui ${"bg-[var(--surface)] text-[var(--ink)]"}`}
                    style={{ fontFamily: preset.displayFont }}
                  >
                    <div className="font-bold text-base tracking-wide mb-1">
                      Bakandeya management hub 2026
                    </div>
                    <div
                      className="text-xs opacity-80"
                      style={{ fontFamily: preset.bodyFont }}
                    >
                      El único panel de gestión inteligente para salas,
                      festivales, ensayos y giras.
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            className={`px-6 py-3 flex justify-between items-center shrink-0 ${" bg-[var(--bg)]"}`}
          >
            <span className="text-micro font-sans text-[var(--ink-2)]">
              Cambio instantáneo guardado en tu navegador
            </span>
            <button
              onClick={onClose}
              className={`px-5 py-2 rounded-[var(--r-pill)] text-xs font-bold transition-ui cursor-pointer ${"bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)]"}`}
            >
              Aceptar y cerrar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
