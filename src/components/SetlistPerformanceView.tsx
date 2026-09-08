import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Music } from 'lucide-react';
import { Setlist, SetlistItem, Song } from '../types';

interface SetlistPerformanceViewProps {
  setlist: Setlist;
  songs: Song[];
  onClose: () => void;
}

export const SetlistPerformanceView: React.FC<SetlistPerformanceViewProps> = ({
  setlist,
  songs,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transpose, setTranspose] = useState(0);

  const songItems = setlist.items.filter(item => item.songId && item.tipoItem === 'cancion');
  const currentItem = songItems[currentIndex];
  const currentSong = songs.find(s => s.id === currentItem?.songId);

  // Transpose key
  const transposeKey = (key: string, semitones: number): string => {
    if (!key || semitones === 0) return key;

    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const minorNotes = ['Am', 'A#m', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m'];

    const isMinor = key.includes('m');
    const noteList = isMinor ? minorNotes : notes;
    const baseKey = key.replace('m', '').replace('b', 'b').trim();

    const currentIndex = noteList.findIndex(n => n.replace('m', '').trim() === baseKey);
    if (currentIndex === -1) return key;

    const newIndex = (currentIndex + semitones) % 12;
    return noteList[(newIndex + 12) % 12];
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < songItems.length - 1) setCurrentIndex(currentIndex + 1);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setTranspose(t => Math.min(t + 1, 6));
      if (e.key === '-') setTranspose(t => Math.max(t - 1, -6));
      if (e.key === '0') setTranspose(0);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, songItems.length]);

  if (!currentSong) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Music className="w-12 h-12 mx-auto mb-4 text-amber-400" />
          <p>No hay canciones en el repertorio</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const transposedKey = transposeKey(currentSong.tonalidad, transpose);
  const chords = currentSong.cifradoTexto || 'Sin acordes guardados';
  const structure = currentSong.guiaSustituto?.estructura || '';
  const progression = currentSong.guiaSustituto?.progresionClave || '';

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden landscape:flex-row">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 to-black p-4 landscape:p-6 border-b border-amber-900/50">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-3xl landscape:text-4xl font-bold text-amber-300">
              🎤 {currentSong.titulo}
            </h1>
            <p className="text-amber-200/70 text-sm landscape:text-base">
              Canción {currentIndex + 1} de {songItems.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
            title="Cerrar (ESC)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 landscape:p-8 flex flex-col justify-center">
        <div className="max-w-5xl mx-auto w-full space-y-8">
          {/* Song Info Bar */}
          <div className="grid grid-cols-2 landscape:grid-cols-4 gap-4 text-center">
            <div className="bg-teal-900/30 border border-teal-500/30 rounded-lg p-3">
              <p className="text-teal-300 text-xs font-mono uppercase">Tonalidad</p>
              <p className="text-2xl landscape:text-3xl font-bold text-teal-300 mt-1">
                {transposedKey}
                {transpose !== 0 && (
                  <span className="text-sm text-teal-200 ml-2">({currentSong.tonalidad} {transpose > 0 ? '+' : ''}{transpose})</span>
                )}
              </p>
            </div>
            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-3">
              <p className="text-indigo-300 text-xs font-mono uppercase">Tempo</p>
              <p className="text-2xl landscape:text-3xl font-bold text-indigo-300 mt-1">{currentSong.bpm} BPM</p>
            </div>
            <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg p-3">
              <p className="text-emerald-300 text-xs font-mono uppercase">Duración</p>
              <p className="text-2xl landscape:text-3xl font-bold text-emerald-300 mt-1">{currentSong.duracion}</p>
            </div>
            {currentSong.afinacion && (
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3">
                <p className="text-purple-300 text-xs font-mono uppercase">Afinación</p>
                <p className="text-2xl landscape:text-3xl font-bold text-purple-300 mt-1">{currentSong.afinacion}</p>
              </div>
            )}
          </div>

          {/* Chords & Structure */}
          <div className="space-y-6">
            {/* Chords */}
            <div className="bg-neutral-900/50 border border-amber-500/20 rounded-lg p-6 landscape:p-8">
              <h2 className="text-lg landscape:text-xl font-bold text-amber-300 mb-4 uppercase">📄 Acordes & Letra</h2>
              <div className="bg-black/50 rounded p-4 landscape:p-6 overflow-y-auto max-h-64 landscape:max-h-96">
                <pre className="text-amber-100 text-base landscape:text-lg font-mono whitespace-pre-wrap leading-relaxed break-words">
                  {chords}
                </pre>
              </div>
            </div>

            {/* Structure & Progression */}
            {(structure || progression) && (
              <div className="grid grid-cols-1 landscape:grid-cols-2 gap-4">
                {structure && (
                  <div className="bg-neutral-900/50 border border-indigo-500/20 rounded-lg p-4 landscape:p-6">
                    <h3 className="text-base landscape:text-lg font-bold text-indigo-300 mb-3 uppercase">🎵 Estructura</h3>
                    <p className="text-indigo-100 text-base landscape:text-lg font-mono">{structure}</p>
                  </div>
                )}
                {progression && (
                  <div className="bg-neutral-900/50 border border-teal-500/20 rounded-lg p-4 landscape:p-6">
                    <h3 className="text-base landscape:text-lg font-bold text-teal-300 mb-3 uppercase">🎸 Progresión</h3>
                    <p className="text-teal-100 text-base landscape:text-lg font-mono">{progression}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="bg-gradient-to-t from-black via-black/80 to-transparent p-4 landscape:p-6 border-t border-amber-900/50">
        <div className="max-w-5xl mx-auto w-full space-y-4">
          {/* Transpose Controls */}
          <div className="flex items-center justify-center gap-2 landscape:gap-4">
            <span className="text-neutral-400 text-sm">Transposición:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setTranspose(t => Math.max(t - 1, -6))}
                className="px-3 landscape:px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-mono"
                title="- (Bajar semitono)"
              >
                −
              </button>
              <span className="px-4 landscape:px-6 py-2 bg-neutral-900 rounded font-mono text-lg min-w-12 text-center">
                {transpose > 0 ? '+' : ''}{transpose}
              </span>
              <button
                onClick={() => setTranspose(t => Math.min(t + 1, 6))}
                className="px-3 landscape:px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-mono"
                title="+ (Subir semitono)"
              >
                +
              </button>
              <button
                onClick={() => setTranspose(0)}
                className="px-3 landscape:px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-mono ml-2"
                title="0 (Reset)"
              >
                0
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex-1 landscape:flex-initial px-4 landscape:px-6 py-3 landscape:py-4 bg-amber-600 hover:bg-amber-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 landscape:gap-3"
              title="← Anterior (Flecha izquierda)"
            >
              <ChevronLeft className="w-5 h-5 landscape:w-6 landscape:h-6" />
              <span className="landscape:inline">Anterior</span>
            </button>

            <div className="text-center text-sm landscape:text-base">
              <p className="text-neutral-400">
                <span className="font-bold text-white text-lg landscape:text-xl">{currentIndex + 1}</span>
                <span className="text-neutral-500"> / {songItems.length}</span>
              </p>
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === songItems.length - 1}
              className="flex-1 landscape:flex-initial px-4 landscape:px-6 py-3 landscape:py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 landscape:gap-3"
              title="Siguiente → (Flecha derecha)"
            >
              <span className="landscape:inline">Siguiente</span>
              <ChevronRight className="w-5 h-5 landscape:w-6 landscape:h-6" />
            </button>
          </div>

          {/* Help Text */}
          <div className="text-center text-xs landscape:text-sm text-neutral-500 pt-2">
            <p>
              ← → Navegar | +/− Transposición | 0 Reset | ESC Salir
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
