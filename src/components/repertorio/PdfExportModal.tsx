import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Printer, X, Users, User, FileText, Settings, Eye, Check,
  ChevronLeft, ChevronRight, Edit3, Music, Sparkles, Image as ImageIcon,
  Sliders, Type, Palette, ShieldCheck, Zap
} from 'lucide-react';
import { Setlist, Song, ThemeColors } from '../../types';
import { BandMemberOption, resolveBandMembers, getSongMemberNote } from '../../utils/repertorioUtils';
import { MemberNotesModal } from './MemberNotesModal';
import { ModalPortal } from '../common/ModalPortal';
import { fitStackedNoteSegments, makeCanvasMeasurer, mmToPx, deterministicRotationDeg, NoteSegment, NoteLine, StackedFitResult } from '../../utils/textFit';

const ptToPx = (pt: number) => (pt * 96) / 72;

// Ancho de la hoja A4 disponible para contenido: 210mm - 2x10mm de margen del @page - el padding
// de 4px de .sheet-page a cada lado (ver handlePrint). Se usa tanto en el HTML de impresión real
// como en la vista previa en directo para decidir, fila a fila, si la nota cabe al lado del
// título o si esa fila concreta necesita caer a una línea propia debajo (ver textFit.ts).
const PAGE_CONTENT_WIDTH_PX = mmToPx(190) - 8;
const MIN_USEFUL_RIGHT_LANE_PX = mmToPx(24);
// Hueco mínimo entre el título y la nota: pequeño a propósito — el efecto buscado es que la nota
// parezca escrita a mano justo pegada al título ya impreso, no maquetada como una columna aparte.
const ROW_GAP_PX = 5;

interface NoteLayoutBadge {
  text: string;
  fontSizePx: number;
  fontFamily?: string;
  fontWeight?: string | number;
  extraWidthPx?: number; // borde/padding que measureText no contempla
}

interface NoteLayoutInput {
  memberNote: string;
  setlistNote: string;
  generalNote: string;
  showSetlistNotes: boolean;
  numberText: string;
  numberFontSizePx: number;
  titleText: string;
  titleFontSizePx: number;
  titleFontFamily: string;
  badges: NoteLayoutBadge[];
  noteFontFamily: string;
  noteMaxFontSizePx: number;
  noteMinFontSizePx: number;
  // Ancho real de contenido disponible en ESE renderizado concreto (impresión vs vista previa
  // tienen paddings distintos — ver Ronda 2 del plan, no asumir un ancho fijo compartido).
  rowWidthPx: number;
  measure: (text: string, fontSizePx: number, fontFamily: string, fontWeight?: string | number) => number;
}

interface NoteLayoutResult {
  mode: 'inline' | 'below';
  maxWidthPx: number;
  fit: StackedFitResult;
}

/**
 * Decide, para una fila de canción concreta, si la nota (miembro, nota del bolo, nota general)
 * cabe en una columna a la derecha del título o si esa fila necesita caer a una línea propia
 * debajo — y calcula, con fitStackedNoteSegments, el tamaño de fuente común y las líneas ya
 * apiladas (una por nota, cada una en su propia línea; el texto de una nota nunca se pierde: no
 * se parte en dos líneas ni se trunca). Si el carril de la derecha obligaría a encoger alguna
 * nota por debajo del mínimo compartido, se prueba antes con el carril de abajo (mucho más
 * ancho) en vez de aceptar directamente esa fuente extrema. Devuelve null si no hay ninguna
 * nota que mostrar.
 */
