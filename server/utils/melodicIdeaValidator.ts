// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

/**
 * Validador y reparador de las secuencias de notas que compone Gemini para 'propose_melodic_idea'
 * (server/routes/chat.ts).
 *
 * Por qué existe: el prompt PIDE notas en escala, en el registro del instrumento y dentro de la
 * duración pedida, pero nada lo comprobaba. Y un fallo aquí no es ruidoso: Tone.js convierte un
 * nombre de nota inválido en NaN sin lanzar excepción, así que una alucinación del modelo llegaba
 * al navegador, se sintetizaba como un hueco mudo y el usuario veía una función rota sin ninguna
 * pista de por qué. Peor todavía: una nota fuera del registro real del instrumento suena, así que
 * ni siquiera se nota que está mal, solo suena poco creíble.
 *
 * Criterio de reparación: se descarta lo irrecuperable (un nombre de nota que no existe) y se
 * repara lo que sí tiene arreglo musical (transportar por octavas al registro del instrumento,
 * encajar en la escala declarada, recortar a los compases disponibles). Devolver menos notas pero
 * correctas es mejor que devolver las que pidió el modelo y que suenen desafinadas.
 *
 * Lógica pura y sin dependencias a propósito, para poder testearla sin montar Express ni Web Audio
 * (mismo estilo que server/utils/bandAccess.ts y server/utils/musicalDna.ts).
 */
import type { MelodicInstrument, MelodicNoteEvent } from "../../src/types.js";
import { notaAMidi, midiANota, CLASE_POR_LETRA } from "../../src/utils/musicTheory.js";

// Re-exportadas porque el exportador MIDI del navegador y este validador comparten la misma
// conversión (ver src/utils/musicTheory.ts), pero los tests de este módulo las cubren aquí.
export { notaAMidi, midiANota };

export interface ResultadoValidacion {
  eventos: MelodicNoteEvent[];
  /** Resumen legible de lo que hubo que arreglar. Vacío = el modelo lo devolvió bien. */
  reparaciones: string[];
}

/** Tope de eventos por idea: por encima deja de ser una idea con gancho y es ruido. */
const MAX_EVENTOS = 64;

/**
 * Registro real de cada instrumento, en MIDI. Una nota fuera de aquí no es "otra opción": es una
 * nota que ese instrumento físicamente no da, y sintetizarla delata la maqueta.
 */
const REGISTRO: Record<MelodicInstrument, { min: number; max: number }> = {
  guitarra: { min: 52, max: 76 },  // E3 - E5
  violin: { min: 55, max: 81 },    // G3 - A5
  handpan: { min: 50, max: 74 },   // D3 - D5
  percusion: { min: 36, max: 48 }  // C2 - C3
};

const ESCALA_MAYOR = [0, 2, 4, 5, 7, 9, 11];
const ESCALA_MENOR = [0, 2, 3, 5, 7, 8, 10];
// Los handpan reales están afinados a una pentatónica, no a la escala completa de 7 notas.
const PENTATONICA_MAYOR = [0, 2, 4, 7, 9];
const PENTATONICA_MENOR = [0, 3, 5, 7, 10];

/**
 * La percusión no toca alturas cromáticas: da golpes con timbre grave, medio y agudo. Se encaja
 * a esos tres para que suene a instrumento de percusión y no a tom afinado tocando una melodía.
 */
const GOLPES_PERCUSION = [36, 43, 48]; // C2, G2, C3

/**
 * Acepta tanto la nomenclatura española que usa el chatbot ('La', 'Fa#m') como la inglesa que
 * puede venir en Song.tonalidad del repertorio ('Am', 'C#m', 'G'), porque la idea puede tomar la
 * tonalidad de una canción real o del ADN musical de la banda, y cada fuente escribe distinto.
 */
