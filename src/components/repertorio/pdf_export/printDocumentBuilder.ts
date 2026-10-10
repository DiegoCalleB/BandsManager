import { buildHeaderFooter } from "./buildHeaderFooter";
import { buildPrintScripts } from "./buildPrintScripts";
import { buildPrintStyles } from "./buildPrintStyles";
import { buildRowHtmlFactory } from "./buildRowHtmlFactory";
/**
 * doc
 * Extraído de PdfExportModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Setlist, Song } from "../../../types";
import { escapeHtml } from "../../../utils/escapeHtml";
import { BandMemberOption } from "../../../utils/repertorioUtils";
import { cleanSetlistName } from "../../../utils/setlistNoteText";
import { ItemKind, maxFontPtForWidth, planPages } from "../../../utils/setlistPaginator";
import { makeCanvasMeasurer, mmToPx } from "../../../utils/textFit";
import type { SetlistStylePreset } from "./printLayout";
import { AUTO_COLUMNS_MIN_SONGS, COLUMN_WIDTH_PX, COMFORT_TITLE_FONT_PT, ensurePrintFonts, FLOOR_TITLE_FONT_PT, MAX_DESIGN_TITLE_FONT_PT, MIN_TITLE_FONT_PT, PAGE_CONTENT_WIDTH_PX, PAGE_SHEET_HEIGHT_MM, PRINT_FONTS_URL, PrintDocument } from "./printLayout";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface PrintDocumentBuilderParams {
  handwritingFont: "caveat" | "permanent_marker" | "courier" | "sans";
  handwritingColor: "blue" | "black" | "red" | "purple";
  membersToExport: BandMemberOption[];
  stylePreset: SetlistStylePreset;
  activeSetlist: Setlist;
  songs: Song[];
  showGeneralNotes: boolean;
  showSongNumbers: boolean;
  markedSongs: Record<string, string[]>;
  showTonality: boolean;
  badgesScope: "all" | "marked";
  showBpm: boolean;
  showDuration: boolean;
  showSetlistNotes: boolean;
  isCentered: boolean;
  showBandLogo: boolean;
  customLogoUrl: string;
  bandName: string;
  showAppBranding: boolean;
  columnsChoice: 2 | "auto" | 1;
  pagesChoice: 2 | "auto" | 1 | 3;
  showWatermark: boolean;
}

/**
 * doc
 * @param params Estado y callbacks del contenedor ({@link PrintDocumentBuilderParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
/**
 * Genera el documento HTML de impresión/vista previa del setlist con los ajustes dados.
 * @param ctx Ajustes de diseño, datos del setlist y banda ({@link PrintDocumentBuilderParams}).
 * @param opts Miembros a imprimir y modo (`print` abre la ventana de impresión, `preview` rellena el iframe).
 * @returns El documento y la información de hojas, o `null` si no hay entorno de navegador.
 */
