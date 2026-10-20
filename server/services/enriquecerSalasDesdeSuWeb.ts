/**
 * Completa las salas del catálogo con lo que dice su propia web: Instagram (si se parece al nombre de la sala), email de rol,
 * teléfono fijo y género. Solo rellena campos VACÍOS: nunca pisa lo que ya había. Procesa unas pocas salas por pasada, las que
 * llevan más tiempo sin revisarse, y anota la revisión aunque no encuentre nada para no volver a leer la misma web cada día.
 * Depende de puertos, no de Supabase ni de la red.
 */
import type { DatosDeWebSala } from '../utils/datosDeWebSala.js';
import type { SalaGuardada } from './catalogoSalas.js';

export const SALAS_WEB_POR_PASADA = 40;
export const DIAS_HASTA_REVISAR_WEB = 90;

type CampoRellenable = keyof DatosDeWebSala;
const CAMPOS: CampoRellenable[] = ['instagram', 'email_contacto', 'telefono', 'genero'];

export interface PuertoEnriquecimientoWeb {
  /** Salas con web y algún dato vacío, sin revisar o revisadas antes de `antesDe`, las más antiguas primero. */
  salasPorEnriquecer(limite: number, antesDe: Date): Promise<SalaGuardada[]>;
  guardarEnriquecimiento(salaId: string, campos: Partial<Record<CampoRellenable, string>>, en: Date): Promise<void>;
}

/** Las páginas de la web de la sala (portada, contacto…) o null si no se pudo leer ninguna. Nunca lanza por una web caída. */
export type LeerWebDeSala = (website: string) => Promise<string[] | null>;

export interface InformeEnriquecimientoWeb {
  revisadas: number;
  sinWeb: number;
  completadas: number;
  camposRellenados: Record<CampoRellenable, number>;
}

const vacio = (v: unknown) => v === null || v === undefined || v === '';

export async function enriquecerSalasDesdeSuWeb(p: {
  puerto: PuertoEnriquecimientoWeb;
  leerWeb: LeerWebDeSala;
  extraer: (paginas: readonly string[], nombre: string) => DatosDeWebSala;
  limite?: number;
  diasHastaRevisar?: number;
  ahora?: () => Date;
  pausaMs?: number;
}): Promise<InformeEnriquecimientoWeb> {
  const ahora = p.ahora ?? (() => new Date());
  const antesDe = new Date(ahora().getTime() - (p.diasHastaRevisar ?? DIAS_HASTA_REVISAR_WEB) * 86_400_000);
  const informe: InformeEnriquecimientoWeb = { revisadas: 0, sinWeb: 0, completadas: 0, camposRellenados: { instagram: 0, email_contacto: 0, telefono: 0, genero: 0 } };

  for (const sala of await p.puerto.salasPorEnriquecer(p.limite ?? SALAS_WEB_POR_PASADA, antesDe)) {
    if (informe.revisadas > 0 && p.pausaMs) await new Promise((r) => setTimeout(r, p.pausaMs));
    informe.revisadas++;
    const paginas = sala.website ? await p.leerWeb(sala.website).catch(() => null) : null;
    const encontrados: Partial<Record<CampoRellenable, string>> = {};
    if (!paginas || paginas.length === 0) informe.sinWeb++;
    else {
      const datos = p.extraer(paginas, sala.nombre);
      for (const c of CAMPOS) if (vacio(sala[c]) && datos[c]) encontrados[c] = datos[c] as string;
    }
    // Se anota la revisión aunque no haya nada nuevo: así la sala pasa al final de la cola.
    await p.puerto.guardarEnriquecimiento(sala.id, encontrados, ahora());
    const n = Object.keys(encontrados) as CampoRellenable[];
    if (n.length > 0) informe.completadas++;
    for (const c of n) informe.camposRellenados[c]++;
  }
  return informe;
}