function computeNoteLayout(input: NoteLayoutInput): NoteLayoutResult | null {
  const segments: NoteSegment[] = [];
  if (input.memberNote) segments.push({ text: input.memberNote, className: 'note-member' });
  if (input.showSetlistNotes && input.setlistNote) {
    segments.push({ text: `*** ${input.setlistNote} ***`, className: 'note-cue' });
  }
  if (input.showSetlistNotes && input.generalNote) {
    segments.push({ text: `[General: ${input.generalNote}]`, className: 'note-general' });
  }
  if (segments.length === 0) return null;

  const numberWidth = input.numberText
    ? input.measure(input.numberText, input.numberFontSizePx, 'Oswald, sans-serif', 800) + ROW_GAP_PX
    : 0;
  const titleWidth = input.measure(input.titleText, input.titleFontSizePx, input.titleFontFamily, 900);
  const badgesWidth = input.badges.reduce(
    (sum, b) =>
      sum +
      input.measure(b.text, b.fontSizePx, b.fontFamily || 'monospace', b.fontWeight ?? 800) +
      ROW_GAP_PX +
      (b.extraWidthPx || 0),
    0
  );
  const leftWidthPx = numberWidth + titleWidth + badgesWidth;
  const rightSpaceAvailable = input.rowWidthPx - leftWidthPx - ROW_GAP_PX;
  const inlineFits = rightSpaceAvailable >= MIN_USEFUL_RIGHT_LANE_PX;
  const belowMaxWidthPx = input.rowWidthPx - (input.numberText ? 40 : 6);

  const fitAt = (maxWidthPx: number) =>
    fitStackedNoteSegments(segments, {
      maxWidthPx,
      maxFontSizePx: input.noteMaxFontSizePx,
      minFontSizePx: input.noteMinFontSizePx,
      fontFamily: input.noteFontFamily,
      fontWeight: 700,
      measure: (text, size) => input.measure(text, size, input.noteFontFamily, 700)
    });

  if (inlineFits) {
    const inlineFit = fitAt(rightSpaceAvailable);
    const neededExtremeShrink = inlineFit.lines.some(l => l.fontSizePx < input.noteMinFontSizePx);
    if (!neededExtremeShrink) {
      return { mode: 'inline', maxWidthPx: rightSpaceAvailable, fit: inlineFit };
    }
    // Ni al tamaño mínimo compartido cupo al lado del título: mejor caer a la fila de abajo
    // (mucho más ancha) que aceptar una fuente extremadamente pequeña junto al título.
    return { mode: 'below', maxWidthPx: belowMaxWidthPx, fit: fitAt(belowMaxWidthPx) };
  }

  return { mode: 'below', maxWidthPx: belowMaxWidthPx, fit: fitAt(belowMaxWidthPx) };
}

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

  // Medidor de texto (canvas) para el ajuste de notas manuscritas de la vista previa — se crea
  // una sola vez y se reutiliza en cada canción del repertorio (ver computeNoteLayout/textFit.ts).
  const measureText = useMemo(() => makeCanvasMeasurer(), []);
  // Las fuentes web (Caveat, Permanent Marker...) tardan en cargar de forma asíncrona; si se mide
  // antes de que terminen de cargar, el canvas usa la fuente de reserva del sistema y el ajuste
  // sale descuadrado. Este contador fuerza un recálculo (nuevo `measureText` con las métricas
  // reales) en cuanto document.fonts confirma que ya están listas.
  const [, setFontsReadyTick] = useState(0);
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return;
    document.fonts.ready.then(() => setFontsReadyTick(t => t + 1));
  }, []);

  // Ancho REAL de contenido de la hoja en la vista previa, medido del DOM en vez de asumido en
  // mm: a diferencia del HTML de impresión (dimensiones fijas de @page), este contenedor tiene
  // padding responsive de Tailwind (p-8 sm:p-12), así que una constante fija sobrestimaba el
  // hueco libre y hacía que el título se aplastara en vez de la nota caer a la línea de abajo
  // (Ronda 2 del plan). Se mide el ancho de la hoja y se le resta el padding calculado.
  const sheetRef = useRef<HTMLDivElement>(null);
  const [previewContentWidthPx, setPreviewContentWidthPx] = useState<number>(PAGE_CONTENT_WIDTH_PX);
  useEffect(() => {
    const el = sheetRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      const paddingX = parseFloat(cs.paddingLeft || '0') + parseFloat(cs.paddingRight || '0');
      const width = rect.width - paddingX;
      if (width > 0) setPreviewContentWidthPx(width);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen]);

  // Los hooks de arriba tienen que ejecutarse siempre (ver react-hooks/rules-of-hooks): este
  // guard vivía antes de ellos, así que abrir/cerrar el modal o cambiar de repertorio activo
  // cambiaba cuántos hooks corrían entre renders.
  if (!isOpen || !activeSetlist) return null;

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

    const measure = makeCanvasMeasurer();
    const titleFontPt = fontSizeScale === 'gigante' ? 28 : fontSizeScale === 'grande' ? 22 : 17;
    const noteFontPt = fontSizeScale === 'gigante' ? 19 : fontSizeScale === 'grande' ? 16 : 13;
    const fontPx = `${titleFontPt}pt`;
    const titleFontSizePx = ptToPx(titleFontPt);
    const noteMaxFontSizePx = ptToPx(noteFontPt);
    const noteMinFontSizePx = 11;
    const songNumFontSizePx = ptToPx(fontSizeScale === 'gigante' ? 22 : 18);
    const inkColor = getInkColorHex();
    const handFont = getHandwritingFontFamily();
    const titleFontFamily = stylePreset === 'rock_stage' ? "'Anton', 'Oswald', sans-serif" : "'Oswald', sans-serif";

    const pagesHtml = membersToExport.map((member, mIdx) => {
      const isMaster = member.id === 'master';

      const itemsRowsHtml = activeSetlist.items.map((item, idx) => {
        if (item.tipoItem === 'cancion') {
          const s = songs.find(x => x.id === item.songId);
          if (!s) return '';

          const memberNote = !isMaster ? getSongMemberNote(s, member.id, member.name) : '';
          const generalRepertorioNote = s.notasRepertorio || s.notasInternas || '';
          const setlistNote = (item as any).notaTema || item.notas || '';
          const numberText = showSongNumbers ? `${idx + 1}.` : '';
          const badges: NoteLayoutBadge[] = [
            ...(showTonality && s.tonalidad ? [{ text: s.tonalidad, fontSizePx: ptToPx(11), extraWidthPx: 14 }] : []),
            ...(showBpm && s.bpm ? [{ text: `${s.bpm} BPM`, fontSizePx: ptToPx(10) }] : []),
            ...(showDuration && s.duracion ? [{ text: s.duracion, fontSizePx: ptToPx(10) }] : [])
          ];

          const layout = computeNoteLayout({
            memberNote,
            setlistNote,
            generalNote: generalRepertorioNote,
            showSetlistNotes,
            numberText,
            numberFontSizePx: songNumFontSizePx,
            titleText: s.titulo.toUpperCase(),
            titleFontSizePx,
            titleFontFamily,
            badges,
            noteFontFamily: handFont,
            noteMaxFontSizePx,
            noteMinFontSizePx,
            rowWidthPx: PAGE_CONTENT_WIDTH_PX,
            measure
          });

          const rotationDeg = deterministicRotationDeg(s.id);
          // Cada nota en su propia línea, apiladas — no todas seguidas en una sola línea. El
          // tamaño de fuente va por línea (no en el contenedor): la nota excepcional que
          // necesitó encogerse más que las demás para caber entera lo hace sola, sin afectar
          // al tamaño de sus vecinas.
          // Flecha manuscrita apuntando al título de arriba: solo en la primera línea, y solo
          // cuando la nota cayó a su propia línea debajo (excepción rara), para que quede claro
          // a qué canción pertenece (ver referencia real de setlist: flechas "← nota" a mano).
          const noteLineColor = (className: string) =>
            className === 'note-member' ? inkColor : className === 'note-cue' ? '#b45309' : '#555';
          const arrowSvg = (color: string) =>
            `<svg width="9" height="9" viewBox="0 0 16 16" style="flex-shrink:0;margin-right:3px;"><path d="M13 13 L4 5 M4 5 L4.5 8.5 M4 5 L7.5 4.5" stroke="${color}" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
          const notesHtml = layout
            ? `<div class="${layout.mode === 'inline' ? 'song-notes-right' : 'song-notes-below'}" style="max-width:${layout.mode === 'inline' ? `${layout.maxWidthPx}px` : 'none'};transform:rotate(${rotationDeg}deg);">${layout.fit.lines.map((line, i) => {
                const color = noteLineColor(line.className);
                const arrow = layout.mode === 'below' && i === 0 ? arrowSvg(color) : '';
                return `<div class="note-seg ${line.className}" style="font-size:${line.fontSizePx}px;display:flex;align-items:center;">${arrow}${line.text}</div>`;
              }).join('')}</div>`
            : '';
          // El título solo se fuerza a una sola línea (con "…" si hace falta) cuando de verdad
          // compite por sitio con una nota en la misma fila (layout.mode === 'inline'). Si esa
          // fila no tiene nota, o la nota cae debajo, el título vuelve a poder ocupar toda su
          // anchura natural — nunca se pidió tocarlo salvo por esa convivencia.
          const titleStyle = layout && layout.mode === 'inline' ? '' : ' style="white-space:normal;overflow:visible;text-overflow:clip;"';

          return `
            <div class="setlist-song-item">
              <div class="song-line">
                <div class="song-left">
                  ${numberText ? `<span class="song-num">${numberText}</span>` : ''}
                  <span class="song-title"${titleStyle}>${s.titulo.toUpperCase()}</span>
                  ${showTonality && s.tonalidad ? `<span class="tag-tonality">${s.tonalidad}</span>` : ''}
                  ${showBpm && s.bpm ? `<span class="tag-bpm">${s.bpm} BPM</span>` : ''}
                  ${showDuration && s.duracion ? `<span class="tag-dur">${s.duracion}</span>` : ''}
                </div>
                ${layout && layout.mode === 'inline' ? notesHtml : ''}
              </div>
              ${layout && layout.mode === 'below' ? notesHtml : ''}
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

          <!-- Professional Footer with BandManager and App URL -->
          ${showAppBranding ? `
            <div class="page-footer">
              <div class="footer-left">
                <span class="app-logo-badge">⚡ BandManager</span>
                <span class="footer-sep">•</span>
                <a href="https://www.bandmanager.app" target="_blank" class="app-link">www.bandmanager.app</a>
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

            /* Setlist Container: el ritmo vertical "sin nota" es el de una lista impresa normal
               y apretada (como si se hubiera impreso ANTES de añadir ninguna anotación) — el
               espacio para las notas manuscritas no se reserva aquí, se aprovecha el hueco que
               ya deja el propio interlineado del título (ver .song-notes-below más abajo). */
            .setlist-items-container {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              gap: 2px;
            }

            .setlist-song-item {
              padding: 0;
            }

            /* .song-line nunca envuelve: el título se trunca con "..." antes de saltar a una
               segunda línea, así la fila mide siempre lo mismo y nada se monta encima de la
               canción anterior, sea cual sea la longitud del título o de las notas. Sin
               justify-content:space-between a propósito: la nota debe quedar pegada justo detrás
               del título (como un boli escribiendo a continuación), no flotando contra el margen
               derecho de la hoja con un hueco en blanco en medio. */
            .song-line {
              display: flex;
              align-items: baseline;
              gap: 5px;
              flex-wrap: nowrap;
            }
            .song-left {
              display: flex;
              align-items: baseline;
              flex-wrap: nowrap;
              gap: 8px;
              min-width: 0;
              flex: 0 1 auto;
              overflow: hidden;
            }
            .song-num {
              font-family: 'Oswald', sans-serif;
              font-size: ${fontSizeScale === 'gigante' ? '22pt' : '18pt'};
              font-weight: 800;
              color: #444;
              min-width: 32px;
              flex-shrink: 0;
            }
            .song-title {
              font-family: ${stylePreset === 'rock_stage' ? "'Anton', 'Oswald', sans-serif" : "'Oswald', sans-serif"};
              font-size: ${fontPx};
              font-weight: 900;
              letter-spacing: 0.5px;
              color: #000;
              line-height: 1.1;
              min-width: 0;
              flex-shrink: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            /* Badges: nunca se encogen ni desaparecen — el título es el único que cede espacio */
            .tag-tonality {
              font-family: monospace;
              font-size: 11pt;
              font-weight: 800;
              border: 1.5px solid #000;
              padding: 1px 5px;
              border-radius: 3px;
              background: #fff;
              color: #000;
              flex-shrink: 0;
            }
            .tag-bpm {
              font-family: monospace;
              font-size: 10pt;
              font-weight: 700;
              color: #444;
              flex-shrink: 0;
            }
            .tag-dur {
              font-family: monospace;
              flex-shrink: 0;
              font-size: 10pt;
              font-weight: 700;
              color: #666;
            }

            /* Notas "escritas a mano encima del repertorio ya impreso": las tres (miembro, nota
               del bolo, nota general) comparten la fuente manuscrita y solo se distinguen por su
               color de tinta. El tamaño de fuente (por línea, no por bloque) y si van al lado
               del título o en su propia línea debajo se calculan fila a fila en JS (ver
               computeNoteLayout/textFit.ts): se encoge la fuente tanto como haga falta — nunca
               se parte una nota en 2 líneas ni se trunca su texto. Por eso aquí no hay font-size
               ni max-width fijos: llegan inline por fila/línea. */
            /* Cada nota apilada en su propia línea (no todas seguidas), justo detrás del título
               (align-items:flex-start: el texto arranca pegado al título, no alineado contra el
               margen derecho del carril calculado — eso dejaba un hueco en blanco en medio).
               overflow:visible a propósito (ver .note-seg): en el caso raro de una nota
               patológicamente larga que ni encogida al mínimo cabe, se deja que asome un poco
               fuera de su carril en vez de recortarla sin avisar. */
            .song-notes-right {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              gap: 0px;
              flex-shrink: 0;
              overflow: visible;
              line-height: 1;
            }
            /* margin-top negativo a propósito: "muerde" el hueco que ya deja el descendente/
               interlineado del título de arriba, para que la nota parezca escrita justo pegada
               a la línea impresa en vez de maquetada como una fila nueva con su propio aire. */
            .song-notes-below {
              display: flex;
              flex-direction: column;
              gap: 0px;
              padding-left: ${showSongNumbers ? '40px' : '6px'};
              margin-top: -10px;
              line-height: 1;
            }
            .note-seg {
              /* overflow:visible a propósito: el texto nunca se trunca en JS (ver textFit.ts),
                 así que tampoco debe cortarse aquí con elipsis por un posible desajuste de 1px
                 entre la medición por canvas y el render real. white-space:nowrap sigue
                 garantizando que una nota nunca salta a una segunda línea. */
              overflow: visible;
              white-space: nowrap;
              min-width: 0;
              max-width: 100%;
            }
            .note-member {
              font-family: ${handFont};
              font-weight: 700;
              color: ${inkColor} !important;
              letter-spacing: 0.2px;
            }
            .note-cue {
              font-family: ${handFont};
              font-weight: 700;
              color: #b45309;
              letter-spacing: 0.2px;
            }
            .note-general {
              font-family: ${handFont};
              font-weight: 600;
              color: #555;
              letter-spacing: 0.2px;
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
                <span>Pie BandManager</span>
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
            ref={sheetRef}
            className="bg-white text-black p-8 sm:p-12 shadow-2xl rounded-sm w-full max-w-[210mm] min-h-[297mm] flex flex-col justify-between border border-neutral-300 transition-all"
            style={{ 
              width: '210mm', 
              minHeight: '297mm',
              fontFamily: stylePreset === 'rock_stage' ? "'Anton', 'Oswald', sans-serif" : "'Oswald', sans-serif"
            }}
          >
            {/* Top Sheet Header — compacta a propósito: cada mm que se ahorra aquí es un mm
                menos de riesgo de que el repertorio se desborde a una hoja extra. */}
            <div>
              <div className="flex items-center justify-between border-b-[3px] border-black pb-1.5 mb-3">
                <div className="flex items-center gap-3">
                  {showBandLogo && customLogoUrl && (
                    <img
                      src={customLogoUrl}
                      alt={bandName}
                      className="max-h-9 max-w-[100px] object-contain filter grayscale contrast-150"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <h1 className="text-[18pt] font-black uppercase tracking-tighter m-0 leading-none text-black font-['Anton',sans-serif]">
                      {bandName.toUpperCase()}
                    </h1>
                    <div className="text-[9pt] font-mono font-bold text-neutral-800 mt-0.5 flex items-center gap-2">
                      <span className="bg-black text-white px-1.5 py-0.5 rounded text-[8pt] uppercase tracking-wider font-['Oswald',sans-serif]">
                        {activeSetlist.nombre}
                      </span>
                      {showDuration && <span>• {activeSetlistMetrics.formattedTime}</span>}
                      <span>• {activeSetlistMetrics.songCount} TEMAS</span>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-black bg-white p-1.5 px-3 rounded text-right min-w-[140px] shadow-sm">
                  <div className="text-[7pt] font-mono font-bold text-neutral-500 uppercase tracking-widest">
                    {!isCurrentMaster ? 'REPERTORIO PERSONALIZADO' : 'COPIA DE CONTROL'}
                  </div>
                  <div className="text-[13pt] font-black uppercase text-black leading-tight font-['Anton',sans-serif] mt-0.5">
                    👤 {currentPreviewMember.name}
                  </div>
                  <div className="text-[8pt] font-mono font-bold text-neutral-800">
                    🎵 {currentPreviewMember.instrument}
                  </div>
                </div>
              </div>

              {/* Setlist Song List (Large High-Impact Typography). El ritmo vertical "sin nota"
                  es el de una lista impresa apretada — no se reserva hueco para notas aquí, se
                  aprovecha el que ya deja el interlineado del título (ver modo 'below' abajo). */}
              <div className="space-y-0.5">
                {activeSetlist.items.map((item, index) => {
                  if (item.tipoItem === 'cancion') {
                    const s = songs.find(x => x.id === item.songId);
                    if (!s) return null;

                    const memberNote = !isCurrentMaster ? getSongMemberNote(s, currentPreviewMember.id, currentPreviewMember.name) : '';
                    const generalRepertorioNote = s.notasRepertorio || s.notasInternas || '';
                    const setlistNote = (item as any).notaTema || item.notas || '';

                    const titleFontPt = fontSizeScale === 'gigante' ? 26 : fontSizeScale === 'grande' ? 22 : 17;
                    const noteFontPt = fontSizeScale === 'gigante' ? 16 : fontSizeScale === 'grande' ? 14 : 11;
                    const numberText = showSongNumbers ? `${index + 1}.` : '';
                    const badges: NoteLayoutBadge[] = [
                      ...(showTonality && s.tonalidad ? [{ text: s.tonalidad, fontSizePx: ptToPx(11), extraWidthPx: 14 }] : []),
                      ...(showBpm && s.bpm ? [{ text: `${s.bpm} BPM`, fontSizePx: ptToPx(10.5) }] : []),
                      ...(showDuration && s.duracion ? [{ text: s.duracion, fontSizePx: ptToPx(10.5) }] : [])
                    ];
                    const noteLayout = computeNoteLayout({
                      memberNote,
                      setlistNote,
                      generalNote: generalRepertorioNote,
                      showSetlistNotes,
                      numberText,
                      numberFontSizePx: ptToPx(20),
                      titleText: s.titulo,
                      titleFontSizePx: ptToPx(titleFontPt),
                      titleFontFamily: "'Anton', 'Oswald', sans-serif",
                      badges,
                      noteFontFamily: getHandwritingFontFamily(),
                      noteMaxFontSizePx: ptToPx(noteFontPt),
                      noteMinFontSizePx: 11,
                      rowWidthPx: previewContentWidthPx,
                      measure: measureText
                    });
                    const noteRotationDeg = deterministicRotationDeg(s.id);

                    // Cada nota (miembro / nota del bolo / general) apilada en su propia línea,
                    // una encima de otra, en vez de todas seguidas en una sola línea. El texto
                    // nunca se trunca: sin `truncate`/`overflow-hidden` a propósito, para que una
                    // nota patológicamente larga (caso raro, ya encogida al suelo mínimo en
                    // computeNoteLayout) pueda asomar un poco fuera de su carril en vez de
                    // recortarse sin avisar. whitespace-nowrap sí se mantiene: eso es lo que
                    // garantiza que nunca salta a una segunda línea.
                    const renderNoteLine = (line: NoteLine, key: string, showArrow: boolean = false) => {
                      const noteColor =
                        line.className === 'note-member'
                          ? getInkColorHex()
                          : line.className === 'note-cue'
                            ? '#b45309'
                            : '#555';
                      return (
                        <div
                          key={key}
                          className={`flex items-center min-w-0 max-w-full font-bold whitespace-nowrap ${
                            line.className === 'note-general' ? 'italic font-semibold' : ''
                          }`}
                          style={{ fontFamily: getHandwritingFontFamily(), fontSize: line.fontSizePx, color: noteColor }}
                        >
                          {/* Flecha manuscrita apuntando al título de arriba: solo cuando la nota
                              cayó a su propia línea debajo (excepción rara) y podría no quedar
                              claro a qué canción pertenece — ver referencia visual de setlist real
                              (flechas "← nota" a mano). Un único trazo doblado, no una V simétrica
                              de línea técnica, para no romper el efecto manuscrito. */}
                          {showArrow && (
                            <svg
                              width={line.fontSizePx * 0.75}
                              height={line.fontSizePx * 0.75}
                              viewBox="0 0 16 16"
                              style={{ flexShrink: 0, marginRight: 3 }}
                            >
                              <path
                                d="M13 13 L4 5 M4 5 L4.5 8.5 M4 5 L7.5 4.5"
                                stroke={noteColor}
                                strokeWidth="1.3"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                          <span>{line.text}</span>
                        </div>
                      );
                    };

                    return (
                      <div key={item.id} className="group relative">
                        {/* flex-nowrap en la fila del título: se trunca con "..." (min-w-0 +
                            truncate) en vez de saltar de línea, así la fila nunca crece de alto
                            ni se monta sobre la canción de arriba. Sin justify-between a
                            propósito: la nota debe quedar pegada justo detrás del título (como
                            un boli escribiendo a continuación), no flotando contra el margen
                            derecho con un hueco en blanco en medio (ver noteLayout más abajo). */}
                        <div className="flex items-baseline gap-1.5 flex-nowrap">
                          <div className="flex items-baseline gap-2.5 min-w-0 flex-nowrap overflow-hidden">
                            {showSongNumbers && (
                              <span className="font-mono text-[20pt] text-neutral-400 font-black min-w-[32px] shrink-0">
                                {index + 1}.
                              </span>
                            )}
                            {/* truncate/min-w-0 solo cuando de verdad hay una nota compitiendo
                                por sitio en esta fila (noteLayout.mode === 'inline'); si no,
                                el título vuelve a poder ocupar toda su anchura natural. */}
                            <span
                              className={`font-black uppercase tracking-wide text-black leading-none ${
                                noteLayout && noteLayout.mode === 'inline' ? 'truncate min-w-0' : ''
                              } ${
                                fontSizeScale === 'gigante' ? 'text-[26pt]' : fontSizeScale === 'grande' ? 'text-[22pt]' : 'text-[17pt]'
                              }`}
                              style={{ fontFamily: "'Anton', 'Oswald', sans-serif" }}
                            >
                              {s.titulo}
                            </span>

                            {showTonality && s.tonalidad && (
                              <span className="font-mono text-[11pt] font-black border-2 border-black px-1.5 py-0.5 rounded bg-white text-black leading-none ml-1 shrink-0">
                                {s.tonalidad}
                              </span>
                            )}

                            {showBpm && s.bpm && (
                              <span className="font-mono text-[10.5pt] font-bold text-neutral-600 ml-1 shrink-0">
                                {s.bpm} BPM
                              </span>
                            )}

                            {showDuration && s.duracion && (
                              <span className="font-mono text-[10.5pt] font-bold text-neutral-500 ml-1 shrink-0">
                                {s.duracion}
                              </span>
                            )}
                          </div>

                          {/* Notas "escritas a mano" a la derecha, cuando cabe con hueco de sobra
                              (ver computeNoteLayout) — apiladas, una por línea, tamaño ya
                              decidido por textFit, aquí solo se pintan. */}
                          {noteLayout && noteLayout.mode === 'inline' && (
                            <div
                              className="flex flex-col items-start shrink-0"
                              style={{ maxWidth: noteLayout.maxWidthPx, lineHeight: 1, transform: `rotate(${noteRotationDeg}deg)` }}
                            >
                              {noteLayout.fit.lines.map((line, i) => renderNoteLine(line, `l${i}`))}
                            </div>
                          )}

                          {/* Quick note edit trigger on hover — ml-auto lo mantiene pegado al
                              margen derecho ahora que el título y la nota ya no usan
                              justify-between entre sí (ver arriba). */}
                          {onUpdateSong && (
                            <button
                              onClick={() => setEditingSongForNotes(s)}
                              title="Editar notas manuscritas de esta canción"
                              className="ml-auto opacity-0 group-hover:opacity-100 text-xs px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded font-mono text-neutral-800 flex items-center gap-1.5 cursor-pointer transition-opacity shrink-0"
                            >
                              <Edit3 className="w-3 h-3 text-emerald-600" />
                              <span>Editar Nota</span>
                            </button>
                          )}
                        </div>

                        {/* Excepción rara y controlada: el título de esta fila concreta no dejó
                            hueco razonable al lado. La nota no abre una fila nueva con su propio
                            aire: muerde (margin-top negativo) el hueco que ya deja el
                            interlineado del título de arriba, para parecer escrita a mano justo
                            pegada a la línea impresa. */}
                        {noteLayout && noteLayout.mode === 'below' && (
                          <div
                            className="pl-9"
                            style={{ lineHeight: 1, marginTop: '-10px', transform: `rotate(${noteRotationDeg}deg)` }}
                          >
                            {noteLayout.fit.lines.map((line, i) => renderNoteLine(line, `l${i}`, i === 0))}
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

            {/* Bottom Footer with BandManager & link */}
            {showAppBranding && (
              <div className="flex justify-between items-center border-t-2 border-black pt-3 mt-8 font-mono text-[9pt] text-neutral-600">
                <div className="flex items-center gap-2">
                  <span className="font-black text-black">⚡ BandManager</span>
                  <span>•</span>
                  <a href="https://www.bandmanager.app" target="_blank" rel="noreferrer" className="text-black font-bold underline">
                    www.bandmanager.app
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
