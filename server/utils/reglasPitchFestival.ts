/**
 * Comprueba un email de campaña contra las reglas de escritura que ya tiene el proyecto: la lista negra de muletillas de IA y
 * aperturas (`promptGuidelines`), lo que prohíben el ADN de la banda y la campaña (`terminos_a_evitar`), los límites de longitud de
 * `auditPitchQuality`, los guiones largos, los enlaces sueltos en el cuerpo (el dossier va en la firma) y los huecos
 * de la plantilla sin rellenar. Devuelve los motivos; vacío = cumple todo. No cambia el texto.
 */
import { BANNED_AI_WORDS, BANNED_OPENINGS } from './promptGuidelines.js';
import { separarAsunto } from '../../src/utils/asuntoDelPitch.js';

const MIN_PALABRAS = 40;
const MAX_PALABRAS = 210;
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const contiene = (texto: string, termino: string) => new RegExp(`(?<![\\p{L}\\p{N}])${escapar(termino.trim())}(?![\\p{L}\\p{N}])`, 'iu').test(texto);

export function revisarReglasDelPitch(pitch: string, terminosAEvitar: readonly string[]): string[] {
  const { asunto, cuerpo } = separarAsunto(pitch);
  const todo = `${asunto}\n${cuerpo}`;
  const motivos: string[] = [];

  const prohibidos = [...new Set(terminosAEvitar.map((t) => t.trim()).filter(Boolean))].filter((t) => contiene(todo, t));
  if (prohibidos.length) motivos.push(`expresiones prohibidas en la campaña: ${prohibidos.join(', ')}`);

  const muletillas = BANNED_AI_WORDS.filter((w) => contiene(todo, w));
  if (muletillas.length) motivos.push(`muletillas de IA: ${muletillas.join(', ')}`);

  const aperturas = BANNED_OPENINGS.filter((o) => todo.toLowerCase().includes(o.toLowerCase()));
  if (aperturas.length) motivos.push(`apertura prohibida: ${aperturas[0]}`);

  if (/—|--/.test(todo)) motivos.push('guion largo (—)');
  if (/https?:\/\//i.test(cuerpo)) motivos.push('enlace suelto en el cuerpo (el dossier va en la firma)');
  if (/\{[a-z_]+\}/.test(todo)) motivos.push('hueco de la plantilla sin rellenar');

  // Mismos límites que `auditPitchQuality`: por debajo de 40 es demasiado corto y por encima de 210 demasiado largo.
  const palabras = cuerpo.split(/\s+/).filter(Boolean).length;
  if (palabras < MIN_PALABRAS || palabras > MAX_PALABRAS) motivos.push(`${palabras} palabras (aceptable ${MIN_PALABRAS}-${MAX_PALABRAS})`);

  return motivos;
}
