/**
 * Banco de pruebas del pulso: Beat This! frente al detector clásico (`calcularPulso` + compases
 * deducidos de los acordes, a los que aquí se les dan los acordes PERFECTOS para no penalizarlo).
 *
 * Canciones sintéticas con la verdad conocida (tempo que cambia, 3/4, swing, sin batería) y métrica
 * estándar de MIREX: F-measure con ±70 ms de tolerancia para pulsos y para inicios de compás.
 *
 *   npx tsx scripts/benchmark-pulso.ts            # tabla de resultados
 *   npx tsx scripts/benchmark-pulso.ts audio.f32  # además, pulsos de un PCM real (mono, 22 050 Hz)
 *
 * Necesita el modelo (BEAT_THIS_MODELO=ruta, o red para bajarlo la primera vez).
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import ffmpeg from "ffmpeg-static";
import { calcularPulso } from "../server/utils/pulso.js";
import { detectarPulsoNeuronal, SAMPLE_RATE_BEAT_THIS as SR } from "../server/utils/beatThis/beatThis.js";
import { pulsoDesdeRed } from "../server/utils/beatThis/compases.js";
import { analizarCuadricula } from "../src/utils/cuadriculaCompases.js";

interface Caso {
  nombre: string;
  bpm: [number, number]; // tempo al empezar y al acabar
  tiempos: 3 | 4;
  bateria: boolean;
  swing?: boolean;
  segundos?: number;
}

const CASOS: Caso[] = [
  { nombre: "Rock 4/4 a 120 fijo", bpm: [120, 120], tiempos: 4, bateria: true },
  { nombre: "Pop 4/4 a 96 fijo", bpm: [96, 96], tiempos: 4, bateria: true },
  { nombre: "Directo que acelera 110→128", bpm: [110, 128], tiempos: 4, bateria: true },
  { nombre: "Balada que frena 84→72", bpm: [84, 72], tiempos: 4, bateria: true },
  { nombre: "Vals 3/4 a 150", bpm: [150, 150], tiempos: 3, bateria: true },
  { nombre: "Shuffle 4/4 a 100 con swing", bpm: [100, 100], tiempos: 4, bateria: true, swing: true },
  { nombre: "Acústica sin batería a 90", bpm: [90, 90], tiempos: 4, bateria: false },
  { nombre: "Rápida 4/4 a 172", bpm: [172, 172], tiempos: 4, bateria: true },
];

/** Muestras del repo (scripts/generateSampleAudio.ts): pulso fijo desde 0 s, compás de 4, BPM conocido. */
const MUESTRAS: Array<[string, number]> = [
  ["sample_01_groove_apertura", 116], ["sample_02_balada_medianoche", 84], ["sample_03_fuego_asfalto", 138],
  ["sample_04_brisa_mediterranea", 128], ["sample_05_cierre_triunfal", 132],
];

function decodificar(ruta: string): Float32Array {
  const r = spawnSync(ffmpeg as unknown as string, ["-v", "error", "-i", ruta, "-ac", "1", "-ar", String(SR), "-f", "f32le", "pipe:1"], { maxBuffer: 1 << 30 });
  return new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + (r.stdout.length & ~3)));
}

const PROGRESION = [[220, 277.2, 329.6], [146.8, 185, 220], [164.8, 207.7, 246.9], [185, 220, 277.2]]; // A D E F#m

/** Ruido determinista para que el banco dé siempre lo mismo. */
function aleatorio(semilla: number) {
  let s = semilla >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1;
}