export function parseTonalidad(keyName: string): { clase: number; esMenor: boolean } {
  const limpio = (keyName || "").trim();
  if (!limpio) return { clase: 9, esMenor: false }; // La, el mismo defecto que musicalDna

  // Las españolas primero y de más larga a más corta: 'Sol' antes que 'Si' para que "Sol" no
  // se lea como "S"+resto, y 'Do'/'Re'/'Mi'/'Fa'/'La' antes de caer a la letra inglesa suelta.
  const ESPANOLAS: [string, number][] = [
    ["sol", 7], ["do", 0], ["re", 2], ["mi", 4], ["fa", 5], ["la", 9], ["si", 11]
  ];

  const lower = limpio.toLowerCase();
  let clase: number | null = null;
  let resto = "";

  for (const [nombre, valor] of ESPANOLAS) {
    if (lower.startsWith(nombre)) {
      clase = valor;
      resto = limpio.slice(nombre.length);
      break;
    }
  }

  if (clase === null) {
    const letra = limpio[0]?.toUpperCase();
    if (letra && CLASE_POR_LETRA[letra] !== undefined) {
      clase = CLASE_POR_LETRA[letra];
      resto = limpio.slice(1);
    }
  }

  if (clase === null) return { clase: 9, esMenor: false };

  const restoLimpio = resto.trim();
  if (restoLimpio.startsWith("#")) clase = (clase + 1) % 12;
  else if (restoLimpio.startsWith("b")) clase = (clase + 11) % 12;

  // 'm', 'min', 'menor' marcan menor; 'Maj'/'may' son mayor explícito. Ojo: hay que mirar lo que
  // queda DESPUÉS de la alteración, si no "Mim" (Mi menor) y "Mi" se leerían igual.
  const sufijo = restoLimpio.replace(/^[#b]/, "").trim().toLowerCase();
  const esMenor = sufijo.startsWith("m") && !sufijo.startsWith("maj") && !sufijo.startsWith("may");

  return { clase, esMenor };
}

function gradosDeEscala(instrument: MelodicInstrument, esMenor: boolean): number[] {
  if (instrument === "handpan") return esMenor ? PENTATONICA_MENOR : PENTATONICA_MAYOR;
  return esMenor ? ESCALA_MENOR : ESCALA_MAYOR;
}

/** Encaja una nota en la escala moviéndola al grado más cercano (empate: hacia abajo). */
function encajarEnEscala(midi: number, claseTonica: number, grados: number[]): number {
  const intervalo = ((midi - claseTonica) % 12 + 12) % 12;
  if (grados.includes(intervalo)) return midi;

  let mejor = grados[0];
  let mejorDistancia = Infinity;
  for (const grado of grados) {
    // Se mide también por el otro lado de la octava: para un intervalo de 11, el grado 0 está a
    // distancia 1 (subiendo), no a 11.
    const distancia = Math.min(Math.abs(grado - intervalo), 12 - Math.abs(grado - intervalo));
    if (distancia < mejorDistancia) {
      mejorDistancia = distancia;
      mejor = grado;
    }
  }

  const diferencia = ((mejor - intervalo) % 12 + 12) % 12;
  return diferencia <= 6 ? midi + diferencia : midi + diferencia - 12;
}

/** Sube o baja octavas hasta meter la nota en el registro, sin cambiarle la clase de altura. */
function transportarAlRegistro(midi: number, min: number, max: number): number {
  let resultado = midi;
  while (resultado < min) resultado += 12;
  while (resultado > max) resultado -= 12;
  // Un registro más estrecho que una octava (percusión) puede dejar la nota fuera igualmente.
  return Math.max(min, Math.min(max, resultado));
}

function masCercano(valor: number, opciones: number[]): number {
  return opciones.reduce((mejor, op) => (Math.abs(op - valor) < Math.abs(mejor - valor) ? op : mejor), opciones[0]);
}

export function validarYRepararEventos(
  eventosCrudos: unknown,
  opts: {
    instrument: MelodicInstrument;
    keyName: string;
    escala?: "mayor" | "menor";
    bpm: number;
    durationSecs: number;
  }
): ResultadoValidacion {
  const reparaciones: string[] = [];

  if (!Array.isArray(eventosCrudos)) {
    return { eventos: [], reparaciones: ["La IA no devolvió una lista de notas."] };
  }

  const registro = REGISTRO[opts.instrument] || REGISTRO.guitarra;
  const { clase: claseTonica, esMenor: menorPorTonalidad } = parseTonalidad(opts.keyName);
  // 'escala' explícita manda; si no viene, se deduce del propio nombre de la tonalidad ("Lam").
  const esMenor = opts.escala ? opts.escala === "menor" : menorPorTonalidad;
  const grados = gradosDeEscala(opts.instrument, esMenor);

  const bpm = Math.max(40, Math.min(220, Number(opts.bpm) || 100));
  const duracion = Math.max(4, Math.min(120, Number(opts.durationSecs) || 20));
  const totalBeats = (duracion / 60) * bpm;

  let descartadas = 0;
  let transportadas = 0;
  let afinadas = 0;
  let recortadas = 0;

  const intermedios: { tiempo: number; midi: number; duracionBeats: number; velocidad: number }[] = [];

  for (const crudo of eventosCrudos) {
    if (!crudo || typeof crudo !== "object") {
      descartadas++;
      continue;
    }
    const ev = crudo as Record<string, unknown>;

    const tiempo = Number(ev.tiempo);
    if (!Number.isFinite(tiempo) || tiempo < 0 || tiempo >= totalBeats) {
      descartadas++;
      continue;
    }

    const midiOriginal = typeof ev.nota === "string" ? notaAMidi(ev.nota) : null;
    if (midiOriginal === null) {
      // Irrecuperable: sin altura no hay forma de adivinar qué quería tocar.
      descartadas++;
      continue;
    }

    let midi = midiOriginal;

    if (opts.instrument === "percusion") {
      const golpe = masCercano(transportarAlRegistro(midi, registro.min, registro.max), GOLPES_PERCUSION);
      if (golpe !== midi) afinadas++;
      midi = golpe;
    } else {
      const enRegistro = transportarAlRegistro(midi, registro.min, registro.max);
      if (enRegistro !== midi) {
        transportadas++;
        midi = enRegistro;
      }
      const enEscala = encajarEnEscala(midi, claseTonica, grados);
      if (enEscala !== midi) {
        afinadas++;
        // Encajar puede haberla empujado justo fuera del registro por un semitono.
        midi = transportarAlRegistro(enEscala, registro.min, registro.max);
      }
    }

    const duracionCruda = Number(ev.duracionBeats);
    let duracionBeats = Number.isFinite(duracionCruda) && duracionCruda > 0 ? duracionCruda : 1;
    if (tiempo + duracionBeats > totalBeats) {
      duracionBeats = totalBeats - tiempo;
      recortadas++;
    }
    if (duracionBeats < 0.05) {
      descartadas++;
      continue;
    }

    const velocidadCruda = Number(ev.velocidad);
    const velocidad = Number.isFinite(velocidadCruda)
      ? Math.max(0.1, Math.min(1, velocidadCruda))
      : 0.85;

    intermedios.push({ tiempo, midi, duracionBeats, velocidad });
  }

  intermedios.sort((a, b) => a.tiempo - b.tiempo || a.midi - b.midi);

  // Dos notas idénticas a la vez son un duplicado del modelo, no un unísono buscado.
  const sinDuplicados = intermedios.filter((ev, i) => {
    if (i === 0) return true;
    const anterior = intermedios[i - 1];
    return !(Math.abs(anterior.tiempo - ev.tiempo) < 1e-6 && anterior.midi === ev.midi);
  });
  if (sinDuplicados.length !== intermedios.length) {
    descartadas += intermedios.length - sinDuplicados.length;
  }

  // Solape en la MISMA altura: la segunda pulsación corta a la primera, así que dejar la cola
  // sonando produce un batido sucio. Entre alturas distintas el solape sí es deseable (acordes).
  for (let i = 0; i < sinDuplicados.length; i++) {
    for (let j = i + 1; j < sinDuplicados.length; j++) {
      const actual = sinDuplicados[i];
      const siguiente = sinDuplicados[j];
      if (siguiente.tiempo >= actual.tiempo + actual.duracionBeats) break;
      if (siguiente.midi === actual.midi) {
        actual.duracionBeats = siguiente.tiempo - actual.tiempo;
        recortadas++;
        break;
      }
    }
  }

  const limitados = sinDuplicados.filter((ev) => ev.duracionBeats >= 0.05).slice(0, MAX_EVENTOS);
  if (sinDuplicados.length > MAX_EVENTOS) {
    reparaciones.push(`Se recortó la idea a ${MAX_EVENTOS} notas (la IA devolvió ${sinDuplicados.length}).`);
  }

  if (descartadas > 0) reparaciones.push(`${descartadas} nota(s) inválida(s) descartada(s).`);
  if (transportadas > 0) reparaciones.push(`${transportadas} nota(s) transportada(s) al registro de ${opts.instrument}.`);
  if (afinadas > 0) reparaciones.push(`${afinadas} nota(s) ajustada(s) a la tonalidad de ${opts.keyName}.`);
  if (recortadas > 0) reparaciones.push(`${recortadas} nota(s) recortada(s) por solape o por exceder la duración.`);

  return {
    eventos: limitados.map((ev) => ({
      tiempo: Number(ev.tiempo.toFixed(4)),
      nota: midiANota(ev.midi),
      duracionBeats: Number(ev.duracionBeats.toFixed(4)),
      velocidad: Number(ev.velocidad.toFixed(3))
    })),
    reparaciones
  };
}

/**
 * Pasa por el validador las notas de cada 'propose_melodic_idea' de una respuesta ya parseada del
 * modelo, antes de que salgan hacia el navegador.
 *
 * Si tras reparar no queda ninguna nota utilizable se retira la propuesta entera y se explica en
 * el texto: es preferible admitir que esa idea no salió a dejar en el chat un botón de "generar y
 * escuchar" que solo produce silencio.
 *
 * Vive aquí, y no dentro del handler de server/routes/chat.ts, para poder testearlo sin levantar
 * Express (la convención del repo para lógica de ruta que necesita cobertura).
 */
export function sanearIdeasMelodicas(parsed: any): any {
  if (!parsed || !Array.isArray(parsed.proposedActions)) return parsed;

  const avisos: string[] = [];
  const acciones = parsed.proposedActions.filter((accion: any) => {
    if (accion?.type !== "propose_melodic_idea" || !accion?.melodicIdea) return true;

    const idea = accion.melodicIdea;
    const { eventos, reparaciones } = validarYRepararEventos(idea.eventos, {
      instrument: idea.instrument,
      keyName: idea.keyName,
      escala: idea.escala,
      bpm: idea.bpm,
      durationSecs: idea.durationSecs
    });

    if (reparaciones.length > 0) {
      console.warn(`[Idea melódica] Reparada una idea de ${idea.instrument}: ${reparaciones.join(" ")}`);
    }

    if (eventos.length === 0) {
      avisos.push(`la idea de ${idea.instrument || "instrumento"} no salió con notas válidas`);
      return false;
    }

    idea.eventos = eventos;
    return true;
  });

  if (avisos.length > 0) {
    parsed.text = `${parsed.text || ""}\n\n⚠️ No he podido preparar ${avisos.join(" ni ")}. Vuelve a pedírmela y la compongo otra vez.`.trim();
  }

  return { ...parsed, proposedActions: acciones };
}
