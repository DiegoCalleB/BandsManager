/**
 * Tipos de entrada de los constructores de prompt de `bandDna.ts`.
 *
 * Todo viene de datos que pueden estar a medias o con nombres heredados (EPK sin rellenar, bandas
 * semilla, campañas con claves camelCase o snake_case), así que los campos son opcionales y cada
 * lector comprueba lo que usa.
 */
import type { Concert, EPKConfig } from '../../src/types.js';
import type { AdnExpresion } from '../db/tiposAdn.js';
import type { ResponseStrategy } from '../db/autonomy.js';
import type { FilaLead } from '../db/leads.js';
import type { BandaRegistradaGuardada } from '../stateTypes.js';

/** Caché por tipo de recinto (salas, festivales...). Los tipos sin cifra no aplican. */
export type CachePorTipoLibre = Record<string, number | undefined>;

/** Lead tal como llega a un prompt: solo se leen unos pocos campos de texto. */
export type LeadParaPrompt = Partial<FilaLead>;

/** Reglas de tono aprendidas para una campaña concreta. */
export interface ReglasTonoCampana {
  reglas_estilo_aprendidas?: string[];
  vocabulario_aprendido?: string[];
  terminos_a_evitar?: string[];
}

/** Campaña activa: la normalizada (camelCase) o la fila (snake_case). */
export interface CampanaParaPrompt {
  name?: string;
  isActive?: boolean;
  is_active?: boolean;
  targetDatesText?: string;
  targetDates?: string[];
  target_dates?: string[];
  targetCities?: string[];
  target_cities?: string[];
  customPitchTemplates?: Record<string, string>;
  custom_pitch_templates?: Record<string, string>;
  notes?: string;
  campaignToneRules?: ReglasTonoCampana;
  campaign_tone_rules?: ReglasTonoCampana;
  minCacheByType?: CachePorTipoLibre;
}

/** EPK del que sale el ADN: el de la app más campos heredados que aún traen algunos datos. */
export type EpkParaAdn = Omit<Partial<EPKConfig>, 'bandasSimilares'> & {
  nombre_banda?: string;
  artistasReferencia?: string;
  energiaDirecto?: string;
  bandasSimilares?: string[] | string;
};

/** Banda registrada con los campos de perfil que solo algunas filas traen. */
export type BandaParaAdn = BandaRegistradaGuardada & {
  biografia?: string;
  dossier_texto_extra?: string;
  artistas_similares?: string;
  artistas_referencia?: string;
  instrumentacion?: string;
  energia_directo?: string;
  web?: string;
  dna_expresion?: AdnExpresion;
};

/** Concierto con los campos de histórico que usa el prompt. */
export type ConciertoParaAdn = Partial<Concert> & { nombre?: string; bandId?: string };

/** Lo que `getBandDnaProfile` lee del estado local. */
export interface EstadoParaAdn {
  epkConfigsByBand?: Record<string, EpkParaAdn>;
  epkConfig?: EpkParaAdn;
  registeredBands?: BandaParaAdn[];
  concerts?: ConciertoParaAdn[];
  categoryTemplates?: Record<string, {
    title?: string;
    guidelines?: string;
    customInstruction?: string;
    body?: string;
    subject?: string;
  }>;
}

export type { ResponseStrategy };
