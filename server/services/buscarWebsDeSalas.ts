/**
 * Busca la web oficial de las fichas del catálogo que no la tienen (salas, festivales, teatros, discotecas…), para que el lector
 * de webs saque luego de ella el email de rol con su regla de evidencia. Unas pocas por pasada (cada búsqueda cuesta); una ficha sin
 * resultado seguro se anota y no se vuelve a buscar hasta pasados `DIAS_HASTA_REBUSCAR`. Nunca inventa: la elección es de
 * `elegirWebOficial`. Depende de puertos, no de Supabase ni de la red.
 */
import { elegirWebOficial, type ResultadoBusqueda } from '../utils/webOficial.js';
import type { SalaGuardada } from './catalogoSalas.js';

export const FICHAS_A_BUSCAR_POR_PASADA = 40;
export const DIAS_HASTA_REBUSCAR = 60;

/** La ficha con su país (la columna existe en la tabla aunque el tipo común no la lleve). */
export type FichaSinWeb = SalaGuardada & { pais?: string | null };

export interface PuertoBusquedaWeb {
  /** Fichas sin web, no ayuntamientos, no «no contactar» ni cerradas, sin buscar o buscadas antes de `antesDe`, las más antiguas primero. */
  fichasSinWeb(limite: number, antesDe: Date): Promise<FichaSinWeb[]>;
  /** `null` = no hubo web segura: solo se anota la búsqueda. Nunca pisa una web que ya tenga. */
  guardarBusqueda(salaId: string, website: string | null, en: Date): Promise<void>;
}

export type BuscarEnLaWeb = (consulta: string, pais: string | null) => Promise<ResultadoBusqueda[]>;

export interface InformeBusquedaWeb {
  buscadas: number;
  encontradas: number;
  errores: number;
  ejemplos: string[];
}

/** «"Sala Wagon" Madrid»: el nombre entre comillas y la ciudad, que es lo que desambigua «Teatro Principal». */
export const consultaDeFicha = (s: Pick<SalaGuardada, 'nombre' | 'ciudad'>): string => `"${s.nombre}"${s.ciudad ? ` ${s.ciudad}` : ''}`.trim();

export async function buscarWebsDeSalas(p: {
  puerto: PuertoBusquedaWeb;
  buscar: BuscarEnLaWeb;
  limite?: number;
  diasHastaRebuscar?: number;
  ahora?: () => Date;
}): Promise<InformeBusquedaWeb> {
  const ahora = p.ahora ?? (() => new Date());
  const antesDe = new Date(ahora().getTime() - (p.diasHastaRebuscar ?? DIAS_HASTA_REBUSCAR) * 86_400_000);
  const informe: InformeBusquedaWeb = { buscadas: 0, encontradas: 0, errores: 0, ejemplos: [] };

  for (const ficha of await p.puerto.fichasSinWeb(p.limite ?? FICHAS_A_BUSCAR_POR_PASADA, antesDe)) {
    let resultados: ResultadoBusqueda[];
    try {
      resultados = await p.buscar(consultaDeFicha(ficha), ficha.pais ?? null);
    } catch {
      // Buscador caído o sin cuota: no se anota, se reintenta en la siguiente pasada.
      informe.errores++;
      continue;
    }
    informe.buscadas++;
    const web = elegirWebOficial(resultados, ficha.nombre, ficha.ciudad || null);
    await p.puerto.guardarBusqueda(ficha.id, web, ahora());
    if (web) {
      informe.encontradas++;
      if (informe.ejemplos.length < 5) informe.ejemplos.push(`${ficha.nombre} → ${web}`);
    }
  }
  return informe;
}

/** Buscador real: Serper (resultados orgánicos de Google). Lanza si no responde, para que la ficha no quede anotada como buscada. */
export function crearBusquedaSerper(clave: string): BuscarEnLaWeb {
  return async (consulta, pais) => {
    const gl = pais ? (pais.toUpperCase() === 'UK' ? 'gb' : pais.toLowerCase()) : 'es';
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': clave, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: consulta, gl, num: 8 }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Serper respondió ${res.status}`);
    const datos = (await res.json()) as { organic?: ResultadoBusqueda[]; knowledgeGraph?: { website?: string; title?: string; description?: string } };
    const kg = datos.knowledgeGraph?.website ? [{ link: datos.knowledgeGraph.website, title: datos.knowledgeGraph.title, snippet: datos.knowledgeGraph.description }] : [];
    return [...kg, ...(Array.isArray(datos.organic) ? datos.organic : [])];
  };
}
