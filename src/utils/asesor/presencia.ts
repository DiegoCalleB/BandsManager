/**
 * La forma de lo que devuelve `POST /api/asesor/presencia`: la define aquí, en `src/`, para que el
 * servidor y la pantalla compartan una sola definición. Solo tipos: la lógica está en `auditoria.ts`,
 * `seo.ts` y `clicsPieza.ts`, y el servidor que lo reúne en `server/services/asesorPresencia.ts`.
 */
import type { CandidatoAnuncio } from './anuncios';
import type { Auditoria, DestinoEnlace } from './auditoria';
import type { ClicsDePieza } from './clicsPieza';
import type { Red } from './reglasFormato';
import type { OpcionBio, PalabraClave } from './seo';

/** Las bios que pega la banda, por red. */
export type BiosPegadas = Partial<Record<Red, string>>;

export interface EnlaceDeRed {
  red: Red;
  url: string | null;
  destino: DestinoEnlace | null;
  concertId: string | null;
  /** Clics en los últimos 7 días. */
  clics7: number;
}

export interface Presencia {
  auditoria: Auditoria;
  kit: {
    palabrasClave: PalabraClave[];
    dondeUsar: string;
    nombreInstagram: string | null;
    bios: Array<{ red: Red; opciones: OpcionBio[] }>;
  };
  enlaces: {
    /** A dónde conviene que lleve el enlace de la bio ahora, y por qué. */
    recomendado: { destino: DestinoEnlace; concertId: string | null; motivo: string };
    porRed: EnlaceDeRed[];
    clicsTrasPublicar: ClicsDePieza[];
  };
  /** Qué piezas recientes merece la pena impulsar con dinero y cuáles no. */
  anuncios: CandidatoAnuncio[];
  instagram: {
    /** false si no está conectado o no se pudo leer: la bio hay que pegarla. */
    leido: boolean;
    seguidores: number | null;
    /** Clics semanales del enlace de Instagram frente a la horquilla sana (lección de métricas clave). */
    clicsSemanalesEstado: 'bajo' | 'sano' | 'alto' | 'sin_datos';
  };
}