export async function buildPrintDocument(
  { handwritingFont, handwritingColor, membersToExport, stylePreset, activeSetlist, songs, showGeneralNotes, showSongNumbers, markedSongs, showTonality, badgesScope, showBpm, showDuration, showSetlistNotes, isCentered, showBandLogo, customLogoUrl, bandName, showAppBranding, columnsChoice, pagesChoice, showWatermark }: PrintDocumentBuilderParams,
  opts: {
    members: BandMemberOption[];
    mode: "print" | "preview";
  },
): Promise<PrintDocument | null> {
// Font helper mappings
const getHandwritingFontFamily = () => {
  switch (handwritingFont) {
    case "caveat":
      return "'Caveat', cursive, sans-serif";
    case "permanent_marker":
      return "'Permanent Marker', cursive, sans-serif";
    case "courier":
      return "'Courier Prime', monospace";
    default:
      return "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  }
};

const getInkColorHex = () => {
  switch (handwritingColor) {
    case "blue":
      return "#0038a8"; // Classic Pilot Blue / Sharpie Blue
    case "black":
      return "#111827";
    case "red":
      return "#dc2626";
    case "purple":
      return "#7c3aed";
    default:
      return "#0038a8";
  }
};

// Genera el HTML de impresión: mide cada fila en un iframe oculto, deja que setlistPaginator.ts
// decida hojas, letra y cortes, y abre la ventana de impresión.
  // Si el usuario imprime justo tras abrir el modal, las fuentes web (Anton/Oswald/Caveat) del
  // documento de la app podrían no haber terminado de cargar todavía — el canvas measurer de
  // abajo mediría con la fuente de reserva del sistema (más ancha), haciendo que el título
  //"parezca" ocupar más sitio del real y forzando el modo'below' o el truncado con más
  // frecuencia de la necesaria, lo que infla la altura calculada de cada fila.
  if (typeof document !== "undefined") {
    await ensurePrintFonts(document);
  }

  const measure = makeCanvasMeasurer();
  const noteMinFontSizePx = 11;
  const inkColor = getInkColorHex();
  const handFont = getHandwritingFontFamily();
  const titleFontFamily =
    stylePreset === "rock_stage"
      ? "'Anton', 'Oswald', sans-serif"
      : "'Oswald', sans-serif";

  const { buildRowHtml } = buildRowHtmlFactory({ activeSetlist, membersToExport, songs, showGeneralNotes, showSongNumbers, markedSongs, showTonality, badgesScope, showBpm, showDuration, showSetlistNotes, titleFontFamily, handFont, noteMinFontSizePx, measure, isCentered, inkColor });

  const { printCss } = buildPrintStyles({ stylePreset, inkColor, showSongNumbers, handFont });

  const { buildHeaderHtml, buildFooterHtml } = buildHeaderFooter({ membersToExport, isCentered, showBandLogo, customLogoUrl, bandName, activeSetlist, showAppBranding });

  // Maquetación (ver setlistPaginator.ts): mide la altura REAL del contenido en un iframe
  // oculto (aislado del resto de la app — un <div> con <style> inyectado contaminaría los
  // estilos globales) para decidir, por cada hoja de miembro, el mayor tamaño de título que
  // hace que el repertorio quepa en una sola página — y si ni el mínimo cabe, en cuántas
  // páginas repartirlo y qué canciones va en cada una.
  const measureFrame = document.createElement("iframe");
  // Dimensiones reales (no 0x0): algunos navegadores — sobre todo Chrome en Android — no
  // calculan el layout interno de un iframe de tamaño cero con fiabilidad, y acaban midiendo
  // con un viewport por defecto en vez del ancho real que le pasamos al contenido. Se mantiene
  // fuera de la pantalla visible con left/top muy negativos en vez de con tamaño cero.
  measureFrame.style.cssText = `position:fixed;left:-99999px;top:-99999px;width:${PAGE_CONTENT_WIDTH_PX + 40}px;height:3000px;visibility:hidden;`;
  document.body.appendChild(measureFrame);

  const measureDoc = measureFrame.contentDocument;
  if (!measureDoc) {
    document.body.removeChild(measureFrame);
    return null;
  }
  // El documento del iframe se escribe UNA sola vez (con las mismas Google Fonts que la
  // impresión real) y se espera a que carguen antes de medir nada — si no, todas las
  // mediciones se harían con la fuente de reserva del sistema (más ancha que Anton/Oswald,
  // que son condensadas), lo que sobreestima cuánto ocupa cada fila y hace que el algoritmo
  // decida más páginas de las que realmente hacen falta. Las mediciones posteriores solo
  // cambian el innerHTML de un contenedor reusable (#measure-target) en vez de reescribir
  // todo el documento cada vez — recargarlo por medición sería lentísimo y volvería a perder
  // las fuentes ya cargadas.
  measureDoc.open();
  measureDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link id="measure-fonts-link" href="${PRINT_FONTS_URL}" rel="stylesheet">
          <style>${printCss}</style>
        </head>
        <body><div id="measure-target"></div></body>
      </html>
    `);
  measureDoc.close();
  // Esperar solo a `fonts.ready` no basta: si en ese momento el navegador aún no ha
  // descargado/parseado la hoja de estilos externa del <link> de Google Fonts, esa promesa
  // puede resolver de inmediato sin haber registrado ninguna fuente todavía. Por eso primero
  // se espera a que el <link> termine de cargar (evento load/error, con timeout de seguridad
  // por si falla la red) y solo entonces a fonts.ready.
  const fontsLink = measureDoc.getElementById("measure-fonts-link");
  if (fontsLink) {
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      fontsLink.addEventListener("load", done, { once: true });
      fontsLink.addEventListener("error", done, { once: true });
      setTimeout(done, 2000);
    });
  }
  await ensurePrintFonts(measureDoc);
  const measureTarget = measureDoc.getElementById("measure-target");

  const measureHtmlHeightPx = (bodyHtml: string): number => {
    if (!measureTarget) return 0;
    measureTarget.innerHTML = bodyHtml;
    const el = measureTarget.firstElementChild as HTMLElement | null;
    return el ? el.getBoundingClientRect().height : 0;
  };

  // Alto total de la hoja menos su padding (2px arriba + 2px abajo): el alto útil real de cada
  // miembro sale de restarle su cabecera y su pie medidos.
  const PAGE_TOTAL_HEIGHT_PX = mmToPx(PAGE_SHEET_HEIGHT_MM) - 4;

  // Motor de maquetación (setlistPaginator.ts): reparte TODOS los items (canciones, bloques e
  // interludios), no solo canciones, así que un encabezado nunca se pierde en un corte.
  const items = activeSetlist.items;
  const itemKinds: ItemKind[] = items.map((it) =>
    it.tipoItem === "cancion"
      ? "song"
      : it.tipoItem === "bloque" && it.bloqueSubtipo === "header"
        ? "header"
        : it.tipoItem === "bloque" && it.bloqueSubtipo === "bis"
          ? "bis"
          : "other",
  );
  let songCounter = 0;
  const songNumberByItem = items.map((it) =>
    it.tipoItem === "cancion" ? songCounter++ : -1,
  );
  // Techo de letra por anchura: los títulos (con su número) deben caber en una línea... salvo los
  // más largos. Un solo "THE HOUSE OF THE RISING SON // A WHITER SHADE OF PALE" no puede hundir
  // la letra de las otras 24 canciones: se ignora el ~10 % más ancho (y un atípico claro), que
  // baja a dos líneas; esa altura extra la mide el motor como cualquier otra fila.
  const titleWidthsAt100 = items
    .map((it) => {
      const s = it.tipoItem === "cancion" ? songs.find((x) => x.id === it.songId) : undefined;
      return s ? measure(s.titulo.toUpperCase(), 100, titleFontFamily, 900) : 0;
    })
    .sort((a, b) => b - a);
  const outliersToSkip = Math.min(
    Math.max(0, titleWidthsAt100.length - 1),
    Math.floor(titleWidthsAt100.length * 0.1) +
      (titleWidthsAt100.length > 1 && titleWidthsAt100[0] > 1.3 * titleWidthsAt100[1] ? 1 : 0),
  );
  const widestTitleAt100 = titleWidthsAt100[outliersToSkip] ?? 0;
  const numberAt100 = showSongNumbers
    ? measure(`${songCounter}.`, 100 * (22 / 28), "Oswald, sans-serif", 800)
    : 0;
  // Ancho que se llevan tono/BPM/duración en su columna de la derecha (modo izquierda).
  const badgesReservePx =
    (showTonality ? 34 : 0) + (showBpm ? 74 : 0) + (showDuration ? 46 : 0) + (showTonality || showBpm || showDuration ? 14 : 0);
  const maxFontFor = (cols: 1 | 2) =>
    Math.min(
      MAX_DESIGN_TITLE_FONT_PT,
      maxFontPtForWidth(
        widestTitleAt100 + numberAt100,
        (cols === 2 ? COLUMN_WIDTH_PX : PAGE_CONTENT_WIDTH_PX) * 0.96 - badgesReservePx,
      ),
    );
  // `in-columns` va en la propia fila medida: las reglas que cambian la altura no pueden colgar
  // de un ancestro que el iframe de medición no tiene.
  const containerClassFor = (cols: 1 | 2) =>
    `setlist-items-container ${isCentered ? "is-centered" : ""} ${cols === 2 ? "in-columns" : ""}`;

  const memberPlans = opts.members.map((member) => {
    const isMaster = member.id === "master";
    const headerHeightPx = measureHtmlHeightPx(
      `<div style="width:${PAGE_CONTENT_WIDTH_PX}px;display:flow-root">${buildHeaderHtml(member, isMaster)}</div>`,
    );
    // El texto exacto del pie ("Hoja X de Y") no cambia su alto, basta con relleno.
    const footerHeightPx = showAppBranding
      ? measureHtmlHeightPx(
          `<div style="width:${PAGE_CONTENT_WIDTH_PX}px;display:flow-root">${buildFooterHtml(member, 1, 1)}</div>`,
        )
      : 0;
    // 6px de colchón: el redondeo de subpíxel de la impresión no debe empujar una fila fuera.
    const pageAvailableHeightPx =
      PAGE_TOTAL_HEIGHT_PX - headerHeightPx - footerHeightPx - 6;

    const heightsAtFor = (cols: 1 | 2) => (titleFontPt: number) =>
      items.map((item, i) =>
        measureHtmlHeightPx(
          `<div class="${containerClassFor(cols)}" style="width:${cols === 2 ? COLUMN_WIDTH_PX : PAGE_CONTENT_WIDTH_PX}px">${buildRowHtml(item, songNumberByItem[i], titleFontPt, member, isMaster, cols)}</div>`,
        ),
      );
    const planFor = (cols: 1 | 2, forcedPages?: number) =>
      planPages({
        kinds: itemKinds,
        heightsAt: heightsAtFor(cols),
        availableHeightPx: pageAvailableHeightPx,
        minFontPt: MIN_TITLE_FONT_PT,
        comfortFontPt: COMFORT_TITLE_FONT_PT,
        columns: cols,
        maxFontPt: maxFontFor(cols),
        floorFontPt: FLOOR_TITLE_FONT_PT,
        forcedPages,
      });
    // 1 o 2 columnas. En automático, 2 columnas solo si el set es largo y aportan algo claro:
    // menos hojas con letra legible, o las mismas hojas con letra bastante mayor.
    const resolveLayout = (forcedPages?: number): { cols: 1 | 2; plan: ReturnType<typeof planFor> } => {
      if (columnsChoice === 1 || columnsChoice === 2) {
        return { cols: columnsChoice, plan: planFor(columnsChoice, forcedPages) };
      }
      const one = planFor(1, forcedPages);
      if (songCounter < AUTO_COLUMNS_MIN_SONGS) return { cols: 1, plan: one };
      const two = planFor(2, forcedPages);
      const better =
        (two.pages.length < one.pages.length && two.fontPt >= MIN_TITLE_FONT_PT + 2) ||
        (two.pages.length === one.pages.length && two.fontPt >= one.fontPt + 3);
      return better ? { cols: 2, plan: two } : { cols: 1, plan: one };
    };
    const forcedPages = pagesChoice === "auto" ? undefined : pagesChoice;
    const { cols, plan } = resolveLayout(forcedPages);
    // Para la etiqueta "Auto (N páginas)" del selector: cuántas hojas elegiría el motor solo.
    const autoPages =
      opts.mode === "preview" && forcedPages
        ? resolveLayout().plan.pages.length
        : plan.pages.length;
    // Con las columnas fijadas por el usuario y letra pequeña, se calcula la otra opción para
    // poder sugerirla en el modal ("con 2 columnas: 18 pt"). Solo en la vista previa.
    let alt: { cols: 1 | 2; fontPt: number; pages: number } | undefined;
    if (opts.mode === "preview" && (columnsChoice === 1 || columnsChoice === 2) && plan.fontPt < MIN_TITLE_FONT_PT) {
      const otherCols: 1 | 2 = columnsChoice === 1 ? 2 : 1;
      const other = planFor(otherCols, forcedPages);
      alt = { cols: otherCols, fontPt: other.fontPt, pages: other.pages.length };
    }
    return { member, isMaster, plan, cols, autoPages, alt };
  });

  document.body.removeChild(measureFrame);

  const totalSheets = memberPlans.reduce((sum, mp) => sum + mp.plan.pages.length, 0);

  // Resolver URLs relativas a absolutas para que funcionen en la ventana de impresión
  // Usar window.location.origin + ruta si es relativa, sino usar URL tal cual
  const absoluteLogoUrl = customLogoUrl?.trim()
    ? customLogoUrl.startsWith("http")
      ? customLogoUrl
      : `${window.location.origin}${customLogoUrl.startsWith("/") ? "" : "/"}${customLogoUrl}`
    : null;

  // Marca de agua: el logo del grupo en alta resolución (la misma imagen original que la
  // cabecera, no una miniatura reescalada) si hay uno subido y activo; si no, el nombre del
  // grupo como texto de respaldo. Si la imagen falla en cargar (404, CORS, etc.), el onerror
  // reemplaza todo el contenedor con el nombre como fallback.
  // Importante: HTML no entiende \" como escape (eso es solo JS) — dentro de un atributo
  // delimitado por comillas dobles, un \" corta el atributo en esa comilla real y deja el
  // resto del código como texto suelto visible en la página (bug real: al fallar la carga
  // del logo, aparecía literalmente `'" />` como texto en la hoja). Las comillas dobles del
  // HTML embebido en el onerror deben ir como entidad &quot;, y cualquier apóstrofe del
  // nombre del grupo debe escaparse para no romper el string JS (delimitado por comillas
  // simples) del propio onerror.
  const watermarkInnerHtml =
    showBandLogo && absoluteLogoUrl
      ? `<img src="${escapeHtml(absoluteLogoUrl)}" alt="" class="page-watermark-logo" data-fallback="${escapeHtml(bandName.toUpperCase())}" onerror="var d=document.createElement('div');d.className='page-watermark-text';d.textContent=this.dataset.fallback;this.parentElement.replaceChildren(d)" />`
      : `<div class="page-watermark-text">${escapeHtml(bandName.toUpperCase())}</div>`;

  let sheetIdx = 0;
  const pagesHtml = memberPlans
    .map(({ member, isMaster, plan, cols }) =>
      plan.pages
        .map((page, pageIdx) => {
          sheetIdx++;
          const columnHtml = (col: { from: number; to: number; rowGapPx: number }, widthPx?: number) => `
                <div class="${containerClassFor(cols)}" style="${widthPx ? `width:${widthPx}px;` : ""}gap:${col.rowGapPx.toFixed(1)}px">
                  ${items
                    .slice(col.from, col.to)
                    .map((item, k) =>
                      buildRowHtml(item, songNumberByItem[col.from + k], plan.fontPt, member, isMaster, cols),
                    )
                    .join("")}
                </div>`;
          const bodyHtml =
            page.columns.length > 1
              ? `<div class="setlist-columns"><div class="setlist-columns-row">${page.columns
                  .map((col) => columnHtml(col, COLUMN_WIDTH_PX))
                  .join('<div class="col-divider"></div>')}</div></div>`
              : columnHtml(page.columns[0]);
          return `
              <div class="sheet-page ${sheetIdx !== totalSheets ? "page-break" : ""}">
                ${showWatermark ? `<div class="page-watermark">${watermarkInnerHtml}</div>` : ""}
                ${buildHeaderHtml(member, isMaster)}
                ${bodyHtml}
                ${buildFooterHtml(member, pageIdx + 1, plan.pages.length)}
              </div>
            `;
        })
        .join(""),
    )
    .join("");

  const { previewCss, previewScript, printScript } = buildPrintScripts();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(bandName)} - Setlist ${escapeHtml(cleanSetlistName(activeSetlist.nombre))}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@600;700&family=Permanent+Marker&family=Courier+Prime:wght@700&family=Oswald:wght@600;700;800&display=swap" rel="stylesheet">
        <style>${printCss}${opts.mode === "preview" ? previewCss : ""}</style>
      </head>
      <body>
        ${pagesHtml}
        ${opts.mode === "preview" ? previewScript : printScript}
</body>
</html>`;
  return {
    html,
    layouts: memberPlans.map(({ member, plan, autoPages, alt }) => ({
      memberId: member.id,
      pages: plan.pages.length,
      fontPt: plan.fontPt,
      autoPages,
      alt,
    })),
  };
}
