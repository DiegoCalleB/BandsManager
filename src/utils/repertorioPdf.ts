// Utilidades de generación de estilos y hojas de impresión para setlists en PDF
import type { Setlist, Song } from "../types";
import { escapeHtml } from "./escapeHtml";
import { formatItemDuration } from "./repertorioUtils";
import { SHOW_ITEM_TYPES } from "../config/defaultRepertoire";

export function getTokenValueForPrint(tokenName: string): string {
  const style =
    typeof document !== "undefined"
      ? getComputedStyle(document.documentElement)
      : null;
  return style
    ? style.getPropertyValue(tokenName).trim() || "#666666"
    : "#666666";
}

export function generatePdfStylesheet(): string {
  const bgColor = getTokenValueForPrint("--bg");
  const inkColor = getTokenValueForPrint("--ink");
  const ink2Color = getTokenValueForPrint("--ink-2");
  const ink3Color = getTokenValueForPrint("--ink-3");
  const accColor = getTokenValueForPrint("--acc");
  const okColor = getTokenValueForPrint("--ok");
  const alertColor = getTokenValueForPrint("--alert");
  const hairColor = getTokenValueForPrint("--hair");

  return `
 body {
 font-family: system-ui, -apple-system, sans-serif;
 margin: 20px;
 background: ${bgColor};
 color: ${inkColor};
 }
 .header {
 border-bottom: 4px solid ${accColor};
 padding-bottom: 15px;
 margin-bottom: 25px;
 display: flex;
 justify-content: space-between;
 align-items: center;
 }
 h1 { font-size: 32px; margin: 0; color: ${accColor}; letter-spacing: 2px; }
 .meta { font-size: 16px; font-family: monospace; color: ${ink2Color}; }
 .set-table { width: 100%; border-collapse: collapse; }
 .set-table th {
 text-align: left;
 padding: 10px;
 border-bottom: 2px solid ${ink3Color};
 font-size: 14px;
 color: ${ink2Color};
 }
 .set-table td {
 padding: 14px 10px;
 border-bottom: 1px solid ${hairColor};
 font-size: 22px;
 font-weight: bold;
 }
 .num { color: ${accColor}; width: 40px; font-family: monospace; }
 .key-badge {
 display: inline-block;
 background: ${bgColor};
 color: ${okColor};
 padding: 4px 10px;
 border-radius: 6px;
 font-size: 18px;
 font-family: monospace;
 }
 .bpm { color: ${ink2Color}; font-size: 16px; font-family: monospace; }
 .chapa { color: ${accColor}; font-style: italic; font-size: 18px; }
 .bis { color: ${alertColor}; font-size: 20px; text-align: center; }
 .note { display: block; font-size: 13px; color: ${ink3Color}; font-weight: normal; margin-top: 4px; font-style: italic; }
 .footer { margin-top: 30px; font-size: 12px; font-family: monospace; color: ${ink3Color}; text-align: center; }
 .member-note {
 display: inline-block;
 background: ${bgColor};
 color: ${inkColor};
 font-size: 11px;
 padding: 2px 7px;
 border-radius: 999px;
 font-family: monospace;
 margin-right: 6px;
 margin-top: 4px;
 }
 `;
}

export interface StageSheetMetrics {
  formattedTime: string;
  songCount: number;
  avgBpm: number;
}

export interface StageSheetOptions {
  setlist: Setlist;
  songs: Song[];
  metrics: StageSheetMetrics;
  bandDisplayName: string;
  /** CSS ya resuelto (generatePdfStylesheet): se inyecta para que esta función sea pura */
  stylesheet: string;
  colors: { ok: string; acc: string; sunken: string };
}

/**
 * Construye el HTML completo de la "Hoja de Escenario" imprimible de un setlist.
 * Función pura (sin DOM ni window): recibe todo por parámetro, así se puede testear.
 * Todo texto de usuario (títulos, notas, cues) pasa por escapeHtml.
 */
