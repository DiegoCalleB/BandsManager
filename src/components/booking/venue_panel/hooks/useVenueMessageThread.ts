import type { SentimentResponse } from "../apiResponses";
/**
 * Hilo de mensajes del lead y análisis de sentimiento.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 react-hooks/set-state-in-effect
*/
import React,{ useEffect,useState } from "react";
import { api } from "../../../../services/api";
import { EmailMessage,Lead } from "../../../../types";
import { apiFetch } from "../../../../utils/api";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface VenueMessageThreadParams {
  selectedLead: Lead;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

/**
 * Hilo de mensajes del lead y análisis de sentimiento.
 * @param params Estado y callbacks del contenedor ({@link VenueMessageThreadParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useVenueMessageThread({ selectedLead, onUpdateLead }: VenueMessageThreadParams) {
  // Historial real de conversación (lead_messages, escrito por el Enviador/Lector) - independiente
  // de selectedLead.hilo_emails, que solo lo rellena el sync manual de Gmail del cliente. Sin esto,
  // los pitches enviados de verdad y las respuestas detectadas automáticamente nunca aparecían aquí.
  const [leadMessages, setLeadMessages] = useState<EmailMessage[]>([]);
  const [isAnalyzingMessageSentiment, setIsAnalyzingMessageSentiment] =
    useState<string | null>(null);

  useEffect(() => {
    if (!selectedLead?.id) {
      setLeadMessages([]);
      return;
    }
    let isMounted = true;
    api
      .getLeadMessages(selectedLead.id)
      .then((res) => {
        if (isMounted) setLeadMessages(res?.messages || []);
      })
      .catch(() => {
        if (isMounted) setLeadMessages([]);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedLead?.id]);

  const handleAnalyzeMessageSentiment = async (
    messageId: string,
    messageText: string,
  ) => {
    if (!selectedLead || !messageText) return;
    try {
      setIsAnalyzingMessageSentiment(messageId);
      const res = await apiFetch<SentimentResponse>(
`/api/leads/${selectedLead.id}/analyze-sentiment`,
        {
          method: "POST",
          body: JSON.stringify({ messageText }),
        },
      );
      if (res?.success && res.sentimentAnalysis) {
        const sa = res.sentimentAnalysis;
        setLeadMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  sentimiento: sa.sentimiento,
                  sentimiento_score: sa.sentimiento_score,
                  sentimiento_label: sa.sentimiento_label,
                  intencion: sa.intencion,
                  intencion_etiqueta: sa.intencion_etiqueta,
                  temperatura: sa.temperatura,
                  objeciones: sa.objeciones_detectadas,
                  puntos_clave: sa.puntos_clave,
                  resumen_ejecutivo: sa.resumen_ejecutivo,
                  sugerencia_estrategia: sa.sugerencia_estrategia,
                  analisis_ia: sa,
                }
              : m,
          ),
        );
        if (onUpdateLead) {
          onUpdateLead(selectedLead.id, {
            ultimo_sentimiento: sa.sentimiento,
            ultimo_sentimiento_score: sa.sentimiento_score,
            ultimo_sentimiento_label: sa.sentimiento_label,
            ultima_intencion: sa.intencion,
            ultima_intencion_etiqueta: sa.intencion_etiqueta,
            ultimas_objeciones: sa.objeciones_detectadas,
            ultimo_analisis_resumen: sa.resumen_ejecutivo,
            temperatura_lead: sa.temperatura,
          });
        }
      }
    } catch (err) {
      console.error("Error analizando sentimiento:", err);
    } finally {
      setIsAnalyzingMessageSentiment(null);
    }
  };

  // Une el hilo manual (hilo_emails) con el real (lead_messages), sin duplicar por asunto+fecha
  // aproximada, y ordenado cronológicamente - una banda puede tener las dos fuentes a la vez si
  // sincronizó Gmail a mano alguna vez además de dejar que los agentes trabajen.
  const hiloCompleto = React.useMemo(() => {
    const manual = (selectedLead?.hilo_emails || []).map((m) => ({
      ...m,
      _origen: "manual" as const,
    }));
    const real = leadMessages.map((m) => ({ ...m, _origen: "real" as const }));
    const todos = [...real, ...manual].filter(
      (m, idx, arr) =>
        arr.findIndex(
          (o) => o.mensaje === m.mensaje && o.remitente === m.remitente,
        ) === idx,
    );
    return todos.sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    );
  }, [selectedLead?.hilo_emails, leadMessages]);

  // Clean helper for values like #ERROR!
  const cleanVal = (val?: string) => {
    if (
      !val ||
      val.includes("#ERROR!") ||
      val.includes("#N/A") ||
      val.includes("#VALUE!")
    )
      return "";
    return val;
  };

  return { cleanVal, hiloCompleto, handleAnalyzeMessageSentiment, isAnalyzingMessageSentiment };
}