function sintetizar(caso: Caso) {
  const dur = caso.segundos ?? 60;
  const pcm = new Float32Array(dur * SR);
  const ruido = aleatorio(7);
  const pulsos: number[] = [];
  for (let t = 1.0, k = 0; t < dur - 0.5; k++) {
    pulsos.push(t);
    const bpm = caso.bpm[0] + (caso.bpm[1] - caso.bpm[0]) * (t / dur);
    t += 60 / bpm;
  }
  const compases = pulsos.filter((_, k) => k % caso.tiempos === 0);
  const golpe = (t0: number, largo: number, f: (i: number, x: number) => number) => {
    const a = Math.round(t0 * SR);
    for (let i = 0; i < largo * SR && a + i < pcm.length; i++) pcm[a + i] += f(i / SR, Math.exp(-(i / SR) / (largo / 4)));
  };
  pulsos.forEach((t, k) => {
    const enCompas = k % caso.tiempos;
    const T = (pulsos[k + 1] ?? t + 0.5) - t;
    if (caso.bateria) {
      if (enCompas === 0 || (caso.tiempos === 4 && enCompas === 2)) golpe(t, 0.25, (x, e) => 0.9 * e * Math.sin(2 * Math.PI * (55 + 60 * Math.exp(-x * 30)) * x));
      if (enCompas % 2 === 1 || (caso.tiempos === 3 && enCompas > 0)) golpe(t, 0.18, (_, e) => 0.45 * e * ruido());
      for (const o of [0, caso.swing ? 2 / 3 : 0.5]) {
        let prev = 0;
        golpe(t + o * T, 0.05, (_, e) => { const r = ruido(); const h = r - prev; prev = r; return 0.12 * e * h; });
      }
    } else {
      // Rasgueo: un ataque por tiempo, más fuerte en el 1.
      const acorde = PROGRESION[Math.floor(k / caso.tiempos) % PROGRESION.length];
      golpe(t, T * 0.95, (x, e) => (enCompas === 0 ? 0.35 : 0.2) * e * acorde.reduce((s, f) => s + Math.sin(2 * Math.PI * f * 2 * x) + 0.4 * Math.sin(2 * Math.PI * f * 4 * x), 0));
    }
  });
  // Bajo y colchón armónico: cambian al inicio de cada compás.
  compases.forEach((t, c) => {
    const acorde = PROGRESION[c % PROGRESION.length];
    const fin = compases[c + 1] ?? t + 2;
    const a = Math.round(t * SR);
    for (let i = 0; a + i < Math.min(pcm.length, Math.round(fin * SR)); i++) {
      const x = i / SR;
      const ataque = Math.min(1, x / 0.03);
      pcm[a + i] += 0.25 * ataque * Math.exp(-x * 1.5) * Math.sin(2 * Math.PI * (acorde[0] / 2) * x);
      pcm[a + i] += 0.05 * Math.min(1, x / 0.2) * acorde.reduce((s, f) => s + Math.sin(2 * Math.PI * f * x), 0);
    }
  });
  const segmentos = compases.map((t, c) => ({ t0: t, t1: compases[c + 1] ?? dur, acorde: ["A", "D", "E", "F#m"][c % 4], confianza: 1 }));
  return { pcm, pulsos, compases, segmentos, dur };
}

/** F-measure de MIREX con ±70 ms (cada referencia empareja como mucho una estimación). */
export function fMeasure(ref: number[], est: number[], tol = 0.07): number {
  if (!ref.length || !est.length) return 0;
  const usado = new Set<number>();
  let aciertos = 0;
  for (const r of ref) {
    let mejor = -1;
    for (let i = 0; i < est.length; i++) if (!usado.has(i) && Math.abs(est[i] - r) <= tol && (mejor < 0 || Math.abs(est[i] - r) < Math.abs(est[mejor] - r))) mejor = i;
    if (mejor >= 0) { usado.add(mejor); aciertos++; }
  }
  const p = aciertos / est.length, r = aciertos / ref.length;
  return p + r ? (2 * p * r) / (p + r) : 0;
}

const diezmar = (pcm: Float32Array) => Float32Array.from({ length: pcm.length >> 1 }, (_, i) => (pcm[2 * i] + pcm[2 * i + 1]) / 2);
const pct = (x: number) => `${Math.round(x * 100)} %`.padStart(5);

