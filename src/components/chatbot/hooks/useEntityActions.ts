/**
 * Aplica las propuestas del asistente sobre estados, bandas, conciertos, ensayos, giras, logo y leads.
 * Extraído de useChatActions.ts (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction } from "react";
import { api } from "../../../services/api";
import { Concert, Lead, Rehearsal, User } from "../../../types";
import { getErrorMessage } from "../../../utils/errorMessage";
import { ChatMessage, ProposedAction } from "../chatTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface EntityActionsParams {
  leads: Lead[];
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
  updateActionStatusInMessages: (msgId: string, actionIndex: number, action: ProposedAction, status: "applied" | "dismissed") => void;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  currentUser: User;
  onAddConcert: (concert: Concert) => void;
  onAddRehearsal: (rehearsal: Rehearsal) => void;
  onCreateLead: (lead: Lead) => void | Lead | Promise<void | Lead>;
  onNavigate: (view: string, options?: Record<string, unknown>) => void;
}

/**
 * Aplica las propuestas del asistente sobre estados, bandas, conciertos, ensayos, giras, logo y leads.
 * @param params Estado y callbacks del contenedor ({@link EntityActionsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useEntityActions({ leads, onUpdateLead, updateActionStatusInMessages, setMessages, currentUser, onAddConcert, onAddRehearsal, onCreateLead, onNavigate }: EntityActionsParams) {
  const applyStatusChange = async (msgId: string, actionIndex: number, action: ProposedAction) => {
    if (action.leadId && action.newStatus) {
      const targetLead = leads.find((l) => l.id === action.leadId);
      if (targetLead) {
        const today = new Date().toISOString().split('T')[0];
        const updatedNotes = `*** [${today}] Clasificación editada vía Chatbot AI a '${action.newStatus}' ***\n${targetLead.notas || ''}`;

        onUpdateLead(
          action.leadId,
          {
            estado: action.newStatus as Lead["estado"],
            notas: updatedNotes,
          },
          targetLead.estado
        );
      }

      updateActionStatusInMessages(msgId, actionIndex, action, 'applied');

      const successMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'bot',
        text: `✅ **Acción Ejecutada con éxito:** Se ha procesado la propuesta para **"${action.leadName || 'Sala'}"**. El estado ha sido modificado y se ha persistido el log correspondiente en la base de datos de Supabase.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, successMsg]);
    }
  };

  const applyBand = async (msgId: string, actionIndex: number, action: ProposedAction) => {
    const bandData = {
      id: `band-${Date.now()}`,
      nombre_banda: action.band?.nombre_banda || 'Nueva Banda',
      estilo_musical: action.band?.estilo_musical || 'Desconocido',
      localizacion: action.band?.localizacion || 'Desconocido',
      estado_relacion: action.band?.estado_relacion || 'nuevo',
      ultimo_contacto: new Date().toISOString().split('T')[0],
      contacto_nombre: action.band?.contacto_nombre || '',
      email: action.band?.email || '',
      telefono: action.band?.telefono || '',
      instagram: action.band?.instagram || '',
      spotify_youtube: action.band?.spotify_youtube || '',
      aforo_promedio: Number(action.band?.aforo_promedio) || 0,
      notas_colaboracion: action.band?.notas_colaboracion || 'Añadido vía AI',
      ciudad_origen_swap: action.band?.localizacion || '',
    };

    try {
      const token = localStorage.getItem('bandmanager_token');
      const activeBandId = currentUser?.band_id || '';
      await fetch('/api/bands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(activeBandId ? { 'x-band-id': activeBandId } : {}),
        },
        body: JSON.stringify(bandData),
      });
    } catch (e) {
      console.error('Error adding band directly:', e);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: `✅ He añadido a **${bandData.nombre_banda}** a la base de datos de bandas aliadas.`,
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
  };

  const applyConcert = async (msgId: string, actionIndex: number, action: ProposedAction) => {
    const concertData: Concert = {
      id: action.concert?.id || `con-${Date.now()}`,
      fecha: action.concert?.fecha || new Date().toISOString().split('T')[0],
      ciudad: action.concert?.ciudad || (action.leadId ? leads.find((l) => l.id === action.leadId)?.ciudad || 'Madrid' : 'Madrid'),
      sala: action.concert?.sala || action.leadName || 'Sala Villanos',
      cache: action.concert?.cache || 0,
      aforo_vendido: action.concert?.aforo_vendido || 0,
      aforo_total: action.concert?.aforo_total || 200,
      contrato_firmado: action.concert?.contrato_firmado ?? true,
      estado_pago: action.concert?.estado_pago || 'pendiente',
      notas: action.concert?.notas || 'Bolo agendado vía Mánager Virtual IA',
      tipo: action.concert?.tipo || 'sala',
    };

    if (onAddConcert) {
      onAddConcert(concertData);
    } else {
      try {
        const token = localStorage.getItem('bandmanager_token');
        await fetch('/api/concerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(concertData),
        });
      } catch (e) {
        console.error('Error adding concert directly:', e);
      }
    }

    if (action.leadId) {
      const targetLead = leads.find((l) => l.id === action.leadId);
      if (targetLead) {
        const today = new Date().toISOString().split('T')[0];
        onUpdateLead(
          action.leadId,
          {
            estado: (action.newStatus as Lead["estado"]) || 'negociando',
            notas: `*** [${today}] Concierto agendado para el ${concertData.fecha} ***\n${targetLead.notas || ''}`,
          },
          targetLead.estado
        );
      }
    }

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return { ...m, actionStatus: 'applied' };
        }
        return m;
      })
    );

    const successMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: 'bot',
      text: `🎉 **¡Concierto Agendado con Éxito!**\n\nSe ha añadido el bolo en **${concertData.sala}** (${concertData.ciudad}) para el **${concertData.fecha}** en la agenda de conciertos y guardado en la pestaña **conciertos** de Supabase.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, successMsg]);
  };

  const applyRehearsal = async (msgId: string, actionIndex: number, action: ProposedAction) => {
    const rehearsalData: Rehearsal = {
      id: action.rehearsal?.id || `reh-${Date.now()}`,
      fecha: action.rehearsal?.fecha || new Date().toISOString().split('T')[0],
      hora: action.rehearsal?.hora || '19:00',
      lugar: action.rehearsal?.lugar || 'Local de Ensayo',
      asistentes: action.rehearsal?.asistentes || ['Banda'],
      notas: action.rehearsal?.notas || 'Ensayo agendado vía Chatbot AI',
      estado: action.rehearsal?.estado || 'programado',
    };

    if (onAddRehearsal) {
      onAddRehearsal(rehearsalData);
    } else {
      try {
        const token = localStorage.getItem('bandmanager_token');
        await fetch('/api/rehearsals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(rehearsalData),
        });
      } catch (e) {
        console.error('Error adding rehearsal directly:', e);
      }
    }

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return { ...m, actionStatus: 'applied' };
        }
        return m;
      })
    );

    const successMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: 'bot',
      text: `📅 **Ensayo Programado con Éxito:**\n\nSe ha agendado el ensayo para el **${rehearsalData.fecha}** a las **${rehearsalData.hora}** en **${rehearsalData.lugar}** y guardado en Supabase.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, successMsg]);
  };

  const applyTour = async (msgId: string, actionIndex: number, action: ProposedAction) => {
    const tourData = action.tour || {
      id: `tour-${Date.now()}`,
      nombre: action.description || 'Nueva Gira',
      vehiculo: 'Furgoneta 9 Plazas',
      estado: 'planificacion',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: new Date().toISOString().split('T')[0],
      presupuestoLogistica: 0,
      stops: [],
    };

    try {
      const token = localStorage.getItem('bandmanager_token');
      await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(tourData),
      });
    } catch (e) {
      console.error('Error creating tour from chat:', e);
    }

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return { ...m, actionStatus: 'applied' };
        }
        return m;
      })
    );

    const successMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: 'bot',
      text: `🚚 **Gira Guardada con Éxito:**\n\nSe ha registrado la gira **"${tourData.nombre || 'Nueva Gira'}"** en la base de datos y sincronizado con Supabase.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, successMsg]);
  };

  const applyLogoUpdate = async (msgId: string, actionIndex: number, action: ProposedAction) => {
    const targetLeadId = action.leadId || (action.targetType === 'lead' ? action.leadId : undefined);
    const targetBandId = action.bandId || (action.targetType === 'band' ? action.bandId : undefined);
    const name = action.targetName || action.leadName || 'Item';

    if (targetLeadId) {
      onUpdateLead(targetLeadId, {
        imagen_url: action.imagen_url,
        icono: action.icono,
      });
    } else if (targetBandId) {
      try {
        const token = localStorage.getItem('bandmanager_token');
        await fetch(`/api/bands/${targetBandId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            id: targetBandId,
            imagen_url: action.imagen_url,
            icono: action.icono,
          }),
        });
      } catch (e) {
        console.error('Error updating band logo directly:', e);
      }
    }

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return { ...m, actionStatus: 'applied' };
        }
        return m;
      })
    );

    const successMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: 'bot',
      text: `🖼️ **Logo/Icono Actualizado con Éxito:** Se ha guardado el logo/icono para **"${name}"** en la base de datos y sincronizado con Supabase.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, successMsg]);
  };

  const applyAddLead = async (msgId: string, actionIndex: number, action: ProposedAction) => {
    const activeBandId = currentUser?.band_id || '';
    const isMedio = action.lead?.tipo === 'medio' || action.lead?.tipo === 'radio' || action.lead?.tipo === 'prensa';
    const newLeadData: Lead = {
      id: action.lead?.id || `lead-${Date.now()}`,
      band_id: action.lead?.band_id || currentUser?.band_id || activeBandId,
      nombre_sala: action.lead?.nombre_sala || action.leadName || 'Nuevo Lead',
      ciudad: action.lead?.ciudad || 'Madrid',
      region: action.lead?.region || action.lead?.ciudad || 'Madrid',
      aforo: Number(action.lead?.aforo) || 0,
      genero: action.lead?.genero || 'Variado',
      tipo: action.lead?.tipo || 'sala',
      email_contacto: action.lead?.email_contacto || '',
      telefono: action.lead?.telefono || '',
      website: action.lead?.website || '',
      instagram: action.lead?.instagram || '',
      festival_start_date: action.lead?.festival_start_date || action.lead?.festivalStartDate || '',
      festival_end_date: action.lead?.festival_end_date || action.lead?.festivalEndDate || '',
      fuente: action.lead?.fuente || 'Chatbot AI',
      estado: action.lead?.estado || 'nuevo',
      notas: action.lead?.notas || 'Creado directamente vía Chatbot AI',
      pitch_generado: action.lead?.pitch_generado || '',
      fecha_envio: action.lead?.fecha_envio || '',
      fecha_ultima_respuesta: '',
    };

    let createdLead: Lead = newLeadData;
    let saveSuccess = false;
    let saveErrorMessage = '';

    try {
      if (onCreateLead) {
        const result = await onCreateLead(newLeadData);
        if (result && typeof result === "object" && result.id) createdLead = result;
        saveSuccess = true;
      } else {
        const res = (await api.createLead(newLeadData)) as Lead & { lead?: Lead };
        if (res?.lead) createdLead = res.lead;
        saveSuccess = true;
      }
    } catch (e) {
      console.error('Error creating lead from chatbot:', e);
      saveErrorMessage = getErrorMessage(e, 'Error al conectar con la base de datos Supabase.');
    }

    if (saveSuccess) {
      try {
        window.dispatchEvent(new Event('app-data-updated'));
      } catch {
        // Ignorado a propósito: es un efecto secundario opcional (evento de actualización, dictado o limpieza).
      }

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === msgId) {
            const updatedActions = (m.proposedActions || []).map((a, idx) =>
              idx === actionIndex ? { ...a, status: 'applied' as const } : a
            );
            return { ...m, actionStatus: 'applied', proposedActions: updatedActions };
          }
          return m;
        })
      );

      if (onNavigate) {
        onNavigate(isMedio ? 'medios' : 'booking', {
          sectionTab: isMedio ? 'medios' : 'salas',
          statusFilter: 'todos',
          initialSelectedLeadId: createdLead.id,
        });
      }

      const addSuccessMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'bot',
        text: `✨ **Nuevo Lead / Medio Creado con Éxito:**\n\nSe ha guardado e insertado **"${newLeadData.nombre_sala}"** (${newLeadData.ciudad}) en la base de datos y sincronizado directamente con Supabase.\n\n📍 *Te he redirigido al CRM seleccionando la sala directamente.*`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, addSuccessMsg]);
    } else {
      const addFailMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'bot',
        text: `⚠️ **No se pudo guardar la sala en Supabase:**\n\n${saveErrorMessage}\n\nRevisa la sesión o intenta añadir la sala manualmente en el CRM.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, addFailMsg]);
    }
  };

  const applyUpdateLead = async (msgId: string, actionIndex: number, action: ProposedAction) => {
    const targetLead = leads.find((l) => l.id === action.leadId);
    if (targetLead && action.updatedFields) {
      onUpdateLead(action.leadId, action.updatedFields, targetLead.estado);
    }

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) return { ...m, actionStatus: 'applied' };
        return m;
      })
    );

    const updateSuccessMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: 'bot',
      text: `✏️ **Lead / Medio Actualizado con Éxito:** Se han guardado los cambios para **"${action.leadName || targetLead?.nombre_sala || 'Lead'}"** en la base de datos y Supabase.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, updateSuccessMsg]);
  };

  return { applyStatusChange, applyBand, applyConcert, applyRehearsal, applyTour, applyLogoUpdate, applyAddLead, applyUpdateLead };
}
