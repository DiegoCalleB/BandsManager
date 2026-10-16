import { BandContact } from "../types";
import { escapeHtml } from "../utils/escapeHtml";
import { spotifyArtistUrl } from "../utils/spotifyEmbed";

/** Colores de tema y estilo de estado con los que se pinta el popup del mapa. */
export interface ColoresPopupBanda {
  ink: string;
  ink2: string;
  acc: string;
  surface: string;
  badge: { bg: string; color: string; text: string };
}

/**
 * HTML del popup de una banda en el mapa. Va en un módulo aparte para que BandMap no crezca más
 * (AGENTS.md §5.6). `puedeEscuchar`: la banda tiene preview de 30 s en el reproductor.
 */
export function htmlPopupBanda(band: BandContact, c: ColoresPopupBanda, puedeEscuchar: boolean): string {
  const { ink: inkColor, ink2: ink2Color, acc: accColor, surface: surfaceColor, badge: badgeCfg } = c;
  return ` <div style="font-family: system-ui, sans-serif;">
 <div style="font-size: 14px; font-weight: 800; color: ${inkColor}; margin-bottom: 2px;">
 ${escapeHtml(band.nombre_banda)}
 </div>
 <div style="font-size: 11px; color: ${ink2Color}; margin-bottom: 6px;">
 📍 ${escapeHtml(band.localizacion)}
 </div>
 <div style="font-size: 11px; font-weight: 600; color: ${accColor}; margin-bottom: 8px;">
 🎵 ${escapeHtml(band.estilo_musical)}
 ${spotifyArtistUrl(band.spotify_youtube) ? `· <a href="${escapeHtml(spotifyArtistUrl(band.spotify_youtube) || '')}" target="_blank" rel="noopener noreferrer" style="color: ${accColor};">Spotify ↗</a>` : ''}
 </div>
 ${
   puedeEscuchar
     ? `
 <div style="margin-bottom: 8px;">
 <button id="pop-band-play-${band.id}" style="
 width: 100%;
 background: ${accColor};
 color: ${surfaceColor};
 padding: 6px 10px;
 border-radius: 999px;
 font-size: 11px;
 font-weight: bold;
 font-family: monospace;
 cursor: pointer;
 display: flex;
 align-items: center;
 justify-content: center;
 gap: 4px;">
 ▶ Escuchar preview (30 s)
 </button>
 </div>
 `
     : ""
 }
 <div style="margin-bottom: 8px;">
 <span style="
 background: ${badgeCfg.bg};
 color: ${badgeCfg.color};
 font-size: 10px;
 font-family: monospace;
 font-weight: 700;
 padding: 2px 8px;
 border-radius: 6px;
 display: inline-block;">
 ${badgeCfg.text}
 </span>
 </div>
 ${
   band.contacto_nombre
     ? `
 <div style="font-size: 11px; color: ${inkColor}; margin-bottom: 4px;">
 👤 <strong>Contacto:</strong> ${escapeHtml(band.contacto_nombre)}
 </div>
 `
     : ""
 }
 ${
   band.email
     ? `
 <div style="font-size: 10px; font-family: monospace; color: ${accColor}; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis;">
 ✉️ ${escapeHtml(band.email)}
 </div>
 `
     : ""
 }
 <div style="margin-top: 10px;">
 <button id="pop-band-select-${band.id}" style="
 width: 100%;
 background: ${surfaceColor};
 color: ${accColor};
 padding: 6px 10px;
 border-radius: 8px;
 font-size: 11px;
 font-weight: bold;
 font-family: monospace;
 cursor: pointer;
 display: flex;
 align-items: center;
 justify-content: center;
 gap: 4px;">
 📋 Ver Ficha Técnica
 </button>
 </div>
 </div>`;
}
