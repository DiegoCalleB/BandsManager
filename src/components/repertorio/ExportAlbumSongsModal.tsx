import React, { useState, useMemo, useEffect } from 'react';
import JSZip from 'jszip';
import { ModalPortal } from '../common/ModalPortal';
import { Song, ThemeColors } from '../../types';
import {
  Download, Copy, Check, X, FileSpreadsheet, Music, FileText, Code, Printer,
  Sparkles, Disc3, Clock, Layers, Share2, Info, Archive, Loader2, AlertCircle, FileCheck
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

type ExportFormat = 'zip' | 'csv' | 'm3u' | 'txt' | 'json';

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
  const [format, setFormat] = useState<ExportFormat>('zip');
  const [includeChords, setIncludeChords] = useState(true);
  const [includeAudioUrls, setIncludeAudioUrls] = useState(true);
  const [copied, setCopied] = useState(false);

  // ZIP packaging status
  const [zipLoading, setZipLoading] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; status: string }>({
    current: 0,
    total: 0,
    status: '',
  });
  const [zipError, setZipError] = useState<string | null>(null);

  // Sync selected album when albumName prop changes
  useEffect(() => {
    if (albumName) {
      setSelectedAlbum(albumName);
    } else {
      setSelectedAlbum('all');
    }
  }, [albumName, isOpen]);

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

  // Count songs with actual downloadable audio
  const songsWithAudio = useMemo(() => {
    return targetSongs.filter((s) => Boolean(s.audioPrincipalUrl || (s as any).audioUrl));
  }, [targetSongs]);

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
      case 'zip':
        return {
          content: `PAQUETE ZIP DIGITAL CON MP3s + METADATOS\n` +
            `--------------------------------------------------\n` +
            `Disco: ${activeTitle}\n` +
            `Artista: ${bandName}\n` +
            `Total pistas audio a comprimir: ${songsWithAudio.length} de ${targetSongs.length}\n` +
            `Incluye: Archivos MP3/WAV, 00_TRACKLIST.txt, 00_DATOS_ALBUM.json` +
            (includeChords ? `, 00_LETRAS_Y_CIFRADOS.txt` : '') + `\n\n` +
            `Haz clic en "DESCARGAR ZIP (.ZIP)" para empaquetar y bajar el disco.`,
          mimeType: 'application/zip;',
          extension: 'zip'
        };
      case 'txt':
      default:
        return { content: generateTextContent(), mimeType: 'text/plain;charset=utf-8;', extension: 'txt' };
    }
  };

  // Handle standard text/CSV/M3U/JSON download
  const handleDownloadStandard = () => {
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

  // Handle ZIP bundle creation with JSZip
  const handleDownloadZip = async () => {
    if (zipLoading) return;
    setZipLoading(true);
    setZipError(null);

    try {
      const zip = new JSZip();
      const safeAlbumName = activeTitle.replace(/[^a-z0-9_\-]/gi, '_');
      const safeBandName = bandName.replace(/[^a-z0-9_\-]/gi, '_');
      const folderName = `${safeBandName}_${safeAlbumName}`;
      const folder = zip.folder(folderName) || zip;

      // 1. Add Tracklist TXT file
      folder.file('00_TRACKLIST.txt', generateTextContent());

      // 2. Add Album metadata JSON file
      folder.file('00_DATOS_ALBUM.json', generateJsonContent());

      // 3. Add M3U playlist file
      folder.file('00_PLAYLIST.m3u8', generateM3uContent());

      // 4. Add Chords/Lyrics document if enabled
      if (includeChords) {
        const chordsContent = targetSongs
          .filter((s) => s.cifradoTexto)
          .map((s, idx) => `==================================================\nTRACK ${String(idx + 1).padStart(2, '0')}: ${s.titulo.toUpperCase()}\n==================================================\n\n${s.cifradoTexto}`)
          .join('\n\n\n');
        if (chordsContent) {
          folder.file('00_LETRAS_Y_CIFRADOS.txt', chordsContent);
        }
      }

      // 5. Fetch and add audio MP3/WAV files
      const audioTargets = targetSongs
        .map((s, idx) => {
          const audioUrl = s.audioPrincipalUrl || (s as any).audioUrl;
          return { song: s, trackIndex: idx + 1, audioUrl };
        })
        .filter((t) => Boolean(t.audioUrl));

      if (audioTargets.length === 0) {
        setZipProgress({ current: 0, total: 0, status: 'Empaquetando metadatos del disco en ZIP...' });
      }

      for (let i = 0; i < audioTargets.length; i++) {
        const target = audioTargets[i];
        const numStr = String(target.trackIndex).padStart(2, '0');
        const cleanTitle = target.song.titulo.replace(/[^a-z0-9_\-]/gi, '_');

        setZipProgress({
          current: i + 1,
          total: audioTargets.length,
          status: `Descargando audio (${i + 1}/${audioTargets.length}): "${target.song.titulo}"...`,
        });

        try {
          const response = await fetch(target.audioUrl!);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();

          let ext = 'mp3';
          const lowerUrl = target.audioUrl!.toLowerCase();
          if (lowerUrl.includes('.wav')) ext = 'wav';
          else if (lowerUrl.includes('.ogg')) ext = 'ogg';
          else if (lowerUrl.includes('.m4a')) ext = 'm4a';
          else if (lowerUrl.includes('.flac')) ext = 'flac';

          folder.file(`${numStr}_${cleanTitle}.${ext}`, blob);
        } catch (err) {
          console.warn(`Error al descargar audio para ${target.song.titulo}:`, err);
          folder.file(
            `${numStr}_${cleanTitle}_NOTA_AUDIO.txt`,
            `No se pudo descargar directamente el archivo de audio para "${target.song.titulo}".\nEnlace original: ${target.audioUrl}`
          );
        }
      }

      setZipProgress({
        current: audioTargets.length,
        total: audioTargets.length,
        status: 'Comprimiendo carpeta y generando archivo .ZIP...',
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setZipProgress((prev) => ({
          ...prev,
          status: `Empaquetando ZIP (${Math.round(metadata.percent)}%)...`,
        }));
      });

      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${safeBandName}_${safeAlbumName}_mp3.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setZipProgress({ current: 0, total: 0, status: '' });
    } catch (err: any) {
      console.error('Error al generar archivo ZIP:', err);
      setZipError(err?.message || 'Error al empaquetar el disco en ZIP.');
    } finally {
      setZipLoading(false);
    }
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

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div
          className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all ${
            isStitchLight
              ? 'bg-white  text-[var(--ink)]'
              : 'bg-[#141416]  text-zinc-100'
          }`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-gradient-to-r from-[#1db954]/10 via-transparent to-transparent">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[var(--r-l)] bg-[#1db954]/20 border border-[#1db954]/40 flex items-center justify-center text-[#1ed760] shrink-0 shadow-inner">
                <Download className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-bold font-display truncate">
                  Exportar Canciones del Disco
                </h2>
                <p className="text-xs text-text-[var(--ink-2)] truncate">
                  Descarga los audios MP3 en ZIP, Excel, M3U playlist o imprime PDF
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-[var(--r-m)] bg-white/5 hover:bg-white/10 text-text-[var(--ink-2)] hover:text-white transition-colors cursor-pointer shrink-0"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
            {/* 1. Album Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-[var(--ink-2)] flex items-center justify-between">
                <span>Seleccionar Álbum / Disco</span>
                <span className="text-[#1ed760] font-mono font-bold text-[11px]">
                  {targetSongs.length} {targetSongs.length === 1 ? 'canción' : 'canciones'} ({formattedTotalDuration})
                </span>
              </label>
              <select
                value={selectedAlbum}
                onChange={(e) => setSelectedAlbum(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-[var(--r-l)] border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1db954]/50 transition-all ${
                  isStitchLight
                    ? 'bg-[var(--sunken)]  text-[var(--ink)]'
                    : 'bg-bg-[var(--surface)]  text-white'
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
              <label className="text-xs font-semibold uppercase tracking-wider text-text-[var(--ink-2)]">
                Formato de Exportación
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {/* ZIP MP3 Bundle (Highlight) */}
                <button
                  type="button"
                  onClick={() => setFormat('zip')}
                  className={`p-3 rounded-[var(--r-l)] border text-left transition-all flex flex-col gap-1.5 cursor-pointer relative col-span-2 sm:col-span-1 ${
                    format === 'zip'
                      ? 'bg-gradient-to-br from-[#1db954]/30 to-emerald-900/40 border-[#1db954] text-white shadow-lg ring-1 ring-[#1ed760]/40'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  }`}
                >
                  <Archive className={`w-5 h-5 ${format === 'zip' ? 'text-[#1ed760]' : 'text-emerald-400'}`} />
                  <div>
                    <div className="text-xs font-extrabold flex items-center gap-1">
                      <span>ZIP MP3s</span>
                      <span className="px-1 bg-[#1ed760] text-black text-[9px] font-black rounded uppercase">Pack</span>
                    </div>
                    <div className="text-[10px] opacity-80">Audios + letras</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('csv')}
                  className={`p-3 rounded-[var(--r-l)] border text-left transition-all flex flex-col gap-1.5 cursor-pointer relative ${
                    format === 'csv'
                      ? 'bg-[#1db954]/20 border-[#1db954] text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-text-[var(--ink-2)] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className={`w-5 h-5 ${format === 'csv' ? 'text-[#1ed760]' : 'text-emerald-400'}`} />
                  <div>
                    <div className="text-xs font-bold">Excel / CSV</div>
                    <div className="text-[10px] opacity-70">Tabla de datos</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('m3u')}
                  className={`p-3 rounded-[var(--r-l)] border text-left transition-all flex flex-col gap-1.5 cursor-pointer relative ${
                    format === 'm3u'
                      ? 'bg-[#1db954]/20 border-[#1db954] text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-text-[var(--ink-2)] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Music className={`w-5 h-5 ${format === 'm3u' ? 'text-[#1ed760]' : 'text-sky-400'}`} />
                  <div>
                    <div className="text-xs font-bold">Playlist M3U</div>
                    <div className="text-[10px] opacity-70">VLC / Reprod.</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('txt')}
                  className={`p-3 rounded-[var(--r-l)] border text-left transition-all flex flex-col gap-1.5 cursor-pointer relative ${
                    format === 'txt'
                      ? 'bg-[#1db954]/20 border-[#1db954] text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-text-[var(--ink-2)] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <FileText className={`w-5 h-5 ${format === 'txt' ? 'text-[#1ed760]' : 'text-amber-400'}`} />
                  <div>
                    <div className="text-xs font-bold">Texto TXT</div>
                    <div className="text-[10px] opacity-70">Lista limpia</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('json')}
                  className={`p-3 rounded-[var(--r-l)] border text-left transition-all flex flex-col gap-1.5 cursor-pointer relative ${
                    format === 'json'
                      ? 'bg-[#1db954]/20 border-[#1db954] text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-text-[var(--ink-2)] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Code className={`w-5 h-5 ${format === 'json' ? 'text-[#1ed760]' : 'text-purple-400'}`} />
                  <div>
                    <div className="text-xs font-bold">JSON Data</div>
                    <div className="text-[10px] opacity-70">Backup</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Audio Availability Banner (for ZIP mode) */}
            {format === 'zip' && (
              <div className="p-3.5 rounded-[var(--r-l)] bg-[#1db954]/10 border border-[#1db954]/30 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Music className="w-4 h-4 text-[#1ed760] shrink-0" />
                  <span>
                    Audios listos para comprimir:{' '}
                    <strong className="text-white font-mono">{songsWithAudio.length}</strong> de{' '}
                    <strong className="text-white font-mono">{targetSongs.length}</strong> temas
                  </span>
                </div>
                {songsWithAudio.length < targetSongs.length && (
                  <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-[var(--r-s)] border /20 shrink-0">
                    {targetSongs.length - songsWithAudio.length} sin MP3 subido
                  </span>
                )}
              </div>
            )}

            {/* 3. Export Options / Toggles */}
            <div className="p-3.5 rounded-[var(--r-l)] bg-white/5 border border-white/10 space-y-2.5">
              <span className="text-xs font-semibold text-text-[var(--ink-3)]">Contenido a incluir en la exportación:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeAudioUrls}
                    onChange={(e) => setIncludeAudioUrls(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#1db954] cursor-pointer"
                  />
                  <span>Enlaces directos de audios demo</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeChords}
                    onChange={(e) => setIncludeChords(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#1db954] cursor-pointer"
                  />
                  <span>Documento de letras y cifrados de guitarra/bajo</span>
                </label>
              </div>
            </div>

            {/* ZIP Progress Bar */}
            {zipLoading && (
              <div className="p-4 rounded-[var(--r-l)] bg-emerald-950/60 border border-emerald-500/40 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-medium text-emerald-300">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-[#1ed760] animate-spin" />
                    <span>{zipProgress.status || 'Procesando paquete ZIP...'}</span>
                  </span>
                  {zipProgress.total > 0 && (
                    <span className="font-mono text-emerald-400 font-bold">
                      {Math.round((zipProgress.current / zipProgress.total) * 100)}%
                    </span>
                  )}
                </div>
                {zipProgress.total > 0 && (
                  <div className="w-full h-2 bg-bg-[var(--surface)] rounded-full overflow-hidden border border-emerald-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-[#1db954] to-[#1ed760] transition-all duration-300 rounded-full"
                      style={{ width: `${Math.round((zipProgress.current / zipProgress.total) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ZIP Error Alert */}
            {zipError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-[var(--r-l)] text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{zipError}</span>
              </div>
            )}

            {/* 4. Live Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-text-[var(--ink-2)]">
                <span className="font-semibold uppercase tracking-wider">Vista previa del archivo</span>
                <span className="font-mono text-[11px] text-neutral-500">
                  formato .{getContentForFormat().extension}
                </span>
              </div>
              <div
                className={`p-3 rounded-[var(--r-l)] border font-mono text-xs max-h-44 overflow-y-auto custom-scrollbar select-all ${
                  isStitchLight
                    ? 'bg-[var(--sunken)]  text-[var(--ink)]'
                    : 'bg-bg-[var(--surface)]  text-emerald-400/90'
                }`}
              >
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
                className="px-3.5 py-2.5 rounded-[var(--r-l)] bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
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
                className="px-4 py-2.5 rounded-[var(--r-l)] bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/10 active:scale-95"
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

              {format === 'zip' ? (
                <button
                  type="button"
                  disabled={zipLoading}
                  onClick={handleDownloadZip}
                  className="px-5 py-2.5 rounded-[var(--r-l)] bg-gradient-to-r from-[#1db954] to-[#1ed760] hover:from-[#1ed760] hover:to-[#1db954] text-black font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {zipLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Empaquetando ZIP...</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4" />
                      <span>DESCARGAR DISCO EN ZIP (.ZIP)</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadStandard}
                  className="px-5 py-2.5 rounded-[var(--r-l)] bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar .{getContentForFormat().extension.toUpperCase()}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
