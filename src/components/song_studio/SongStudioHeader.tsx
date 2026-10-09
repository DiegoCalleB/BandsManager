/**
 * Cabecera del estudio: título, estado, favorita, preparación, herramientas y controles
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { Disc, Sparkles } from "lucide-react";
import { formatSongTitle } from "../../utils/formatSongTitle";
import { SongStudioReadinessSelect } from "./SongStudioReadinessSelect";
import { SongStudioToolsMenu } from "./SongStudioToolsMenu";
import { SongStudioHeaderControls } from "./SongStudioHeaderControls";
import { Song } from "../../types";
import React from "react";
import { useSongStudio } from "./SongStudioContext";

/**
 * Cabecera del estudio: título, estado, favorita, preparación, herramientas y controles
 * @returns Sección de interfaz.
 */
export function SongStudioHeader() {
  const { song } = useSongStudio();
  return (
    <>
{/* Header Bar */}
          <div className="p-2.5 sm:p-5 flex items-center justify-between bg-[var(--ink)]/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc)]  flex items-center justify-center text-[var(--on-acc)]">
                <Disc className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2
                    className="text-xl font-bold tracking-tight text-[var(--ink)]"
                    title={`⏱️ ${song.duracion} · 🎵 ${song.tonalidad} · ⚡ ${song.bpm} BPM${song.afinacion ? ` · 🎸 ${song.afinacion}` : ''}`}
                  >
                    {formatSongTitle(song.titulo)}
                  </h2>
                  <span className="text-micro font-sans px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--ink)] font-semibold">
                    {song.estadoTema || 'componiendo'}
                  </span>
                  {song.favoritoGeneral && (
                    <span className="text-[var(--acc)]" title="Tema favorito">
                      <Sparkles className="w-3.5 h-3.5 fill-[var(--acc)]" />
                    </span>
                  )}

                  <SongStudioReadinessSelect />

                  <SongStudioToolsMenu />
                </div>
              </div>
            </div>

            <SongStudioHeaderControls />
          </div>
    </>
  );
}
