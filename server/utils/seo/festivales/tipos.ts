/**
 * Festivales del directorio público. Los datos viven en el repositorio y entran por revisión (pull request):
 * nadie puede editar una ficha publicada desde fuera. Cada ficha lleva su fuente y la fecha en que se comprobó.
 */
export type EstiloFestival =
  | 'rock' | 'indie' | 'pop' | 'metal' | 'punk' | 'electronica' | 'folk' | 'jazz' | 'blues' | 'flamenco'
  | 'urbano' | 'reggaeton' | 'reggae' | 'mundo' | 'clasica' | 'antigua' | 'experimental' | 'emergente';

/** `desconocido` no es `no`: un filtro por «admite independientes» solo devuelve lo que está comprobado. */
export type Tri = 'si' | 'no' | 'desconocido';

export interface RequisitosConvocatoria {
  independientes: Tri;
  exigeSelloOAgencia: Tri;
  exigeResidencia: Tri;
  cuota: Tri;
  remuneracion?: string;
}

export interface Festival {
  /** Identificador estable de la URL (minúsculas, números y guiones). No se cambia nunca: la URL es el enlace de otros. */
  slug: string;
  nombre: string;
  ciudad: string;
  provincia: string;
  /** Código ISO 3166-1 alfa-2. */
  pais: 'ES';
  estilos: EstiloFestival[];
  /** Web oficial. Si no se ha podido comprobar, se omite en lugar de suponerla. */
  web?: string;
  /** Dónde se leyó la información (página oficial, bases, nota de prensa). Obligatoria. */
  fuente: string;
  /** Día (AAAA-MM-DD) en que alguien comprobó los datos contra la fuente. Caduca al año. */
  verificadoEn: string;
  /** Qué es, en una frase y solo con hechos comprobados. */
  descripcion: { es: string; en: string };
  /** Próxima edición, si está confirmada. */
  edicion?: { inicio: string; fin: string };
  /** Convocatoria para bandas, si la hay. Sin `cierre` solo se enlaza la fuente: no se inventa un plazo. */
  convocatoria?: {
    url: string;
    abre?: string;
    cierre?: string;
    /** Edición para la que se programa (la siguiente o la siguiente a la siguiente). */
    edicionAnio?: number;
    requisitos?: RequisitosConvocatoria;
    resumen: { es: string; en: string };
  };
}
