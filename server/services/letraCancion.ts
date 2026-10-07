// Letra y acordes del audio de UNA canción, sincronizados. Lo usan la ruta manual
// (`POST /songs/:id/letra-sincronizada`) y la cola de letras en segundo plano (`colaLetras.ts`).
// La letra sale de un modelo de RECONOCIMIENTO DE VOZ (Whisper) sobre la pista de voz aislada de
// Iris (o, si no hay, la mezcla), con marcas de tiempo; los acordes, de la detección propia. Se
// fusionan por tiempo en un cifrado de texto. Nunca se genera letra a partir del título ni con un
// modelo generativo: si no se puede transcribir, se devuelve el error y no se escribe nada.

import { analizarAcordesDeCancion } from "./acordesCancion.js";
import { transcribirLetra, limpiarLineas, totalPalabras, confianzaGlobal } from "./transcripcionLetra.js";
import { construirCifradoSincronizado } from "../utils/cifradoSincronizado.js";
import { iniciarProgreso, avanzarProgreso, terminarProgreso } from "../utils/progresoOido.js";
import { analisisAcordesEnCurso } from "../utils/bloqueoOido.js";
import { getAudioSnippetPath } from "../routes/concert_to_album.js";
import { dbGetSongs, dbUpsertSong } from "../db.js";

export interface OpcionesLetra {
  sobrescribir?: boolean;
  idioma?: string;
}

export async function ejecutarLetraSincronizada(
  id: string,
  userBandId: string,
  { sobrescribir = false, idioma }: OpcionesLetra = {}
): Promise<{ status: number; body: any }> {
  const clave = `${userBandId}:${id}`;
  if (analisisAcordesEnCurso.has(clave)) {
    return { status: 409, body: { error: "Ya se está procesando el audio de esta canción." } };
  }
  analisisAcordesEnCurso.add(clave);
  iniciarProgreso(clave, "letra", "Preparando la canción…");
  let status = 200;
  try {
    const respuesta = await transcribirYGuardar(id, userBandId, clave, sobrescribir, idioma);
    status = respuesta.status;
    return respuesta;
  } catch (err: any) {
    console.error("Error en letra-sincronizada:", err);
    status = 500;
    return { status, body: { error: err?.message || "No se pudo procesar la letra." } };
  } finally {
    terminarProgreso(clave, status >= 400 ? "No se pudo completar" : undefined);
    analisisAcordesEnCurso.delete(clave);
  }
}

async function transcribirYGuardar(
  id: string,
  userBandId: string,
  clave: string,
  sobrescribir: boolean,
  idioma?: string
): Promise<{ status: number; body: any }> {
  const songs = await dbGetSongs(userBandId);
  const song = Array.isArray(songs) ? songs.find((s: any) => s.id === id) : null;
  if (!song) return { status: 404, body: { error: "Canción no encontrada." } };

  // Un cifrado escrito por la banda no se sustituye sin confirmación (y no se gasta transcripción).
  if (song.cifradoTexto && String(song.cifradoTexto).trim() && !sobrescribir) {
    return {
      status: 409,
      body: { yaTieneCifrado: true, error: "Esta canción ya tiene un cifrado guardado. Transcribir desde el audio lo sustituiría." },
    };
  }

  avanzarProgreso(clave, "voz", "Buscando la pista de voz aislada (si no hay, se usa la mezcla)…");
  const urlVoz = (song.audioIdeas ?? [])
    .flatMap((i: any) => i.pistas ?? [])
    .find((p: any) => /^(voz|vocals?|voice)\b/i.test(p?.nombre || "") && p?.audioUrl)?.audioUrl;
  const urlMezcla = song.audioPrincipalUrl || song.audioUrl || song.audioIdeas?.find((i: any) => i.audioUrl)?.audioUrl;
  const urlLetra: string | undefined = urlVoz || urlMezcla;
  if (!urlLetra) {
    return {
      status: 400,
      body: { error: "Sin audio no se puede transcribir la letra, y no voy a inventarla. Sube el audio de la canción, o escribe/pega el cifrado." },
    };
  }
  const fuenteLetra: "voz" | "mezcla" = urlVoz ? "voz" : "mezcla";

  // Acordes: los ya detectados (con correcciones) o un análisis nuevo. Si fallan, la letra sigue.
  let analisis = song.analisisAcordes as any;
  let avisoAcordes: string | undefined;
  if (!analisis) {
    const r = await analizarAcordesDeCancion(song, (e, d) => avanzarProgreso(clave, e, d));
    if (r.ok === true) analisis = r.analisis;
    else avisoAcordes = (r as { error: string }).error;
  }

  avanzarProgreso(clave, "transcribir", fuenteLetra === "voz" ? "Escuchando la voz y escribiendo la letra con sus tiempos…" : "Escuchando la mezcla completa y escribiendo la letra (mejor con la voz aislada)…");
  let transcripcion;
  try {
    transcripcion = await transcribirLetra(urlLetra, {
      idioma,
      // Para APIs que reciben el fichero (OpenAI): mp3 mono recortado, descargado con la guardia SSRF.
      archivoLocal: () => getAudioSnippetPath({ audioUrl: urlLetra, allowSyntheticFallback: false, maxSeconds: 600 }),
    });
  } catch (err: any) {
    console.error("[letra-sincronizada] Transcripción fallida:", err?.message || err);
    return { status: 502, body: { error: `No se pudo transcribir la letra: ${err?.message || "error del servicio de voz"}. No se ha modificado nada.` } };
  }

  const lineas = limpiarLineas(transcripcion.lineas);
  if (totalPalabras(lineas) < 8) {
    return {
      status: 422,
      body: {
        letraConfianza: "sin_letra",
        error: "No se oye una letra inteligible en este audio (¿instrumental, o voz muy tapada?). No se ha escrito ninguna letra.",
      },
    };
  }

  avanzarProgreso(clave, "unir", "Colocando cada acorde sobre su palabra…");
  const cifradoTexto = construirCifradoSincronizado(lineas, analisis?.segmentos ?? []);
  const letraConfianza = confianzaGlobal(lineas, fuenteLetra);
  const analisisFinal = analisis
    ? {
        ...analisis,
        letra: {
          fuente: fuenteLetra,
          modelo: transcripcion.modelo,
          idioma: transcripcion.idioma,
          transcritaEn: new Date().toISOString(),
          lineas: lineas.slice(0, 400).map((l) => ({ t0: l.t0, t1: l.t1, texto: l.texto })),
        },
      }
    : undefined;

  const guardada = await dbUpsertSong(
    {
      ...song,
      cifradoTexto,
      guiaSustituto: { ...(song.guiaSustituto || {}), origenCifrado: "audio_real", cifradoAproximado: true, letraConfianza },
      ...(analisisFinal ? { analisisAcordes: analisisFinal } : {}),
    },
    userBandId
  );

  return {
    status: 200,
    body: {
      success: true,
      cifradoTexto,
      letraConfianza,
      fuenteLetra,
      idioma: transcripcion.idioma,
      modelo: transcripcion.modelo,
      lineas: lineas.length,
      conAcordes: Boolean(analisis),
      avisoAcordes,
      analisis: analisisFinal ?? analisis ?? null,
      song: guardada,
    },
  };
}
