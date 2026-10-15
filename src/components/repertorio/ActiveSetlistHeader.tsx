import React, { useState } from "react";
import {
  Mic,
  Headphones,
  Sparkles,
  Brain,
  Printer,
  MoreHorizontal,
  MessageSquare,
  CheckCircle2,
  Copy,
  Camera,
  Edit2,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { PopoverAncla } from "../ui/PopoverAncla";
import { MenuItem } from "../ui/MenuItem";
import { Setlist } from "../../types";

export interface ActiveSetlistHeaderProps {
  activeSetlist: Setlist | null;
  onUpdateSetlistName: (name: string) => void;
  onEnterStageMode: () => void;
  onEnterRehearsalMode: () => void;
  onOpenAIAnalysis: () => void;
  onOpenPerfectSetlist: () => void;
  aiAnalysisOverallScore?: number | null;
  onPrintSetlist: () => void;
  onShareSetlist: () => void;
  onAssignSetlist: () => void;
  onDuplicateSetlist: () => void;
  onImportSetlist: () => void;
  onEditSetlistDetails: () => void;
  onDeleteSetlist: () => void;
}

/**
 * Cabecera y barra de herramientas principal del setlist activo.
 * Agrupa el título editable, modos de directo/ensayo, asistente IA y acciones de gestión.
 */
export const ActiveSetlistHeader: React.FC<ActiveSetlistHeaderProps> = ({
  activeSetlist,
  onUpdateSetlistName,
  onEnterStageMode,
  onEnterRehearsalMode,
  onOpenAIAnalysis,
  onOpenPerfectSetlist,
  aiAnalysisOverallScore,
  onPrintSetlist,
  onShareSetlist,
  onAssignSetlist,
  onDuplicateSetlist,
  onImportSetlist,
  onEditSetlistDetails,
  onDeleteSetlist,
}) => {
  const [showAssistantChooser, setShowAssistantChooser] = useState(false);
  const [showSetlistActionsMenu, setShowSetlistActionsMenu] = useState(false);

  if (!activeSetlist) return null;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
      <input
        data-raw
        className="w-full flex-1 min-w-0 text-base sm:text-lg font-bold tracking-tight rounded-[var(--r-s)] px-2 py-1 bg-transparent hover:bg-[var(--surface)]/80 focus:bg-[var(--surface)]/80 focus:outline-none focus:ring-1 focus:ring-[var(--acc)]/50 text-[var(--ink)]"
        placeholder="Nombre del repertorio"
        value={activeSetlist.nombre || ""}
        onChange={(e) => onUpdateSetlistName(e.target.value)}
      />

      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
        {/* MODO ESCENARIO / ATRIL: la acción principal para directo */}
        <Button
          id="btn-stage-mode-header"
          variant="primary"
          size="sm"
          onClick={onEnterStageMode}
          title="Modo Escenario / Atril: teleprompter con partituras, acordes y letras en directo"
        >
          <Mic className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Modo escenario</span>
          <span className="sm:hidden">Atril</span>
        </Button>

        {/* MODO ENSAYO: atril de ensayo con pistas Iris */}
        <Button
          id="btn-rehearsal-mode-header"
          variant="neutral"
          size="sm"
          onClick={onEnterRehearsalMode}
          title="Modo Ensayo: atril optimizado para ensayo con pistas Iris, silenciamiento de instrumentos y metrónomo"
        >
          <Headphones className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Modo ensayo</span>
          <span className="sm:hidden">Ensayo</span>
        </Button>

        {/* ASISTENTE IA: análisis (Cerebro) y setlist perfecto (Optimizar) en un solo sitio */}
        <div className="relative hidden shrink-0 sm:block">
          <Button
            id="btn-ai-analysis-header"
            variant="neutral"
            size="sm"
            onClick={() => setShowAssistantChooser((v) => !v)}
            aria-expanded={showAssistantChooser}
            title="Asistente IA del repertorio: análisis de narrativa y energía, y setlist perfecto"
          >
            <Sparkles className="size-4 text-[var(--acc)]" aria-hidden="true" />
            <span className="hidden sm:inline">Asistente IA</span>
            <span className="sm:hidden">IA</span>
            {aiAnalysisOverallScore && (
              <Chip tone="neutral" className="tabular-nums">
                {aiAnalysisOverallScore}
              </Chip>
            )}
          </Button>
          {showAssistantChooser && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowAssistantChooser(false)}
              />
              <PopoverAncla className="absolute right-0 top-full mt-1.5 z-40 w-72 max-w-[calc(100vw-2rem)] rounded-[var(--r-l)] border border-[var(--line)] bg-[var(--surface)] p-1.5 space-y-0.5 text-xs text-[var(--ink)]">
                <MenuItem
                  id="btn-ai-perfect-header"
                  type="button"
                  onClick={() => {
                    setShowAssistantChooser(false);
                    onOpenAIAnalysis();
                  }}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                    <Brain
                      className="size-4 text-[var(--acc)]"
                      aria-hidden="true"
                    />{" "}
                    Ver análisis
                  </span>
                  <span className="block mt-0.5 pl-6 text-xs text-[var(--ink-2)]">
                    Arco narrativo, puntuación y sugerencias explicadas.
                  </span>
                </MenuItem>
                <MenuItem
                  type="button"
                  onClick={() => {
                    setShowAssistantChooser(false);
                    onOpenPerfectSetlist();
                  }}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                    <Sparkles
                      className="size-4 text-[var(--acc)]"
                      aria-hidden="true"
                    />{" "}
                    Generar plan de cambios
                  </span>
                  <span className="block mt-0.5 pl-6 text-xs text-[var(--ink-2)]">
                    Reordena y optimiza canciones sobre una copia.
                  </span>
                </MenuItem>
              </PopoverAncla>
            </>
          )}
        </div>

        {/* IMPRIMIR: el setlist de papel para pegar en escenario */}
        <Button
          id="btn-print-setlist-header"
          variant="soft"
          size="sm"
          onClick={onPrintSetlist}
          title="Imprimir el setlist en papel (A4): una hoja por músico, maquetado automático"
        >
          <Printer className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Imprimir setlist</span>
          <span className="sm:hidden">Imprimir</span>
        </Button>

        {/* MENÚ MÁS ACCIONES */}
        <div className="relative shrink-0">
          <Button
            variant="ghost"
            size="xs"
            type="button"
            onClick={() => setShowSetlistActionsMenu((v) => !v)}
            title="Acciones del repertorio: compartir, asignar a bolo, duplicar, editar detalles, eliminar"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
          {showSetlistActionsMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowSetlistActionsMenu(false)}
              />
              <PopoverAncla className="absolute right-0 top-full mt-1.5 z-40 w-56 rounded-[var(--r-l)] p-1.5 space-y-1 text-xs bg-[var(--sunken)] text-[var(--ink)]">
                {/* En móvil el asistente IA vive aquí: menos botones a la vista */}
                <button
                  type="button"
                  onClick={() => {
                    setShowSetlistActionsMenu(false);
                    onOpenAIAnalysis();
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-[var(--r-m)] px-2.5 py-2 text-left text-[var(--ink)] transition hover:bg-[var(--surface)] sm:hidden"
                >
                  <Brain className="w-3.5 h-3.5 shrink-0" /> Asistente IA: ver
                  análisis
                  {aiAnalysisOverallScore ? ` (${aiAnalysisOverallScore})` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSetlistActionsMenu(false);
                    onOpenPerfectSetlist();
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-[var(--r-m)] px-2.5 py-2 text-left text-[var(--ink)] transition hover:bg-[var(--surface)] sm:hidden"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" /> Generar plan de
                  cambios
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSetlistActionsMenu(false);
                    onShareSetlist();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-[var(--r-m)] text-[var(--ink)] transition cursor-pointer flex items-center gap-2 hover:bg-[var(--surface)]"
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" /> Compartir
                  repertorio
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSetlistActionsMenu(false);
                    onAssignSetlist();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-[var(--r-m)] text-[var(--ink)] transition cursor-pointer flex items-center gap-2 hover:bg-[var(--surface)]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Asignar a
                  bolo/ensayo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSetlistActionsMenu(false);
                    onDuplicateSetlist();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-[var(--r-m)] text-[var(--ink)] transition cursor-pointer flex items-center gap-2 hover:bg-[var(--surface)]"
                >
                  <Copy className="w-3.5 h-3.5 shrink-0" /> Duplicar repertorio
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSetlistActionsMenu(false);
                    onImportSetlist();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-[var(--r-m)] text-[var(--ink)] transition cursor-pointer flex items-center gap-2 hover:bg-[var(--surface)]"
                >
                  <Camera className="w-3.5 h-3.5 shrink-0" /> Importar desde
                  foto/PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSetlistActionsMenu(false);
                    onEditSetlistDetails();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-[var(--r-m)] text-[var(--ink)] transition cursor-pointer flex items-center gap-2 hover:bg-[var(--surface)]"
                >
                  <Edit2 className="w-3.5 h-3.5 shrink-0" /> Editar nombre y
                  detalles
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSetlistActionsMenu(false);
                    onDeleteSetlist();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-[var(--r-m)] text-[var(--alert)] transition cursor-pointer flex items-center gap-2 hover:bg-[var(--alert-soft)]"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" /> Eliminar setlist
                </button>
              </PopoverAncla>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
