/**
 * Identidad del chat: nombre visible, banda activa y utilidades de ids y textos heredados.
 * Extraído de Chatbot.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { User } from "../../../types";
import type { ChatMessage, RawChatMessage } from "../chatTypes";


/** Dependencias que el componente contenedor inyecta al hook. */
export interface ChatIdentityParams {
  userRole: string;
  currentUser: User;
  activeBandName: string;
}

/**
 * Identidad del chat: nombre visible, banda activa y utilidades de ids y textos heredados.
 * @param params Estado y callbacks del contenedor ({@link ChatIdentityParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useChatIdentity({ userRole, currentUser, activeBandName }: ChatIdentityParams) {
  const isAdmin =
    userRole === 'admin' || userRole === 'leader' || (currentUser?.role as string) === 'admin' || currentUser?.role === 'leader';

  const bandDisplayName = activeBandName || currentUser?.bandName || 'vuestra banda';

  const cleanUserName = (() => {
    const rawName = currentUser?.name || currentUser?.username || '';
    if (!rawName) return 'equipo';

    const lowerRaw = rawName
      .toLowerCase()
      .replace(/^(band|reg)-/, '')
      .trim();
    const lowerBandDisplay = bandDisplayName
      .toLowerCase()
      .replace(/^(band|reg)-/, '')
      .trim();

    if (
      lowerRaw === lowerBandDisplay ||
      ['repercusion', 'bakandeya', 'admin', 'user', 'guest', 'leader', 'member', 'banda', 'equipo'].includes(lowerRaw) ||
      lowerRaw.startsWith('band-') ||
      lowerRaw.startsWith('reg-')
    ) {
      return 'equipo';
    }
    const firstName = rawName.split(' ')[0].trim();
    return firstName || 'equipo';
  })();

  const storageKey = `bakandeya_chat_messages_${currentUser?.id || 'guest'}_${currentUser?.band_id || 'default'}`;

  const cleanLegacyText = (text: string) => {
    if (!text) return text;
    return text
      .replace(/hoja de datos de Google Sheets \(salas\)/gi, 'base de datos de Supabase (salas)')
      .replace(/hoja de datos de Google Sheets/gi, 'base de datos de Supabase')
      .replace(/Google Sheets/gi, 'Supabase')
      .replace(/GitHub Actions/gi, 'Supabase Native Engine')
      .replace(/tareas de Python en GitHub Actions/gi, 'tareas nativas en Supabase')
      .replace(/Agentes Python/gi, 'Agentes Supabase')
      .replace(/Python/gi, 'Supabase');
  };

  const getWelcomeMessageText = (name: string, band: string) => {
    return `👋 **¡Buenas, ${name}!** Soy vuestro **Manager Virtual de ${band}**.\n\nEstoy conectado en tiempo real con vuestra base de datos de Supabase (salas), el calendario de ensayos de banda, la contabilidad y la logística de redes.\n\nPuedes preguntarme cosas como:\n- *¿Qué salas tengo pendientes de aprobación en Madrid o Granada?*\n- *Resúmeme el estado de la semana o hazme una lista de tareas para hoy.*\n- *¿Cuántas salas de Ska, Reggae o Fusión tenemos registradas?*\n\nSi necesitas, puedo **proponer cambios directos** en las salas (como aprobar un correo de contacto) o agendar ensayos, pidiéndote confirmación antes de actuar.`;
  };

  let chatMsgSeq = 0;

  const generateUniqueMsgId = (prefix: string = 'msg'): string => {
    chatMsgSeq += 1;
    const rand = Math.random().toString(36).substring(2, 7);
    return `${prefix}-${Date.now()}-${chatMsgSeq}-${rand}`;
  };

  const ensureUniqueMessageIds = (rawMessages: RawChatMessage[]): ChatMessage[] => {
    const seenIds = new Set<string>();
    return rawMessages.map((m) => {
      let msgId = m.id;
      if (!msgId || seenIds.has(msgId)) {
        msgId = generateUniqueMsgId(typeof msgId === 'string' && msgId ? msgId.split('-')[0] : 'msg');
      }
      seenIds.add(msgId);
      return {
        ...m,
        id: msgId,
        text: cleanLegacyText(m.text),
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        proposedActions: (m.proposedActions || []).map((act) => ({
          ...act,
          status: act.status || (m.actionStatus === 'applied' ? 'applied' : m.actionStatus === 'dismissed' ? 'dismissed' : 'pending'),
        })),
      };
    });
  };

  return { storageKey, ensureUniqueMessageIds, getWelcomeMessageText, cleanUserName, bandDisplayName, generateUniqueMsgId, isAdmin };
}
