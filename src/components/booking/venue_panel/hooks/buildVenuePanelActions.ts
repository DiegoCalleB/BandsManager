/**
 * Acciones del panel de sala: regenerar y revertir pitch, enriquecer ficha, edición, confirmación de bolo, borrador, bitácora y formateo de teléfonos.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any
*/
import { apiFetch } from "../../../../utils/api";
import { camposCambiados } from "../../../../utils/camposCambiados";
import { Lead, LeadStatus, Setlist, InteractionLog } from "../../../../types";
import React, { Dispatch, SetStateAction, RefObject } from "react";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface buildVenuePanelActionsParams {
  setIsRegeneratingPitch: Dispatch<SetStateAction<boolean>>;
  setFeedbackSuccessMsg: Dispatch<SetStateAction<string>>;
  selectedAiModel: "gemini" | "deepseek";
  selectedLead: Lead;
  toneRating: number;
  contentRating: number;
  feedbackComment: string;
  feedbackScope: "este_pitch" | "global";
  activeCampaign: any;
  setEditedPitch: Dispatch<SetStateAction<string>>;
  setIsEditingPitch: Dispatch<SetStateAction<boolean>>;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  setToneRating: Dispatch<SetStateAction<number>>;
  setContentRating: Dispatch<SetStateAction<number>>;
  setFeedbackComment: Dispatch<SetStateAction<string>>;
  setIsRevertingPitch: Dispatch<SetStateAction<boolean>>;
  setIsEnrichingLead: Dispatch<SetStateAction<boolean>>;
  setEnrichStatusMsg: Dispatch<SetStateAction<string>>;
  setEditedLeadInfo: Dispatch<SetStateAction<Partial<Lead>>>;
  editedLeadInfo: Partial<Lead>;
  setIsSearchingLogo: Dispatch<SetStateAction<boolean>>;
  cleanVal: (val?: string) => string;
  leadAlEditarRef: RefObject<Partial<Lead>>;
  setActiveTab: Dispatch<SetStateAction<"info" | "emails" | "intelligence" | "copilot" | "bitacora">>;
  setIsEditingLeadInfo: Dispatch<SetStateAction<boolean>>;
  setShowBoloConfirmadoModal: Dispatch<SetStateAction<boolean>>;
  setFeedbackBoloMsg: Dispatch<SetStateAction<string>>;
  hiloCompleto: any[];
  setIsCreatingDraft: Dispatch<SetStateAction<boolean>>;
  setDraftError: Dispatch<SetStateAction<string>>;
  editedPitch: string;
  interactionNotes: string;
  interactionType: "Llamada" | "WhatsApp" | "Email" | "Reunión" | "Otro";
  interactionAutor: string;
  interactionResultado: "Interesado" | "Enviar propuesta" | "Seguimiento pendiente" | "Rechazado" | "Info recibida" | "Acuerdo cerrado";
  setInteractionNotes: Dispatch<SetStateAction<string>>;
  setCopiedPitch: Dispatch<SetStateAction<boolean>>;
}

