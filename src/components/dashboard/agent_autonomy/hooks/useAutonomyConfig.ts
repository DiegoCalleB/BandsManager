/**
 * Carga, edición, presets y guardado de la configuración de autonomía de los agentes.
 * Extraído de AgentAutonomySettingsModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { User } from "../../../../types";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { api } from "../../../../services/api";
import { BandSchedule } from "../../../../types";
import { apiFetch } from "../../../../utils/api";
import type { AgentAutonomyConfig, LearnedRuleBucket } from "../autonomyTypes";
import { ResponseStrategyForm } from "../responseTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface AutonomyConfigParams {
  initialConfig: Partial<AgentAutonomyConfig>;
  bandName: string;
  bandId: string;
  currentUser?: User;
  isOpen: boolean;
  setResponseStrategies: Dispatch<SetStateAction<Record<string, ResponseStrategyForm>>>;
  setLearnedResponseRules: Dispatch<SetStateAction<Record<string, LearnedRuleBucket>>>;
  setStartupChecklist: Dispatch<SetStateAction<{ toneTrained: boolean; templateCustomized: boolean; }>>;
  isAdmin: boolean;
  onSaveConfig: (config: AgentAutonomyConfig) => void;
  onClose: () => void;
}

/**
 * Carga, edición, presets y guardado de la configuración de autonomía de los agentes.
 * @param params Estado y callbacks del contenedor ({@link AutonomyConfigParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAutonomyConfig({ initialConfig, bandName, bandId, currentUser, isOpen, setResponseStrategies, setLearnedResponseRules, setStartupChecklist, isAdmin, onSaveConfig, onClose }: AutonomyConfigParams) {
  // State: Autonomy Settings
  const [config, setConfig] = useState<AgentAutonomyConfig>({
    dispatchLevel: initialConfig?.dispatchLevel || "draft_only",
    negotiationDepth: initialConfig?.negotiationDepth || "filter_conditions",
    minCacheByType: initialConfig?.minCacheByType || {},
    negotiationStartCacheByType:
      initialConfig?.negotiationStartCacheByType || {},
    autoDeclineUnderMinCache: initialConfig?.autoDeclineUnderMinCache ?? false,
    notifyOnEveryProposal: initialConfig?.notifyOnEveryProposal ?? true,
    requireHumanForFinalSignOff: true,
    agentSenderEmail: initialConfig?.agentSenderEmail || "",
    agentSenderName: initialConfig?.agentSenderName || `${bandName} Management`,
    agentReplyToEmail: initialConfig?.agentReplyToEmail || "",
    dispatchMode: initialConfig?.dispatchMode || "draft_gmail",
    markAsReadInInbox: initialConfig?.markAsReadInInbox ?? false,
  });

  // Indicador (punto verde en la pestaña) de si la banda tiene YA una bandeja conectada -
  // Gmail OAuth o SMTP/IMAP, lo que sea que EmailAccountConfig gestione. Estado propio y
  // desacoplado de EmailAccountConfig a propósito: solo se usa para el badge de la pestaña,
  // no duplica su lógica de conexión.
  const [emailAccountConnected, setEmailAccountConnected] = useState(false);

  // State: Band Schedules (Lector & Enviador)
  const [timezone, setTimezone] = useState<string>("Europe/Madrid");

  const [horasLector, setHorasLector] = useState<number[]>([8, 12, 16, 20]);

  const [horasEnviador, setHorasEnviador] = useState<number[]>([
    9, 10, 11, 12, 13,
  ]);

  const [diasEnviador, setDiasEnviador] = useState<number[]>([2, 3, 4]);

 // Default: Martes, Miércoles, Jueves (Top Booking)
  const [diasLector, setDiasLector] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);

 // Default: Toda la semana

  // Loading & Feedback
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [, setStatusFeedback] = useState<string | null>(null);

  useEffect(() => {
    const targetBand = bandId || currentUser?.band_id;
    if (!isOpen || !targetBand) return;
    let isMounted = true;
    const checkEmailAccountConnected = async () => {
      const [gmailOAuth, imapAccount] = await Promise.all([
        api.getGmailOAuthStatus().catch(() => null),
        api.getBandEmailAccount(targetBand).catch(() => null),
      ]);
      if (isMounted) {
        setEmailAccountConnected(
          Boolean(gmailOAuth?.connected) || Boolean(imapAccount?.connected),
        );
      }
    };
    checkEmailAccountConnected();
    return () => {
      isMounted = false;
    };
  }, [isOpen, bandId, currentUser]);

  // Load existing configuration from server
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marca la carga al abrir el modal
    setIsLoading(true);
    setStatusFeedback(null);

    const loadAllConfigs = async () => {
      try {
        const targetBand = bandId || currentUser?.band_id;
        if (!targetBand) return;

        // 1. Fetch Autonomy Config
        const serverAutonomy = await api.getAutonomyConfig().catch(() => null);
        if (isMounted && serverAutonomy) {
          setConfig((prev) => ({
            ...prev,
            dispatchLevel: serverAutonomy.dispatchLevel || prev.dispatchLevel,
            negotiationDepth:
              serverAutonomy.negotiationDepth || prev.negotiationDepth,
            minCacheByType:
              serverAutonomy.minCacheByType ?? prev.minCacheByType,
            negotiationStartCacheByType:
              serverAutonomy.negotiationStartCacheByType ??
              prev.negotiationStartCacheByType,
            autoDeclineUnderMinCache: !!serverAutonomy.autoDeclineUnderMinCache,
            notifyOnEveryProposal:
              serverAutonomy.notifyOnEveryProposal !== false,
            agentSenderEmail:
              serverAutonomy.agentSenderEmail || prev.agentSenderEmail,
            agentSenderName:
              serverAutonomy.agentSenderName || prev.agentSenderName,
            agentReplyToEmail:
              serverAutonomy.agentReplyToEmail || prev.agentReplyToEmail,
            dispatchMode: serverAutonomy.dispatchMode || prev.dispatchMode,
            markAsReadInInbox: Boolean(serverAutonomy.markAsReadInInbox),
            requireHumanForFinalSignOff: true,
          }));
        }

        // 2. Fetch Band Data to prefill email if missing
        try {
          const appState = await api.getState().catch(() => null);
          if (isMounted && appState?.bands) {
            const cleanTarget = (targetBand || "")
              .replace(/^(band|reg)-/, "")
              .toLowerCase();
            const currentBandObj = appState.bands.find(
              (b) =>
                (b.id || "").replace(/^(band|reg)-/, "").toLowerCase() ===
                cleanTarget,
            );
            if (currentBandObj) {
              const defaultEmail =
                currentBandObj.email || currentBandObj.contacto_booking?.email;
              if (defaultEmail) {
                setConfig((prev) => ({
                  ...prev,
                  agentSenderEmail: prev.agentSenderEmail || defaultEmail,
                  agentReplyToEmail: prev.agentReplyToEmail || defaultEmail,
                }));
              }
            }
          }
        } catch {
          // ignore
        }

        // 3. Fetch Response Strategies (guía condicional del Contestador)
        const serverStrategies = await api
          .getResponseStrategies()
          .catch(() => null);
        if (isMounted && serverStrategies?.responseStrategies) {
          setResponseStrategies(
            serverStrategies.responseStrategies as Record<
              string,
              ResponseStrategyForm
            >,
          );
        }

        // 3b. Fetch reglas aprendidas de respuestas (Self-Refining Tone DNA) - mismo endpoint
        // que ya usa BandToneModal.tsx, solo nos quedamos con la parte de respuestas. De paso,
        // reutilizamos la misma llamada para la señal"ADN de voz entrenado" de la checklist.
        const toneDnaRes = await apiFetch("/api/bands/tone-dna").catch(
          () => null,
        );
        if (isMounted && toneDnaRes?.data?.reglas_por_categoria_respuesta) {
          setLearnedResponseRules(
            toneDnaRes.data.reglas_por_categoria_respuesta,
          );
        }
        const toneDnaData = toneDnaRes?.data;
        const toneTrained = Boolean(
          (toneDnaData?.tono_comunicacion &&
            String(toneDnaData.tono_comunicacion).trim()) ||
          (Array.isArray(toneDnaData?.vocabulario_clave) &&
            toneDnaData.vocabulario_clave.length > 0),
        );

        // 3c. Fetch plantillas de categoría, solo para la señal"plantilla personalizada" de la
        // checklist: customInstruction empieza vacío en las 7 categorías por defecto (a
        // diferencia de guidelines, que ya viene pre-rellenado de fábrica), así que si alguna
        // tiene contenido es que el mánager escribió una instrucción propia de verdad.
        const templatesRes = await apiFetch("/api/templates").catch(() => null);
        const templateCustomized = Boolean(
          templatesRes?.templates &&
          Object.values(
            templatesRes.templates as Record<
              string,
              { customInstruction?: string }
            >,
          ).some((t) => t.customInstruction && t.customInstruction.trim()),
        );

        if (isMounted) {
          setStartupChecklist({ toneTrained, templateCustomized });
        }

        // 4. Fetch Band Schedule (Lector & Enviador crons)
        const serverSchedule: BandSchedule = await api
          .getBandSchedule(targetBand)
          .catch(() => null);
        if (isMounted && serverSchedule) {
          if (serverSchedule.timezone) setTimezone(serverSchedule.timezone);
          if (Array.isArray(serverSchedule.horas_lector)) {
            setHorasLector(serverSchedule.horas_lector.map(Number));
          }
          if (Array.isArray(serverSchedule.horas_enviador)) {
            setHorasEnviador(serverSchedule.horas_enviador.map(Number));
          }
          if (
            Array.isArray(serverSchedule.dias_enviador) &&
            serverSchedule.dias_enviador.length > 0
          ) {
            setDiasEnviador(serverSchedule.dias_enviador.map(Number));
          }
          if (
            Array.isArray(serverSchedule.dias_lector) &&
            serverSchedule.dias_lector.length > 0
          ) {
            setDiasLector(serverSchedule.dias_lector.map(Number));
          }
        }
      } catch (err) {
        console.warn("Advertencia cargando configuraciones de agentes:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadAllConfigs();
    return () => {
      isMounted = false;
    };
  }, [isOpen, bandId, currentUser?.band_id]);

  // Toggle Hour & Day Handlers
  const toggleHoraEnviador = (hour: number) => {
    if (!isAdmin) return;
    setHorasEnviador((prev) =>
      prev.includes(hour)
        ? prev.filter((h) => h !== hour)
        : [...prev, hour].sort((a, b) => a - b),
    );
  };

  const toggleDiaEnviador = (dayId: number) => {
    if (!isAdmin) return;
    setDiasEnviador((prev) =>
      prev.includes(dayId)
        ? prev.filter((d) => d !== dayId)
        : [...prev, dayId].sort((a, b) => a - b),
    );
  };

  // Schedule Presets & AI Day Suggestions
  const applyPresetRecommendedBooking = () => {
    if (!isAdmin) return;
    setDiasEnviador([2, 3, 4]); // Martes, Miércoles, Jueves
    setHorasEnviador([10, 11, 12, 13]); // Horario dorado matutino
    setDiasLector([1, 2, 3, 4, 5, 6, 7]);
    setHorasLector([9, 13, 17, 21]);
    setStatusFeedback(
      "🎯 Sugerencia IA Aplicada: Martes, Miércoles y Jueves (10:00 a 14:00). Máxima tasa de respuesta.",
    );
    setTimeout(() => setStatusFeedback(null), 3500);
  };

  const applyPresetCommercial = () => {
    if (!isAdmin) return;
    setDiasEnviador([1, 2, 3, 4, 5]);
    setHorasEnviador([9, 10, 11, 12, 13, 14]);
    setDiasLector([1, 2, 3, 4, 5, 6, 7]);
    setHorasLector([8, 12, 16, 20]);
    setStatusFeedback(
      "🏢 Preset Comercial Aplicado: Lunes a Viernes de 09:00 a 14:00.",
    );
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  const applyPresetAllDay = () => {
    if (!isAdmin) return;
    setDiasEnviador([1, 2, 3, 4, 5, 6, 7]);
    setHorasEnviador([9, 11, 13, 16, 18, 20]);
    setDiasLector([1, 2, 3, 4, 5, 6, 7]);
    setHorasLector([8, 10, 12, 14, 16, 18, 20, 22]);
    setStatusFeedback(
      "⚡ Preset Intensivo Aplicado: Todos los días con múltiples ventanas.",
    );
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  // Save All Settings
  const handleSave = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    setStatusFeedback(null);
    try {
      const targetBand = bandId || currentUser?.band_id;
      if (!targetBand) {
        setStatusFeedback(
          "⚠️ No hay ninguna banda activa para guardar la configuración.",
        );
        setIsSaving(false);
        return;
      }

      // 1. Persist Autonomy
      localStorage.setItem("bandmanager_agent_autonomy", JSON.stringify(config));
      window.dispatchEvent(new Event("autonomy-settings-changed"));
      await api.updateAutonomyConfig({
        ...config,
        band_id: targetBand,
      });

      // 2. Persist Schedule
      await api.saveBandSchedule({
        band_id: targetBand,
        timezone,
        horas_lector: horasLector,
        horas_enviador: horasEnviador,
        dias_enviador: diasEnviador,
        dias_lector: diasLector,
      });

      if (onSaveConfig) onSaveConfig(config);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (e) {
      console.error("Error guardando configuración unificada de agentes:", e);
      alert("Error guardando los ajustes en el servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  return { emailAccountConnected, setConfig, config, applyPresetRecommendedBooking, applyPresetCommercial, applyPresetAllDay, timezone, setTimezone, diasEnviador, horasEnviador, setDiasEnviador, toggleDiaEnviador, setHorasEnviador, toggleHoraEnviador, handleSave, isSaving, isLoading, savedSuccess };
}
