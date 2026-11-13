/**
 * Aportaciones del público al directorio: validación pura (lista blanca de campos, longitudes, URL y email).
 * Nada de lo que llega se publica: se guarda como «pendiente» para revisarlo contra la fuente.
 */

export const CAMPOS_APORTACION = ['ciudad', 'fechas', 'web', 'contacto_booking', 'convocatoria', 'estilo', 'cerrado', 'otro'] as const;
export type CampoAportacion = (typeof CAMPOS_APORTACION)[number];

export interface Aportacion {
  tipo: 'festival' | 'sala';
  ficha_id: string;
  campo: CampoAportacion;
  valor: string;
  fuente: string | null;
  comentario: string | null;
  contacto: string | null;
  idioma: 'es' | 'en';
}

const texto = (v: unknown, max: number): string =>
  // eslint-disable-next-line no-control-regex
  typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';

const urlValida = (v: string): boolean => {
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
};

/** `null` si el envío es de un bot (campo trampa relleno): se responde como si hubiera ido bien y no se guarda. */
export function validarAportacion(body: unknown): { ok: true; aportacion: Aportacion } | { ok: false; error: string } | null {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (texto(b.web, 10)) return null;
  const idioma = b.idioma === 'en' ? 'en' : 'es';
  const err = (es: string, en: string) => ({ ok: false as const, error: idioma === 'en' ? en : es });

  const tipo = b.tipo === 'sala' ? 'sala' : b.tipo === 'festival' ? 'festival' : null;
  const ficha = texto(b.ficha_id, 120);
  if (!tipo || !/^[a-z0-9-]+$/.test(ficha)) return err('Ficha no válida.', 'Invalid listing.');
  const campo = CAMPOS_APORTACION.find((c) => c === b.campo);
  if (!campo) return err('Elige qué dato quieres aportar.', 'Choose what you want to add.');
  const valor = texto(b.valor, 300);
  if (!valor && campo !== 'cerrado') return err('Escribe el dato que conoces.', 'Write what you know.');
  const fuente = texto(b.fuente, 500);
  if (fuente && !urlValida(fuente)) return err('La fuente tiene que ser un enlace (https://…).', 'The source must be a link (https://…).');
  const contacto = texto(b.contacto, 200).toLowerCase();
  if (contacto && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contacto)) return err('El email no parece válido.', 'That email does not look valid.');
  return {
    ok: true,
    aportacion: {
      tipo,
      ficha_id: ficha,
      campo,
      valor: valor || (idioma === 'en' ? 'No longer running' : 'Ya no se celebra'),
      fuente: fuente || null,
      comentario: texto(b.comentario, 1000) || null,
      contacto: contacto || null,
      idioma,
    },
  };
}
