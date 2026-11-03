/**
 * Banco de pruebas del BPM: el detector por ataques (el de antes), el detector clásico y el nuevo (pulsos de
 * Beat This! + ajuste fino) frente a canciones sintéticas con el tempo REAL conocido. Acierto = error < 2 %.
 *
 *   npx tsx scripts/benchmark-bpm.ts
 *
 * Necesita el modelo (BEAT_THIS_MODELO=ruta, o red para bajarlo la primera vez).
 */
import { detectarOnsetsDesdePcm, detectarBpmDesdeOnsets, SAMPLE_RATE } from "../server/utils/audioKey.js";
import { calcularPulso } from "../server/utils/pulso.js";
import { detectarPulsoNeuronal, SAMPLE_RATE_BEAT_THIS as SR } from "../server/utils/beatThis/beatThis.js";
import { bpmDesdePulsos } from "../server/utils/medirBpm.js";
import { sintetizar, type Caso } from "./lib/audioSintetico.js";

const diezmar = (pcm: Float32Array) => Float32Array.from({ length: pcm.length >> 1 }, (_, i) => (pcm[2 * i] + pcm[2 * i + 1]) / 2);
const casos: Caso[] = [60, 66, 68, 72, 80, 92, 100, 108, 116, 120, 128, 138, 146, 160, 172, 190].map((b) => ({ nombre: `Rock ${b}`, bpm: [b, b], tiempos: 4, bateria: true, segundos: 45 }));
casos.push(
  { nombre: "Swing 100", bpm: [100, 100], tiempos: 4, bateria: true, swing: true, segundos: 45 },
  { nombre: "Acústica 90 sin batería", bpm: [90, 90], tiempos: 4, bateria: false, segundos: 45 },
  { nombre: "Acústica 66 sin batería", bpm: [66, 66], tiempos: 4, bateria: false, segundos: 45 },
  { nombre: "Vals 150 (3/4)", bpm: [150, 150], tiempos: 3, bateria: true, segundos: 45 },
);

const aciertos = { ataques: 0, clasico: 0, nuevo: 0 };
for (const c of casos) {
  const { pcm } = sintetizar(c);
  const real = c.bpm[0];
  const ataques = detectarBpmDesdeOnsets(detectarOnsetsDesdePcm(diezmar(pcm), SAMPLE_RATE));
  const clasico = calcularPulso(diezmar(pcm), SR / 2, {})?.bpm ?? null;
  const red = await detectarPulsoNeuronal(pcm);
  const nuevo = red ? bpmDesdePulsos(red.pulsos) : null;
  const fila = (x: number | null, clave: keyof typeof aciertos) => {
    const ok = x !== null && Math.abs(x - real) / real < 0.02;
    if (ok) aciertos[clave]++;
    return `${x === null ? "—" : x.toFixed(1)}${ok ? " ✓" : " ✗"}`.padEnd(11);
  };
  console.log(`${c.nombre.padEnd(25)} real ${String(real).padStart(3)} | ataques ${fila(ataques, "ataques")} | clásico ${fila(clasico, "clasico")} | NUEVO ${fila(nuevo, "nuevo")}`);
}
console.log(`\nAciertos (error < 2 %) de ${casos.length}:  ataques ${aciertos.ataques}  clásico ${aciertos.clasico}  NUEVO ${aciertos.nuevo}`);