async function evaluar(nombre: string, pcm: Float32Array, verdad: { pulsos: number[]; compases: number[]; segmentos?: Array<{ t0: number; t1: number; acorde: string; confianza: number }>; bpm: number }, suma: number[]) {
  const dur = pcm.length / SR;
  const clasico = calcularPulso(diezmar(pcm), SR / 2, { bpmFicha: verdad.bpm });
  const rejilla = verdad.segmentos ? analizarCuadricula(verdad.segmentos, verdad.bpm, dur, clasico).cuadricula : null;
  const compasesClasico = rejilla ? rejilla.compases.map((c) => c.t0).filter((t) => t > 0) : [];
  const red = await detectarPulsoNeuronal(pcm);
  const cambios = verdad.segmentos?.slice(1).map((s) => s.t0);
  const fino = red ? pulsoDesdeRed(red, { duracion: dur, cambios, bpmFicha: verdad.bpm }) : null;
  const fila = [
    fMeasure(verdad.pulsos, clasico?.pulsos ?? []), fMeasure(verdad.pulsos, red?.pulsos ?? []), fMeasure(verdad.pulsos, fino?.pulsos ?? []),
    verdad.segmentos ? fMeasure(verdad.compases, compasesClasico) : NaN, fMeasure(verdad.compases, red?.compases ?? []), fMeasure(verdad.compases, fino?.compases ?? []),
  ];
  fila.forEach((v, i) => (suma[i] += Number.isNaN(v) ? 0 : v));
  console.log(`| ${nombre} | ${fila.map((v) => (Number.isNaN(v) ? "  —  " : pct(v))).join(" | ")} | ${clasico?.bpm ?? "-"} / ${fino?.bpm ?? "-"} (${verdad.bpm}) |`);
}

async function main() {
  console.log("| Caso | Pulsos clásico | Pulsos red | Pulsos red+ | Compases clásico* | Compases red | Compases red+ | BPM clásico / red+ (real) |");
  console.log("|---|---|---|---|---|---|---|---|");
  const suma = [0, 0, 0, 0, 0, 0];
  for (const caso of CASOS) {
    const { pcm, pulsos, compases, segmentos } = sintetizar(caso);
    await evaluar(caso.nombre, pcm, { pulsos, compases, segmentos, bpm: caso.bpm[0] }, suma);
  }
  for (const [nombre, bpm] of MUESTRAS) {
    const pcm = decodificar(`public/audio/samples/${nombre}.mp3`);
    const T = 60 / bpm;
    const pulsos = Array.from({ length: Math.floor(28 / T) }, (_, k) => k * T);
    await evaluar(`Muestra ${nombre.slice(10)}`, pcm, { pulsos, compases: pulsos.filter((_, k) => k % 4 === 0), bpm }, suma);
  }
  const n = CASOS.length + MUESTRAS.length;
  console.log(`| **Media** | ${suma.map((s, i) => pct(s / (i === 3 ? CASOS.length : n))).join(" | ")} | |`);
  console.log("\n* con los acordes exactos de la verdad: el mejor caso posible para el método clásico (solo en las sintéticas).");
  console.log("red+ = red con nivel métrico por la ficha, huecos rellenos y compases por Viterbi con los cambios de acorde.");

  for (const ruta of process.argv.slice(2)) {
    const b = readFileSync(ruta);
    const pcm = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + (b.length & ~3)));
    const t = Date.now();
    const neuronal = await detectarPulsoNeuronal(pcm);
    const clasico = calcularPulso(diezmar(pcm), SR / 2);
    if (!neuronal) continue;
    const fino = pulsoDesdeRed(neuronal, { duracion: pcm.length / SR });
    if (!fino?.compases) continue;
    const porCompas: Record<number, number> = {};
    fino.compases.slice(1).forEach((t, i) => {
      const n = fino.pulsos.filter((p) => p >= fino.compases![i] - 1e-6 && p < t - 1e-6).length;
      porCompas[n] = (porCompas[n] ?? 0) + 1;
    });
    console.log(`${ruta.split("/").pop()}: ${((Date.now() - t) / 1000).toFixed(1)} s · red+ ${fino.bpm} BPM ${fino.tiempos}/4 conf ${fino.confianza} · tiempos por compás ${JSON.stringify(porCompas)} · clásico ${clasico?.bpm ?? "-"} BPM · coinciden ${pct(fMeasure(fino.pulsos, clasico?.pulsos ?? []))}`);
    writeFileSync(`${ruta}.pulsos.json`, JSON.stringify({ pulsos: fino.pulsos, compases: fino.compases, clasico: clasico?.pulsos ?? [] }));
  }
}

main();
