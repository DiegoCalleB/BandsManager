// Contacto de empresas (plan B2B de la landing). Validación pura, sin red ni BD, para poder probarla.

import { idiomaInteresado, normalizarEmailInteresado, type IdiomaInteresado } from './interesados.js';

export const TIPOS_EMPRESA = ['agencia', 'sello', 'sala', 'escuela', 'otro'] as const;
export type TipoEmpresa = (typeof TIPOS_EMPRESA)[number];

export interface ContactoEmpresa {
  empresa: string;
  email: string;
  tipo: TipoEmpresa;
  mensaje: string;
  idioma: IdiomaInteresado;
}

const limpiar = (valor: unknown, max: number) =>
  typeof valor === 'string' ? valor.replace(/\s+/g, ' ').trim().slice(0, max) : '';

/** Devuelve el contacto limpio o el error que se le enseña a quien lo envía. */
export function validarContactoEmpresa(body: unknown): { ok: true; contacto: ContactoEmpresa } | { ok: false; error: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const email = normalizarEmailInteresado(b.email);
  if (!email) return { ok: false, error: 'Escribe un email válido.' };
  const empresa = limpiar(b.empresa, 120);
  if (!empresa) return { ok: false, error: 'Indica el nombre de tu empresa.' };
  if (b.consentimiento !== true) return { ok: false, error: 'Marca la casilla para poder contestarte.' };
  const tipo = (TIPOS_EMPRESA as readonly string[]).includes(b.tipo as string) ? (b.tipo as TipoEmpresa) : 'otro';
  return { ok: true, contacto: { empresa, email, tipo, mensaje: limpiar(b.mensaje, 1000), idioma: idiomaInteresado(b.idioma) } };
}
