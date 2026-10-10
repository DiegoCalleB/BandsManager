/**
 * Aprueba leads y crea/envía borradores de email a través del agente enviador.
 * Extraído de useChatActions.ts (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction } from "react";
import { Lead } from "../../../types";
import { apiFetch } from "../../../utils/api";
import { getErrorMessage } from "../../../utils/errorMessage";
import type { ChatAutonomyConfig } from "../chatTypes";
import { ChatMessage, ProposedAction, TriggerAgentResponse } from "../chatTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface LeadEmailActionsParams {
  leads: Lead[];
  autonomyConfig: ChatAutonomyConfig;
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
}

/**
 * Aprueba leads y crea/envía borradores de email a través del agente enviador.
 * @param params Estado y callbacks del contenedor ({@link LeadEmailActionsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useLeadEmailActions({ leads, autonomyConfig, onUpdateLead, setMessages }: LeadEmailActionsParams) {
  // Confirm action callback

  const applyLeadApproval = async (msgId: string, actionIndex: number, action: ProposedAction) => {
    const targetLead = leads.find((l) => l.id === action.leadId);
    if (targetLead) {
      const today = new Date().toISOString().split('T')[0];
      const nowStr = `${today} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

      const emailBody = action.body || targetLead.pitch_generado || '';
      const recipientEmail = targetLead.email_contacto;
      const isDraftOnly = autonomyConfig.dispatchLevel === 'draft_only' || autonomyConfig.dispatchLevel !== 'autonomous_first_contact';

      if (isDraftOnly) {
        // Antes esto abría un popup de Google (Firebase Auth) para crear el borrador - imposible
        // de repetir sin usuario delante, y por tanto incompatible con que el Agente Enviador
        // programado hiciera lo mismo sin contraseña. Dispara el mismo endpoint que usa el
        // scheduler (POST /api/trigger-agent), que ya elige entre la API de Gmail por OAuth (sin
        // popup) y el IMAP con contraseña de aplicación para Outlook (server/services/agentEngine.ts)
        // - así el borrador vale igual venga del chatbot, del botón"Aprobar" del CRM o del scheduler.
        let gmailOk = false;
        let gmailError = '';
        if (!recipientEmail) {
          gmailError = 'La sala no tiene un correo de contacto (email_contacto).';
        } else {
          try {
            if (emailBody && emailBody !== targetLead.pitch_generado) {
              await onUpdateLead(action.leadId, { pitch_generado: emailBody }, targetLead.estado);
            }
            const data = await apiFetch<TriggerAgentResponse>('/api/trigger-agent', {
              method: 'POST',
              body: JSON.stringify({ agentName: 'enviador', params: { id: targetLead.id, trigger_type: 'chatbot' } }),
            });
            const leadResult = Array.isArray(data.results) ? data.results.find((r) => r.id === targetLead.id) : null;
            gmailOk = leadResult?.status === 'borrador';
            if (!gmailOk) gmailError = leadResult?.error || data.message || 'No se pudo crear el borrador.';
          } catch (err) {
            console.error('Error aprobando lead vía Chatbot:', err);
            gmailError = getErrorMessage(err, 'Error al aprobar el lead.');
          }
        }

        const updatedNotes = `*** [${nowStr}] Borrador Creado por Mánager IA (Modo Sólo Borradores Activo) ***\n${targetLead.notas || ''}`;
        onUpdateLead(
          action.leadId,
          {
            estado: gmailOk ? 'borrador_creado' : 'pendiente_aprobacion',
            pitch_generado: emailBody || targetLead.pitch_generado,
            notas: updatedNotes,
          },
          targetLead.estado
        );
        // El servidor ya audita la ejecución (logAgentExecution dentro de runEnviadorAgent), no
        // hace falta duplicar el registro aquí como antes.

        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === msgId) return { ...m, actionStatus: 'applied' };
            return m;
          })
        );

        const draftMsg: ChatMessage = {
          id: `sys-${Date.now()}`,
          sender: 'bot',
          text: gmailOk
            ? `📝 **Borrador Creado (Modo Sólo Borradores Activo):**\n\n🔒 Por seguridad y al estar la autonomía fijada en **SÓLO BORRADORES**, el correo NO se ha enviado directamente.\nSe ha generado el **borrador real** en tu bandeja de email para **"${recipientEmail}"** (${targetLead.nombre_sala}).\n- **Estado:** Guardado para revisión humana obligatoria.`
            : `⚠️ **No se pudo crear el borrador:** ${gmailError || 'Error desconocido.'}\n\nEl lead queda pendiente de aprobación para que lo revises a mano.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, draftMsg]);
      } else {
        // Envío directo (autonomía"Auto 1er Contacto"): esto abría un popup de Google (Firebase
        // Auth) y mandaba el correo directo desde el navegador con el token personal de quien
        // estuviera en el chat - saltándose los dos interruptores de seguridad que sí respeta el
        // Agente Enviador (AGENT_EMAIL_MODE de la plataforma y el dispatch_mode de la banda, ver
        // AGENTS.md sección 3): un envío disparado desde aquí podía salir de verdad aunque el
        // kill switch global siguiera en modo seguro. Mismo arreglo que ya se aplicó a la rama de
        //"Sólo Borradores" de arriba: dispara el mismo endpoint que usa el scheduler
        // (POST /api/trigger-agent), que es quien de verdad decide si envía o deja borrador.
        let enviadoOk = false;
        let estadoNuevo = '';
        let fechaEnvioReal = '';
        let gmailError = '';

        if (!recipientEmail) {
          gmailError = 'La sala no tiene un correo de contacto (email_contacto).';
        } else {
          try {
            if (emailBody && emailBody !== targetLead.pitch_generado) {
              await onUpdateLead(action.leadId, { pitch_generado: emailBody }, targetLead.estado);
            }
            const data = await apiFetch<TriggerAgentResponse>('/api/trigger-agent', {
              method: 'POST',
              body: JSON.stringify({ agentName: 'enviador', params: { id: targetLead.id, trigger_type: 'chatbot' } }),
            });
            const leadResult = Array.isArray(data.results) ? data.results.find((r) => r.id === targetLead.id) : null;
            enviadoOk = leadResult?.status === 'enviado';
            estadoNuevo = leadResult?.estado_nuevo || '';
            fechaEnvioReal = leadResult?.fecha_envio || '';
            if (!enviadoOk) gmailError = leadResult?.error || data.message || 'No se pudo enviar el correo.';
          } catch (err) {
            console.error('Error aprobando lead vía Chatbot:', err);
            gmailError = getErrorMessage(err, 'Error al aprobar el lead.');
          }
        }

        const updatedNotes = `*** [${nowStr}] Correo APROBADO Y ENVIADO vía Chatbot AI Assistant ***\n${targetLead.notas || ''}`;
        onUpdateLead(
          action.leadId,
          {
            estado: (enviadoOk ? estadoNuevo || 'contactado' : 'pendiente_aprobacion') as Lead['estado'],
            fecha_envio: enviadoOk ? fechaEnvioReal || nowStr : undefined,
            pitch_generado: emailBody || targetLead.pitch_generado,
            notas: updatedNotes,
          },
          targetLead.estado
        );

        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === msgId) return { ...m, actionStatus: 'applied' };
            return m;
          })
        );

        const successMsg: ChatMessage = {
          id: `sys-${Date.now()}`,
          sender: 'bot',
          text: enviadoOk
            ? `📧 **¡Correo Enviado con Éxito!**\n\nSe ha enviado el correo oficialmente a **"${recipientEmail}"** (${targetLead.nombre_sala}).\n- **Estado:** ${estadoNuevo || 'Enviado'} (${nowStr})\n- **Sincronización:** Supabase actualizado.`
            : `✅ **Aprobación Registrada en Supabase:** Se ha marcado como aprobado **"${targetLead.nombre_sala}"** en la base de datos.${gmailError ? `\n\n⚠️ *Aviso:* ${gmailError}` : ''}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, successMsg]);
      }
    }
  };

  const applyDraftEmail = async (msgId: string, actionIndex: number, action: ProposedAction) => {
    const targetLead = leads.find((l) => l.id === action.leadId);
    const rawDraftBody = action.body || targetLead?.pitch_generado || '';

    // Antes esto abría un popup de Google para crear el borrador (ver comentario en
    // propose_lead_approval, más arriba) - ahora dispara el Agente Enviador en el servidor
    // (POST /api/trigger-agent), que crea el borrador sin popup vía la API de Gmail por OAuth
    // si la banda la tiene conectada, o por IMAP si no.
    let gmailOk = false;
    let gmailError = '';

    if (!targetLead) {
      gmailError = 'No se encontró el lead.';
    } else if (!targetLead.email_contacto) {
      gmailError = 'La sala no tiene un correo de contacto (email_contacto).';
    } else {
      try {
        if (rawDraftBody && rawDraftBody !== targetLead.pitch_generado) {
          await onUpdateLead(action.leadId, { pitch_generado: rawDraftBody }, targetLead.estado);
        }
        const data = await apiFetch<TriggerAgentResponse>('/api/trigger-agent', {
          method: 'POST',
          body: JSON.stringify({ agentName: 'enviador', params: { id: targetLead.id, trigger_type: 'chatbot' } }),
        });
        const leadResult = Array.isArray(data.results) ? data.results.find((r) => r.id === targetLead.id) : null;
        gmailOk = leadResult?.status === 'borrador';
        if (!gmailOk) gmailError = leadResult?.error || data.message || 'No se pudo crear el borrador.';
      } catch (err) {
        console.error('Error creando el borrador vía Chatbot:', err);
        gmailError = getErrorMessage(err, 'Error al crear el borrador.');
      }
    }

    if (targetLead) {
      const today = new Date().toISOString().split('T')[0];
      const updatedNotes = `*** [${today}] Borrador guardado vía Chatbot AI ***\n${targetLead.notas || ''}`;
      onUpdateLead(
        action.leadId,
        {
          pitch_generado: rawDraftBody || targetLead.pitch_generado,
          estado: gmailOk ? 'borrador_creado' : 'pendiente_aprobacion',
          notas: updatedNotes,
        },
        targetLead.estado
      );
    }
    // El servidor ya audita la ejecución (logAgentExecution dentro de runEnviadorAgent), no
    // hace falta duplicar el registro aquí como antes.

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) return { ...m, actionStatus: 'applied' };
        return m;
      })
    );

    const draftSuccessMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: 'bot',
      text: gmailOk
        ? `📝 **Borrador Creado y Guardado:**\n\nSe ha creado el borrador real en tu bandeja de email para **"${targetLead?.email_contacto}"** (${targetLead?.nombre_sala}).\n- **Estado:** Pendiente de revisión humana.`
        : `⚠️ **No se pudo crear el borrador:** ${gmailError || 'Error desconocido.'}\n\nEl lead queda pendiente de aprobación para que lo revises a mano.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, draftSuccessMsg]);
  };

  const applySendEmail = async (msgId: string, actionIndex: number, action: ProposedAction) => {
    const targetLead = leads.find((l) => l.id === action.leadId);
    const today = new Date().toISOString().split('T')[0];
    const nowStr = `${today} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    const isDraftOnly = autonomyConfig.dispatchLevel === 'draft_only' || autonomyConfig.dispatchLevel !== 'autonomous_first_contact';

    if (targetLead) {
      const emailBody = action.body || targetLead.pitch_generado || '';
      const recipientEmail = targetLead.email_contacto;

      if (isDraftOnly) {
        // Ver comentario en propose_lead_approval: dispara el Agente Enviador en el servidor
        // en vez de abrir el popup de Google, para que funcione igual que el scheduler.
        let gmailOk = false;
        let gmailError = '';
        if (!recipientEmail) {
          gmailError = 'El lead/sala no tiene un correo de contacto definido (email_contacto).';
        } else {
          try {
            if (emailBody && emailBody !== targetLead.pitch_generado) {
              await onUpdateLead(action.leadId, { pitch_generado: emailBody }, targetLead.estado);
            }
            const data = await apiFetch<TriggerAgentResponse>('/api/trigger-agent', {
              method: 'POST',
              body: JSON.stringify({ agentName: 'enviador', params: { id: targetLead.id, trigger_type: 'chatbot' } }),
            });
            const leadResult = Array.isArray(data.results) ? data.results.find((r) => r.id === targetLead.id) : null;
            gmailOk = leadResult?.status === 'borrador';
            if (!gmailOk) gmailError = leadResult?.error || data.message || 'No se pudo crear el borrador.';
          } catch (err) {
            console.error('Error creando el borrador vía Chatbot:', err);
            gmailError = getErrorMessage(err, 'Error al crear el borrador.');
          }
        }

        const updatedNotes = `*** [${nowStr}] Borrador Creado por Mánager IA (Bloqueado Modo Solo Borradores) ***\n${targetLead.notas || ''}`;
        onUpdateLead(
          action.leadId,
          {
            estado: gmailOk ? 'borrador_creado' : 'pendiente_aprobacion',
            pitch_generado: emailBody,
            notas: updatedNotes,
          },
          targetLead.estado
        );
        // El servidor ya audita la ejecución (logAgentExecution dentro de runEnviadorAgent).

        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === msgId) return { ...m, actionStatus: 'applied' };
            return m;
          })
        );

        const draftOnlyMsg: ChatMessage = {
          id: `sys-${Date.now()}`,
          sender: 'bot',
          text: gmailOk
            ? `📝 **Borrador Creado (Modo Sólo Borradores Activo):**\n\n🔒 Por seguridad y al estar la autonomía en **SÓLO BORRADORES**, el correo NO se ha enviado directamente.\nSe ha creado el **borrador real** en tu bandeja de email para **"${recipientEmail}"** (${targetLead.nombre_sala}).\n- **Estado:** Guardado para revisión humana.`
            : `⚠️ **No se pudo crear el borrador:** ${gmailError || 'Error desconocido.'}\n\nEl lead queda pendiente de aprobación para que lo revises a mano.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, draftOnlyMsg]);
      } else {
        // Envío directo (autonomía"Auto 1er Contacto"): igual que en propose_lead_approval, esto
        // abría el popup de Google y enviaba desde el navegador saltándose AGENT_EMAIL_MODE y el
        // dispatch_mode de la banda. Dispara el mismo endpoint que el scheduler.
        let enviadoOk = false;
        let estadoNuevo = '';
        let fechaEnvioReal = '';
        let gmailError = '';

        if (!recipientEmail) {
          gmailError = 'El lead/sala no tiene un correo de contacto definido (email_contacto).';
        } else {
          try {
            if (emailBody && emailBody !== targetLead.pitch_generado) {
              await onUpdateLead(action.leadId, { pitch_generado: emailBody }, targetLead.estado);
            }
            const data = await apiFetch<TriggerAgentResponse>('/api/trigger-agent', {
              method: 'POST',
              body: JSON.stringify({ agentName: 'enviador', params: { id: targetLead.id, trigger_type: 'chatbot' } }),
            });
            const leadResult = Array.isArray(data.results) ? data.results.find((r) => r.id === targetLead.id) : null;
            enviadoOk = leadResult?.status === 'enviado';
            estadoNuevo = leadResult?.estado_nuevo || '';
            fechaEnvioReal = leadResult?.fecha_envio || '';
            if (!enviadoOk) gmailError = leadResult?.error || data.message || 'No se pudo enviar el correo.';
          } catch (err) {
            console.error('Error procesando el correo vía Chatbot:', err);
            gmailError = getErrorMessage(err, 'Error al aprobar el lead.');
          }
        }

        const updatedNotes = `*** [${nowStr}] Correo ENVIADO a ${recipientEmail || 'sin_email'} por ${action.senderName || 'Mánager Virtual Chatbot'} ***\n${targetLead.notas || ''}`;
        onUpdateLead(
          action.leadId,
          {
            estado: (enviadoOk ? estadoNuevo || 'contactado' : 'pendiente_aprobacion') as Lead['estado'],
            fecha_envio: enviadoOk ? fechaEnvioReal || nowStr : undefined,
            pitch_generado: emailBody,
            notas: updatedNotes,
          },
          targetLead.estado
        );

        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === msgId) return { ...m, actionStatus: 'applied' };
            return m;
          })
        );

        const sendSuccessMsg: ChatMessage = {
          id: `sys-${Date.now()}`,
          sender: 'bot',
          text: enviadoOk
            ? `📧 **¡Correo ENVIADO REALMENTE!**\n\nEl correo ha sido enviado oficialmente a **"${recipientEmail}"** (${targetLead.nombre_sala}).\n- **Estado:** ${estadoNuevo || 'Enviado'} (${nowStr})\n- **Firma & EPK:** Incluidos automáticamente.\n\nSe ha actualizado el estado y registrado la fecha de envío en Supabase.`
            : `📧 **Correo Marcado como Aprobado en Supabase:**\n\nSe ha actualizado el estado de **"${action.leadName || targetLead.nombre_sala}"** a **Pendiente de Aprobación** en la base de datos (${nowStr}).\n\n⚠️ **Atención:** ${gmailError}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, sendSuccessMsg]);
      }
    }

    try {
      window.dispatchEvent(new Event('app-data-updated'));
    } catch {
      // Ignorado a propósito: es un efecto secundario opcional (evento de actualización, dictado o limpieza).
    }
  };

  return { applyLeadApproval, applyDraftEmail, applySendEmail };
}
