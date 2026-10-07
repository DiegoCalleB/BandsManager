import type { AudioTrack } from '../types';
import { instrumentoDesdeTexto, type InstrumentoProfesor } from './instrumentoProfesor';

/** «todo»: el tema entero · «solo»: únicamente mi pista · «sin»: todo menos mi pista (para tocar encima). */
export type ModoEscucha = 'todo' | 'solo' | 'sin';

/** Instrumento de una pista separada, mirando primero su campo y luego su nombre («Bajo», «Batería»…). */
export function instrumentoDePista(p: AudioTrack): InstrumentoProfesor | null {
  return instrumentoDesdeTexto(p.instrumento) ?? instrumentoDesdeTexto(p.nombre);
}

/** La pista que le corresponde al usuario por su instrumento; null si no hay (se elige a mano). */
export function pistaDelUsuario(pistas: AudioTrack[], instrumento: InstrumentoProfesor | null): AudioTrack | null {
  if (!instrumento) return null;
  return pistas.find((p) => instrumentoDePista(p) === instrumento) ?? null;
}

/** Qué pistas deben sonar en cada modo. «todo» devuelve [] porque suena el audio original completo. */
export function pistasParaModo(pistas: AudioTrack[], miId: string | null, modo: ModoEscucha): AudioTrack[] {
  if (modo === 'todo' || !miId || !pistas.some((p) => p.id === miId)) return [];
  return modo === 'solo' ? pistas.filter((p) => p.id === miId) : pistas.filter((p) => p.id !== miId);
}

/** Ajuste personal de una pista (solo en este dispositivo): volumen, silencio y solo. */
export interface AjustePista {
  volumen?: number;
  muted?: boolean;
  solo?: boolean;
}
export type AjustesPistas = Record<string, AjustePista>;

/** La pista con su ajuste personal ya aplicado. */
export function pistaConAjuste(p: AudioTrack, ajustes: AjustesPistas): AudioTrack {
  const a = ajustes[p.id];
  return a ? { ...p, ...a } : p;
}

export function hayPistaEnSolo(pistas: AudioTrack[], ajustes: AjustesPistas): boolean {
  return pistas.some((p) => pistaConAjuste(p, ajustes).solo);
}

/** Si la pista suena: con alguna en solo, solo esas; el silencio siempre gana. */
export function pistaAudible(p: AudioTrack, ajustes: AjustesPistas, hayEnSolo: boolean): boolean {
  const e = pistaConAjuste(p, ajustes);
  return (hayEnSolo ? !!e.solo : true) && !e.muted;
}

/** Volumen final 0..1 que debe tener el elemento de audio (0 si no es audible). */
export function volumenEfectivo(p: AudioTrack, ajustes: AjustesPistas, hayEnSolo: boolean): number {
  if (!pistaAudible(p, ajustes, hayEnSolo)) return 0;
  return Math.max(0, Math.min(1, pistaConAjuste(p, ajustes).volumen ?? 1));
}

export function alternarSilencio(ajustes: AjustesPistas, id: string): AjustesPistas {
  return { ...ajustes, [id]: { ...ajustes[id], muted: !(ajustes[id]?.muted ?? false) } };
}

/** Solo exclusivo, estilo Cubase: activar uno desactiva el resto; pulsar el activo lo apaga. */
export function alternarSolo(ajustes: AjustesPistas, pistas: AudioTrack[], id: string): AjustesPistas {
  if (ajustes[id]?.solo) return { ...ajustes, [id]: { ...ajustes[id], solo: false } };
  const siguiente: AjustesPistas = {};
  for (const p of pistas) siguiente[p.id] = { ...ajustes[p.id], solo: p.id === id };
  return siguiente;
}
