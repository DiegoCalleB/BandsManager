/** De las filas de Supabase (`catalogo_festivales`, `catalogo_festival_ediciones`, `catalogo_festival_convocatorias`) a la ficha pública. Puro y probado. */
import type { EstiloFestival, Festival, Tri } from './tipos.js';

export interface FilaFestival {
  id: string;
  nombre: string;
  ciudad: string | null;
  provincia: string | null;
  pais: string;
  generos: string[];
  web: string | null;
  descripcion_es: string | null;
  descripcion_en: string | null;
  estado_revision: 'candidata' | 'minima' | 'completa';
  fuente: string | null;
  verificado_en: string | null;
}

export interface FilaEdicion {
  festival_id: string;
  anio: number;
  inicio: string | null;
  fin: string | null;
  estado: 'anunciada' | 'confirmada' | 'cancelada';
}

export interface FilaConvocatoria {
  festival_id: string;
  edicion_anio: number | null;
  abre: string | null;
  cierra: string | null;
  url: string;
  estado: 'proxima' | 'abierta' | 'cerrada' | 'no_anunciada';
  admite_independientes: Tri;
  exige_sello_o_agencia: Tri;
  exige_residencia: Tri;
  cuota: Tri;
  remuneracion: string | null;
  resumen_es: string | null;
  resumen_en: string | null;
}

const ESTILOS_VALIDOS = new Set<string>([
  'rock', 'indie', 'pop', 'metal', 'punk', 'electronica', 'folk', 'jazz', 'blues', 'flamenco',
  'urbano', 'reggaeton', 'reggae', 'mundo', 'clasica', 'antigua', 'experimental', 'emergente',
]);

const RESUMEN_POR_DEFECTO = {
  es: 'Consulta las bases y los plazos en la fuente oficial.',
  en: 'Check the rules and deadlines at the official source.',
};

/** La edición que viene: la primera que no ha terminado. Una cancelada no cuenta. */
function proximaEdicion(ediciones: FilaEdicion[], hoy: string): FilaEdicion | undefined {
  return ediciones
    .filter((e) => e.estado !== 'cancelada' && e.inicio && e.fin && e.fin >= hoy)
    .sort((a, b) => String(a.inicio).localeCompare(String(b.inicio)))[0];
}

/** La convocatoria que importa: la que cierra antes entre las vigentes; si no hay, la última que cerró. */
function convocatoriaRelevante(cs: FilaConvocatoria[], hoy: string): FilaConvocatoria | undefined {
  const vigentes = cs.filter((c) => (c.estado === 'abierta' || c.estado === 'proxima') && (!c.cierra || c.cierra >= hoy));
  if (vigentes.length) return vigentes.sort((a, b) => (a.cierra ?? '9999').localeCompare(b.cierra ?? '9999'))[0];
  return [...cs].sort((a, b) => (b.cierra ?? '').localeCompare(a.cierra ?? ''))[0];
}

/**
 * Ficha pública, o `null` si no es publicable: una candidata (solo el nombre) o una sin fuente o fecha de comprobación
 * no sale nunca, ni aunque tenga más datos.
 */
export function festivalDeFilas(f: FilaFestival, ediciones: FilaEdicion[], convocatorias: FilaConvocatoria[], hoy: string): Festival | null {
  if (f.estado_revision === 'candidata' || !f.fuente || !f.verificado_en || !f.ciudad || !f.provincia) return null;
  const estilos = f.generos.filter((g): g is EstiloFestival => ESTILOS_VALIDOS.has(g));
  if (!estilos.length) return null;
  const ed = proximaEdicion(ediciones, hoy);
  const c = convocatoriaRelevante(convocatorias, hoy);
  return {
    slug: f.id,
    nombre: f.nombre,
    ciudad: f.ciudad,
    provincia: f.provincia,
    pais: 'ES',
    estilos,
    ...(f.web ? { web: f.web } : {}),
    fuente: f.fuente,
    verificadoEn: f.verificado_en,
    descripcion: { es: f.descripcion_es ?? `${f.nombre}, en ${f.ciudad}.`, en: f.descripcion_en ?? `${f.nombre}, in ${f.ciudad}, Spain.` },
    ...(ed?.inicio && ed.fin ? { edicion: { inicio: ed.inicio, fin: ed.fin } } : {}),
    ...(c
      ? {
          convocatoria: {
            url: c.url,
            ...(c.abre ? { abre: c.abre } : {}),
            ...(c.cierra ? { cierre: c.cierra } : {}),
            ...(c.edicion_anio ? { edicionAnio: c.edicion_anio } : {}),
            requisitos: {
              independientes: c.admite_independientes,
              exigeSelloOAgencia: c.exige_sello_o_agencia,
              exigeResidencia: c.exige_residencia,
              cuota: c.cuota,
              ...(c.remuneracion ? { remuneracion: c.remuneracion } : {}),
            },
            resumen: { es: c.resumen_es ?? RESUMEN_POR_DEFECTO.es, en: c.resumen_en ?? RESUMEN_POR_DEFECTO.en },
          },
        }
      : {}),
  };
}

/** Agrupa las filas sueltas por festival y devuelve solo las fichas publicables. */
export function festivalesDeFilas(festivales: FilaFestival[], ediciones: FilaEdicion[], convocatorias: FilaConvocatoria[], hoy: string): Festival[] {
  const por = <T extends { festival_id: string }>(filas: T[]) => {
    const m = new Map<string, T[]>();
    for (const x of filas) m.set(x.festival_id, [...(m.get(x.festival_id) ?? []), x]);
    return m;
  };
  const eds = por(ediciones);
  const cs = por(convocatorias);
  return festivales.flatMap((f) => festivalDeFilas(f, eds.get(f.id) ?? [], cs.get(f.id) ?? [], hoy) ?? []);
}
