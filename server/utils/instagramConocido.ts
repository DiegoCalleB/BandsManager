/**
 * Instagram de salas y festivales conocidos, sin llamar a ninguna API: primero la base local de festivales y luego
 * unas pocas salas muy conocidas reconocibles por su nombre o su web. Extraído de auto_enrichment.ts (etapa 0).
 */
import { hostEnDominio } from './urlHost.js';

/** [fragmento del nombre, fragmento de la web o dominio, usuario]. El primero que coincide gana. */
const SALAS_CONOCIDAS: Array<{ nombre: string; web?: string; dominio?: string; instagram: string }> = [
  { nombre: 'riviera', web: 'salariviera', instagram: '@salariviera' },
  { nombre: 'panda club', web: 'pandamadrid', instagram: '@pandaclubmadrid' },
  { nombre: 'kasba', instagram: '@kasbamusic' },
  { nombre: 'rockville', dominio: 'rockville.es', instagram: '@salarockville' },
  { nombre: 'ferrara buskers', instagram: '@ferrarabuskersfestival' },
  { nombre: 'candlelight', web: 'feverup', instagram: '@candlelight.concerts' },
  { nombre: 'movistar arena', web: 'movistararena', instagram: '@movistararena_es' },
  { nombre: 'cocheras del puerto', instagram: '@puertohuelva' },
];

/** Usuario de Instagram que ya conocemos para esa sala o festival, o null si no la reconocemos. */
export async function instagramConocido(nombreSala: string, website?: string | null): Promise<string | null> {
  const nombre = nombreSala.toLowerCase().trim();
  try {
    const { SPANISH_FESTIVALS } = await import('./spanishFestivalsDB.js');
    const festival = SPANISH_FESTIVALS.find((f) => f.nombre.toLowerCase().trim() === nombre || nombre.includes(f.nombre.toLowerCase()));
    if (festival?.instagram) return festival.instagram;
  } catch {
    /* sin base de festivales se prueba con la lista de salas */
  }
  const web = (website || '').toLowerCase();
  const sala = SALAS_CONOCIDAS.find((s) => nombre.includes(s.nombre) || (s.web && web.includes(s.web)) || (s.dominio && hostEnDominio(web, s.dominio)));
  return sala?.instagram ?? null;
}
