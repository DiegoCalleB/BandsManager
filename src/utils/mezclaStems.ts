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
