/** De una ficha fija de `datos.ts` a las filas de las tres tablas, para sembrar la base sin perder lo ya comprobado. */
import type { Festival } from './tipos.js';

export interface FilasDeFicha {
  festival: Record<string, unknown>;
  edicion?: Record<string, unknown>;
  convocatoria?: Record<string, unknown>;
}

export function filasDeFichaFija(f: Festival): FilasDeFicha {
  return {
    festival: {
      id: f.slug,
      nombre: f.nombre,
      ciudad: f.ciudad,
      provincia: f.provincia,
      pais: f.pais,
      generos: f.estilos,
      web: f.web ?? null,
      descripcion_es: f.descripcion.es,
      descripcion_en: f.descripcion.en,
      estado_revision: f.web || f.convocatoria ? 'completa' : 'minima',
      fuente: f.fuente,
      verificado_en: f.verificadoEn,
    },
    ...(f.edicion
      ? { edicion: { id: `${f.slug}-${f.edicion.inicio.slice(0, 4)}`, festival_id: f.slug, anio: Number(f.edicion.inicio.slice(0, 4)), inicio: f.edicion.inicio, fin: f.edicion.fin, estado: 'confirmada', fuente: f.fuente, verificado_en: f.verificadoEn } }
      : {}),
    ...(f.convocatoria
      ? {
          convocatoria: {
            id: `${f.slug}-${f.convocatoria.edicionAnio ?? (f.edicion ? f.edicion.inicio.slice(0, 4) : 'sin-anio')}`,
            festival_id: f.slug,
            edicion_anio: f.convocatoria.edicionAnio ?? (f.edicion ? Number(f.edicion.inicio.slice(0, 4)) : null),
            abre: f.convocatoria.abre ?? null,
            cierra: f.convocatoria.cierre ?? null,
            url: f.convocatoria.url,
            estado: !f.convocatoria.cierre ? 'no_anunciada' : f.convocatoria.cierre >= new Date().toISOString().slice(0, 10) ? 'abierta' : 'cerrada',
            resumen_es: f.convocatoria.resumen.es,
            resumen_en: f.convocatoria.resumen.en,
            fuente: f.fuente,
            verificado_en: f.verificadoEn,
          },
        }
      : {}),
  };
}
