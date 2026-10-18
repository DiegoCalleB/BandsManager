/**
 * Tipos de `epk_configs`: la fila tal como está en Supabase (snake_case) y lo que acepta el guardado.
 *
 * El EPK de la app (`EPKConfig`, camelCase) y la fila de la tabla (`FilaEpk`) tienen los mismos datos
 * con otros nombres; `dbGetEpkConfig` devuelve ambas formas a la vez y `dbUpsertEpkConfig` acepta
 * cualquiera de las dos.
 */
import type {
  BandMember,
  DatosContratacion,
  EmailSignatureConfig,
  EPKConfig,
  EPKSectionId,
  EPKTemplateId,
  EPKTranslations,
  EPKVideo,
  RiderConfig,
} from '../../src/types.js';

/** Fila de `epk_configs`. Todo es opcional: las columnas se van añadiendo con migraciones. */
export interface FilaEpk {
  band_id?: string;
  biografia?: string;
  logo_url?: string;
  dossier_pdf_url?: string;
  dossier_pdf_name?: string;
  dossier_document_url?: string;
  dossier_document_name?: string;
  dossier_texto_extra?: string;
  /** Lista de URLs; filas antiguas guardaban objetos `{ url }`. */
  band_photos?: Array<string | { url?: string } | null>;
  /** Miembros; las filas antiguas pueden traer `foto_url` en lugar de `fotoUrl`. */
  miembros?: Array<Partial<BandMember> & { foto_url?: string }>;
  videos?: EPKVideo[];
  datos_contratacion?: DatosContratacion;
  rider_tecnico?: string;
  rider_pdf_url?: string;
  rider_pdf_name?: string;
  enlaces_redes?: EPKConfig['enlacesRedes'];
  contacto_booking?: EPKConfig['contactoBooking'];
  temas_destacados_ids?: string[];
  incentivo_fans?: EPKConfig['incentivoFans'];
  donacion_revolut?: EPKConfig['donacionRevolut'] | null;
  ciudades_config?: string[];
  firma_email?: EmailSignatureConfig;
  traducciones?: EPKTranslations;
  audio_preview?: EPKConfig['audioPreview'];
  cifras_clave?: EPKConfig['cifrasClave'];
  resenas_prensa?: EPKConfig['resenasPrensa'];
  genero?: string;
  frase_impacto?: string;
  bandas_similares?: string[];
  mostrar_bandas_similares?: boolean;
  rider_config?: RiderConfig;
  idioma?: string | null;
  font_style?: string | null;
  tipografia?: string | null;
  plantilla?: EPKTemplateId | null;
  orden_secciones?: EPKSectionId[] | null;
  secciones_ocultas?: EPKSectionId[] | null;
}

/**
 * EPK para guardar: los campos de la app (todos opcionales, es un guardado parcial) o los de la
 * fila, más el nombre de banda con el que se sincroniza `registered_bands`.
 */
export type EntradaEpk = Omit<Partial<EPKConfig>, 'miembros' | 'contactoBooking'> &
  Omit<FilaEpk, 'contacto_booking'> & {
    /** El contacto también llega parcial (p. ej. `{}` si la banda aún no lo ha rellenado). */
    contactoBooking?: Partial<EPKConfig['contactoBooking']>;
    contacto_booking?: Partial<EPKConfig['contactoBooking']>;
    bandName?: string;
    nombre_banda?: string;
    localBandName?: string;
  };
