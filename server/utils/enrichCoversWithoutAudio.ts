// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { getAiClient, generateContentWithFallback } from "../ai.js";
import { dbGetSongs, dbUpsertSong } from "../db/repertoire.js";
import { safeParseJson } from "../utils.js";

export interface EnrichedCoverResult {
  songId: string;
  titulo: string;
  artistaOriginal?: string;
  tonalidadAnterior?: string;
  tonalidadNueva: string;
  bpmAnterior?: number;
  bpmNuevo: number;
  energiaAnterior?: number;
  energiaNueva: number;
  genero?: string;
  exito: boolean;
  motivo?: string;
}

/**
 * Busca por internet y en base de datos las tonalidades, BPMs, artista original
 * y energía de las canciones de versiones/covers que no tienen pista de audio grabada.
 */
export async function enrichMissingAudioSongsForBand(
  bandId: string
): Promise<{ totalProcesadas: number; enriquecidas: number; canciones: EnrichedCoverResult[] }> {
  const songs = await dbGetSongs(bandId);
  const aiClient = getAiClient();

  if (!songs || songs.length === 0) {
    return { totalProcesadas: 0, enriquecidas: 0, canciones: [] };
  }

  // Filtrar canciones que no tienen archivo de audio o son versiones sin bpm/tono contrastado
  const songsToEnrich = songs.filter((s: any) => {
    const hasAudio = Boolean(s.audioPrincipalUrl || s.audioUrl);
    // Si no tiene audio, o si tiene audio por defecto/mock y está marcada como versión o sin análisis
    return !hasAudio || s.esVersionCovers;
  });

  if (songsToEnrich.length === 0) {
    return { totalProcesadas: 0, enriquecidas: 0, canciones: [] };
  }

  const results: EnrichedCoverResult[] = [];

  for (const song of songsToEnrich) {
    try {
      let tonoNuevo = song.tonalidad || 'Am';
      let bpmNuevo = song.bpm || 120;
      let energiaNueva = song.energia || 14;
      let artistaOriginal = song.artista || '';
      let genero = song.genero || 'Rock';

      if (aiClient) {
        const prompt = `Eres un musicólogo experto e investigador musical. Necesitamos los datos originales de estudio para la canción/versión de rock:
Título: "${song.titulo}"
${song.artista ? `Artista de referencia: "${song.artista}"` : 'Busca el autor o banda clásica de rock original que popularizó este tema.'}

Investiga con precisión y responde ÚNICAMENTE en formato JSON con la siguiente estructura:
{
  "artistaOriginal": "Nombre de la banda/artista original (ej. Creedence Clearwater Revival, Chuck Berry, AC/DC, Rolling Stones, Fito & Fitipaldis, Leño, Queen, etc.)",
  "tonalidadOriginal": "Tonalidad estándar en notación inglesa o española (ej. E, Am, G, D, C, Em, A, Bm, Fa#m, Sol...)",
  "bpmOriginal": 128,
  "energia": 15,
  "generoRock": "Subgénero específico (ej. Rock & Roll Clásico, Hard Rock, Blues Rock, Rock Español, Punk Rock)",
  "duracionMinutosSegundos": "3:45"
}

REGLAS OBLIGATORIAS:
- El BPM debe ser un número entero realista del tempo de grabación original de estudio.
- La tonalidad debe ser la armadura estándar con la que se grabó la pista original.
- La energía debe ser un número del 1 al 20 (donde 1 es acústico introspectivo y 20 es hard rock acelerado).`;

        const aiRes = await generateContentWithFallback(aiClient, {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
            tools: [{ googleSearch: {} }]
          },
          bandId
        });

        let responseText = aiRes?.text || "";
        if (!responseText && aiRes?.candidates?.[0]?.content?.parts) {
          responseText = aiRes.candidates[0].content.parts.map((p: any) => p.text || "").join("\n");
        }

        const parsed = safeParseJson(responseText);
        if (parsed && typeof parsed === 'object') {
          if (parsed.tonalidadOriginal) tonoNuevo = String(parsed.tonalidadOriginal).trim();
          if (parsed.bpmOriginal && Number(parsed.bpmOriginal) > 40 && Number(parsed.bpmOriginal) < 250) {
            bpmNuevo = Math.round(Number(parsed.bpmOriginal));
          }
          if (parsed.energia && Number(parsed.energia) >= 1 && Number(parsed.energia) <= 20) {
            energiaNueva = Math.round(Number(parsed.energia));
          }
          if (parsed.artistaOriginal) artistaOriginal = String(parsed.artistaOriginal).trim();
          if (parsed.generoRock) genero = String(parsed.generoRock).trim();
        }
      }

      // Actualizar en base de datos
      const updatedSong = {
        ...song,
        artista: artistaOriginal || song.artista,
        tonalidad: tonoNuevo,
        bpm: bpmNuevo,
        energia: energiaNueva,
        genero: genero || song.genero,
        esVersionCovers: true,
        notasInternas: song.notasInternas
          ? (song.notasInternas.includes('BPM y tono original investigados') ? song.notasInternas : `${song.notasInternas} | [Versión Original: ${artistaOriginal || 'Rock Clásico'} - ${tonoNuevo}, ${bpmNuevo} BPM]`)
          : `[Versión Original: ${artistaOriginal || 'Rock Clásico'} - ${tonoNuevo}, ${bpmNuevo} BPM]`
      };

      await dbUpsertSong(updatedSong, bandId);

      results.push({
        songId: song.id,
        titulo: song.titulo,
        artistaOriginal,
        tonalidadAnterior: song.tonalidad,
        tonalidadNueva: tonoNuevo,
        bpmAnterior: song.bpm,
        bpmNuevo,
        energiaAnterior: song.energia,
        energiaNueva,
        genero,
        exito: true
      });
    } catch (err: any) {
      console.error(`[EnrichCovers] Error procesando "${song.titulo}":`, err);
      results.push({
        songId: song.id,
        titulo: song.titulo,
        tonalidadNueva: song.tonalidad || 'Am',
        bpmNuevo: song.bpm || 120,
        energiaNueva: song.energia || 10,
        exito: false,
        motivo: err?.message || 'Error desconocido'
      });
    }
  }

  return {
    totalProcesadas: songsToEnrich.length,
    enriquecidas: results.filter(r => r.exito).length,
    canciones: results
  };
}
