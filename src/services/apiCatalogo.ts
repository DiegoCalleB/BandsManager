// Catálogo compartido de salas: alta en la agenda de la banda. El email y el teléfono de la sala los copia el servidor
// al añadirla; el cliente nunca los recibe en la consulta.
import { getAuthHeaders } from './api';

export interface ResultadoAnadirSala {
  ok: boolean;
  leadId?: string;
  /** La banda ya tenía esa sala (409): no es un fallo. */
  yaEnAgenda?: boolean;
  error?: string;
}

export async function anadirSalaDelCatalogo(salaId: string): Promise<ResultadoAnadirSala> {
  const res = await fetch(`/api/catalogo/salas/${encodeURIComponent(salaId)}/anadir`, { method: 'POST', headers: getAuthHeaders(), body: '{}' });
  const cuerpo = (await res.json().catch(() => ({}))) as { leadId?: string; error?: string };
  if (res.ok && cuerpo.leadId) return { ok: true, leadId: cuerpo.leadId };
  return { ok: false, yaEnAgenda: res.status === 409, leadId: cuerpo.leadId, error: cuerpo.error || `No se pudo añadir la sala (${res.status}).` };
}
