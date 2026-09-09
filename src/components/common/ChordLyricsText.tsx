import React from 'react';
import { parseRootNote } from '../../utils/chordUtils';

// Resaltado compartido de acordes vs. letra: mismo criterio (parseRootNote + umbral del 70%)
// que ya usaban SongChordsViewerModal y processChordText, pero como componente reutilizable
// para que Modo Concierto pueda distinguir acordes de letra con colores, no solo el visor
// normal. Parametrizado por glareMode porque el escenario tiene su propio tema claro de alto
// contraste (para sol directo) además del tema oscuro habitual.
const SECTION_HEADER_RE = /^\[(Intro|Verso|Estribillo|Coro|Puente|Solo|Outro|Coda|Final)(?:\s*\d+)?\]/i;

export const ChordLyricsText: React.FC<{ text: string; glareMode?: boolean; className?: string }> = ({
  text,
  glareMode = false,
  className = ''
}) => {
  if (!text) return null;

  const chordChipClass = glareMode
    ? 'font-bold text-orange-800 bg-orange-100 px-1 py-0.5 rounded border border-orange-400 mx-0.5'
    : 'font-bold text-amber-300 bg-amber-950/50 px-1 py-0.5 rounded border border-amber-500/40 mx-0.5';
  const chordLineClass = glareMode ? 'font-bold text-orange-800' : 'font-bold text-amber-300';
  const lyricClass = glareMode ? 'text-neutral-800' : 'text-neutral-100';
  const headerBadgeClass = glareMode
    ? 'bg-purple-100 border border-purple-400 text-purple-800'
    : 'bg-purple-950/80 border border-purple-500/40 text-purple-300';
  const rowClass = 'whitespace-pre-wrap break-words py-0.5';

  return (
    <div className={className}>
      {text.split('\n').map((line, idx) => {
        const trimmed = line.trim();

        if (SECTION_HEADER_RE.test(trimmed)) {
          return (
            <div key={idx} className="my-2 pt-2 first:mt-0 first:pt-0 border-t border-current/10 flex items-center justify-center">
              <span className={`px-2.5 py-0.5 rounded ${headerBadgeClass}`}>{trimmed}</span>
            </div>
          );
        }

        if (line.includes('[')) {
          const parts = line.split(/(\[[A-Za-z0-9#\/]+\])/g);
          return (
            <div key={idx} className={rowClass}>
              {parts.map((part, pIdx) =>
                part.startsWith('[') && part.endsWith(']') ? (
                  <span key={pIdx} className={chordChipClass}>{part.slice(1, -1)}</span>
                ) : (
                  <span key={pIdx} className={lyricClass}>{part}</span>
                )
              )}
            </div>
          );
        }

        const tokens = trimmed.split(/\s+/);
        const chordCount = tokens.filter(t => parseRootNote(t) !== null).length;
        const isChordLine = trimmed.length > 0 && chordCount > 0 && chordCount / tokens.length >= 0.7;

        if (isChordLine) {
          return <div key={idx} className={`${chordLineClass} ${rowClass} tracking-wide`}>{line}</div>;
        }

        return <div key={idx} className={`${lyricClass} ${rowClass}`}>{line || ' '}</div>;
      })}
    </div>
  );
};
