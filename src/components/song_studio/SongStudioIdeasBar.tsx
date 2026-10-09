/**
 * Barra del bloque de ideas con el botón de grabar o subir una idea
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { Music, Plus } from "lucide-react";
import { motion } from "motion/react";
import React, { Dispatch, SetStateAction } from "react";
import { useSongStudio } from "./SongStudioContext";

/**
 * Barra del bloque de ideas con el botón de grabar o subir una idea
 * @returns Sección de interfaz.
 */
export function SongStudioIdeasBar() {
  const { setShowAddIdea } = useSongStudio();
  return (
    <>
{/* Ideas: bloque propio, separado de Iris por aire (sin bordes) */}
            <div className="flex items-center justify-between gap-3 p-2 sm:p-3 bg-[var(--bg)]/80 rounded-[var(--r-l)]">
              <span className="text-xs font-sans font-bold text-[var(--ink-2)] flex items-center gap-1.5">
                <Music className="w-4 h-4 text-[var(--tentative)]" /> Ideas y grabaciones
              </span>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setShowAddIdea(true)}
                className="px-3.5 py-1.5 rounded-[var(--r-m)] bg-[var(--ok)] hover:brightness-110 text-[var(--on-ok)] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-ui"
              >
                <Plus className="w-4 h-4" />
                <span>+ Grabar / subir idea</span>
              </motion.button>
            </div>
    </>
  );
}
