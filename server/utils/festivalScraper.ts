// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { esUrlExternaSegura } from "./ssrfGuard.js";

export async function scrapeFestivalDatesFromWikipedia(festivalName: string, ciudad?: string): Promise<{ start: string; end: string } | null> {
  try {
    const searchQuery = `${festivalName} ${ciudad || "España"} festival dates`;
    const wikiUrl = `https://es.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(festivalName)}`;

    if (!(await esUrlExternaSegura(wikiUrl))) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(wikiUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data: any = await response.json();
    if (!data.query?.search || data.query.search.length === 0) return null;

    // Obtener el primer resultado y buscar fechas en el contenido
    const firstResult = data.query.search[0];
    const snippet = firstResult.snippet || "";

    // Buscar patrones de fechas (ej: "15-18 de julio", "del 10 al 25 de agosto")
    const datePattern = /(\d{1,2})\D*?(?:al?|de)\D*?(\d{1,2})\D*?(?:de)?\D*?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i;
    const match = snippet.match(datePattern);

    if (match) {
      const [, dayStart, dayEnd, monthName] = match;
      const monthMap: { [key: string]: number } = {
        enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
        julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
      };

      const month = monthMap[monthName.toLowerCase()];
      if (month) {
        const year = new Date().getFullYear();
        return {
          start: `${year}-${String(month).padStart(2, "0")}-${String(dayStart).padStart(2, "0")}`,
          end: `${year}-${String(month).padStart(2, "0")}-${String(dayEnd).padStart(2, "0")}`
        };
      }
    }

    return null;
  } catch (err) {
    console.warn(`[FestivalScraper] Error scraping Wikipedia for "${festivalName}":`, err);
    return null;
  }
}

export async function scrapeFestivalFromFestivalesDeMusica(venueName: string): Promise<{ start: string; end: string } | null> {
  try {
    const searchUrl = `https://www.festivalesdemusica.com/buscar.php?q=${encodeURIComponent(venueName)}`;

    if (!(await esUrlExternaSegura(searchUrl))) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const html = await response.text();

    // Buscar patrón de fechas en HTML (ej: "15-18 julio" o "15 al 18 de julio")
    const dateRegex = /(\d{1,2})\s*(?:al?|-)\s*(\d{1,2})\s*(?:de)?\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi;
    const matches = [...html.matchAll(dateRegex)];

    if (matches.length > 0) {
      const [, dayStart, dayEnd, monthName] = matches[0];
      const monthMap: { [key: string]: number } = {
        enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
        julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
      };

      const month = monthMap[monthName.toLowerCase()];
      if (month) {
        const year = new Date().getFullYear();
        return {
          start: `${year}-${String(month).padStart(2, "0")}-${String(dayStart).padStart(2, "0")}`,
          end: `${year}-${String(month).padStart(2, "0")}-${String(dayEnd).padStart(2, "0")}`
        };
      }
    }

    return null;
  } catch (err) {
    console.warn(`[FestivalScraper] Error scraping festivalesdemusica.com for "${venueName}":`, err);
    return null;
  }
}
