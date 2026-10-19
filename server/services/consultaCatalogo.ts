/**
 * Consulta, sugerencias y alta desde el catálogo compartido de salas (fases 2 y 3).
 *
 * Depende de un puerto, no de Supabase (el adaptador es server/db/salasCatalogo.ts). El catálogo es pequeño y
 * cambia poco, así que se lee entero y se filtra en memoria con una caché corta; si crece, el filtrado se
 * mueve a SQL sin cambiar quien lo llama.
 */
import { claveSala } from '../utils/salaCatalogo.js';
import { consultarSalas, leadDesdeSala, parsearFiltros, salasEnAgenda, type ResultadoCatalogo } from '../utils/consultaCatalogo.js';
import { sugerirSalas, type PerfilBanda, type Sugerencia } from '../utils/sugerenciasCatalogo.js';
import type { PuertoCatalogo, SalaGuardada } from './catalogoSalas.js';

export type PuertoConsulta = Pick<PuertoCatalogo, 'leerSalas' | 'enlazarLeads'>;
type LeadDeAgenda = Parameters<typeof salasEnAgenda>[0][number] & { id?: string };
export type ResultadoAlta = { resultado: 'anadida'; leadId: string } | { resultado: 'no_disponible' } | { resultado: 'ya_en_agenda'; leadId?: string };

export interface PeticionAlta {
  salaId: string;
  bandId: string;
  leadsDeLaBanda: LeadDeAgenda[];
  nuevoId: () => string;
  guardarLead: (lead: Record<string, unknown>) => Promise<{ id: string }>;
}

/** Las más que se añaden de una vez: un onboarding no necesita más y acota el trabajo de una petición. */
export const MAX_ALTAS_POR_PETICION = 10;

export interface InformeAltas {
  anadidas: number;
  yaEnAgenda: number;
  noDisponibles: number;
  /** Quedaron salas sin añadir porque el plan de la banda no admite más. */
  limiteAlcanzado: boolean;
}

const TTL_MS = 60_000;

export function crearConsultaCatalogo(puerto: PuertoConsulta, ahora: () => number = Date.now) {
  let cache: { salas: SalaGuardada[]; hasta: number } | null = null;

  async function salas(): Promise<SalaGuardada[]> {
    if (!cache || cache.hasta < ahora()) cache = { salas: await puerto.leerSalas(), hasta: ahora() + TTL_MS };
    return cache.salas;
  }

  /**
   * Añade una sala del catálogo a la agenda de la banda. Es la única vía por la que su email y teléfono salen del
   * catálogo. `guardarLead` lo pone quien llama (guarda con el bandId de la sesión).
   */
  async function anadir(p: PeticionAlta): Promise<ResultadoAlta> {
    const sala = (await salas()).find((s) => s.id === p.salaId);
    if (!sala || sala.no_contactar || sala.estado_negocio === 'cerrado_permanente') return { resultado: 'no_disponible' };

    const agenda = salasEnAgenda(p.leadsDeLaBanda);
    if (agenda.ids.has(sala.id) || agenda.claves.has(sala.clave)) {
      const existente = p.leadsDeLaBanda.find((l) => l.sala_id === sala.id);
      return { resultado: 'ya_en_agenda', leadId: existente?.id };
    }

    const guardado = await p.guardarLead(leadDesdeSala(sala, p.nuevoId(), p.bandId));
    // El enlace es una mejora (alimenta la fiabilidad y marca «ya la tienes»): si falla, el lead ya está bien guardado.
    await puerto.enlazarLeads([{ leadId: guardado.id, salaId: sala.id }]).catch((e) => console.warn('No se pudo enlazar el lead con la sala del catálogo:', e));
    return { resultado: 'anadida', leadId: guardado.id };
  }

  return {
    async consultar(entrada: Record<string, unknown> | undefined, leadsDeLaBanda: LeadDeAgenda[]): Promise<ResultadoCatalogo> {
      return consultarSalas(await salas(), parsearFiltros(entrada), salasEnAgenda(leadsDeLaBanda));
    },

    /** Salas del catálogo que encajan con la banda (su ciudad y su género), sin las que ya tiene. */
    async sugerir(perfil: PerfilBanda, leadsDeLaBanda: LeadDeAgenda[], limite?: number): Promise<Sugerencia[]> {
      return sugerirSalas(await salas(), perfil, salasEnAgenda(leadsDeLaBanda), limite);
    },

    anadir,

    /** La sala del catálogo que corresponde a un lead (por `place_id` o por nombre y ciudad), o null si no se conoce. */
    async buscar(p: { placeId?: string | null; nombre?: unknown; ciudad?: unknown }): Promise<SalaGuardada | null> {
      const place = typeof p.placeId === 'string' ? p.placeId.trim() : '';
      const nc = claveSala({ nombre: p.nombre, ciudad: p.ciudad });
      if (!place && !nc) return null;
      return (
        (await salas()).find((s) => (place && s.place_id === place) || (nc && (s.clave === nc || claveSala({ nombre: s.nombre, ciudad: s.ciudad }) === nc))) ?? null
      );
    },

    /**
     * Añade varias seguidas. `plazas` es cuántas más admite el plan de la banda: al agotarse se detiene y lo dice, en
     * vez de fallar a medias sin explicación. Cada alta cuenta la anterior (no se duplica una sala repetida en la lista).
     */
    async anadirVarias(p: Omit<PeticionAlta, 'salaId'> & { salaIds: string[]; plazas: number }): Promise<InformeAltas> {
      const informe: InformeAltas = { anadidas: 0, yaEnAgenda: 0, noDisponibles: 0, limiteAlcanzado: false };
      const agenda = [...p.leadsDeLaBanda];
      for (const salaId of [...new Set(p.salaIds)].slice(0, MAX_ALTAS_POR_PETICION)) {
        if (informe.anadidas >= p.plazas) {
          informe.limiteAlcanzado = true;
          break;
        }
        const r = await anadir({ ...p, salaId, leadsDeLaBanda: agenda });
        if (r.resultado === 'anadida') {
          informe.anadidas++;
          agenda.push({ id: r.leadId, sala_id: salaId });
        } else if (r.resultado === 'ya_en_agenda') informe.yaEnAgenda++;
        else informe.noDisponibles++;
      }
      return informe;
    },
  };
}

export type ConsultaCatalogo = ReturnType<typeof crearConsultaCatalogo>;
