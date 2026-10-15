import React from 'react';
import type { AudioTrack, SongAudioIdea } from '../../types';
import { pistasBaseDeIdea } from '../../utils/ideaDeAtril';

/**
 * Tomas de la canción con su fondo: eliges qué stems de Iris acompañan a cada toma
 * (p. ej. solo la batería, para tocar una guitarra encima) y la escuchas junto a ellos.
 * Los stems se referencian por id: no se copia audio.
 */
export const TomasConFondo: React.FC<{
  tomas: SongAudioIdea[];
  stems: AudioTrack[];
  activaId: string | null;
  onActiva: (id: string | null) => void;
  onFondo: (ideaId: string, ids: string[]) => void;
}> = ({ tomas, stems, activaId, onActiva, onFondo }) => {
  if (tomas.length === 0 || stems.length < 2) return null;
  return (
    <div className="space-y-2" role="group" aria-label="Tomas con fondo">
      <span className="text-micro font-sans font-bold text-[var(--ink-2)]">Tomas con fondo</span>
      {tomas.map((t) => {
        const { faltan } = pistasBaseDeIdea(t, stems);
        const ids = (t.sobrePistas ?? []).filter((id) => stems.some((s) => s.id === id));
        const activa = activaId === t.id;
        return (
          <div key={t.id} className="bg-[var(--sunken)] rounded-[var(--r-m)] p-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-sans text-[var(--ink)] truncate">{t.titulo}</span>
              <button
                type="button"
                aria-pressed={activa}
                aria-label={`Escuchar ${t.titulo} con su fondo`}
                onClick={() => onActiva(activa ? null : t.id)}
                className={`px-2.5 py-0.5 rounded-[var(--r-pill)] text-micro font-sans cursor-pointer transition-ui ${activa ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
              >
                {activa ? 'Escuchando' : 'Escuchar'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1" role="group" aria-label={`Fondo de ${t.titulo}`}>
              {stems.map((s) => {
                const on = ids.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onFondo(t.id, on ? ids.filter((id) => id !== s.id) : [...ids, s.id])}
                    className={`px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-sans cursor-pointer transition-ui ${on ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold' : 'bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
                  >
                    {s.nombre}
                  </button>
                );
              })}
            </div>
            {faltan.length > 0 && (
              <p className="text-micro font-sans text-[var(--acc-ink)]">
                Falta{faltan.length > 1 ? 'n' : ''} {faltan.length} pista{faltan.length > 1 ? 's' : ''} del fondo (se volvió a separar la canción).
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
