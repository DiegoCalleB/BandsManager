/**
 * ¿Puede la banda escribir a este lead hoy y por dónde? Un único estado por lead, calculado con lo que ya hay
 * (fiabilidad del email, formulario, redes) para filtrar el listado y preparar envíos sin abrir ficha por ficha.
 * Coherente con el Enviador: «enviable» es exactamente lo que `emailsNoEnviables` deja pasar (fiabilidad ≥ UMBRAL_ENVIO).
 */
import { fiabilidadDelEmail, sePuedeEnviar, type Fiabilidad, type ProcedenciaEmail } from './fiabilidadEmail';
import { avisoDeEmail } from './avisoDeEmail';
import { viaDeContacto } from './contactoPorFormulario';

export type EstadoDeContacto = 'enviable' | 'revisar' | 'no_enviable' | 'formulario' | 'redes' | 'sin_via';
export type FiltroContacto = 'todos' | EstadoDeContacto;

export const ESTADOS_DE_CONTACTO: EstadoDeContacto[] = ['enviable', 'revisar', 'no_enviable', 'formulario', 'redes', 'sin_via'];

export const ETIQUETA_CONTACTO: Record<EstadoDeContacto, string> = {
  enviable: 'Enviable',
  revisar: 'Revisar email',
  no_enviable: 'Email no válido',
  formulario: 'Formulario',
  redes: 'Instagram / teléfono',
  sin_via: 'Sin contacto',
};

export interface LeadParaContacto {
  email_contacto?: string | null;
  email_secundario?: string | null;
  instagram?: string | null;
  telefono?: string | null;
  notas?: string | null;
  datos_fuentes?: unknown;
}

export interface ContactoDelLead {
  estado: EstadoDeContacto;
  /** Frase para el tooltip: por qué está en ese estado. */
  motivo: string;
}

const CAMPOS = ['email_contacto', 'email_secundario'] as const;

export function estadoDeContacto(lead: LeadParaContacto, ahora: Date = new Date()): ContactoDelLead {
  const fuentes = (lead.datos_fuentes && typeof lead.datos_fuentes === 'object' ? lead.datos_fuentes : {}) as Record<string, ProcedenciaEmail | undefined>;
  const valoradas: Fiabilidad[] = [];
  for (const campo of CAMPOS) {
    const email = lead[campo]?.trim();
    if (!email) continue;
    const dudoso = avisoDeEmail(lead, campo) !== null;
    valoradas.push(fiabilidadDelEmail({ email, procedencia: dudoso ? { ...fuentes[campo], aviso: { tipo: 'dominio_inexistente', para: email } } : fuentes[campo] }, ahora));
  }
  if (valoradas.length) {
    const mejor = valoradas.reduce((a, b) => (b.puntos > a.puntos ? b : a));
    if (sePuedeEnviar(mejor)) return { estado: 'enviable', motivo: mejor.motivo };
    return { estado: mejor.puntos > 0 ? 'revisar' : 'no_enviable', motivo: mejor.motivo };
  }
  const via = viaDeContacto(lead);
  if (via === 'formulario') return { estado: 'formulario', motivo: 'Sin email: solo admite formulario de contacto en su web.' };
  if (via === 'instagram' || via === 'telefono') return { estado: 'redes', motivo: 'Sin email: se les puede escribir por Instagram o llamar.' };
  return { estado: 'sin_via', motivo: 'No tenemos ninguna vía de contacto todavía.' };
}

export function contarPorContacto(leads: LeadParaContacto[], ahora: Date = new Date()): Record<EstadoDeContacto, number> {
  const cuenta = Object.fromEntries(ESTADOS_DE_CONTACTO.map((e) => [e, 0])) as Record<EstadoDeContacto, number>;
  for (const l of leads) cuenta[estadoDeContacto(l, ahora).estado]++;
  return cuenta;
}
