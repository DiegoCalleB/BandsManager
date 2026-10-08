import React from 'react';

/** Con la hoja transpuesta, decide si el audio la acompaña (cambio de tono real) o suena original. */
export const ControlTonoAudio: React.FC<{ transpose: number; sigue: boolean; onSigue: (v: boolean) => void }> = ({ transpose, sigue, onSigue }) => {
  if (transpose === 0) return null;
  const st = `${transpose > 0 ? '+' : ''}${transpose}`;
  return (
    <button
      type="button"
      aria-pressed={sigue}
      title={sigue ? 'El audio suena transpuesto como la hoja' : 'El audio suena en su tono original'}
      onClick={() => onSigue(!sigue)}
      className={`px-2.5 py-0.5 rounded-[var(--r-pill)] text-micro font-sans cursor-pointer transition-ui ${sigue ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold' : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
    >
      {sigue ? `Audio ${st} st` : 'Audio original'}
    </button>
  );
};