export function buildStageSetlistHtml(opts: StageSheetOptions): string {
  const { setlist, songs, metrics, bandDisplayName, stylesheet, colors } = opts;
  const band = escapeHtml(bandDisplayName.toUpperCase());

  const rows = setlist.items
    .map((it, idx) => {
      if (it.tipoItem === "cancion" && it.songId) {
        const s = songs.find((x) => x.id === it.songId);
        if (!s) return "";
        const memberNotes = Array.isArray(s.notasPorMiembro)
          ? s.notasPorMiembro
          : [];
        const memberNotesHtml =
          memberNotes.length > 0
            ? `<div style="margin-top: 4px;">${memberNotes
                .map(
                  (m) =>
                    `<span class="member-note"><b style="color: #f2ca50;">[${escapeHtml(m.instrument || m.memberName)}]:</b> ${escapeHtml(m.nota)}</span>`,
                )
                .join("")}</div>`
            : "";
        return `
  <tr>
  <td class="num">${idx + 1}</td>
  <td>
  <div style="font-size: 20px; color: #fff;">${escapeHtml(s.titulo)}</div>
  ${it.notaTema ? `<span class="note">💡 <b>CUE:</b> ${escapeHtml(it.notaTema)}</span>` : ""}
  ${memberNotesHtml}
  ${s.notasRepertorio ? `<span class="note" style="color: #93c5fd;">📝 ${escapeHtml(s.notasRepertorio)}</span>` : ""}
  </td>
  <td><span class="key-badge">${escapeHtml(it.tonalidadDeseada || s.tonalidad)}</span></td>
  <td class="bpm">${escapeHtml(s.bpm)}</td>
  <td style="font-family:monospace; font-size:16px; color:#aaa;">${escapeHtml(s.duracion)}</td>
  </tr>
  `;
      }
      if (it.tipoItem === "bloque" && it.bloqueSubtipo === "header") {
        return `
  <tr style="background:${colors.sunken}; border-top: 3px solid ${colors.acc}; border-bottom: 2px solid ${colors.acc};">
  <td colspan="5" style="color:${colors.acc}; font-size:18px; font-weight:900; letter-spacing:1px; padding: 12px 10px;">
  ${escapeHtml(it.tituloCustom || "⚡ Bloque del show")}
  </td>
  </tr>
  `;
      }
      const typeInfo = SHOW_ITEM_TYPES[it.tipoItem] || {
        label: "Evento",
        icon: "📌",
      };
      return `
  <tr style="background:#0f172a; border-left: 4px solid #38bdf8;">
  <td class="num" style="color:#38bdf8;">•</td>
  <td colspan="3" style="color:#e0f2fe; font-size:16px; font-weight:bold;">
  <span style="background:rgba(56,189,248,0.2); color:#38bdf8; padding:2px 8px; border-radius:4px; font-size:12px; font-family:monospace; margin-right:8px;">
  ${typeInfo.icon} ${escapeHtml(typeInfo.label.toUpperCase())}
  </span>
  ${escapeHtml(it.tituloCustom || "Evento del Show")}
  ${it.notaTema ? `<span class="note" style="color:#94a3b8; font-size:12px;">📋 CUE: ${escapeHtml(it.notaTema)}</span>` : ""}
  </td>
  <td style="font-family:monospace; font-size:16px; color:var(--acc); text-align:right;">${escapeHtml(formatItemDuration(it))}</td>
  </tr>
  `;
    })
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <head>
  <title>SETLIST ${band} - ${escapeHtml(setlist.nombre)}</title>
  <style>
  ${stylesheet}
  </style>
  </head>
  <body>
  <div class="header">
  <div>
  <h1>${band} — HOJA DE ESCENARIO</h1>
  <div class="meta">${escapeHtml(setlist.nombre)} (${escapeHtml(metrics.formattedTime)} • ${metrics.songCount} Temas)</div>
  </div>
  <div style="font-size:20px; font-weight:bold; color:${colors.ok}; font-family:monospace;">
  AVG BPM: ${metrics.avgBpm}
  </div>
  </div>

  <table class="set-table">
  <thead>
  <tr>
  <th style="width:40px;">#</th>
  <th>TÍTULO DEL TEMA y CUES</th>
  <th style="width:90px;">TONO</th>
  <th style="width:80px;">BPM</th>
  <th style="width:80px;">TIEMPO</th>
  </tr>
  </thead>
  <tbody>
  ${rows}
  </tbody>
  </table>

  <div class="footer">
  Hoja de Escenario Impresa • ${escapeHtml(bandDisplayName)} • Repertoire Manager
  </div>

  <script>
  window.onload = function() { window.print(); }
  </script>
  </body>
  </html>
  `;
}
