import React from "react";
import { SetlistItem } from "../../types";
import { ShowIcon } from '../ui/ShowIcon';

// Vista"teleprompter" para los bloques del repertorio (presentación al público, cambio de
// instrumento, descanso...) que antes desaparecían sin más del modo concierto. Texto grande y
// centrado, como un guion, para leerlo en voz alta o seguir la indicación sin acercarse a mirar.
export const TeleprompterBlockPage: React.FC<{
  item: SetlistItem;
  meta: { icon: string; label: string };
  glareMode: boolean;
}> = ({ item, meta, glareMode }) => {
  const script = item.notas || item.notaTema || "";
  const duration = item.duracionEstimadaMinutos
    ? `${item.duracionEstimadaMinutos} min`
    : item.duracionEstimadaSegundos
      ? `${item.duracionEstimadaSegundos}s`
      : null;

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center p-6 sm:p-12 text-center overflow-y-auto ${
        glareMode
          ? "bg-[var(--surface)]"
          : "bg-[var(--acc)]/40 "
      }`}
    >
      <span className="text-5xl sm:text-7xl mb-6"><ShowIcon inline emoji={meta.icon} /></span>
      <h2
        className={`text-2xl sm:text-4xl font-bold mb-6 ${glareMode ? "text-[var(--ink)]" : "text-[var(--acc)]/70"}`}
      >
        {item.tituloCustom || meta.label}
      </h2>
      {script ? (
        <p
          className={`text-xl sm:text-3xl md:text-4xl leading-relaxed max-w-4xl whitespace-pre-wrap font-medium ${glareMode ? "text-[var(--ink)] font-bold" : "text-[var(--ink)]"}`}
        >
          {script}
        </p>
      ) : (
        <p className="text-[var(--ink-2)] text-lg">{meta.label}</p>
      )}
      {duration && (
        <p className="mt-8 text-[var(--ink-2)] font-sans text-sm">
          <ShowIcon inline emoji="⏱" />{duration}
        </p>
      )}
    </div>
  );
};
