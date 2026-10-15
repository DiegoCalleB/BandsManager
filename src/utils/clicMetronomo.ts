/** Tono del clic: agudo en el primer tiempo del compás, grave en los demás. */
const HZ_ACENTO = 1200;
const HZ_NORMAL = 800;

/**
 * Programa un clic de metrónomo en el instante `time` del reloj de `ctx` (seno corto con ataque de 5 ms y
 * caída rápida, sin chasquidos). `volumen` es el del acento; el resto suena al 60 %. Un solo sonido para
 * todo el producto: ensayo en vivo, sala de práctica y metrónomo suelto.
 */
export function programarClic(ctx: AudioContext, time: number, acento: boolean, volumen = 0.8): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = acento ? HZ_ACENTO : HZ_NORMAL;
  const pico = Math.max(0.0002, acento ? volumen : volumen * 0.6);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(pico, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.06);
}

/**
 * Instantes de los pulsos que caen antes de `ahora + horizonte` (el planificador «con adelanto» del
 * metrónomo: se programan unos milisegundos antes para que el reloj de audio, no el del timer, marque el pulso).
 */
export function pulsosPendientes(proximo: number, ahora: number, horizonte: number, segundosPorPulso: number): number[] {
  if (!(segundosPorPulso > 0)) return [];
  const salida: number[] = [];
  for (let t = proximo; t < ahora + horizonte && salida.length < 64; t += segundosPorPulso) salida.push(t);
  return salida;
}
