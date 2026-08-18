import React, { useState } from 'react';
import { 
  Printer, X, Users, User, FileText, Settings, Eye, Check, 
  ChevronLeft, ChevronRight, Edit3, Music, Sparkles, Image as ImageIcon,
  Sliders, Type, Palette, ShieldCheck, Zap
} from 'lucide-react';
import { Setlist, Song, ThemeColors } from '../../types';
import { BandMemberOption, resolveBandMembers, getSongMemberNote } from '../../utils/repertorioUtils';
import { MemberNotesModal } from './MemberNotesModal';
import { ModalPortal } from '../common/ModalPortal';

interface PdfExportModalProps {
  isOpen: boolean;
  activeSetlist: Setlist | null;
  activeSetlistMetrics: { formattedTime: string; songCount: number; avgBpm?: number; totalSeconds?: number };
  songs: Song[];
  isStitchLight: boolean;
  bandMembers?: BandMemberOption[];
  bandName?: string;
  bandLogoUrl?: string;
  onClose: () => void;
  onUpdateSong?: (updatedSong: Song) => void;
}

export type SetlistStylePreset = 'rock_stage' | 'festival_bold' | 'clean_stand' | 'sound_foh';

export function PdfExportModal({
  isOpen,
  activeSetlist,
  activeSetlistMetrics,
  songs,
  isStitchLight,
  bandMembers = [],
  bandName = 'Bakandeya',
  bandLogoUrl = '/logo_bakandeya_bueno_sin_fondo.png',
  onClose,
  onUpdateSong
}: PdfExportModalProps) {
  if (!isOpen || !activeSetlist) return null;

  const resolvedMembers = resolveBandMembers(bandMembers);

  // Print mode: 'all_members' | 'single_member' | 'master'
  const [printMode, setPrintMode] = useState<'all_members' | 'single_member' | 'master'>('all_members');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(resolvedMembers[0]?.id || 'usr-diego');
  
  // Design & Preset State
  const [stylePreset, setStylePreset] = useState<SetlistStylePreset>('rock_stage');
  const [fontSizeScale, setFontSizeScale] = useState<'gigante' | 'grande' | 'compacto'>('gigante');
  const [handwritingFont, setHandwritingFont] = useState<'caveat' | 'permanent_marker' | 'courier' | 'sans'>('caveat');
  const [handwritingColor, setHandwritingColor] = useState<'blue' | 'black' | 'red' | 'purple'>('blue');
  
  // Customization Toggles (Duration and BPM OFF by default as requested)
  const [showBandLogo, setShowBandLogo] = useState<boolean>(true);
  const [customLogoUrl, setCustomLogoUrl] = useState<string>(bandLogoUrl);
  const [showSongNumbers, setShowSongNumbers] = useState<boolean>(true);
  const [showBlockLines, setShowBlockLines] = useState<boolean>(true);
  const [showTonality, setShowTonality] = useState<boolean>(false);
  const [showBpm, setShowBpm] = useState<boolean>(false);
  const [showDuration, setShowDuration] = useState<boolean>(false);
  const [showSetlistNotes, setShowSetlistNotes] = useState<boolean>(true);
  const [showAppBranding, setShowAppBranding] = useState<boolean>(true);
  
  // Preview Pagination
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(0);

  // Quick edit note state
  const [editingSongForNotes, setEditingSongForNotes] = useState<Song | null>(null);

  const selectedMember = resolvedMembers.find(m => m.id === selectedMemberId) || resolvedMembers[0] || {
    id: 'usr-1',
    name: 'Músico',
    instrument: 'Instrumento'
  };

  const membersToExport = printMode === 'single_member' 
    ? [selectedMember]
    : printMode === 'all_members' 
      ? resolvedMembers 
      : [{ id: 'master', name: 'Master Escenario / Sonido', instrument: 'Técnico FOH / Backstage' }];

  // Font helper mappings
  const getHandwritingFontFamily = () => {
    switch (handwritingFont) {
      case 'caveat': return "'Caveat', cursive, sans-serif";
      case 'permanent_marker': return "'Permanent Marker', cursive, sans-serif";
      case 'courier': return "'Courier Prime', monospace";
      default: return "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    }
  };

  const getInkColorHex = () => {
    switch (handwritingColor) {
      case 'blue': return '#0038a8'; // Classic Pilot Blue / Sharpie Blue
      case 'black': return '#111827';
      case 'red': return '#dc2626';
      case 'purple': return '#7c3aed';
      default: return '#0038a8';
    }
  };

  // Generate HTML for printing
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const fontPx = fontSizeScale === 'gigante' ? '28pt' : fontSizeScale === 'grande' ? '22pt' : '17pt';
    const noteFontPx = fontSizeScale === 'gigante' ? '19pt' : fontSizeScale === 'grande' ? '16pt' : '13pt';
    const inkColor = getInkColorHex();
    const handFont = getHandwritingFontFamily();

    const pagesHtml = membersToExport.map((member, mIdx) => {
      const isMaster = member.id === 'master';

      const itemsRowsHtml = activeSetlist.items.map((item, idx) => {
        if (item.tipoItem === 'cancion') {
          const s = songs.find(x => x.id === item.songId);
          if (!s) return '';

          const memberNote = !isMaster ? getSongMemberNote(s, member.id, member.name) : '';
          const generalRepertorioNote = s.notasRepertorio || s.notasInternas || '';
          const setlistNote = (item as any).notaTema || item.notas || '';

          return `
            <div class="setlist-song-item">
              <div class="song-line">
                <div class="song-left">
                  ${showSongNumbers ? `<span class="song-num">${idx + 1}.</span>` : ''}
                  <span class="song-title">${s.titulo.toUpperCase()}</span>
                  ${showTonality && s.tonalidad ? `<span class="tag-tonality">${s.tonalidad}</span>` : ''}
                  ${showBpm && s.bpm ? `<span class="tag-bpm">${s.bpm} BPM</span>` : ''}
                  ${showDuration && s.duracion ? `<span class="tag-dur">${s.duracion}</span>` : ''}
                </div>
              </div>

              ${memberNote ? `
                <div class="handwritten-note">
                  <span class="note-text">${memberNote}</span>
                </div>
              ` : ''}

              ${(showSetlistNotes && setlistNote) ? `
                <div class="setlist-cue-note">
                  *** ${setlistNote} ***
                </div>
              ` : ''}

              ${(showSetlistNotes && isMaster && !memberNote && generalRepertorioNote) ? `
                <div class="general-cue-note">
                  [Nota General: ${generalRepertorioNote}]
                </div>
              ` : ''}
            </div>
          `;
        } else if (item.tipoItem === 'bloque_header') {
          return `
            <div class="block-divider-item">
              <div class="divider-line"></div>
              <div class="block-title">${(item.tituloCustom || 'BLOQUE').toUpperCase()}</div>
              <div class="divider-line"></div>
            </div>
          `;
        } else if (item.tipoItem === 'bis') {
          return `
            <div class="bis-divider-item">
              <div class="bis-double-line"></div>
              <div class="bis-text">=== ${(item.tituloCustom || 'BIS / ENCORE').toUpperCase()} ===</div>
              <div class="bis-double-line"></div>
            </div>
          `;
        } else {
          return `
            <div class="interlude-item">
              <span class="interlude-bracket">****</span>
              <span class="interlude-title">${(item.tituloCustom || item.notas || (item as any).notaTema || item.tipoItem || 'INTERLUDIO').toUpperCase()}</span>
              <span class="interlude-bracket">****</span>
              ${(item.notas || (item as any).notaTema) && item.tituloCustom ? `
                <span class="interlude-note">(${item.notas || (item as any).notaTema})</span>
              ` : ''}
            </div>
          `;
        }
      }).join('');

      return `
        <div class="sheet-page ${mIdx < membersToExport.length - 1 ? 'page-break' : ''}">
          <!-- Header: Band Logo / Name + Member Name -->
          <div class="page-header">
            <div class="header-left">
              ${(showBandLogo && customLogoUrl) ? `
                <img src="${customLogoUrl}" alt="${bandName}" class="band-logo-img" onerror="this.style.display='none'" />
              ` : ''}
              <div class="band-text-block">
                <h1 class="band-heading">${bandName.toUpperCase()}</h1>
                <div class="setlist-meta">
                  <span class="setlist-name-badge">${activeSetlist.nombre.toUpperCase()}</span>
                  ${showDuration ? `<span class="meta-dot">•</span> <span>${activeSetlistMetrics.formattedTime}</span>` : ''}
                  <span class="meta-dot">•</span> <span>${activeSetlistMetrics.songCount} TEMAS</span>
                </div>
              </div>
            </div>
            
            <div class="header-right">
              <div class="member-stage-tag">
                <div class="tag-title">${!isMaster ? 'COPIA PARA MÚSICO' : 'COPIA CONTROL'}</div>
                <div class="tag-name">${member.name.toUpperCase()}</div>
                <div class="tag-instrument">${member.instrument.toUpperCase()}</div>
              </div>
            </div>
          </div>

          <!-- Main Setlist Body -->
          <div class="setlist-items-container">
            ${itemsRowsHtml}
          </div>

          <!-- Professional Footer with BandManager.ai and App URL -->
          ${showAppBranding ? `
            <div class="page-footer">
              <div class="footer-left">
                <span class="app-logo-badge">⚡ BandManager.ai</span>
                <span class="footer-sep">•</span>
                <a href="https://www.bandmanager.ia" target="_blank" class="app-link">www.bandmanager.ia</a>
              </div>
              <div class="footer-right">
                <span>Hoja ${mIdx + 1} de ${membersToExport.length} (${member.name})</span>
                <span class="footer-sep">•</span>
                <span>${new Date().toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${bandName} - Setlist ${activeSetlist.nombre}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@600;700&family=Permanent+Marker&family=Courier+Prime:wght@700&family=Oswald:wght@600;700;800&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: ${stylePreset === 'rock_stage' ? "'Anton', 'Oswald', -apple-system, sans-serif" : stylePreset === 'festival_bold' ? "'Oswald', sans-serif" : "-apple-system, BlinkMacSystemFont, sans-serif"};
              color: #000;
              background: #fff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .sheet-page {
              width: 100%;
              min-height: 278mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              padding: 4px;
            }
            .page-break {
              page-break-after: always;
              break-after: page;
            }

            /* Header */
            .page-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 4px solid #000;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .header-left {
              display: flex;
              align-items: center;
              gap: 14px;
            }
            .band-logo-img {
              max-height: 52px;
              max-width: 130px;
              object-fit: contain;
              filter: grayscale(100%) contrast(150%);
            }
            .band-text-block {
              display: flex;
              flex-direction: column;
            }
            .band-heading {
              font-family: 'Anton', 'Oswald', sans-serif;
              font-size: 26pt;
              line-height: 1;
              margin: 0;
              letter-spacing: 0.5px;
              color: #000;
            }
            .setlist-meta {
              font-family: 'Oswald', sans-serif;
              font-size: 10.5pt;
              font-weight: 700;
              color: #333;
              margin-top: 4px;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .setlist-name-badge {
              background: #000;
              color: #fff !important;
              padding: 1px 6px;
              border-radius: 2px;
              letter-spacing: 0.5px;
            }
            .meta-dot {
              color: #888;
            }

            .header-right {
              text-align: right;
            }
            .member-stage-tag {
              border: 2.5px solid #000;
              padding: 4px 10px;
              background: #fff;
              border-radius: 4px;
              text-align: right;
            }
            .tag-title {
              font-family: 'Oswald', sans-serif;
              font-size: 8pt;
              font-weight: 700;
              color: #555;
              letter-spacing: 1px;
            }
            .tag-name {
              font-family: 'Anton', 'Oswald', sans-serif;
              font-size: 17pt;
              line-height: 1.1;
              color: #000;
              margin-top: 1px;
            }
            .tag-instrument {
              font-family: monospace;
              font-size: 9.5pt;
              font-weight: 800;
              color: #333;
            }

            /* Setlist Container */
            .setlist-items-container {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              gap: 6px;
            }

            .setlist-song-item {
              padding: 2px 0;
            }

            .song-line {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
            }
            .song-left {
              display: flex;
              align-items: baseline;
              flex-wrap: wrap;
              gap: 8px;
            }
            .song-num {
              font-family: 'Oswald', sans-serif;
              font-size: ${fontSizeScale === 'gigante' ? '22pt' : '18pt'};
              font-weight: 800;
              color: #444;
              min-width: 32px;
            }
            .song-title {
              font-family: ${stylePreset === 'rock_stage' ? "'Anton', 'Oswald', sans-serif" : "'Oswald', sans-serif"};
              font-size: ${fontPx};
              font-weight: 900;
              letter-spacing: 0.5px;
              color: #000;
              line-height: 1.1;
            }

            /* Badges */
            .tag-tonality {
              font-family: monospace;
              font-size: 11pt;
              font-weight: 800;
              border: 1.5px solid #000;
              padding: 1px 5px;
              border-radius: 3px;
              background: #fff;
              color: #000;
            }
            .tag-bpm {
              font-family: monospace;
              font-size: 10pt;
              font-weight: 700;
              color: #444;
            }
            .tag-dur {
              font-family: monospace;
              font-size: 10pt;
              font-weight: 700;
              color: #666;
            }

            /* Handwritten Musician Notes (The Star Feature) */
            .handwritten-note {
              font-family: ${handFont};
              font-size: ${noteFontPx};
              font-weight: 700;
              color: ${inkColor} !important;
              padding-left: ${showSongNumbers ? '40px' : '6px'};
              margin-top: -2px;
              line-height: 1.15;
              letter-spacing: 0.2px;
            }
            .handwritten-note .note-text {
              display: inline-block;
              transform: rotate(-0.3deg);
            }

            .setlist-cue-note {
              font-family: monospace;
              font-size: 10pt;
              font-weight: 700;
              color: #b45309;
              padding-left: ${showSongNumbers ? '40px' : '6px'};
              margin-top: 1px;
            }

            .general-cue-note {
              font-family: monospace;
              font-size: 9.5pt;
              color: #555;
              padding-left: ${showSongNumbers ? '40px' : '6px'};
              font-style: italic;
            }

            /* Dividers & Interludes */
            .block-divider-item {
              display: flex;
              align-items: center;
              gap: 10px;
              margin: 6px 0;
            }
            .divider-line {
              flex: 1;
              height: 2px;
              background: #000;
            }
            .block-title {
              font-family: 'Oswald', sans-serif;
              font-size: 12pt;
              font-weight: 800;
              letter-spacing: 1px;
              color: #000;
            }

            .bis-divider-item {
              margin: 10px 0 6px 0;
              text-align: center;
            }
            .bis-double-line {
              height: 2px;
              background: #000;
              margin: 2px 0;
            }
            .bis-text {
              font-family: 'Anton', 'Oswald', sans-serif;
              font-size: 16pt;
              letter-spacing: 1px;
              color: #000;
            }

            .interlude-item {
              font-family: 'Oswald', monospace, sans-serif;
              font-size: 13pt;
              font-weight: 700;
              color: #222;
              padding: 3px 0 3px ${showSongNumbers ? '40px' : '6px'};
              letter-spacing: 0.5px;
            }
            .interlude-bracket {
              color: #666;
            }
            .interlude-title {
              font-weight: 800;
            }
            .interlude-note {
              font-size: 10.5pt;
              font-family: monospace;
              color: #555;
              font-style: italic;
              margin-left: 6px;
            }

            /* Footer */
            .page-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-top: 2px solid #000;
              padding-top: 6px;
              margin-top: 10px;
              font-family: monospace;
              font-size: 8.5pt;
              color: #444;
            }
            .footer-left {
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .app-logo-badge {
              font-weight: 900;
              color: #000;
            }
            .app-link {
              color: #000;
              text-decoration: none;
              font-weight: 700;
            }
            .footer-sep {
              color: #999;
            }
            .footer-right {
              display: flex;
              align-items: center;
              gap: 6px;
              font-weight: 700;
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Preview page member
  const currentPreviewMember = membersToExport[previewPageIndex] || membersToExport[0];
  const isCurrentMaster = currentPreviewMember?.id === 'master';

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto overscroll-contain">
        <div
          className={`w-full max-w-7xl max-h-[96vh] my-auto flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${
            isStitchLight ? 'bg-slate-100 border-slate-300' : 'bg-neutral-950 border-neutral-800'
          }`}
        >
        {/* Modal Top Header */}
        <div
          className={`p-3.5 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b shrink-0 ${
            isStitchLight ? 'border-slate-300 bg-white' : 'border-neutral-800 bg-[#121111]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-base sm:text-lg uppercase tracking-wider text-white">
                  Generador de Repertorios de Escenario
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-[#1db954] text-black">
                  Rock Stage Edition
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Setlist: <span className="font-bold text-white">{activeSetlist.nombre}</span> ({activeSetlistMetrics.songCount} temas • Letras grandes para el suelo de escenario con notas a mano)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase transition-all shadow-xl flex items-center gap-2 cursor-pointer bg-[#1db954] hover:bg-[#1ed760] text-black active:scale-95 hover:shadow-[#1db954]/20"
            >
              <Printer className="w-4 h-4" /> 
              <span>Imprimir {membersToExport.length} {membersToExport.length === 1 ? 'Hoja' : 'Hojas'} (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors active:scale-95 cursor-pointer ${
                isStitchLight
                  ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-700'
                  : 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customization Control Panel */}
        <div className={`p-3 sm:px-6 border-b flex flex-col gap-3 text-xs font-mono shrink-0 ${
          isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900/90 border-neutral-800'
        }`}>
          {/* Row 1: Mode & Target Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
              <button
                onClick={() => {
                  setPrintMode('all_members');
                  setPreviewPageIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  printMode === 'all_members'
                    ? 'bg-[#1db954] text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Todos los Músicos ({resolvedMembers.length} hojas individuales)
              </button>
              <button
                onClick={() => {
                  setPrintMode('single_member');
                  setPreviewPageIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  printMode === 'single_member'
                    ? 'bg-[#1db954] text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" /> 1 Músico Específico
              </button>
              <button
                onClick={() => {
                  setPrintMode('master');
                  setPreviewPageIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  printMode === 'master'
                    ? 'bg-[#1db954] text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Master Escenario / Sonido
              </button>
            </div>

            {/* Single member picker */}
            {printMode === 'single_member' && (
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 font-bold">Músico:</span>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className={`p-1.5 px-3 rounded-lg border font-bold cursor-pointer ${
                    isStitchLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-700 text-white'
                  }`}
                >
                  {resolvedMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      👤 {m.name} ({m.instrument})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Row 2: Typography, Handwritten Sharpie Ink & Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5">
            {/* Font Scale */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 font-bold flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-amber-400" /> Tamaño Títulos:
              </span>
              <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">
                <button
                  onClick={() => setFontSizeScale('gigante')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                    fontSizeScale === 'gigante' ? 'bg-amber-500 text-black font-black' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="30pt+ - Ideal para leer de pie desde el suelo o encima de un monitor"
                >
                  🔥 Suelo / Escenario (Gigante)
                </button>
                <button
                  onClick={() => setFontSizeScale('grande')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                    fontSizeScale === 'grande' ? 'bg-amber-500 text-black font-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Atril (Grande)
                </button>
                <button
                  onClick={() => setFontSizeScale('compacto')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                    fontSizeScale === 'compacto' ? 'bg-amber-500 text-black font-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Compacto
                </button>
              </div>
            </div>

            {/* Handwritten Note Style */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 font-bold flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-sky-400" /> Letra Manuscrita:
              </span>
              <select
                value={handwritingFont}
                onChange={(e) => setHandwritingFont(e.target.value as any)}
                className="p-1 px-2.5 rounded-lg bg-black/50 border border-neutral-700 text-white font-bold text-[11px] cursor-pointer"
              >
                <option value="caveat">✍️ Rotulador Fino (Caveat)</option>
                <option value="permanent_marker">🖊️ Sharpie Grueso (Permanent Marker)</option>
                <option value="courier">⌨️ Máquina (Courier)</option>
                <option value="sans">🔤 Imprenta Limpia (Sans)</option>
              </select>

              {/* Ink color selector */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10">
                <button
                  onClick={() => setHandwritingColor('blue')}
                  className={`w-5 h-5 rounded-full bg-blue-600 transition-transform cursor-pointer ${
                    handwritingColor === 'blue' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                  title="Tinta Azul Rotulador"
                />
                <button
                  onClick={() => setHandwritingColor('black')}
                  className={`w-5 h-5 rounded-full bg-neutral-900 border border-neutral-600 transition-transform cursor-pointer ${
                    handwritingColor === 'black' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                  title="Tinta Negra Sharpie"
                />
                <button
                  onClick={() => setHandwritingColor('red')}
                  className={`w-5 h-5 rounded-full bg-red-600 transition-transform cursor-pointer ${
                    handwritingColor === 'red' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                  title="Tinta Roja Marcador"
                />
                <button
                  onClick={() => setHandwritingColor('purple')}
                  className={`w-5 h-5 rounded-full bg-purple-600 transition-transform cursor-pointer ${
                    handwritingColor === 'purple' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                  title="Tinta Violeta"
                />
              </div>
            </div>

            {/* Feature Toggles (BPM & Duration optional, Logo, etc.) */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-neutral-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBandLogo}
                  onChange={(e) => setShowBandLogo(e.target.checked)}
                  className="rounded accent-[#1db954] cursor-pointer"
                />
                <span>Logo Grupo</span>
              </label>

              <label className="flex items-center gap-1.5 text-neutral-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showTonality}
                  onChange={(e) => setShowTonality(e.target.checked)}
                  className="rounded accent-[#1db954] cursor-pointer"
                />
                <span>Tono</span>
              </label>

              <label className="flex items-center gap-1.5 text-neutral-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBpm}
                  onChange={(e) => setShowBpm(e.target.checked)}
                  className="rounded accent-[#1db954] cursor-pointer"
                />
                <span>BPM</span>
              </label>

              <label className="flex items-center gap-1.5 text-neutral-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDuration}
                  onChange={(e) => setShowDuration(e.target.checked)}
                  className="rounded accent-[#1db954] cursor-pointer"
                />
                <span>Duración</span>
              </label>

              <label className="flex items-center gap-1.5 text-neutral-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showAppBranding}
                  onChange={(e) => setShowAppBranding(e.target.checked)}
                  className="rounded accent-[#1db954] cursor-pointer"
                />
                <span>Pie BandManager.ai</span>
              </label>
            </div>
          </div>
        </div>

        {/* Pager Navigation for Multiple Sheets */}
        {membersToExport.length > 1 && (
          <div className={`px-4 sm:px-6 py-2 border-b flex items-center justify-between text-xs font-mono shrink-0 ${
            isStitchLight ? 'bg-slate-200 border-slate-300' : 'bg-[#151515] border-neutral-800 text-neutral-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-400">Previsualizando hoja {previewPageIndex + 1} de {membersToExport.length}:</span>
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <span>👤 {currentPreviewMember.name}</span>
                <span className="text-neutral-400 text-[10px]">({currentPreviewMember.instrument})</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={previewPageIndex <= 0}
                onClick={() => setPreviewPageIndex(p => Math.max(0, p - 1))}
                className="p-1 px-3 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
              </button>
              <button
                disabled={previewPageIndex >= membersToExport.length - 1}
                onClick={() => setPreviewPageIndex(p => Math.min(membersToExport.length - 1, p + 1))}
                className="p-1 px-3 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                Siguiente <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Body: A4 Stage Sheet Real Preview Container */}
        <div
          className={`flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center ${
            isStitchLight ? 'bg-slate-200' : 'bg-[#0a0a0a]'
          }`}
        >
          {/* Authentic Real Stage Paper Sheet */}
          <div
            className="bg-white text-black p-8 sm:p-12 shadow-2xl rounded-sm w-full max-w-[210mm] min-h-[297mm] flex flex-col justify-between border border-neutral-300 transition-all"
            style={{ 
              width: '210mm', 
              minHeight: '297mm',
              fontFamily: stylePreset === 'rock_stage' ? "'Anton', 'Oswald', sans-serif" : "'Oswald', sans-serif"
            }}
          >
            {/* Top Sheet Header */}
            <div>
              <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-6">
                <div className="flex items-center gap-4">
                  {showBandLogo && customLogoUrl && (
                    <img
                      src={customLogoUrl}
                      alt={bandName}
                      className="max-h-14 max-w-[140px] object-contain filter grayscale contrast-150"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <h1 className="text-[30pt] font-black uppercase tracking-tighter m-0 leading-none text-black font-['Anton',sans-serif]">
                      {bandName.toUpperCase()}
                    </h1>
                    <div className="text-[12pt] font-mono font-bold text-neutral-800 mt-1 flex items-center gap-2">
                      <span className="bg-black text-white px-2 py-0.5 rounded text-[10pt] uppercase tracking-wider font-['Oswald',sans-serif]">
                        {activeSetlist.nombre}
                      </span>
                      {showDuration && <span>• {activeSetlistMetrics.formattedTime}</span>}
                      <span>• {activeSetlistMetrics.songCount} TEMAS</span>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-black bg-white p-2.5 px-4 rounded text-right min-w-[180px] shadow-sm">
                  <div className="text-[8.5pt] font-mono font-bold text-neutral-500 uppercase tracking-widest">
                    {!isCurrentMaster ? 'REPERTORIO PERSONALIZADO' : 'COPIA DE CONTROL'}
                  </div>
                  <div className="text-[19pt] font-black uppercase text-black leading-tight font-['Anton',sans-serif] mt-0.5">
                    👤 {currentPreviewMember.name}
                  </div>
                  <div className="text-[10pt] font-mono font-bold text-neutral-800">
                    🎵 {currentPreviewMember.instrument}
                  </div>
                </div>
              </div>

              {/* Setlist Song List (Large High-Impact Typography) */}
              <div className="space-y-3">
                {activeSetlist.items.map((item, index) => {
                  if (item.tipoItem === 'cancion') {
                    const s = songs.find(x => x.id === item.songId);
                    if (!s) return null;

                    const memberNote = !isCurrentMaster ? getSongMemberNote(s, currentPreviewMember.id, currentPreviewMember.name) : '';
                    const generalRepertorioNote = s.notasRepertorio || s.notasInternas || '';
                    const setlistNote = (item as any).notaTema || item.notas || '';

                    return (
                      <div key={item.id} className="group relative py-1">
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-baseline flex-wrap gap-2.5">
                            {showSongNumbers && (
                              <span className="font-mono text-[20pt] text-neutral-400 font-black min-w-[32px]">
                                {index + 1}.
                              </span>
                            )}
                            <span 
                              className={`font-black uppercase tracking-wide text-black leading-none ${
                                fontSizeScale === 'gigante' ? 'text-[26pt]' : fontSizeScale === 'grande' ? 'text-[22pt]' : 'text-[17pt]'
                              }`}
                              style={{ fontFamily: "'Anton', 'Oswald', sans-serif" }}
                            >
                              {s.titulo}
                            </span>

                            {showTonality && s.tonalidad && (
                              <span className="font-mono text-[11pt] font-black border-2 border-black px-1.5 py-0.5 rounded bg-white text-black leading-none ml-1">
                                {s.tonalidad}
                              </span>
                            )}

                            {showBpm && s.bpm && (
                              <span className="font-mono text-[10.5pt] font-bold text-neutral-600 ml-1">
                                {s.bpm} BPM
                              </span>
                            )}

                            {showDuration && s.duracion && (
                              <span className="font-mono text-[10.5pt] font-bold text-neutral-500 ml-1">
                                {s.duracion}
                              </span>
                            )}
                          </div>

                          {/* Quick note edit trigger on hover */}
                          {onUpdateSong && (
                            <button
                              onClick={() => setEditingSongForNotes(s)}
                              title="Editar notas manuscritas de esta canción"
                              className="opacity-0 group-hover:opacity-100 text-xs px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded font-mono text-neutral-800 flex items-center gap-1.5 cursor-pointer transition-opacity"
                            >
                              <Edit3 className="w-3 h-3 text-emerald-600" />
                              <span>Editar Nota</span>
                            </button>
                          )}
                        </div>

                        {/* Handwritten Member Note */}
                        {memberNote ? (
                          <div 
                            className={`mt-0.5 pl-9 ${
                              fontSizeScale === 'gigante' ? 'text-[19pt]' : fontSizeScale === 'grande' ? 'text-[16pt]' : 'text-[13pt]'
                            }`}
                            style={{ 
                              fontFamily: getHandwritingFontFamily(),
                              color: getInkColorHex(),
                              lineHeight: 1.15,
                              transform: 'rotate(-0.3deg)'
                            }}
                          >
                            <span className="font-bold">{memberNote}</span>
                          </div>
                        ) : (
                          <div className="pl-9 text-[10pt] font-mono text-neutral-300 italic">
                            (Sin anotación específica)
                          </div>
                        )}

                        {/* Setlist cue notes */}
                        {showSetlistNotes && setlistNote && (
                          <div className="pl-9 font-mono text-[10.5pt] font-bold text-amber-800 mt-0.5">
                            *** {setlistNote} ***
                          </div>
                        )}

                        {/* General notes in master view */}
                        {showSetlistNotes && isCurrentMaster && !memberNote && generalRepertorioNote && (
                          <div className="pl-9 font-mono text-[10pt] text-neutral-600 italic">
                            [Nota General: {generalRepertorioNote}]
                          </div>
                        )}
                      </div>
                    );
                  } else if (item.tipoItem === 'bloque_header') {
                    return (
                      <div key={item.id} className="flex items-center gap-3 my-2.5 py-1">
                        <div className="flex-1 h-0.5 bg-black" />
                        <span className="font-['Oswald',sans-serif] text-[13pt] font-black uppercase tracking-wider text-black">
                          {item.tituloCustom || 'BLOQUE'}
                        </span>
                        <div className="flex-1 h-0.5 bg-black" />
                      </div>
                    );
                  } else if (item.tipoItem === 'bis') {
                    return (
                      <div key={item.id} className="my-3 py-1 text-center">
                        <div className="h-0.5 bg-black my-0.5" />
                        <div className="h-0.5 bg-black mb-1.5" />
                        <span className="font-['Anton',sans-serif] text-[17pt] uppercase tracking-widest text-black">
                          === {item.tituloCustom || 'BIS / ENCORE'} ===
                        </span>
                        <div className="h-0.5 bg-black mt-1.5" />
                        <div className="h-0.5 bg-black my-0.5" />
                      </div>
                    );
                  } else {
                    return (
                      <div key={item.id} className="pl-9 py-1 text-neutral-800 font-mono text-[12pt] font-bold">
                        <span className="text-neutral-500">****</span> {(item.tituloCustom || item.notas || (item as any).notaTema || item.tipoItem || 'INTERLUDIO').toUpperCase()} <span className="text-neutral-500">****</span>
                        {(item.notas || (item as any).notaTema) && item.tituloCustom && (
                          <span className="text-[10pt] text-neutral-600 font-normal italic ml-2">
                            ({item.notas || (item as any).notaTema})
                          </span>
                        )}
                      </div>
                    );
                  }
                })}
              </div>
            </div>

            {/* Bottom Footer with BandManager.ai & link */}
            {showAppBranding && (
              <div className="flex justify-between items-center border-t-2 border-black pt-3 mt-8 font-mono text-[9pt] text-neutral-600">
                <div className="flex items-center gap-2">
                  <span className="font-black text-black">⚡ BandManager.ai</span>
                  <span>•</span>
                  <a href="https://www.bandmanager.ia" target="_blank" rel="noreferrer" className="text-black font-bold underline">
                    www.bandmanager.ia
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span>Hoja {previewPageIndex + 1} de {membersToExport.length} ({currentPreviewMember.name})</span>
                  <span>•</span>
                  <span>{new Date().toLocaleDateString('es-ES')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Member Notes Modal if clicked from preview */}
      {editingSongForNotes && (
        <MemberNotesModal
          isOpen={Boolean(editingSongForNotes)}
          song={editingSongForNotes}
          colors={{ card: 'bg-neutral-900', text: 'text-white' } as any}
          isStitchLight={isStitchLight}
          bandMembers={resolvedMembers}
          onClose={() => setEditingSongForNotes(null)}
          onSaveSongNotes={(updated) => {
            if (onUpdateSong) {
              onUpdateSong(updated);
            }
            setEditingSongForNotes(null);
          }}
        />
      )}
    </div>
    </ModalPortal>
  );
}
