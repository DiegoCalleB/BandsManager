/**
 * Estado y acciones de enriquecimiento externo: rutas, redes, ventana de programación, eventos, prensa, co-booking y simulador financiero.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-explicit-any,
 react-hooks/set-state-in-effect
*/
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { apiFetch } from "../../../../utils/api";
import { Lead } from "../../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface VenueEnrichmentParams {
  selectedLead: Lead;
  setIsEnrichingApis: Dispatch<SetStateAction<boolean>>;
  setScoutActionFeedback: Dispatch<SetStateAction<string>>;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  setEditedLeadInfo: Dispatch<SetStateAction<Partial<Lead>>>;
}

/**
 * Estado y acciones de enriquecimiento externo: rutas, redes, ventana de programación, eventos, prensa, co-booking y simulador financiero.
 * @param params Estado y callbacks del contenedor ({@link VenueEnrichmentParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useVenueEnrichment({ selectedLead, setIsEnrichingApis, setScoutActionFeedback, onUpdateLead, setEditedLeadInfo }: VenueEnrichmentParams) {
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeOrigin, setRouteOrigin] = useState("Madrid");
  const [isEnrichingSocial, setIsEnrichingSocial] = useState(false);
  const [isEnrichingBookingWindow, setIsEnrichingBookingWindow] =
    useState(false);
  const [isEnrichingLocalEvents, setIsEnrichingLocalEvents] = useState(false);
  const [isEnrichingPressMedia, setIsEnrichingPressMedia] = useState(false);
  const [isEnrichingCoBooking, setIsEnrichingCoBooking] = useState(false);

  // Financial simulation state
  const [simAnticipada, setSimAnticipada] = useState<number>(
    selectedLead?.financial_break_even?.precio_entrada_anticipada ?? 12,
  );
  const [simTaquilla, setSimTaquilla] = useState<number>(
    selectedLead?.financial_break_even?.precio_entrada_taquilla ?? 15,
  );
  const [simAlquiler, setSimAlquiler] = useState<number>(
    selectedLead?.financial_break_even?.alquiler_sala_fijo ?? 250,
  );
  const [simPctSala, setSimPctSala] = useState<number>(
    selectedLead?.financial_break_even?.porcentaje_sala ?? 15,
  );
  const [simGastosProd, setSimGastosProd] = useState<number>(
    selectedLead?.financial_break_even?.gastos_produccion_fijos ?? 150,
  );
  const [simNumMusicos, setSimNumMusicos] = useState<number>(
    selectedLead?.financial_break_even?.num_musicos ?? 5,
  );
  const [isRecalculatingFinancial, setIsRecalculatingFinancial] =
    useState(false);

  useEffect(() => {
    if (selectedLead?.financial_break_even) {
      setSimAnticipada(
        selectedLead.financial_break_even.precio_entrada_anticipada ?? 12,
      );
      setSimTaquilla(
        selectedLead.financial_break_even.precio_entrada_taquilla ?? 15,
      );
      setSimAlquiler(
        selectedLead.financial_break_even.alquiler_sala_fijo ?? 250,
      );
      setSimPctSala(selectedLead.financial_break_even.porcentaje_sala ?? 15);
      setSimGastosProd(
        selectedLead.financial_break_even.gastos_produccion_fijos ?? 150,
      );
      setSimNumMusicos(selectedLead.financial_break_even.num_musicos ?? 5);
    }
    if (selectedLead?.tour_logistics?.origen) {
      setRouteOrigin(selectedLead.tour_logistics.origen);
    }
  }, [selectedLead]);

  const handleEnrichAllApis = async () => {
    if (!selectedLead) return;
    try {
      setIsEnrichingApis(true);
      setScoutActionFeedback(
        "Analizando Spotify, Google Places, Setlist, Ruta, Redes, Ventana Booking, Eventos, Prensa y Co-Booking...",
      );
      const res: any = await apiFetch(
        `/api/leads/${selectedLead.id}/enrich-all-apis`,
        {
          method: "POST",
        },
      );
      if (res?.success && res.lead) {
        if (onUpdateLead) onUpdateLead(selectedLead.id, res.lead);
        setEditedLeadInfo(res.lead);
        setScoutActionFeedback(
          "✓ Inteligencia Multi-API completa: 11 fuentes de datos conectadas y actualizadas.",
        );
      } else {
        setScoutActionFeedback(
          `Aviso: ${res?.error || "No se pudieron completar todas las consultas"}`,
        );
      }
    } catch (err: any) {
      setScoutActionFeedback(
        `Error Inteligencia: ${err?.message || "Error de conexión"}`,
      );
    } finally {
      setIsEnrichingApis(false);
      setTimeout(() => setScoutActionFeedback(null), 5000);
    }
  };

  const handleCalculateRoute = async () => {
    if (!selectedLead) return;
    try {
      setIsCalculatingRoute(true);
      setScoutActionFeedback(
        `Calculando ruta y gasolina desde ${routeOrigin}...`,
      );
      const res: any = await apiFetch(
        `/api/leads/${selectedLead.id}/enrich-logistics`,
        {
          method: "POST",
          body: JSON.stringify({ origen: routeOrigin }),
        },
      );
      if (res?.success && res.lead) {
        if (onUpdateLead) onUpdateLead(selectedLead.id, res.lead);
        setEditedLeadInfo(res.lead);
        setScoutActionFeedback(
          "✓ Hoja de ruta y costes de furgoneta calculados.",
        );
      }
    } catch (err: any) {
      setScoutActionFeedback(`Error al calcular ruta: ${err?.message}`);
    } finally {
      setIsCalculatingRoute(false);
      setTimeout(() => setScoutActionFeedback(null), 4000);
    }
  };

  const handleFetchSocial = async () => {
    if (!selectedLead) return;
    try {
      setIsEnrichingSocial(true);
      setScoutActionFeedback("Analizando Instagram & TikTok de la sala...");
      const res: any = await apiFetch(
        `/api/leads/${selectedLead.id}/enrich-social`,
        {
          method: "POST",
        },
      );
      if (res?.success && res.lead) {
        if (onUpdateLead) onUpdateLead(selectedLead.id, res.lead);
        setEditedLeadInfo(res.lead);
        setScoutActionFeedback(
          "✓ Radar de redes sociales y co-promoción actualizado.",
        );
      }
    } catch (err: any) {
      setScoutActionFeedback(`Error al analizar redes: ${err?.message}`);
    } finally {
      setIsEnrichingSocial(false);
      setTimeout(() => setScoutActionFeedback(null), 4000);
    }
  };

  const handleRecalculateFinancial = async (overrideData?: {
    precioAnticipada: number;
    precioTaquilla: number;
    alquilerSalaFijo: number;
    porcentajeSala: number;
    gastosProduccionFijos: number;
    numMusicos: number;
  }) => {
    if (!selectedLead) return;
    try {
      setIsRecalculatingFinancial(true);
      const payload = overrideData || {
        precioAnticipada: simAnticipada,
        precioTaquilla: simTaquilla,
        alquilerSalaFijo: simAlquiler,
        porcentajeSala: simPctSala,
        gastosProduccionFijos: simGastosProd,
        numMusicos: simNumMusicos,
      };
      const res: any = await apiFetch(
        `/api/leads/${selectedLead.id}/calculate-break-even`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      if (res?.success && res.lead) {
        if (onUpdateLead) onUpdateLead(selectedLead.id, res.lead);
        setEditedLeadInfo(res.lead);
        if (overrideData) {
          setSimAnticipada(overrideData.precioAnticipada);
          setSimTaquilla(overrideData.precioTaquilla);
          setSimAlquiler(overrideData.alquilerSalaFijo);
          setSimPctSala(overrideData.porcentajeSala);
          setSimGastosProd(overrideData.gastosProduccionFijos);
          setSimNumMusicos(overrideData.numMusicos);
        }
        setScoutActionFeedback("✓ P&L Financiero y Break-Even actualizados.");
      }
    } catch (err: any) {
      setScoutActionFeedback(`Error en simulación: ${err?.message}`);
    } finally {
      setIsRecalculatingFinancial(false);
      setTimeout(() => setScoutActionFeedback(null), 4000);
    }
  };

  const handleFetchBookingWindow = async () => {
    if (!selectedLead) return;
    try {
      setIsEnrichingBookingWindow(true);
      setScoutActionFeedback(
        "Analizando ventana de programación y antelación ideal...",
      );
      const res: any = await apiFetch(
        `/api/leads/${selectedLead.id}/enrich-booking-window`,
        {
          method: "POST",
        },
      );
      if (res?.success && res.lead) {
        if (onUpdateLead) onUpdateLead(selectedLead.id, res.lead);
        setEditedLeadInfo(res.lead);
        setScoutActionFeedback(
          "✓ Ventana de programación y lead time calculados.",
        );
      }
    } catch (err: any) {
      setScoutActionFeedback(`Error ventana booking: ${err?.message}`);
    } finally {
      setIsEnrichingBookingWindow(false);
      setTimeout(() => setScoutActionFeedback(null), 4000);
    }
  };

  const handleFetchLocalEvents = async () => {
    if (!selectedLead) return;
    try {
      setIsEnrichingLocalEvents(true);
      setScoutActionFeedback(
        `Escaneando festivales y eventos locales en ${selectedLead.ciudad || "la zona"}...`,
      );
      const res: any = await apiFetch(
        `/api/leads/${selectedLead.id}/enrich-local-events`,
        {
          method: "POST",
        },
      );
      if (res?.success && res.lead) {
        if (onUpdateLead) onUpdateLead(selectedLead.id, res.lead);
        setEditedLeadInfo(res.lead);
        setScoutActionFeedback(
          "✓ Radar de eventos locales y alertas de clash actualizadas.",
        );
      }
    } catch (err: any) {
      setScoutActionFeedback(`Error radar eventos: ${err?.message}`);
    } finally {
      setIsEnrichingLocalEvents(false);
      setTimeout(() => setScoutActionFeedback(null), 4000);
    }
  };

  const handleFetchPressMedia = async () => {
    if (!selectedLead) return;
    try {
      setIsEnrichingPressMedia(true);
      setScoutActionFeedback(
        `Buscando radios, fanzines y prensa cultural en ${selectedLead.ciudad || "la provincia"}...`,
      );
      const res: any = await apiFetch(
        `/api/leads/${selectedLead.id}/enrich-press-media`,
        {
          method: "POST",
        },
      );
      if (res?.success && res.lead) {
        if (onUpdateLead) onUpdateLead(selectedLead.id, res.lead);
        setEditedLeadInfo(res.lead);
        setScoutActionFeedback(
          "✓ Medios locales y gancho para nota de prensa listos.",
        );
      }
    } catch (err: any) {
      setScoutActionFeedback(`Error medios locales: ${err?.message}`);
    } finally {
      setIsEnrichingPressMedia(false);
      setTimeout(() => setScoutActionFeedback(null), 4000);
    }
  };

  return { setIsEnrichingCoBooking, handleRecalculateFinancial, isRecalculatingFinancial, handleEnrichAllApis, routeOrigin, setRouteOrigin, handleCalculateRoute, isCalculatingRoute, handleFetchSocial, isEnrichingSocial, handleFetchBookingWindow, isEnrichingBookingWindow, handleFetchLocalEvents, isEnrichingLocalEvents, handleFetchPressMedia, isEnrichingPressMedia, isEnrichingCoBooking, simAnticipada, setSimAnticipada, simTaquilla, setSimTaquilla, simAlquiler, setSimAlquiler, simPctSala, setSimPctSala, simGastosProd, setSimGastosProd, simNumMusicos, setSimNumMusicos };
}
