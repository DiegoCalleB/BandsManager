/**
 * El chat puede proponer crear una sala o modificarla con un `email_contacto`. Una IA que «completa» una ficha se
 * inventa `info@dominio.com` con toda naturalidad, y el usuario aprueba sin sospechar. La regla es simple y no necesita
 * red: un email en una propuesta solo vale si lo ha escrito el usuario en esta conversación. Los que no, se quitan de la
 * propuesta (el resto de la ficha sigue igual).
 */
import { emailsEnTexto, normalizarEmail } from './emailConEvidencia.js';

const CLAVES_DE_EMAIL = new Set(['email_contacto', 'email_secundario', 'email']);

/** Lo que escribió el usuario: el mensaje de ahora y sus turnos anteriores, nunca los de la IA. */
export function textoEscritoPorElUsuario(mensaje: unknown, historial: unknown): string {
  const partes: string[] = [typeof mensaje === 'string' ? mensaje : ''];
  if (Array.isArray(historial)) {
    for (const turno of historial) {
      if (typeof turno === 'string') {
        partes.push(turno);
        continue;
      }
      if (!turno || typeof turno !== 'object') continue;
      const t = turno as { role?: unknown; text?: unknown; content?: unknown; parts?: unknown };
      if (t.role !== 'user') continue;
      if (typeof t.text === 'string') partes.push(t.text);
      if (typeof t.content === 'string') partes.push(t.content);
      if (Array.isArray(t.parts)) for (const p of t.parts) if (p && typeof (p as { text?: unknown }).text === 'string') partes.push((p as { text: string }).text);
    }
  }
  return partes.join('\n');
}

/** Copia de las acciones sin los emails que el usuario no escribió, y cuántos se quitaron. No modifica la original. */
export function quitarEmailsNoEscritosPorElUsuario<T>(acciones: T[], textoDelUsuario: string): { acciones: T[]; quitados: number } {
  const escritos = new Set(emailsEnTexto(textoDelUsuario));
  const copia = structuredClone(acciones);
  let quitados = 0;

  const recorrer = (nodo: unknown): void => {
    if (!nodo || typeof nodo !== 'object') return;
    const objeto = nodo as Record<string, unknown>;
    for (const [clave, valor] of Object.entries(objeto)) {
      if (CLAVES_DE_EMAIL.has(clave) && typeof valor === 'string' && valor.trim()) {
        if (!escritos.has(normalizarEmail(valor))) {
          delete objeto[clave];
          quitados++;
        }
      } else if (valor && typeof valor === 'object') {
        recorrer(valor);
      }
    }
  };
  recorrer(copia);
  return { acciones: copia, quitados };
}
