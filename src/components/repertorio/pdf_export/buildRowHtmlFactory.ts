/**
 * HTML de cada fila del setlist (canción, bloque o nota) con su maquetación.
 * Extraído de printDocumentBuilder.ts (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Setlist, Song } from "../../../types";
import { escapeHtml } from "../../../utils/escapeHtml";
import { BandMemberOption, getSongMemberNote, isSongBpmMarkedForMember, isSongTonoMarkedForMember } from "../../../utils/repertorioUtils";
import { cleanPrintedNote, isAutoVersionNote } from "../../../utils/setlistNoteText";
import { deterministicOffsetPx, deterministicRotationDeg } from "../../../utils/textFit";
import { COLUMN_WIDTH_PX, computeNoteLayout, deriveNoteFontPt, deriveSongNumFontPt, NoteLayoutBadge, PAGE_CONTENT_WIDTH_PX, ptToPx } from "./printLayout";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface buildRowHtmlFactoryParams {
  activeSetlist: Setlist;
  membersToExport: BandMemberOption[];
  songs: Song[];
  showGeneralNotes: boolean;
  showSongNumbers: boolean;
  markedSongs: Record<string, string[]>;
  showTonality: boolean;
  badgesScope: "all" | "marked";
  showBpm: boolean;
  showDuration: boolean;
  showSetlistNotes: boolean;
  titleFontFamily: "'Anton', 'Oswald', sans-serif" | "'Oswald', sans-serif";
  handFont: "'Caveat', cursive, sans-serif" | "'Permanent Marker', cursive, sans-serif" | "'Courier Prime', monospace" | "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  noteMinFontSizePx: 11;
  measure: (text: string, fontSizePx: number, fontFamily: string, fontWeight?: string | number) => number;
  isCentered: boolean;
  inkColor: "#0038a8" | "#111827" | "#dc2626" | "#7c3aed";
}

/**
 * HTML de cada fila del setlist (canción, bloque o nota) con su maquetación.
 * @param params Estado y callbacks del contenedor ({@link buildRowHtmlFactoryParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function buildRowHtmlFactory({ songs, showGeneralNotes, showSongNumbers, markedSongs, showTonality, badgesScope, showBpm, showDuration, showSetlistNotes, titleFontFamily, handFont, noteMinFontSizePx, measure, isCentered, inkColor }: buildRowHtmlFactoryParams) {
  // Construye el HTML de UNA fila (canción o divisor) a un tamaño de título dado — reutilizada
  // tanto para el HTML final de impresión como para medir alturas candidatas del auto-ajuste
  // (computeAutoFitPlan, ver más abajo). Antes esto vivía inline dentro de un único
  // `activeSetlist.items.map`, atado al fontSizeScale fijo elegido a mano; ahora titleFontPt
  // llega como parámetro porque el auto-ajuste puede decidir un tamaño distinto por miembro
  // (cada uno tiene sus propias notas, que ocupan distinto espacio).
  const buildRowHtml = (
    item: Setlist["items"][number],
    idx: number,
    titleFontPt: number,
    member: BandMemberOption,
    isMaster: boolean,
    cols: 1 | 2,
  ): string => {
    // Ancho real de una fila: toda la hoja o una columna.
    const rowWidthPx = cols === 2 ? COLUMN_WIDTH_PX : PAGE_CONTENT_WIDTH_PX;
    const titleFontSizePx = ptToPx(titleFontPt);
    const noteFontPt = deriveNoteFontPt(titleFontPt);
    const noteMaxFontSizePx = ptToPx(noteFontPt);
    const songNumFontSizePx = ptToPx(deriveSongNumFontPt(titleFontPt));
    // Bloques e interludios escalan con la letra del título: a 11pt de título un divisor de
    // 9pt fijo parecía más grande que las canciones.
    const auxFontPt = Math.max(7.5, Math.min(10, titleFontPt * 0.42));

    if (item.tipoItem === "cancion") {
      const s = songs.find((x) => x.id === item.songId);
      if (!s) return "";

      const memberNote = !isMaster
        ? cleanPrintedNote(getSongMemberNote(s, member.id, member.name))
        : "";
      const rawGeneralNote = s.notasRepertorio || s.notasInternas || "";
      // La nota general autogenerada al importar ("Versión Original: ...") repite el tono y los
      // BPM y no dice nada de cómo toca la banda el tema: no se imprime.
      const generalRepertorioNote =
        showGeneralNotes && !isAutoVersionNote(rawGeneralNote)
          ? cleanPrintedNote(rawGeneralNote)
          : "";
      const setlistNote = cleanPrintedNote(item.notaTema || item.notas || "");
      const numberText = showSongNumbers ? `${idx + 1}.` : "";
      // Tono/BPM/duración escalan con el título: a 14pt de título, unos badges de 11pt fijos
      // parecían casi tan grandes como la propia canción.
      const badgePt = Math.max(7.5, Math.min(12, titleFontPt * 0.5));
      // Con "solo marcados", tono y BPM salen únicamente en los temas que ese músico marcó.
      const legacyMarked = (markedSongs[member.id] ?? []).includes(s.id);
      const keyHere =
        showTonality &&
        (badgesScope === "all" || legacyMarked || isSongTonoMarkedForMember(s, member.id, member.name));
      const bpmHere =
        showBpm &&
        (badgesScope === "all" || legacyMarked || isSongBpmMarkedForMember(s, member.id, member.name));
      const badges: NoteLayoutBadge[] = [
        ...(keyHere && s.tonalidad
          ? [{ text: s.tonalidad, fontSizePx: ptToPx(badgePt + 3), extraWidthPx: 24 }]
          : []),
        ...(bpmHere && s.bpm
          ? [{ text: `${s.bpm} BPM`, fontSizePx: ptToPx(badgePt), extraWidthPx: 12 }]
          : []),
        ...(showDuration && s.duracion
          ? [{ text: s.duracion, fontSizePx: ptToPx(badgePt), extraWidthPx: 8 }]
          : []),
      ];
      const badgesHtml = [
        keyHere && s.tonalidad
          ? `<span class="tag-tonality" style="font-size:${badgePt + 3}pt;">${escapeHtml(s.tonalidad)}</span>`
          : "",
        bpmHere && s.bpm
          ? `<span class="tag-bpm" style="font-size:${badgePt}pt;">${escapeHtml(s.bpm)} BPM</span>`
          : "",
        showDuration && s.duracion
          ? `<span class="tag-dur" style="font-size:${badgePt}pt;">${escapeHtml(s.duracion)}</span>`
          : "",
      ].join("");

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
        rowWidthPx,
        measure,
        forceBelowMode: isCentered || cols === 2,
      });

      // Cada nota en su propia línea, apiladas — no todas seguidas en una sola línea. El
      // tamaño de fuente va por línea (no en el contenedor): la nota excepcional que
      // necesitó encogerse más que las demás para caber entera lo hace sola, sin afectar
      // al tamaño de sus vecinas.
      // Flecha manuscrita apuntando al título de arriba: en modo'below' va en la primera
      // línea (nota separada del título); en modo'inline' con varias notas apiladas va en
      // la ÚLTIMA (la más cerca de la canción siguiente, donde puede haber duda de a qué
      // tema pertenece) — ver referencia real de setlist: flechas"← nota" a mano.
      const noteLineColor = (className: string) =>
        className === "note-member"
          ? inkColor
          : className === "note-cue"
            ? "#b45309"
            : "#555";
      const arrowSvg = (color: string) =>
        `<svg width="14" height="14" viewBox="0 0 16 16" style="flex-shrink:0;margin-right:4px;"><path d="M13 13 L4 5 M4 5 L4.5 8.5 M4 5 L7.5 4.5" stroke="${color}" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      // Rotación + desplazamiento por LÍNEA (no un único transform para todo el bloque): así
      // las tres notas no giran como una pieza rígida, sino que cada una parece garabateada
      // por separado, en un momento distinto — más orgánico y menos"maquetado".
      // layout puede venir en modo'inline' con fit.lines vacío (caso"solo badges, sin
      // notas" — ver computeNoteLayout): ahí no hay nada que pintar como nota manuscrita,
      // solo se usó layout para calcular cuánto debía ceder el título ante los badges.
      const notesHtml =
        layout && layout.fit.lines.length > 0
          ? `<div class="${layout.mode === "inline" ? "song-notes-right" : "song-notes-below"}" style="max-width:${layout.mode === "inline" ? `${layout.maxWidthPx}px` : "none"};">${layout.fit.lines
              .map((line, i) => {
                const color = noteLineColor(line.className);
                // Flecha hacia el título: en modo'below' en la primera línea (todo el bloque
                // está separado del título). En modo'inline' con varias notas apiladas, en la
                // ÚLTIMA línea — es la que queda más lejos del título y más cerca de la canción
                // siguiente, donde puede haber duda de a qué tema pertenece.
                const showArrow =
                  !isCentered &&
                  ((layout.mode === "below" && i === 0) ||
                    (layout.mode === "inline" &&
                      layout.fit.lines.length > 1 &&
                      i === layout.fit.lines.length - 1));
                const arrow = showArrow ? arrowSvg(color) : "";
                const seed = `${s.id}-${line.className}`;
                // Solo hacia arriba (o recta), nunca hacia abajo: rotate() positivo gira en
                // sentido horario, o sea el extremo derecho del texto cae hacia abajo — se veía
                // como una nota"torcida hacia abajo" en vez de la escritura ascendente natural.
                const lineRotationDeg = -Math.abs(
                  deterministicRotationDeg(seed, 3),
                );
                const lineOffsetXPx = deterministicOffsetPx(`${seed}-x`, 2);
                // Solo hacia arriba (o recta), nunca hacia abajo: un desplazamiento positivo se
                // veía como un salto de línea/desalineación entre notas — justo el efecto que se
                // había quitado a propósito (ver line-height:1 más arriba).
                const lineOffsetYPx = -Math.abs(
                  deterministicOffsetPx(`${seed}-y`, 2),
                );
                const lineTransform = `rotate(${lineRotationDeg}deg) translate(${lineOffsetXPx}px, ${lineOffsetYPx}px)`;
                return `<div class="note-seg ${line.className}" style="font-size:${line.fontSizePx}px;display:flex;align-items:center;transform:${lineTransform};">${arrow}${escapeHtml(line.text)}</div>`;
              })
              .join("")}</div>`
          : "";
      // El título solo se fuerza a una sola línea (con"…" si hace falta) cuando de verdad
      // compite por sitio con una nota en la misma fila (layout.mode ==='inline'). Si esa
      // fila no tiene nota, o la nota cae debajo, el título vuelve a poder ocupar toda su
      // anchura natural — nunca se pidió tocarlo salvo por esa convivencia. font-size inline
      // (no una clase CSS global): titleFontPt ahora puede variar por miembro/página según
      // el auto-ajuste (ver computeAutoFitPlan), a diferencia de los 3 tamaños fijos de antes.
      const titleStyle =
        layout && layout.mode === "inline"
          ? `font-size:${titleFontPt}pt;`
          : `font-size:${titleFontPt}pt;white-space:normal;overflow:visible;text-overflow:clip;`;

      return `
          <div class="setlist-song-item" data-song-id="${s.id}">
            <div class="song-line">
              <div class="song-left">
                ${numberText ? `<span class="song-num" style="font-size:${deriveSongNumFontPt(titleFontPt)}pt;">${numberText}</span>` : ""}
                <span class="song-title" style="${titleStyle}">${escapeHtml(s.titulo.toUpperCase())}</span>
                ${(isCentered || badgesScope === "marked") && badgesHtml ? `<span class="badges-inline">${badgesHtml}</span>` : ""}
              </div>
              ${layout && layout.mode === "inline" ? notesHtml : ""}
              ${!isCentered && badgesScope !== "marked" && badgesHtml ? `<div class="song-badges">${badgesHtml}</div>` : ""}
            </div>
            ${layout && layout.mode === "below" ? notesHtml : ""}
          </div>
        `;
    } else if (
      item.tipoItem === "bloque" &&
      item.bloqueSubtipo === "header"
    ) {
      return `
          <div class="block-divider-item">
            <div class="divider-line"></div>
            <div class="block-title" style="font-size:${auxFontPt}pt;">${escapeHtml((item.tituloCustom || "BLOQUE").toUpperCase())}</div>
            <div class="divider-line"></div>
          </div>
        `;
    } else if (item.tipoItem === "bloque" && item.bloqueSubtipo === "bis") {
      return `
          <div class="bis-divider-item">
            <div class="divider-line"></div>
            <div class="bis-text" style="font-size:${auxFontPt}pt;">${escapeHtml((item.tituloCustom || "BIS / ENCORE").toUpperCase())}</div>
            <div class="divider-line"></div>
          </div>
        `;
    } else {
      return `
          <div class="interlude-item" style="font-size:${auxFontPt + 1}pt;">
            <span class="interlude-title">${escapeHtml((item.tituloCustom || item.notas || item.notaTema || item.tipoItem || "INTERLUDIO").toUpperCase())}</span>
            ${
 (item.notas || item.notaTema) && item.tituloCustom
   ? `
              <span class="interlude-note" style="font-size:${auxFontPt + 1.5}pt;">${escapeHtml(cleanPrintedNote(item.notas || item.notaTema))}</span>
            `
   : ""
 }
          </div>
        `;
    }
  };

  return { buildRowHtml };
}
