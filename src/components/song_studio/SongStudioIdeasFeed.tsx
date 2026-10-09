/**
 * Feed de ideas: estado vacío o lista de tomas
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { Sparkles } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { SongStudioIdeaCard } from "./SongStudioIdeaCard";
import { SongAudioIdea } from "../../types";
import React, { Dispatch, SetStateAction } from "react";
import { useSongStudio } from "./SongStudioContext";

/**
 * Feed de ideas: estado vacío o lista de tomas
 * @returns Sección de interfaz.
 */
export function SongStudioIdeasFeed() {
  const { tomas, activeSectionFilter, setIdeaSection, setShowAddIdea } = useSongStudio();
  return (
    <>
{/* Ideas Audio Feed */}
            {tomas.length === 0 ? (
              <div className="p-8 rounded-[var(--r-l)] text-center space-y-3">
                <Sparkles className="w-8 h-8 text-[var(--ink-2)] mx-auto" />
                <p className="text-sm text-[var(--ink-2)] font-sans">
                  {activeSectionFilter === 'todas'
                    ? 'Aún no hay ideas de audio subidas para este tema.'
                    : `No hay propuestas grabadas para la sección "${activeSectionFilter}".`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (activeSectionFilter !== 'todas') setIdeaSection(activeSectionFilter as any);
                    setShowAddIdea(true);
                  }}
                  className="px-4 py-2 rounded-[var(--r-pill)] bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-xs text-[var(--ink)] font-bold transition-ui cursor-pointer"
                >
                  + Grabar / Subir la primera idea
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence>
                  {tomas.map((toma) => (
                    <SongStudioIdeaCard key={toma.id} idea={toma} />
                  ))}
                </AnimatePresence>
              </div>
            )}
    </>
  );
}
