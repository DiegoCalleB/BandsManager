/**
 * Consulta y alta desde el catálogo compartido de salas (fase 2).
 *
 * Depende de un puerto, no de Supabase (el adaptador es server/db/salasCatalogo.ts). El catálogo es pequeño y
 * cambia poco, así que se lee entero y se filtra en memoria con una caché corta; si crece, el filtrado se
 * mueve a SQL sin cambiar quien lo llama.
 */
import { consultarSalas, leadDesdeSala, parsearFiltros, salasEnAgenda, type ResultadoCatalogo } from '../utils/consultaCatalogo.js';
import type { PuertoCatalogo, SalaGuardada } from './catalogoSalas.js';

export type PuertoConsulta = Pick<PuertoCatalogo, 'leerSalas' | 'enlazarLeads'>;
type LeadDeAgenda = Parameters<typeof salasEnAgenda>[0][number] & { id?: string };

const TTL_MS = 60_000;

export function crearConsultaCatalogo(puerto: PuertoConsulta, ahora: () => number = Date.now) {
  let cache: { salas: SalaGuardada[]; hasta: number } | null = null;

  async function salas(): Promise<SalaGuardada[]> {
    if (!cache || cache.hasta < ahora()) cache = { salas: await puerto.leerSalas(), hasta: ahora() + TTL_MS };
    return cache.salas;
  }

  return {
    async consultar(entrada: Record<string, unknown> | undefined, leadsDeLaBanda: LeadDeAgenda[]): Promise<ResultadoCatalogo> {
      return consultarSalas(await salas(), parsearFiltros(entrada), salasEnAgenda(leadsDeLaBanda));
    },

    /**
     * Añade una sala del catálogo a la agenda de la banda. Es la única vía por la que su email y teléfono salen del
     * catálogo. `guardarLead` lo pone quien llama (comprueba el plan y guarda con el bandId de la sesión).
     */
    async anadir(p: {
      salaId: string;
      bandId: string;
      leadsDeLaBanda: LeadDeAgenda[];
      nuevoId: () => string;
      guardarLead: (lead: Record<string, unknown>) => Promise<{ id: string }>;
    }): Promise<{ resultado: 'anadida'; leadId: string } | { resultado: 'no_disponible' } | { resultado: 'ya_en_agenda'; leadId?: string }> {
      const sala = (await salas()).find((s) => s.id === p.salaId);
      if (!sala || sala.no_contactar) return { resultado: 'no_disponible' };

      const agenda = salasEnAgenda(p.leadsDeLaBanda);
      if (agenda.ids.has(sala.id) || agenda.claves.has(sala.clave)) {
        const existente = p.leadsDeLaBanda.find((l) => l.sala_id === sala.id);
        return { resultado: 'ya_en_agenda', leadId: existente?.id };
      }

      const guardado = await p.guardarLead(leadDesdeSala(sala, p.nuevoId(), p.bandId));
      // El enlace es una mejora (alimenta la fiabilidad y marca «ya la tienes»): si falla, el lead ya está bien guardado.
      await puerto.enlazarLeads([{ leadId: guardado.id, salaId: sala.id }]).catch((e) => console.warn('No se pudo enlazar el lead con la sala del catálogo:', e));
      return { resultado: 'anadida', leadId: guardado.id };
    },
  };
}

export type ConsultaCatalogo = ReturnType<typeof crearConsultaCatalogo>;
