import React, { useState, useMemo } from 'react';
import { ModalPortal } from '../common/ModalPortal';
import { Song, ThemeColors } from '../../types';
import {
  Download, Copy, Check, X, FileSpreadsheet, Music, FileText, Code, Printer,
  Sparkles, Disc3, Clock, Layers, Share2, Info
} from 'lucide-react';

interface ExportAlbumSongsModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumName?: string;
  songs: Song[];
  albumsList: string[];
  bandName?: string;
  isStitchLight?: boolean;
  colors?: ThemeColors;
  onExportAsSetlistPdf?: (albumSongs: Song[], titleName: string) => void;
}

type ExportFormat = 'csv' | 'm3u' | 'txt' | 'json';

export const ExportAlbumSongsModal: React.FC<ExportAlbumSongsModalProps> = ({
  isOpen,
  onClose,
  albumName,
  songs = [],
  albumsList = [],
  bandName = 'Banda',
  isStitchLight = false,
  colors,
  onExportAsSetlistPdf,
}) => {
  const [selectedAlbum, setSelectedAlbum] = useState<string>(albumName || 'all');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [includeChords, setIncludeChords] = useState(false);
  const [includeAudioUrls, setIncludeAudioUrls] = useState(true);
  const [copied, setCopied] = useState(false);

  // Sync selected album when albumName prop changes
  React.useEffect(() => {
    if (albumName) {
      setSelectedAlbum(albumName);
    } else {
      setSelectedAlbum('all');
    }
  }, [albumName, isOpen]);

  if (!isOpen) return null;

  // Filter songs by selected album
  const targetSongs = useMemo(() => {
    const validSongs = songs.filter((s) => Boolean(s && typeof s === 'object' && s.id));
    if (!selectedAlbum || selectedAlbum === 'all') {
      return validSongs;
    }
    return validSongs.filter((s) => {
      const songAlbum = s.albumDisco || s.album || '';
      if (selectedAlbum === 'Singles / Sin Disco') {
        return !songAlbum || songAlbum === 'Singles / Sin Disco';
      }
      return songAlbum === selectedAlbum;
    }).sort((a, b) => {
      const oA = typeof a.ordenAlbum === 'number' ? a.ordenAlbum : 999;
      const oB = typeof b.ordenAlbum === 'number' ? b.ordenAlbum : 999;
      return oA - oB;
    });
  }, [songs, selectedAlbum]);

  // Calculate total duration in seconds and formatted string
  const totalSeconds = useMemo(() => {
    return targetSongs.reduce((acc, s) => {
      if (typeof s.duracionSegundos === 'number' && s.duracionSegundos > 0) {
        return acc + s.duracionSegundos;
      }
      if (s.duracion && s.duracion.includes(':')) {
        const parts = s.duracion.split(':');
        const m = parseInt(parts[0], 10) || 0;
        const sec = parseInt(parts[1], 10) || 0;
        return acc + (m * 60 + sec);
      }
      return acc;
    }, 0);
  }, [targetSongs]);

  const formattedTotalDuration = useMemo(() => {
    if (totalSeconds <= 0) return '0 min';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs} h ${remMins} min`;
    }
    return `${mins} min ${secs > 0 ? `${secs} s` : ''}`;
  }, [totalSeconds]);

  const activeTitle = selectedAlbum === 'all'
    ? 'Discografía Completa'
    : selectedAlbum;

  // Generate plain text version for copy/txt export
  const generateTextContent = (): string => {
    const lines: string[] = [];
    lines.push(`==================================================`);
    lines.push(`${bandName.toUpperCase()} — ${activeTitle.toUpperCase()}`);
    lines.push(`Total canciones: ${targetSongs.length} | Duración: ${formattedTotalDuration}`);
    lines.push(`Exportado el: ${new Date().toLocaleDateString('es-ES')}`);
    lines.push(`==================================================\n`);

    targetSongs.forEach((song, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      const dur = song.duracion || '0:00';
      const key = song.tonalidad ? ` | Ton: ${song.tonalidad}` : '';
      const bpm = song.bpm ? ` | ${song.bpm} BPM` : '';
      const album = song.albumDisco || song.album ? ` [${song.albumDisco || song.album}]` : '';

      lines.push(`${num}. ${song.titulo} (${dur})${key}${bpm}${album}`);

      if (includeChords && song.cifradoTexto) {
        lines.push(`   --- Letra / Cifrado ---`);
        lines.push(song.cifradoTexto.split('\n').map((l) => `   ${l}`).join('\n'));
        lines.push(``);
      }

      if (includeAudioUrls) {
        const audio = song.audioPrincipalUrl || (song as any).audioUrl;
        if (audio) {
          lines.push(`   Audio: ${audio}`);
        }
      }
    });

    lines.push(`\n-- Generado con BandManager.ai --`);
    return lines.join('\n');
  };

  // Generate CSV with UTF-8 BOM
  const generateCsvContent = (): string => {
    const headers = ['N° Track', 'Título', 'Álbum', 'Artista', 'Duración', 'Tonalidad', 'BPM', 'Tipo'];
    if (includeAudioUrls) headers.push('Enlace Audio Demo');
    if (includeChords) headers.push('Cifrado / Letra');

    const escapeCsv = (str: string) => {
      if (!str) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows: string[] = [headers.map(escapeCsv).join(',')];

    targetSongs.forEach((song, idx) => {
      const row = [
        String(idx + 1),
        song.titulo || '',
        song.albumDisco || song.album || 'Single',
        song.artista || bandName,
        song.duracion || '0:00',
        song.tonalidad || '',
        song.bpm ? String(song.bpm) : '',
        song.tipo || 'cancion',
      ];

      if (includeAudioUrls) {
        const audio = song.audioPrincipalUrl || (song as any).audioUrl || '';
        row.push(audio);
      }

      if (includeChords) {
        row.push(song.cifradoTexto || '');
      }

      rows.push(row.map(escapeCsv).join(','));
    });

    return '\uFEFF' + rows.join('\n');
  };

  // Generate M3U8 Playlist
  const generateM3uContent = (): string => {
    const lines: string[] = ['#EXTM3U'];
    lines.push(`#EXTENC:UTF-8`);
    lines.push(`#PLAYLIST:${bandName} - ${activeTitle}`);

    targetSongs.forEach((song) => {
      let durationSec = song.duracionSegundos || 0;
      if (!durationSec && song.duracion && song.duracion.includes(':')) {
        const parts = song.duracion.split(':');
        durationSec = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
      }
      const audio = song.audioPrincipalUrl || (song as any).audioUrl || '';
      const artist = song.artista || bandName;
      lines.push(`#EXTINF:${durationSec},${artist} - ${song.titulo}`);
      lines.push(audio || `# (Sin archivo audio subido para ${song.titulo})`);
    });

    return lines.join('\n');
  };

  // Generate JSON content
  const generateJsonContent = (): string => {
    const data = {
      banda: bandName,
      album: activeTitle,
      totalCanciones: targetSongs.length,
      duracionTotal: formattedTotalDuration,
      fechaExportacion: new Date().toISOString(),
      canciones: targetSongs.map((s, idx) => ({
        trackNumber: idx + 1,
        id: s.id,
        titulo: s.titulo,
        artista: s.artista || bandName,
        album: s.albumDisco || s.album || 'Single',
        duracion: s.duracion,
        duracionSegundos: s.duracionSegundos,
        tonalidad: s.tonalidad,
        bpm: s.bpm,
        tipo: s.tipo,
        audioUrl: s.audioPrincipalUrl || (s as any).audioUrl || null,
        portadaUrl: s.portadaUrl || null,
        cifradoTexto: includeChords ? s.cifradoTexto || null : undefined,
      })),
    };
    return JSON.stringify(data, null, 2);
  };

  const getContentForFormat = (): { content: string; mimeType: string; extension: string } => {
    switch (format) {
      case 'csv':
        return { content: generateCsvContent(), mimeType: 'text/csv;charset=utf-8;', extension: 'csv' };
      case 'm3u':
        return { content: generateM3uContent(), mimeType: 'audio/x-mpegurl;charset=utf-8;', extension: 'm3u8' };
      case 'json':
        return { content: generateJsonContent(), mimeType: 'application/json;charset=utf-8;', extension: 'json' };
      case 'txt':
      default:
        return { content: generateTextContent(), mimeType: 'text/plain;charset=utf-8;', extension: 'txt' };
    }
  };

  const handleDownload = () => {
    const { content, mimeType, extension } = getContentForFormat();
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeAlbumName = activeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeBandName = bandName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    link.href = url;
    link.download = `${safeBandName}_${safeAlbumName}_canciones.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = () => {
    const { content } = getContentForFormat();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintSetlist = () => {
    if (onExportAsSetlistPdf) {
      onExportAsSetlistPdf(targetSongs, activeTitle);
      onClose();
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div
          className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all ${
            isStitchLight
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-[#141416] border-neutral-800 text-zinc-100'
          }`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-gradient-to-r from-[#1db954]/10 via-transparent to-transparent">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#1db954]/20 border border-[#1db954]/40 flex items-center justify-center text-[#1ed760] shrink-0 shadow-inner">
                <Download className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-bold font-display truncate">
                  Exportar Canciones del Disco
                </h2>
                <p className="text-xs text-neutral-400 truncate">
                  Exporta tu tracklist a Excel, M3U playlist, TXT o imprime en PDF
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
            {/* 1. Album Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                <span>Seleccionar Álbum / Disco</span>
                <span className="text-[#1ed760] font-mono font-bold text-[11px]">
                  {targetSongs.length} {targetSongs.length === 1 ? 'canción' : 'canciones'} ({formattedTotalDuration})
                </span>
              </label>
              <select
                value={selectedAlbum}
                onChange={(e) => setSelectedAlbum(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1db954]/50 transition-all ${
                  isStitchLight
                    ? 'bg-slate-100 border-slate-300 text-slate-800'
                    : 'bg-neutral-900 border-neutral-800 text-white'
                }`}
              >
                <option value="all">💿 Discografía Completa (Todas las Canciones)</option>
                {albumsList
                  .filter((a) => a !== 'todos')
                  .map((album) => (
                    <option key={album} value={album}>
                      {album === 'Singles / Sin Disco' ? '🎵 Singles / Sin Disco' : `💽 ${album}`}
                    </option>
                  ))}
              </select>
            </div>

            {/* 2. Format Selection Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Formato de Exportación
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('csv')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer relative ${
                    format === 'csv'
                      ? 'bg-[#1db954]/20 border-[#1db954] text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className={`w-5 h-5 ${format === 'csv' ? 'text-[#1ed760]' : 'text-emerald-400'}`} />
                  <div>
                    <div className="text-xs font-bold">Excel / CSV</div>
                    <div className="text-[10px] opacity-70">Tabla compatible</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('m3u')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer relative ${
                    format === 'm3u'
                      ? 'bg-[#1db954]/20 border-[#1db954] text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Music className={`w-5 h-5 ${format === 'm3u' ? 'text-[#1ed760]' : 'text-sky-400'}`} />
                  <div>
                    <div className="text-xs font-bold">Playlist M3U</div>
                    <div className="text-[10px] opacity-70">VLC / Reproductores</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('txt')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer relative ${
                    format === 'txt'
                      ? 'bg-[#1db954]/20 border-[#1db954] text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <FileText className={`w-5 h-5 ${format === 'txt' ? 'text-[#1ed760]' : 'text-amber-400'}`} />
                  <div>
                    <div className="text-xs font-bold">Texto / Lista</div>
                    <div className="text-[10px] opacity-70">WhatsApp / Dossier</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('json')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer relative ${
                    format === 'json'
                      ? 'bg-[#1db954]/20 border-[#1db954] text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Code className={`w-5 h-5 ${format === 'json' ? 'text-[#1ed760]' : 'text-purple-400'}`} />
                  <div>
                    <div className="text-xs font-bold">JSON Data</div>
                    <div className="text-[10px] opacity-70">Copia de seguridad</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 3. Export Options / Toggles */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <span className="text-xs font-semibold text-neutral-300">Opciones adicionales de exportación:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeAudioUrls}
                    onChange={(e) => setIncludeAudioUrls(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#1db954] cursor-pointer"
                  />
                  <span>Incluir enlaces de audio demo MP3/WAV</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeChords}
                    onChange={(e) => setIncludeChords(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#1db954] cursor-pointer"
                  />
                  <span>Incluir cifrado y letra de los temas</span>
                </label>
              </div>
            </div>

            {/* 4. Live Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-semibold uppercase tracking-wider">Vista previa del archivo</span>
                <span className="font-mono text-[11px] text-neutral-500">
                  formato .{getContentForFormat().extension}
                </span>
              </div>
              <div className={`p-3 rounded-2xl border font-mono text-xs max-h-44 overflow-y-auto custom-scrollbar select-all ${
                isStitchLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-neutral-950 border-neutral-800 text-emerald-400/90'
              }`}>
                <pre className="whitespace-pre-wrap break-all leading-relaxed">
                  {getContentForFormat().content.slice(0, 1200)}
                  {getContentForFormat().content.length > 1200 && '\n... (vista previa truncada)'}
                </pre>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-2">
            {onExportAsSetlistPdf && (
              <button
                type="button"
                onClick={handlePrintSetlist}
                className="px-3.5 py-2.5 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Convertir canciones del disco en un setlist para imprimir en PDF"
              >
                <Printer className="w-4 h-4 text-purple-400" />
                <span>Imprimir PDF Escenario</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={handleCopyClipboard}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/10 active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400" />
                    <span>Copiar Lista</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-2xl bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Descargar .{getContentForFormat().extension.toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
