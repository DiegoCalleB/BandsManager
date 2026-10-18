/** Aplica `propose_add_from_catalog`: añade una sala del catálogo compartido a la agenda de la banda. */
import { Dispatch, SetStateAction } from 'react';
import { anadirSalaDelCatalogo } from '../../../services/apiCatalogo';
import { ChatMessage, ProposedAction } from '../chatTypes';

interface Params {
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  onNavigate: (view: string, options?: Record<string, unknown>) => void;
}

export function useCatalogoActions({ setMessages, onNavigate }: Params) {
  const responder = (text: string) => setMessages((prev) => [...prev, { id: `sys-${Date.now()}`, sender: 'bot', text, timestamp: new Date() }]);

  const applyAddFromCatalog = async (msgId: string, actionIndex: number, action: ProposedAction) => {
    const nombre = action.leadName || 'la sala';
    try {
      const r = await anadirSalaDelCatalogo(action.salaId || '');
      if (!r.ok && !r.yaEnAgenda) {
        responder(`⚠️ **No se pudo añadir ${nombre}:** ${r.error}`);
        return;
      }
      // «Ya la tenías» cuenta como resuelto: la propuesta se marca aplicada para no dejarla pendiente.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, actionStatus: 'applied', proposedActions: (m.proposedActions || []).map((a, i) => (i === actionIndex ? { ...a, status: 'applied' as const } : a)) }
            : m,
        ),
      );
      const leadId = r.leadId;
      responder(r.ok ? `✨ **${nombre}** está en tu agenda, con su contacto. Ya puedes prepararle un correo.` : `ℹ️ **${nombre}** ya estaba en tu agenda.`);
      if (leadId) onNavigate('booking', { sectionTab: 'salas', statusFilter: 'todos', initialSelectedLeadId: leadId });
    } catch (e) {
      console.error('Error añadiendo sala del catálogo:', e);
      responder(`⚠️ **No se pudo añadir ${nombre}:** error de conexión. Inténtalo de nuevo.`);
    }
  };

  return { applyAddFromCatalog };
}