/**
 * Acciones del panel de sala: regenerar y revertir pitch, enriquecer ficha, edición, confirmación de bolo, borrador, bitácora y formateo de teléfonos.
 * @param params Estado y callbacks del contenedor ({@link buildVenuePanelActionsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function buildVenuePanelActions({ setIsRegeneratingPitch, setFeedbackSuccessMsg, selectedAiModel, selectedLead, toneRating, contentRating, feedbackComment, feedbackScope, activeCampaign, setEditedPitch, setIsEditingPitch, onUpdateLead, setToneRating, setContentRating, setFeedbackComment, setIsRevertingPitch, setIsEnrichingLead, setEnrichStatusMsg, setEditedLeadInfo, editedLeadInfo, setIsSearchingLogo, cleanVal, leadAlEditarRef, setActiveTab, setIsEditingLeadInfo, setShowBoloConfirmadoModal, setFeedbackBoloMsg, hiloCompleto, setIsCreatingDraft, setDraftError, editedPitch, interactionNotes, interactionType, interactionAutor, interactionResultado, setInteractionNotes, setCopiedPitch }: buildVenuePanelActionsParams) {
  const handleRegeneratePitchWithFeedback = async (
    targetProvider?: "gemini" | "deepseek",
  ) => {
    setIsRegeneratingPitch(true);
    setFeedbackSuccessMsg(null);
    const providerToUse = targetProvider || selectedAiModel;
    try {
      const token =
        localStorage.getItem("bakandeya_token") ||
        localStorage.getItem("token") ||
        "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        headers["x-auth-token"] = token;
      }
      // En etapa de respuesta usa el endpoint del Contestador (prompt con el mensaje entrante
      // real y el hilo) en vez del de pitch inicial - antes ambos casos llamaban al mismo
      // endpoint de pitch, perdiendo el contexto de a qué estaba respondiendo la banda.
      const endpoint = isReplyStage
        ? `/api/leads/${selectedLead.id}/regenerate-reply`
        : `/api/leads/${selectedLead.id}/regenerate-pitch`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          tono_rating: toneRating || undefined,
          contenido_rating: contentRating || undefined,
          comentario: feedbackComment || undefined,
          alcance: feedbackScope,
          provider: providerToUse,
          activeCampaign,
        }),
      });

      const data = await res.json().catch(() => ({
        success: false,
        error: "Respuesta inválida del servidor",
      }));
      if (res.ok && data.success && data.newPitchText) {
        setEditedPitch(data.newPitchText);
        setIsEditingPitch(false);
        selectedLead.pitch_generado = data.newPitchText;
        const updatedHistory = data.feedbackLog
          ? [data.feedbackLog, ...(selectedLead.historial_feedback_pitch || [])]
          : selectedLead.historial_feedback_pitch || [];
        selectedLead.historial_feedback_pitch = updatedHistory;

        onUpdateLead(selectedLead.id, {
          pitch_generado: data.newPitchText,
          historial_feedback_pitch: updatedHistory,
        });

        // Reset feedback form after successful save & regenerate
        setToneRating(0);
        setContentRating(0);
        setFeedbackComment("");
        const modelLabel =
          providerToUse === "deepseek" ? "DeepSeek V3" : "Gemini 3.7 Flash";
        if (feedbackScope === "global") {
          setFeedbackSuccessMsg(
            `¡Pitch reescrito con ${modelLabel}! Aprendizaje guardado en la memoria global.`,
          );
        } else {
          setFeedbackSuccessMsg(
            `¡Pitch reescrito con ${modelLabel} aplicando tus notas a esta sala!`,
          );
        }
        setTimeout(() => setFeedbackSuccessMsg(null), 4500);
      } else {
        alert(data.error || "No se pudo regenerar el pitch.");
      }
    } catch (err: any) {
      console.error("Error al regenerar pitch:", err);
      alert(
        `Error de conexión al reescribir el pitch con IA: ${err.message || "Verifica la conexión"}`,
      );
    } finally {
      setIsRegeneratingPitch(false);
    }
  };

  const handleRevertPitch = async (targetLogId?: string) => {
    if (!selectedLead) return;
    setIsRevertingPitch(true);
    try {
      const token =
        localStorage.getItem("bakandeya_token") ||
        localStorage.getItem("token") ||
        "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        headers["x-auth-token"] = token;
      }
      const res = await fetch(`/api/leads/${selectedLead.id}/revert-pitch`, {
        method: "POST",
        headers,
        body: JSON.stringify({ logId: targetLogId }),
      });

      const data = await res.json().catch(() => ({
        success: false,
        error: "Respuesta inválida del servidor",
      }));
      if (res.ok && data.success && data.restoredPitch !== undefined) {
        const restored = data.restoredPitch;
        setEditedPitch(restored);
        setIsEditingPitch(false);
        selectedLead.pitch_generado = restored;

        const updatedHistory = (
          selectedLead.historial_feedback_pitch || []
        ).map((item) => {
          if (
            item.id ===
            (data.revertedLogId ||
              targetLogId ||
              selectedLead.historial_feedback_pitch?.[0]?.id)
          ) {
            return { ...item, deshecho: true };
          }
          return item;
        });
        selectedLead.historial_feedback_pitch = updatedHistory;

        onUpdateLead(selectedLead.id, {
          pitch_generado: restored,
          historial_feedback_pitch: updatedHistory,
        });

        setFeedbackSuccessMsg(
          "↩️ Entrenamiento deshecho: Se ha restaurado el pitch anterior.",
        );
        setTimeout(() => setFeedbackSuccessMsg(null), 5000);
      } else {
        alert(data.error || "No se pudo restaurar el pitch anterior.");
      }
    } catch (err) {
      console.error("Error al deshacer entrenamiento del pitch:", err);
      alert("Error de conexión al restaurar el pitch anterior.");
    } finally {
      setIsRevertingPitch(false);
    }
  };

  const handleEnrichLead = async () => {
    if (!selectedLead?.id) return;
    setIsEnrichingLead(true);
    setEnrichStatusMsg(
      "Investigando y completando datos oficiales sin inventar...",
    );
    try {
      const res = await apiFetch("/api/leads/enrich-lead", {
        method: "POST",
        body: JSON.stringify({
          leadId: selectedLead.id,
          force: true,
        }),
      });
      if (res.success && res.lead) {
        onUpdateLead(selectedLead.id, res.lead);
        setEditedLeadInfo(res.lead);
        setEnrichStatusMsg("✨ ¡Datos completados y verificados con éxito!");
        setTimeout(() => setEnrichStatusMsg(null), 4000);
      } else {
        setEnrichStatusMsg(
          res.error || "No se encontraron datos nuevos verificables.",
        );
        setTimeout(() => setEnrichStatusMsg(null), 4000);
      }
    } catch (err: any) {
      console.error("Error enriqueciendo lead:", err);
      setEnrichStatusMsg(err.message || "Error al completar datos.");
      setTimeout(() => setEnrichStatusMsg(null), 4000);
    } finally {
      setIsEnrichingLead(false);
    }
  };

  const handleAutoSearchLogo = async () => {
    const venueName = (
      editedLeadInfo.nombre_sala ||
      selectedLead.nombre_sala ||
      ""
    ).trim();
    if (!venueName) return;
    setIsSearchingLogo(true);
    try {
      const res = await apiFetch("/api/leads/ai-lookup", {
        method: "POST",
        body: JSON.stringify({
          nombre_sala: venueName,
          ciudad: editedLeadInfo.ciudad || selectedLead.ciudad,
          leadId: selectedLead.id,
        }),
      });
      if (res.success && res.data) {
        setEditedLeadInfo((prev) => ({
          ...prev,
          imagen_url: res.data.imagen_url || prev.imagen_url,
          icono: res.data.icono || prev.icono,
          website: res.data.website || prev.website,
          instagram: res.data.instagram || prev.instagram,
        }));
        if (res.data.imagen_url) {
          onUpdateLead(selectedLead.id, {
            imagen_url: res.data.imagen_url,
            icono: res.data.icono || editedLeadInfo.icono,
            website: res.data.website || editedLeadInfo.website,
          });
        }
      }
    } catch (err) {
      console.error("Error auto-searching logo:", err);
    } finally {
      setIsSearchingLogo(false);
    }
  };

  // Sync edits when lead changes
  const handleStartEdit = () => {
    const alEditar = {
      ...selectedLead,
      telefono: cleanVal(selectedLead.telefono),
      telefono_movil: cleanVal(selectedLead.telefono_movil),
      telefono_fijo: cleanVal(selectedLead.telefono_fijo),
    };
    leadAlEditarRef.current = alEditar;
    setEditedLeadInfo(alEditar);
    setActiveTab("info");
    setIsEditingLeadInfo(true);
  };

  const handleSaveLeadInfo = () => {
    if (!editedLeadInfo.nombre_sala) return;
    const finalInfo = {
      ...editedLeadInfo,
      telefono:
        editedLeadInfo.telefono ||
        editedLeadInfo.telefono_movil ||
        editedLeadInfo.telefono_fijo ||
        "",
    };
    // Solo lo cambiado: antes se mandaba el lead entero de cuando se pulsó «Editar» y se pisaban
    // el estado o el hilo de correos cambiados mientras tanto.
    const cambios = leadAlEditarRef.current ? camposCambiados(leadAlEditarRef.current as any, finalInfo as any) : finalInfo;
    if (Object.keys(cambios).length > 0) {
      onUpdateLead(selectedLead.id, cambios as Partial<Lead>);
    }
    leadAlEditarRef.current = null;
    setIsEditingLeadInfo(false);
  };

  const handleCorrectStatus = (newStatus: LeadStatus) => {
    if (newStatus === "confirmado") {
      setShowBoloConfirmadoModal(true);
      return;
    }
    onUpdateLead(selectedLead.id, { estado: newStatus });
  };

  const handleConfirmWithSetlist = async (data: {
    concertDate: string;
    cacheAmount?: number;
    setlistId: string;
    newSetlist?: Setlist;
  }) => {
    try {
      // 1. Si se generó un nuevo setlist automático a medida, guardarlo
      if (data.newSetlist) {
        await apiFetch("/api/setlists", {
          method: "POST",
          body: JSON.stringify(data.newSetlist),
        }).catch((err) =>
          console.warn("Error guardando setlist generado:", err),
        );
      }

      // 2. Crear el concierto en el calendario con la vinculación al setlist y al bolo
      const isFestival =
        selectedLead.tipo === "festival" ||
        selectedLead.tipo === "ayuntamiento";
      const newConcert = {
        id: `concert-crm-${selectedLead.id}-${Date.now()}`,
        fecha: data.concertDate,
        ciudad: selectedLead.ciudad || "Ciudad por definir",
        sala: selectedLead.nombre_sala,
        direccion: selectedLead.direccion || "",
        cache: data.cacheAmount || 0,
        aforo_vendido: 0,
        aforo_total: selectedLead.aforo || 0,
        contrato_firmado: true,
        estado_pago: "pendiente",
        notas: `Bolo confirmado desde el CRM. Lead: ${selectedLead.nombre_sala}`,
        tipo: isFestival ? "festival" : "sala",
        setlistId: data.setlistId,
      };

      // Si el concierto no se crea, el lead NO se confirma: antes el fallo se tragaba, el lead
      // quedaba «confirmado» sin bolo en el calendario y la pantalla decía que todo había ido bien.
      await apiFetch("/api/concerts", {
        method: "POST",
        body: JSON.stringify(newConcert),
      });

      // 3. Actualizar estado del lead en Supabase
      onUpdateLead(selectedLead.id, { estado: "confirmado" });
      // El calendario se alimenta del estado global: se pide recargarlo para que el bolo aparezca.
      window.dispatchEvent(new CustomEvent("app-data-updated"));
      setShowBoloConfirmadoModal(false);
      setFeedbackBoloMsg(
        "🎉 ¡Bolo confirmado y repertorio asignado en el calendario!",
      );
      setTimeout(() => setFeedbackBoloMsg(null), 5000);
    } catch (err) {
      console.error("Error al confirmar bolo con setlist:", err);
      setFeedbackBoloMsg(
        "No se pudo crear el bolo en el calendario, así que la sala NO se ha marcado como confirmada. Inténtalo de nuevo.",
      );
      setTimeout(() => setFeedbackBoloMsg(null), 8000);
    }
  };

  const handleConfirmWithoutSetlist = () => {
    onUpdateLead(selectedLead.id, { estado: "confirmado" });
    setShowBoloConfirmadoModal(false);
    setFeedbackBoloMsg("🎉 Concierto marcado como confirmado en el CRM.");
    setTimeout(() => setFeedbackBoloMsg(null), 4000);
  };

  // hiloCompleto (lead_messages real + hilo_emails manual) es la señal fiable de que ya hubo
  // conversación con la sala - antes solo se miraba hilo_emails (el campo legado que solo rellena
  // el sync manual de Gmail) y el estado, así que un lead cuya respuesta el Lector auto-redactó
  // (estado'pendiente_aprobacion', ver server/services/lectorAgent.ts) dejaba de detectarse como
  //"en fase de respuesta" y el botón"Aprobar" mandaba aprobado_propuesta en vez de
  // aprobado_respuesta, haciendo que el Enviador lo tratase como pitch nuevo (asunto sin"Re:",
  // vuelta a'contactado' en vez de'negociando').
  const isReplyStage =
    hiloCompleto.length > 0 ||
    selectedLead.estado === "respondido" ||
    selectedLead.estado === "negociando";

  // Al aprobar se dispara el Agente Enviador en el servidor para este lead concreto
  // (POST /api/trigger-agent, el mismo endpoint que usa el scheduler) en vez de crear el
  // borrador desde el navegador: el servidor ya sabe elegir entre la API de Gmail por OAuth
  // (sin contraseña, sin popup - ver server/services/gmailApiClient.ts) y el camino IMAP con
  // contraseña de aplicación para Outlook (server/services/agentEngine.ts). Así el botón
  //"Aprobar" y el Agente Enviador programado comparten una sola implementación, sin duplicar
  // lógica ni depender de Firebase/popup en el cliente. Si falla (sin email de contacto, sin
  // ninguna cuenta conectada...), el lead cae de todos modos en el estado de aprobado clásico
  // para no perder la aprobación humana.
  const createDraftAndApprove = async (
    pitchText: string,
    alsoSavePitch: boolean,
  ) => {
    const approvalState = isReplyStage
      ? "aprobado_respuesta"
      : "aprobado_propuesta";

    setIsCreatingDraft(true);
    setDraftError(null);

    // El Enviador (server/services/agentEngine.ts), cuando se dispara para un lead concreto como
    // aquí, lo busca por id SIN filtrar por estado - decide si es respuesta (asunto"Re:",
    // pasa a'negociando' al enviar) mirando lead.estado ==='aprobado_respuesta' en Supabase EN
    // ESE MOMENTO. Antes esto solo se guardaba si la petición fallaba, así que en el camino
    // normal el Enviador seguía viendo el estado anterior (p.ej.'pendiente_aprobacion') y
    // trataba cualquier respuesta aprobada como si fuera un pitch nuevo. Hace falta escribirlo
    // (y esperar a que el PATCH llegue a Supabase) ANTES de disparar el agente.
    const updates: Partial<Lead> = { estado: approvalState };
    if (alsoSavePitch) updates.pitch_generado = pitchText;
    // onUpdateLead devuelve false si el servidor no guardó la aprobación: en ese caso NO se lanza
    // el Enviador (leería el estado viejo y trataría la respuesta como un pitch nuevo).
    const aprobacionGuardada = ((await onUpdateLead(selectedLead.id, updates)) as unknown) !== false;
    if (!aprobacionGuardada) {
      setDraftError("No se pudo guardar la aprobación. No se ha creado ningún borrador: inténtalo de nuevo.");
      setIsCreatingDraft(false);
      return;
    }

    let draftError = "";
    try {
      const data = await apiFetch("/api/trigger-agent", {
        method: "POST",
        body: JSON.stringify({
          agentName: "enviador",
          params: { id: selectedLead.id, trigger_type: "usuario_manual" },
        }),
      });

      const leadResult = Array.isArray(data.results)
        ? data.results.find((r: any) => r.id === selectedLead.id)
        : null;
      if (
        leadResult?.status === "borrador" ||
        leadResult?.status === "enviado"
      ) {
        onUpdateLead(selectedLead.id, { estado: "borrador_creado" });
      } else {
        draftError =
          leadResult?.error || data.message || "No se pudo crear el borrador.";
      }
    } catch (err: any) {
      console.error("Error aprobando lead:", err);
      draftError = err.message || "Error al aprobar el lead.";
    }

    if (draftError) {
      // El estado ya quedó en approvalState (guardado arriba) - el mánager puede reintentar la
      // aprobación sin perderla.
      setDraftError(draftError);
    }

    setIsCreatingDraft(false);
  };

  const handleSavePitch = () => {
    setIsEditingPitch(false);
    void createDraftAndApprove(editedPitch, true);
  };

  const handleApprovePitchDirectly = () => {
    void createDraftAndApprove(selectedLead.pitch_generado || "", false);
  };

  const handleAddInteractionLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionNotes.trim()) return;

    const nowStr = new Date().toISOString().replace("T", " ").slice(0, 16);
    const newLog: InteractionLog = {
      id: `log-${Date.now()}`,
      fecha: nowStr,
      tipo: interactionType,
      autor: interactionAutor,
      notas: interactionNotes.trim(),
      resultado: interactionResultado,
    };

    const existingLogs = selectedLead.historial_contacto || [];
    const updatedLogs = [newLog, ...existingLogs];

    let newStatus = selectedLead.estado;
    if (interactionResultado === "Interesado") {
      newStatus = "negociando";
    } else if (interactionResultado === "Acuerdo cerrado") {
      newStatus = "confirmado";
    } else if (interactionResultado === "Rechazado") {
      newStatus = "no_interesado";
    }

    onUpdateLead(selectedLead.id, {
      historial_contacto: updatedLogs,
      estado: newStatus,
      fecha_ultima_respuesta: new Date().toISOString().slice(0, 10),
    });

    setInteractionNotes("");
  };

  const handleDeleteInteractionLog = (logId: string) => {
    if (!selectedLead.historial_contacto) return;
    const updated = selectedLead.historial_contacto.filter(
      (l) => l.id !== logId,
    );
    onUpdateLead(selectedLead.id, { historial_contacto: updated });
  };

  const handleCopyPitch = () => {
    if (selectedLead.pitch_generado) {
      navigator.clipboard.writeText(selectedLead.pitch_generado);
      setCopiedPitch(true);
      setTimeout(() => setCopiedPitch(false), 2000);
    }
  };

  const phoneCleanMobile = selectedLead.telefono_movil
    ? selectedLead.telefono_movil.replace(/\D/g, "")
    : "";
  const phoneCleanFijo = selectedLead.telefono_fijo
    ? selectedLead.telefono_fijo.replace(/\D/g, "")
    : "";
  const phoneCleanLegacy = selectedLead.telefono
    ? selectedLead.telefono.replace(/\D/g, "")
    : "";
  // WhatsApp sólo está habilitado cuando existe teléfono móvil
  const phoneCleanForWhatsApp = phoneCleanMobile;
  const phoneClean = phoneCleanMobile || phoneCleanFijo || phoneCleanLegacy;

  return { handleStartEdit, handleCorrectStatus, isReplyStage, handleApprovePitchDirectly, handleEnrichLead, handleSaveLeadInfo, handleAutoSearchLogo, handleCopyPitch, handleRegeneratePitchWithFeedback, handleSavePitch, handleRevertPitch, handleAddInteractionLog, handleDeleteInteractionLog, handleConfirmWithSetlist, handleConfirmWithoutSetlist };
}
