import React, { useState, useEffect } from "react";
import {
  Lead,
  LeadStatus,
  LeadType,
  InteractionLog,
  Setlist,
  EmailMessage,
  Concert,
} from "../../types";
import {
  checkBandDateConflict,
  getCityTourHistory,
  getCommercialDealSnippets,
} from "../../utils/bookingTourContext";
import { LeadHealthBadge } from "./LeadHealthBadge";
import { VerifiedBadge } from "../common/VerifiedBadge";
import { LeadAvatar } from "./LeadAvatar";
import { ReliabilityBadge } from "../common/ReliabilityBadge";
import { FavoriteButton } from "../common/FavoriteButton";
import { isLeadVerificado } from "../../utils/leadReliability";
import DirectionsCard from "../DirectionsCard";
import { apiFetch } from "../../utils/api";
import { api } from "../../services/api";
import { MultiModelPitchComparatorModal } from "./MultiModelPitchComparatorModal";
import { BoloConfirmadoSetlistModal } from "./BoloConfirmadoSetlistModal";
import { DealAndLogisticsCopilot } from "./DealAndLogisticsCopilot";
import { QuickDealSimulator } from "./QuickDealSimulator";
import {
  isLeadNeedsFollowup,
  getDaysSinceContact,
  generateFollowupTemplate,
} from "../../utils/bookingFollowup";
import {
  formatFestivalDateRange,
  toIsoDateString,
} from "../../utils/festivalDateFormat";
import { HolidayDateWarning } from "../common/HolidayDateWarning";
import { PublicoSilhouette } from "../ui/PublicoSilhouette";
import {
  Edit3,
  X,
  Sparkles,
  MessageCircle,
  PhoneCall,
  Phone,
  Smartphone,
  Mail,
  Instagram,
  CheckCircle2,
  History,
  Save,
  Trash2,
  ChevronDown,
  Send,
  AlertCircle,
  Copy,
  ExternalLink,
  Star,
  MessageSquare,
  RefreshCw,
  Loader2,
  Upload,
  Undo2,
  RotateCcw,
  Layers,
  ShieldAlert,
  Clock,
  Sliders,
  DollarSign,
  CalendarCheck,
  Eye,
  CheckCheck,
  MousePointerClick,
  Globe,
  Compass,
  Calendar,
  Headphones,
  ShieldCheck,
  TrendingUp,
  Radio,
  Disc,
  MapPin,
  Image as ImageIcon,
  Truck,
  Fuel,
  Calculator,
  Coins,
  Users,
  Percent,
  Wallet,
  Navigation,
  CalendarDays,
  Megaphone,
  Newspaper,
  PartyPopper,
  Flame,
  Handshake,
} from "lucide-react";
import { EmailDeliveryTicks } from "./EmailDeliveryTicks";
import {
  getWhatsAppUrl,
  openWhatsAppChat,
  WHATSAPP_WINDOW_NAME,
} from "../../utils/whatsapp";
import { WhatsAppPreviewModal } from "./WhatsAppPreviewModal";
import { ShowIcon } from '../ui/ShowIcon';
import { Button, IconButton, Input, LinkButton, Select, Textarea } from '../ui';

// Espectro resuelve claro/oscuro en tokens: las ramas `isStitchLight` que llegan de main no deben
// activarse nunca (traerían de vuelta slate/indigo). Se eliminan en el restyle de este fichero.
const isStitchLight = false;

interface VenueDetailPanelProps {
  selectedLead: Lead | null;
  onClose: () => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onDeleteLead?: (id: string, name: string) => void;
  getStatusBadgeClass: (status: LeadStatus | string) => string;
  getStatusLabel: (status: LeadStatus | string) => string;
  getStatusDotColor: (status: LeadStatus | string) => string;
  normalizeStatus: (status: string) => LeadStatus;
  normalizeType: (type?: string) => string;
  autoDetectVenueAddress: (venueName: string, city: string) => string;
  sectionTab: "salas" | "medios" | "grupos";
  activeCampaign?: any;
  onLeadLogoUpload?: (file: File) => Promise<string | null> | void;
  isUploadingLeadLogo?: boolean;
  initialTab?: "info" | "emails" | "copilot" | "bitacora";
  onOpenRoadbookModal?: (lead: Lead) => void;
  onFilterByRouteCity?: (city: string) => void;
  bandName?: string;
  concerts?: Concert[];
}

export const VenueDetailPanel: React.FC<VenueDetailPanelProps> = ({
  selectedLead,
  onClose,
  onUpdateLead,
  onDeleteLead,
  getStatusBadgeClass,
  getStatusLabel,
  getStatusDotColor,
  normalizeStatus,
  normalizeType,
  autoDetectVenueAddress,
  sectionTab,
  activeCampaign,
  onLeadLogoUpload,
  isUploadingLeadLogo = false,
  initialTab = "info",
  onOpenRoadbookModal,
  onFilterByRouteCity,
  bandName,
  concerts = [],
}) => {
  // Active Tab inside panel
  const [activeTab, setActiveTab] = useState<
    "info" | "emails" | "intelligence" | "copilot" | "bitacora"
  >(initialTab as any);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, selectedLead?.id]);

  // Edit Lead State
  const [isEditingLeadInfo, setIsEditingLeadInfo] = useState(false);
  const [editedLeadInfo, setEditedLeadInfo] = useState<Partial<Lead>>({
    ...selectedLead,
  });

  useEffect(() => {
    setEditedLeadInfo({ ...selectedLead });
  }, [selectedLead]);

  // Pitch Editing & Feedback State
  const [isEditingPitch, setIsEditingPitch] = useState(false);
  const [editedPitch, setEditedPitch] = useState(
    selectedLead?.pitch_generado || "",
  );
  const [isEnrichingApis, setIsEnrichingApis] = useState(false);
  const [toneRating, setToneRating] = useState<number>(0);
  const [contentRating, setContentRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>("");
  const [feedbackScope, setFeedbackScope] = useState<"este_pitch" | "global">(
    "este_pitch",
  );
  const [isRegeneratingPitch, setIsRegeneratingPitch] = useState(false);
  const [isRevertingPitch, setIsRevertingPitch] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(
    null,
  );
  const [showFeedbackHistory, setShowFeedbackHistory] = useState(false);
  const [showMultiModelModal, setShowMultiModelModal] = useState(false);
  const [selectedAiModel, setSelectedAiModel] = useState<"gemini" | "deepseek">(
    "gemini",
  );

  // Bolo Confirmado -> Setlist Optimization Modal
  const [showBoloConfirmadoModal, setShowBoloConfirmadoModal] = useState(false);
  const [feedbackBoloMsg, setFeedbackBoloMsg] = useState<string | null>(null);

  // Bitácora state
  const [interactionType, setInteractionType] =
    useState<InteractionLog["tipo"]>("Llamada");
  const [interactionAutor, setInteractionAutor] = useState("Mánager / Booking");
  const [interactionNotes, setInteractionNotes] = useState("");
  const [interactionResultado, setInteractionResultado] =
    useState<InteractionLog["resultado"]>("Interesado");

  // Quick Copy status
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [isSearchingLogo, setIsSearchingLogo] = useState(false);
  const [isEnrichingLead, setIsEnrichingLead] = useState(false);
  const [enrichStatusMsg, setEnrichStatusMsg] = useState<string | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [isExtractingDates, setIsExtractingDates] = useState(false);

  // WhatsApp Modal & External Intelligence Tools (Jina, Wegow Radar, Instagram)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [isScanningJina, setIsScanningJina] = useState(false);
  const [isDetectingDates, setIsDetectingDates] = useState(false);
  const [isEnrichingInstagram, setIsEnrichingInstagram] = useState(false);
  const [scoutActionFeedback, setScoutActionFeedback] = useState<string | null>(
    null,
  );

  const handleScanWithJina = async () => {
    if (!selectedLead) return;
    const targetUrl = selectedLead.website || editedLeadInfo.website;
    if (!targetUrl) {
      setScoutActionFeedback(
        "Añade un sitio web o enlace a la sala para escanear con Jina Reader",
      );
      setTimeout(() => setScoutActionFeedback(null), 4000);
      return;
    }
    try {
      setIsScanningJina(true);
      setScoutActionFeedback(
        "Escaneando sitio web con Jina Reader (r.jina.ai)...",
      );
      const res: any = await apiFetch(
        `/api/leads/${selectedLead.id}/enrich-jina`,
        {
          method: "POST",
          body: JSON.stringify({ website: targetUrl }),
        },
      );
      if (res?.success && res.lead) {
        if (onUpdateLead) onUpdateLead(selectedLead.id, res.lead);
        setEditedLeadInfo(res.lead);
        setScoutActionFeedback(
          "✓ Jina Reader: Extraído móvil, fijo, email y rider correctamente.",
        );
      } else {
        setScoutActionFeedback(
          `Aviso: ${res?.error || "No se encontraron datos adicionales."}`,
        );
      }
    } catch (err: any) {
      setScoutActionFeedback(
        `Error Jina Reader: ${err?.message || "Error de conexión"}`,
      );
    } finally {
      setIsScanningJina(false);
      setTimeout(() => setScoutActionFeedback(null), 5000);
    }
  };

  const handleDetectVenueDates = async () => {
    if (!selectedLead) return;
    try {
      setIsDetectingDates(true);
      setScoutActionFeedback(
        "Consultando y contrastando radar en Wegow y Bandsintown...",
      );
      const res: any = await apiFetch(
        `/api/leads/${selectedLead.id}/detect-dates`,
        {
          method: "POST",
        },
      );
      if (res?.success && res.lead) {
        if (onUpdateLead) onUpdateLead(selectedLead.id, res.lead);
        setEditedLeadInfo(res.lead);
        const numLibres = res.radar?.fechas_libres_detectadas?.length || 0;
        const numOcupadas = res.radar?.fechas_ocupadas?.length || 0;
        const contrastado = res.radar?.contrastado_multi_fuente
          ? "✓ Multi-fuente contrastada (Wegow + Bandsintown)"
          : "Radar consultado";
        if (res.radar?.datos_fechas_encontrados === false) {
          setScoutActionFeedback(
            "(no se han encontrado datos de fechas de esta sala)",
          );
        } else if (res.radar?.is_campaign_active) {
          setScoutActionFeedback(
            `${contrastado}: ${res.radar?.mensaje_disponibilidad || `${numLibres} fechas libres detectadas`}`,
          );
        } else {
          setScoutActionFeedback(
            `${contrastado}: ${numOcupadas} eventos detectados. ${numLibres} fechas libres disponibles.`,
          );
        }
      } else {
        setScoutActionFeedback(
          `Aviso: ${res?.error || "No se pudieron calcular las fechas."}`,
        );
      }
    } catch (err: any) {
      setScoutActionFeedback(
        `Error Radar: ${err?.message || "Error de conexión"}`,
      );
    } finally {
      setIsDetectingDates(false);
      setTimeout(() => setScoutActionFeedback(null), 5000);
    }
  };

  const handleEnrichInstagram = async () => {
    if (!selectedLead) return;
    const igHandle = selectedLead.instagram || editedLeadInfo.instagram;
    if (!igHandle) {
      setScoutActionFeedback(
        "Añade un perfil de Instagram a la sala para analizarlo",
      );
      setTimeout(() => setScoutActionFeedback(null), 4000);
      return;
    }
    try {
      setIsEnrichingInstagram(true);
      setScoutActionFeedback("Consultando perfil comercial de Instagram...");
      const res: any = await apiFetch(
        `/api/leads/${selectedLead.id}/enrich-instagram`,
        {
          method: "POST",
          body: JSON.stringify({ instagram: igHandle }),
        },
      );
      if (res?.success && res.lead) {
        if (onUpdateLead) onUpdateLead(selectedLead.id, res.lead);
        setEditedLeadInfo(res.lead);
        setScoutActionFeedback(
          "✓ Instagram: Datos comerciales y WhatsApp sincronizados.",
        );
      } else {
        const info =
          res?.data?.apify_free_tier_info ||
          res?.error ||
          "No se extrajeron datos adicionales";
        setScoutActionFeedback(`Aviso: ${info}`);
      }
    } catch (err: any) {
      setScoutActionFeedback(
        `Error Instagram: ${err?.message || "Error de conexión"}`,
      );
    } finally {
      setIsEnrichingInstagram(false);
      setTimeout(() => setScoutActionFeedback(null), 6000);
    }
  };

  const handleAutoExtractFestivalDates = async () => {
    if (!selectedLead) return;
    try {
      setIsExtractingDates(true);
      const res: any = await apiFetch("/api/leads/enrich-lead", {
        method: "POST",
        body: JSON.stringify({ leadId: selectedLead.id, force: true }),
      });
      if (res?.lead) {
        if (res.lead.festival_start_date) {
          setEditedLeadInfo((prev) => ({
            ...prev,
            festival_start_date: res.lead.festival_start_date,
            festival_end_date:
              res.lead.festival_end_date || res.lead.festival_start_date,
          }));
        }
        if (onUpdateLead) {
          onUpdateLead(selectedLead.id, res.lead);
        }
      }
    } catch (err: any) {
      console.warn("Error enriqueciendo fechas:", err);
    } finally {
      setIsExtractingDates(false);
    }
  };

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

  const handleFetchCoBooking = async () => {
    if (!selectedLead) return;
    try {
      setIsEnrichingCoBooking(true);
      setScoutActionFeedback(
        `Buscando bandas locales afines para co-booking en ${selectedLead.ciudad || "la ciudad"}...`,
      );
      const res: any = await apiFetch(
        `/api/leads/${selectedLead.id}/enrich-co-booking`,
        {
          method: "POST",
        },
      );
      if (res?.success && res.lead) {
        if (onUpdateLead) onUpdateLead(selectedLead.id, res.lead);
        setEditedLeadInfo(res.lead);
        setScoutActionFeedback("✓ Bandas locales para co-booking encontradas.");
      }
    } catch (err: any) {
      setScoutActionFeedback(`Error bandas locales: ${err?.message}`);
    } finally {
      setIsEnrichingCoBooking(false);
      setTimeout(() => setScoutActionFeedback(null), 4000);
    }
  };

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
      const res: any = await apiFetch(
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
    const manual = (selectedLead?.hilo_emails || []).map((m: any) => ({
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

  // Sync state when selected lead changes or pitch updates
  useEffect(() => {
    if (!selectedLead) return;
    setEditedPitch(selectedLead.pitch_generado || "");
    setEditedLeadInfo({
      ...selectedLead,
      telefono: cleanVal(selectedLead.telefono),
      telefono_movil: cleanVal(selectedLead.telefono_movil),
      telefono_fijo: cleanVal(selectedLead.telefono_fijo),
      contacto_nombre: cleanVal(selectedLead.contacto_nombre),
      email_contacto: cleanVal(selectedLead.email_contacto),
      direccion: cleanVal(selectedLead.direccion),
    });
  }, [
    selectedLead?.id,
    selectedLead?.pitch_generado,
    selectedLead?.imagen_url,
    selectedLead?.icono,
  ]);

  // Los hooks de arriba tienen que ejecutarse siempre en el mismo orden (ver
  // react-hooks/rules-of-hooks): este guard vivía ANTES de ellos, así que abrir el panel con
  // una sala nueva cambiaba cuántos hooks se ejecutaban entre un render y el siguiente.
  if (!selectedLead) return null;

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
    setEditedLeadInfo({
      ...selectedLead,
      telefono: cleanVal(selectedLead.telefono),
      telefono_movil: cleanVal(selectedLead.telefono_movil),
      telefono_fijo: cleanVal(selectedLead.telefono_fijo),
    });
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
    onUpdateLead(selectedLead.id, finalInfo);
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

      await apiFetch("/api/concerts", {
        method: "POST",
        body: JSON.stringify(newConcert),
      }).catch((err) => console.warn("Error creando concierto:", err));

      // 3. Actualizar estado del lead en Supabase
      onUpdateLead(selectedLead.id, { estado: "confirmado" });
      setShowBoloConfirmadoModal(false);
      setFeedbackBoloMsg(
        "🎉 ¡Bolo confirmado y repertorio asignado en el calendario!",
      );
      setTimeout(() => setFeedbackBoloMsg(null), 5000);
    } catch (err) {
      console.error("Error al confirmar bolo con setlist:", err);
      onUpdateLead(selectedLead.id, { estado: "confirmado" });
      setShowBoloConfirmadoModal(false);
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
    await onUpdateLead(selectedLead.id, updates);

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

  return (
    <div className="w-full space-y-5 relative">
      {/* Feedback Alert for Bolo Confirmado */}
      {feedbackBoloMsg && (
        <div className="p-3.5 rounded-[var(--r-l)] bg-[var(--ok)]/20 text-[var(--ink)] font-sans text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span>{feedbackBoloMsg}</span>
          </div>
          <IconButton
            label="Cerrar"
            onClick={() => setFeedbackBoloMsg(null)}
          >
            <X className="w-4 h-4" />
          </IconButton>
        </div>
      )}

      {/* HEADER CARD */}
      <div className="bg-[var(--sunken)] rounded-[var(--r-l)] p-4 sm:p-5800 space-y-4">
        {/* Title Bar */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3">
            <LeadAvatar lead={selectedLead} size="lg" showCameraHover={false} />
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[var(--ink)] notranslate"
                  translate="no"
                >
                  {selectedLead.nombre_sala}
                </h3>
                <VerifiedBadge
                  isVerified={isLeadVerificado(selectedLead)}
                  size="md"
                  showLabel={true}
                />
              </div>
              <div className="flex items-center flex-wrap gap-1.5 mt-0.5 text-xs sm:text-sm font-sans text-[var(--ink-2)]">
                <span className="font-semibold text-[var(--ink-2)]">
                  {selectedLead.ciudad}
                </span>
                {onFilterByRouteCity && selectedLead.ciudad && (
                  <button
                    type="button"
                    onClick={() => {
                      onFilterByRouteCity(selectedLead.ciudad!);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[var(--on-acc)] hover:text-[var(--acc)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                    title={`Filtrar salas en ruta para fin de semana doble desde ${selectedLead.ciudad} (<2.5h)`}
                  >
                    <span><ShowIcon inline emoji="🚗" />Enlazar ruta (&lt;2.5h)</span>
                  </button>
                )}
                <span>•</span>
                <span>{selectedLead.genero || "Variado"}</span>
                <span>•</span>
                <span
                  className={
                    selectedLead.roster ? "text-[var(--acc)] font-medium" : ""
                  }
                >
                  {selectedLead.roster
                    ? `Róster: ${selectedLead.roster}`
                    : ["agencia", "manager", "productora", "sello"].includes(
                          String(selectedLead.tipo || "").toLowerCase(),
                        )
                      ? "Agencia de Booking"
                      : selectedLead.aforo
                        ? `${selectedLead.aforo} pax`
                        : "Aforo n/d"}
                </span>
              </div>
              {selectedLead.festival_start_date &&
                selectedLead.festival_end_date && (
                  <div className="space-y-1 mt-1">
                    <p className="text-xs sm:text-sm font-sans text-[var(--acc)] flex items-center gap-1.5">
                      <span className="text-lg"><ShowIcon inline emoji="🎪" /></span>
                      <span className="font-semibold">Festival/Evento:</span>
                      <span>
                        {formatFestivalDateRange(
                          selectedLead.festival_start_date,
                          selectedLead.festival_end_date,
                        )}
                      </span>
                    </p>
                    <HolidayDateWarning
                      date={selectedLead.festival_start_date}
                      city={selectedLead.ciudad}
                      compact
                    />
                  </div>
                )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <FavoriteButton
              isFavorite={!!selectedLead.es_favorito}
              onToggle={(newVal) =>
                onUpdateLead(selectedLead.id, { es_favorito: newVal })
              }
              size="md"
            />
            <IconButton
              label="Editar ficha completa"
              onClick={handleStartEdit}
            >
              <Edit3 className="w-4 h-4" />
            </IconButton>
            {onDeleteLead && (
              <Button
                variant="danger"
                size="sm"
                onClick={() =>
                  onDeleteLead(selectedLead.id, selectedLead.nombre_sala)
                }
                title="Eliminar y guardar en lista negra"
              >
                <Trash2 className="w-4 h-4 text-[var(--alert)]" />
              </Button>
            )}
            <IconButton
              label="Cerrar panel"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </IconButton>
          </div>
        </div>

        {/* Lead Health / Temperature Badge & Quality Indicator & Category Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1800/80">
          <div className="flex flex-wrap items-center gap-2">
            <LeadHealthBadge
              lead={selectedLead}
              showDescription={true}
              size="md"
            />
            <ReliabilityBadge item={selectedLead} size="md" />
            {selectedLead.ultimo_sentimiento && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-m)] bg-[var(--acc)]/40 text-xs font-sans text-[var(--ink)]"
                title={
                  selectedLead.ultimo_analisis_resumen ||
                  `Sentimiento: ${selectedLead.ultimo_sentimiento_label || selectedLead.ultimo_sentimiento}`
                }
              >
                <span className="font-bold">
                  {selectedLead.ultimo_sentimiento_label ||
                    selectedLead.ultimo_sentimiento}
                </span>
                {selectedLead.ultima_intencion_etiqueta && (
                  <span className="text-[var(--ink-2)] font-mono text-micro">
                    ({selectedLead.ultima_intencion_etiqueta})
                  </span>
                )}
                {selectedLead.temperatura_lead && (
                  <span className="text-micro px-1.5 py-0.2 rounded bg-[var(--acc)]/20 text-[var(--acc-ink)] font-mono">
                    {selectedLead.temperatura_lead === "muy_caliente"
                      ? "Muy Caliente"
                      : selectedLead.temperatura_lead === "caliente"
                        ? "Caliente"
                        : selectedLead.temperatura_lead === "tibio"
                          ? "Tibio"
                          : "Frío"}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category / Type Recategorizer */}
            <div className="flex items-center gap-1.5 bg-[var(--surface)] px-2.5 py-1 rounded-[var(--r-m)]">
              <span className="text-micro text-[var(--acc)] font-sans font-bold">
                Tipo:
              </span>
              <select data-raw
                value={String(selectedLead.tipo || "sala").toLowerCase()}
                onChange={(e) => {
                  const newType = e.target.value as LeadType;
                  onUpdateLead(selectedLead.id, { tipo: newType });
                }}
                className="text-xs font-sans font-bold text-[var(--acc)]/70 bg-transparent cursor-pointer focus:outline-none"
                title="Cambiar categoría / tipo de este lead"
              >
                <option
                  value="sala"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Sala de conciertos
                </option>
                <option
                  value="festival"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Festival
                </option>
                <option
                  value="ayuntamiento"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Ayuntamiento / fiestas
                </option>
                <option
                  value="discoteca"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Discoteca / Club
                </option>
                <option
                  value="grupo"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Grupo / banda aliada
                </option>
                <option
                  value="agencia"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Agencia de Booking
                </option>
                <option
                  value="manager"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Manager / Representante
                </option>
                <option
                  value="productora"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Productora de eventos
                </option>
                <option
                  value="sello"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Discográfica / Sello
                </option>
                <option
                  value="medio"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Medio / prensa / radio
                </option>
              </select>
            </div>

            {/* Status selector */}
            <div className="flex items-center gap-1.5 bg-[var(--surface)] px-2.5 py-1 rounded-[var(--r-m)]">
              <span
                className={`w-2 h-2 rounded-[var(--r-pill)] ${getStatusDotColor(selectedLead.estado)}`}
              />
              <select data-raw
                value={normalizeStatus(selectedLead.estado)}
                onChange={(e) =>
                  handleCorrectStatus(e.target.value as LeadStatus)
                }
                className="text-xs font-sans font-bold text-[var(--ink)] bg-transparent cursor-pointer focus:outline-none"
              >
                <option value="nuevo" className="bg-[var(--bg)]">
                  Por contactar (nuevo)
                </option>
                <option value="esperando_respuesta" className="bg-[var(--bg)]">
                  Contactado (esperando respuesta)
                </option>
                <option value="respondido" className="bg-[var(--bg)]">
                  En conversación (ha respondido)
                </option>
                <option value="negociando" className="bg-[var(--bg)]">
                  En negociación
                </option>
                <option value="confirmado" className="bg-[var(--bg)]">
                  Concierto confirmado 
                </option>
                <option value="aplazado" className="bg-[var(--bg)]">
                  Aplazado (recontactar luego) 
                </option>
                <option value="no_interesado" className="bg-[var(--bg)]">
                  Descartado / No interesado
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Action Bar for Booking Manager */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
          {/* Botón WhatsApp — Abre el visual preview drawer con mensaje adaptado y wa.me */}
          <button
            type="button"
            onClick={() => setShowWhatsAppModal(true)}
            className="py-2.5 px-3 bg-[var(--ok)] hover:bg-[var(--ok)] text-[var(--on-ok)] rounded-[var(--r-m)] font-bold text-xs flex items-center justify-center gap-2 transition-ui cursor-pointer group"
            title={
              selectedLead.telefono_movil
                ? `Abrir propuesta para WhatsApp (${selectedLead.telefono_movil})`
                : "Escribir propuesta por WhatsApp"
            }
          >
            <MessageCircle className="w-4 h-4 text-[var(--ok)] shrink-0 transition-transform" />
            <span>
              WhatsApp {selectedLead.telefono_movil ? "Móvil" : "Directo"}
            </span>
          </button>

          {selectedLead.telefono_movil ? (
            <a
              href={`tel:${selectedLead.telefono_movil}`}
              className="py-2.5 px-3 bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--on-acc)] rounded-[var(--r-m)] font-bold text-xs flex items-center justify-center gap-2 transition-ui cursor-pointer"
              title={`Llamar al teléfono móvil: ${selectedLead.telefono_movil}`}
            >
              <Smartphone className="w-4 h-4 text-[var(--acc)] shrink-0" />
              <span>Llamar móvil</span>
            </a>
          ) : null}

          {selectedLead.telefono_fijo ? (
            <a
              href={`tel:${selectedLead.telefono_fijo}`}
              className="py-2.5 px-3 bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--on-acc)] rounded-[var(--r-m)] font-bold text-xs flex items-center justify-center gap-2 transition-ui cursor-pointer"
              title={`Llamar al teléfono fijo: ${selectedLead.telefono_fijo}`}
            >
              <Phone className="w-4 h-4 text-[var(--acc)] shrink-0" />
              <span>Llamar fijo</span>
            </a>
          ) : !selectedLead.telefono_movil && selectedLead.telefono ? (
            <a
              href={`tel:${selectedLead.telefono}`}
              className="py-2.5 px-3 bg-[var(--bg)]/90 hover:bg-[var(--tentative)] text-[var(--ink-2)] rounded-[var(--r-m)] font-bold text-xs flex items-center justify-center gap-2 transition-ui cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-[var(--ink-2)]" />
              <span>Llamar por Tel</span>
            </a>
          ) : null}
        </div>

        {/* Intelligence Scout Tools Toolbar (Jina Reader, Radar Wegow, Instagram Apify) */}
        <div className="bg-[var(--surface)] p-2.5 rounded-[var(--r-m)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-micro font-mono font-bold text-[var(--acc)] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[var(--acc)]" />
              Herramientas Agente Scout e Inteligencia Externa:
            </span>
            <span className="text-micro text-[var(--ink-2)] font-sans">
              Datos verificados sin inventar
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="neutral"
              size="xs"
              type="button"
              onClick={handleScanWithJina}
              disabled={isScanningJina}
              className="items-center gap-1.5"
              title="Escanea el sitio web con Jina Reader para extraer móviles, fijos, emails de booking y especificaciones técnicas"
            >
              {isScanningJina ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--acc)]" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-[var(--acc)]" />
              )}
              <span>
                {isScanningJina
                  ? "Leyendo web..."
                  : "Jina Reader (Web y Teléfonos)"}
              </span>
            </Button>

            <Button
              variant="neutral"
              size="xs"
              type="button"
              onClick={handleDetectVenueDates}
              disabled={isDetectingDates}
              className="items-center gap-1.5"
              title="Analiza la cartelera de Wegow y ticketing para deducir qué fines de semana tienen libres"
            >
              {isDetectingDates ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--acc)]" />
              ) : (
                <Calendar className="w-3.5 h-3.5 text-[var(--acc)]" />
              )}
              <span>
                {isDetectingDates
                  ? "Detectando fechas..."
                  : "Radar Wegow (Fechas Libres)"}
              </span>
            </Button>

            {(selectedLead.instagram || editedLeadInfo.instagram) && (
              <Button
                variant="neutral"
                size="xs"
                type="button"
                onClick={handleEnrichInstagram}
                disabled={isEnrichingInstagram}
                className="items-center gap-1.5"
                title="Extrae WhatsApp comercial y datos de contacto de su perfil de Instagram"
              >
                {isEnrichingInstagram ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--acc)]" />
                ) : (
                  <Instagram className="w-3.5 h-3.5 text-[var(--acc)]" />
                )}
                <span>
                  {isEnrichingInstagram
                    ? "Extrayendo..."
                    : "Instagram (WhatsApp Business)"}
                </span>
              </Button>
            )}
          </div>

          {/* Feedback Banner for Scout Tools */}
          {scoutActionFeedback && (
            <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--acc-ink)] text-xs font-sans flex items-center gap-2 animate-fadeIn">
              <span>{scoutActionFeedback}</span>
            </div>
          )}

          {/* 🎯 DISPONIBILIDAD Y CONFLICTO EN LA GIRA DE LA BANDA (Punto 1) */}
          {(() => {
            const targetDate =
              (selectedLead as any).fecha_posible_evento ||
              (selectedLead.fechas_propuestas_sala &&
                selectedLead.fechas_propuestas_sala[0]) ||
              (selectedLead.fechas_libres_detectadas &&
                selectedLead.fechas_libres_detectadas[0]) ||
              (selectedLead as any).fechas_libres_campana?.[0] ||
              (selectedLead as any).fechas_propuestas?.[0] ||
              (selectedLead as any).fechas_disponibles?.[0] ||
              activeCampaign?.fecha_inicio;
            const conflictCheck = checkBandDateConflict(
              targetDate,
              concerts,
              selectedLead.ciudad,
            );

            if (conflictCheck.status === "conflicto_directo") {
              return (
                <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--alert)] text-[var(--on-alert)] text-xs flex items-center justify-between gap-2.5 animate-fadeIn shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0"><ShowIcon inline emoji="🔴" /></span>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--alert)] text-xs truncate">
                        Conflicto en la agenda de {bandName || "la banda"}
                      </p>
                      <p className="text-xs text-[var(--alert)]">
                        {conflictCheck.mensaje}
                      </p>
                    </div>
                  </div>
                  <span className="text-micro font-mono font-bold px-2 py-0.5 rounded bg-[var(--alert)] text-[var(--on-alert)] shrink-0">
                    Fecha Ocupada
                  </span>
                </div>
              );
            }

            if (conflictCheck.status === "cercano_compatible") {
              return (
                <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--ok)] text-[var(--on-ok)] text-xs flex items-center justify-between gap-2.5 animate-fadeIn shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0"><ShowIcon inline emoji="🚗" /></span>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--ok)] text-xs truncate">
                        Oportunidad de enlace en ruta (Doble fecha)
                      </p>
                      <p className="text-xs text-[var(--ok)]/90">
                        {conflictCheck.mensaje}
                      </p>
                    </div>
                  </div>
                  <span className="text-micro font-mono font-bold px-2 py-0.5 rounded bg-[var(--ok)] text-[var(--on-ok)] shrink-0">
                    Compatible
                  </span>
                </div>
              );
            }

            if (conflictCheck.status === "cercano_aviso") {
              return (
                <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)] text-[var(--on-acc)] text-xs flex items-center justify-between gap-2.5 animate-fadeIn shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0"><ShowIcon inline emoji="⚠️" /></span>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--acc)] text-xs truncate">
                        Concierto en fecha adyacente
                      </p>
                      <p className="text-xs text-[var(--acc)]/90">
                        {conflictCheck.mensaje}
                      </p>
                    </div>
                  </div>
                  <span className="text-micro font-mono font-bold px-2 py-0.5 rounded bg-[var(--acc)] text-[var(--on-acc)] shrink-0">
                    Revisar kilometraje
                  </span>
                </div>
              );
            }

            if (targetDate) {
              return (
                <div className="p-2 rounded-[var(--r-m)] bg-[var(--sunken)]/60 text-[var(--ok)] text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
                  <span className="text-xs">
                    Agenda de {bandName || "la banda"} disponible para{" "}
                    {targetDate}
                  </span>
                </div>
              );
            }

            return null;
          })()}

          {/* 🏛️ HISTÓRICO DE BOLOS EN LA MISMA CIUDAD (Punto 4) */}
          {(() => {
            const cityHistory = getCityTourHistory(
              selectedLead.ciudad || selectedLead.region,
              concerts,
            );
            if (!cityHistory) return null;

            return (
              <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/20 flex items-center justify-between gap-2.5 flex-wrap animate-fadeIn">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-[var(--r-m)] bg-[var(--acc)]/20 flex items-center justify-center shrink-0 text-[var(--acc-ink)]">
                    <PartyPopper className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[var(--acc)] block truncate">
                      Histórico en {cityHistory.ciudad} (
                      {cityHistory.totalConciertos}{" "}
                      {cityHistory.totalConciertos === 1
                        ? "concierto"
                        : "conciertos"}
                      )
                    </span>
                    <span className="text-xs text-[var(--ink-2)] block">
                      {cityHistory.resumenTexto}
                    </span>
                  </div>
                </div>

                <Button
                  variant="neutral"
                  size="xs"
                  type="button"
                  onClick={() => {
                    const current =
                      editedPitch || selectedLead.pitch_generado || "";
                    if (!current.includes(cityHistory.pitchSnippet)) {
                      const updated = current
                        ? `${current}\n\n${cityHistory.pitchSnippet}`
                        : cityHistory.pitchSnippet;
                      setEditedPitch(updated);
                      setIsEditingPitch(true);
                      if (onUpdateLead) {
                        onUpdateLead(selectedLead.id, {
                          pitch_generado: updated,
                        });
                      }
                    }
                  }}
                  className="items-center gap-1 shrink-0"
                  title="Inserta este hito histórico en el pitch para dar credibilidad de taquilla a la sala"
                >
                  <TrendingUp className="w-3 h-3 text-[var(--acc)]" />
                  <span>+ Citar hito en pitch</span>
                </Button>
              </div>
            );
          })()}

          {/* Display Fechas Libres Detectadas Pills if available */}
          {(() => {
            const campaignIsActive =
              activeCampaign &&
              (activeCampaign.isActive ??
                (activeCampaign as any).is_active ??
                true);
            const fechasLibres =
              campaignIsActive && (editedLeadInfo as any)?.fechas_libres_campana
                ? (editedLeadInfo as any).fechas_libres_campana
                : editedLeadInfo?.fechas_libres_detectadas &&
                    editedLeadInfo.fechas_libres_detectadas.length > 0
                  ? editedLeadInfo.fechas_libres_detectadas
                  : campaignIsActive &&
                      (selectedLead as any)?.fechas_libres_campana
                    ? (selectedLead as any).fechas_libres_campana
                    : selectedLead?.fechas_libres_detectadas || [];

            const hasVerifiedSources =
              (Array.isArray(selectedLead?.radar_fuentes_verificadas) &&
                selectedLead.radar_fuentes_verificadas.length > 0) ||
              (Array.isArray(
                (editedLeadInfo as any)?.radar_fuentes_verificadas,
              ) &&
                (editedLeadInfo as any).radar_fuentes_verificadas.length > 0);
            const hasOccupied =
              (selectedLead?.fechas_ocupadas?.length || 0) > 0 ||
              ((editedLeadInfo as any)?.fechas_ocupadas?.length || 0) > 0;
            const hasWegowOk =
              (selectedLead as any)?.radar_wegow_status === "ok" ||
              (editedLeadInfo as any)?.radar_wegow_status === "ok";
            const hasBandsintownOk =
              (selectedLead as any)?.radar_bandsintown_status === "ok" ||
              (editedLeadInfo as any)?.radar_bandsintown_status === "ok";

            const hasConcertsOrSources =
              selectedLead?.datos_fechas_encontrados === true ||
              (editedLeadInfo as any)?.datos_fechas_encontrados === true ||
              hasWegowOk ||
              hasBandsintownOk ||
              hasVerifiedSources ||
              hasOccupied;
            const hasNoData =
              !hasConcertsOrSources ||
              selectedLead?.datos_fechas_encontrados === false ||
              (editedLeadInfo as any)?.datos_fechas_encontrados === false;

            const wegowStatus =
              (selectedLead as any)?.radar_wegow_status ||
              ((selectedLead?.fechas_ocupadas?.length || 0) > 0
                ? "ok"
                : "sin_datos");
            const bandsintownStatus =
              (selectedLead as any)?.radar_bandsintown_status || "sin_datos";
            const contrastado = Boolean(
              (selectedLead as any)?.contrastado_multi_fuente ||
              (wegowStatus === "ok" && bandsintownStatus === "ok"),
            );

            if (hasNoData) {
              return (
                <div className="pt-1.5 border-t border-[var(--hair)]/80 flex flex-col gap-1.5">
                  <span className="text-micro text-[var(--ink)] font-sans font-medium flex items-center gap-1.5 bg-[var(--acc)]/40 px-2.5 py-1 rounded-[var(--r-s)]">
                    <AlertCircle className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                    (no se han encontrado datos de fechas de esta sala)
                  </span>
                  <div className="flex items-center gap-2 text-micro font-mono text-[var(--ink-2)] pl-1">
                    <span>
                      Wegow:{" "}
                      <strong
                        className={
                          wegowStatus === "ok"
                            ? "text-[var(--ok)]"
                            : "text-[var(--ink-2)]"
                        }
                      >
                        {wegowStatus === "ok" ? "Conectado" : "Sin cartelera"}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Bandsintown:{" "}
                      <strong
                        className={
                          bandsintownStatus === "ok"
                            ? "text-[var(--acc)]"
                            : "text-[var(--ink-2)]"
                        }
                      >
                        {bandsintownStatus === "ok"
                          ? "Contrastado"
                          : "Sin datos"}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div className="pt-1 border-t border-[var(--hair)]/80 flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`text-micro font-mono font-bold flex items-center gap-1 ${campaignIsActive ? "text-[var(--acc)]" : "text-[var(--acc)]"}`}
                  >
                    <CalendarCheck className="w-3 h-3 text-current" />
                    {campaignIsActive
                      ? "Fechas disponibles para la campaña:"
                      : "Fechas disponibles detectadas:"}
                  </span>
                  {fechasLibres.map((fecha: string, idx: number) => (
                    <Button
                      variant={campaignIsActive ? "primary" : "primary"}
                      size="xs"
                      key={`free-date-${idx}`}
                      type="button"
                      onClick={() => setShowWhatsAppModal(true)}
                      className="items-center gap-1"
                      title="Clic para proponer esta fecha por WhatsApp o Pitch"
                    >
                      <span>{fecha}</span>
                      <span className="text-micro opacity-70"><ShowIcon inline emoji="💬" /></span>
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-micro font-mono text-[var(--ink-2)] pl-0.5">
                  <a
                    href={`https://www.wegow.com/es-es/busqueda?query=${encodeURIComponent(selectedLead?.nombre_sala || (editedLeadInfo as any)?.nombre_sala || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-[var(--ok)] transition-colors cursor-pointer"
                    title="Clic para ver cartelera en Wegow"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-[var(--r-pill)] ${wegowStatus === "ok" ? "bg-[var(--ok)]" : "bg-[var(--sunken)]"}`}
                    ></span>
                    <span>
                      Wegow:{" "}
                      <strong
                        className={
                          wegowStatus === "ok"
                            ? "text-[var(--ok)]"
                            : "text-[var(--ink-2)]"
                        }
                      >
                        {wegowStatus === "ok" ? "✓ OK" : "Sin datos"}
                      </strong>
                    </span>
                    <ExternalLink className="w-2 h-2 opacity-60" />
                  </a>
                  <span>•</span>
                  <a
                    href={`https://www.bandsintown.com/a/search?q=${encodeURIComponent(selectedLead?.nombre_sala || (editedLeadInfo as any)?.nombre_sala || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-[var(--acc)] transition-colors cursor-pointer"
                    title="Clic para ver cartelera en Bandsintown"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-[var(--r-pill)] ${bandsintownStatus === "ok" ? "bg-[var(--acc)]" : "bg-[var(--sunken)]"}`}
                    ></span>
                    <span>
                      Bandsintown:{" "}
                      <strong
                        className={
                          bandsintownStatus === "ok"
                            ? "text-[var(--acc)]"
                            : "text-[var(--ink-2)]"
                        }
                      >
                        {bandsintownStatus === "ok" ? "✓ OK" : "Sin datos"}
                      </strong>
                    </span>
                    <ExternalLink className="w-2 h-2 opacity-60" />
                  </a>
                  {contrastado && (
                    <span className="text-[var(--on-acc)] font-bold bg-[var(--acc)] px-1 py-0.2 rounded ">
                      <ShowIcon inline emoji="⭐" />Multi-fuente contrastada
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Agent Workflow & Sub-status Banner (Option A 2-Dimensional Model) */}
        {(() => {
          const rawStatus = String(selectedLead.estado || "");
          const isPending =
            rawStatus === "pendiente_aprobacion" ||
            (rawStatus === "nuevo" &&
              !!selectedLead.pitch_generado &&
              !selectedLead.fecha_envio);
          const isDraftCreated = rawStatus === "borrador_creado";
          const isApproved = rawStatus.startsWith("aprobado");
          const isSent = normalizeStatus(rawStatus) === "esperando_respuesta";

          if (isPending) {
            return (
              <div className="p-3 bg-[var(--acc)]/10 rounded-[var(--r-m)] flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-[var(--r-s)] bg-[var(--acc)]/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-[var(--acc)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--acc)]/70">
                      {isReplyStage
                        ? "Respuesta redactada por IA — Pendiente de aprobación"
                        : "Pitch inicial redactado por IA — Pendiente de aprobación"}
                    </p>
                    <p className="text-micro text-[var(--ink-2)] truncate">
                      {isReplyStage
                        ? "Revisa el borrador para responder a la sala y autorizar su envío."
                        : "Revisa la propuesta inicial para autorizar al agente de envíos."}
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="xs"
                  type="button"
                  onClick={handleApprovePitchDirectly}
                  disabled={isCreatingDraft}
                  className="shrink-0 items-center gap-1"
                >
                  {isCreatingDraft ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isCreatingDraft ? "Creando borrador..." : "Aprobar"}
                  </span>
                </Button>
              </div>
            );
          }

          if (isDraftCreated) {
            return (
              <div className="p-2.5 bg-[var(--acc)]/10 rounded-[var(--r-m)] flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-[var(--r-pill)] bg-[var(--acc)] shrink-0 ml-1" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--acc)]/80">
                    <ShowIcon inline emoji="📝" />Borrador creado en tu Gmail
                  </p>
                  <p className="text-micro text-[var(--ink-2)]">
                    Revísalo en tu bandeja de borradores y envíalo cuando
                    quieras — no se ha enviado nada automáticamente.
                  </p>
                </div>
              </div>
            );
          }

          if (isApproved) {
            return (
              <div className="p-2.5 bg-[var(--ok)]/10 rounded-[var(--r-m)] flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-[var(--r-pill)] bg-[var(--ok)] shrink-0 ml-1" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--ink-2)]">
                      <ShowIcon inline emoji="🚀" />{" "}
                      {rawStatus === "aprobado_respuesta"
                        ? "Respuesta Aprobada"
                        : "Propuesta Aprobada"}{" "}
                      — En cola del Agente Enviador
                    </p>
                    <p className="text-micro text-[var(--ink-2)]">
                      {draftError
                        ? `No se pudo crear el borrador en Gmail (${draftError}). El lead quedó en cola para el Agente Enviador por email.`
                        : "El agente despachará este correo respetando las normas de envío y rate-limiting."}
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="xs"
                  type="button"
                  disabled={isCreatingDraft}
                  onClick={async () => {
                    setIsCreatingDraft(true);
                    setDraftError(null);
                    try {
                      const data = await apiFetch("/api/trigger-agent", {
                        method: "POST",
                        body: JSON.stringify({
                          agentName: "enviador",
                          params: {
                            id: selectedLead.id,
                            trigger_type: "usuario_manual",
                          },
                        }),
                      });
                      const leadResult = Array.isArray(data.results)
                        ? data.results.find(
                            (r: any) => r.id === selectedLead.id,
                          )
                        : null;
                      if (
                        leadResult?.status === "borrador" ||
                        leadResult?.status === "enviado"
                      ) {
                        onUpdateLead(selectedLead.id, {
                          estado:
                            leadResult?.status === "enviado"
                              ? leadResult?.estado_nuevo || "contactado"
                              : "borrador_creado",
                        });
                      } else if (leadResult?.error || data.message) {
                        setDraftError(leadResult?.error || data.message);
                      }
                    } catch (err: any) {
                      setDraftError(
                        err.message || "Error al despachar el correo.",
                      );
                    } finally {
                      setIsCreatingDraft(false);
                    }
                  }}
                  className="shrink-0 items-center gap-1.5"
                  title="Forzar el despacho inmediato de este correo por el agente enviador"
                >
                  {isCreatingDraft ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isCreatingDraft ? "Enviando..." : "Despachar Ahora"}
                  </span>
                </Button>
              </div>
            );
          }

          if (isSent) {
            const wasOpened = Boolean(
              selectedLead.email_abierto ||
              (selectedLead.veces_abierto && selectedLead.veces_abierto > 0),
            );
            const openCount = selectedLead.veces_abierto || 1;
            const clickCount = selectedLead.clics_epk || 0;

            return (
              <div className="p-2 bg-[var(--acc)]/10 rounded-[var(--r-m)] flex items-center gap-2 text-xs text-[var(--ink-2)]">
                <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--tentative)] shrink-0 ml-1" />
                <span className="text-xs font-medium">
                  <ShowIcon inline emoji="📬" />Email enviado el{" "}
                  {selectedLead.fecha_envio || "recientemente"} • Agente a la
                  espera de respuesta de la sala
                </span>
              </div>
            );
          }

          return null;
        })()}
      </div>

      {/* CONTACT & LOCATION CARD */}
      <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 space-y-2.5800">
        <div className="flex items-center justify-between">
          <p className="text-micro font-sans font-bold text-[var(--ink-2)]">
            Ficha de contacto y ubicación
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {selectedLead.email_contacto && (
              <span
                className="text-xs text-[var(--acc)]/70 font-sans font-medium truncate max-w-[200px] notranslate"
                translate="no"
                title={`Email Principal: ${selectedLead.email_contacto}`}
              >
                <ShowIcon inline emoji="✉️" />{selectedLead.email_contacto}
              </span>
            )}
            {selectedLead.email_secundario && (
              <span
                className="text-xs text-[var(--acc)]/80 font-sans font-medium truncate max-w-[200px] notranslate"
                translate="no"
                title={`Email Secundario / Promotora: ${selectedLead.email_secundario}`}
              >
                <ShowIcon inline emoji="✉️" />2 {selectedLead.email_secundario}
              </span>
            )}
            {selectedLead.telefono_movil && (
              <a
                href={getWhatsAppUrl(selectedLead.telefono_movil)}
                target={WHATSAPP_WINDOW_NAME}
                onClick={(e) => {
                  e.preventDefault();
                  openWhatsAppChat(selectedLead.telefono_movil);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-m)] bg-[var(--ok)] text-[var(--on-ok)] text-xs font-mono font-bold hover:bg-[var(--ok)] transition-colors shadow-2xs"
                title={`WhatsApp móvil: ${selectedLead.telefono_movil}`}
              >
                <Smartphone className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
                <span>{selectedLead.telefono_movil}</span>
              </a>
            )}
            {selectedLead.telefono_fijo && (
              <a
                href={`tel:${selectedLead.telefono_fijo}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-m)] bg-[var(--acc)] text-[var(--on-acc)] text-xs font-mono font-bold hover:bg-[var(--acc)] transition-colors shadow-2xs"
                title={`Teléfono fijo: ${selectedLead.telefono_fijo}`}
              >
                <Phone className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                <span>{selectedLead.telefono_fijo}</span>
              </a>
            )}
            {!selectedLead.telefono_movil &&
              !selectedLead.telefono_fijo &&
              selectedLead.telefono && (
                <span
                  className="text-xs text-[var(--ink-2)] font-mono font-medium inline-flex items-center gap-1"
                  title={`Teléfono: ${selectedLead.telefono}`}
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[var(--ink-2)] shrink-0" />
                  <span>{selectedLead.telefono}</span>
                </span>
              )}
            <Button
              variant="neutral"
              size="xs"
              onClick={handleEnrichLead}
              disabled={isEnrichingLead}
              className="items-center gap-1.5"
              title="Scout Enriquecedor: Completa emails, webs y datos faltantes sin alucinaciones"
            >
              <Sparkles
                className={`w-3 h-3 text-[var(--acc)] ${isEnrichingLead ? "animate-spin" : ""}`}
              />
              <span>
                {isEnrichingLead ? "Completando..." : "Scout Enriquecedor"}
              </span>
            </Button>
          </div>
        </div>

        {enrichStatusMsg && (
          <div className="p-2 bg-[var(--acc)]/10 rounded-[var(--r-s)] text-[var(--acc-ink)] text-xs font-sans flex items-center gap-1.5 animate-fadeIn">
            <span>{enrichStatusMsg}</span>
          </div>
        )}

        {selectedLead.direccion ? (
          <p className="text-xs font-sans font-bold text-[var(--ink)]">
            {selectedLead.direccion}
          </p>
        ) : (
          <button
            onClick={() => {
              const detected = autoDetectVenueAddress(
                selectedLead.nombre_sala,
                selectedLead.ciudad,
              );
              onUpdateLead(selectedLead.id, { direccion: detected });
            }}
            className="text-xs font-sans font-bold text-[var(--acc)] hover:text-[var(--acc)] cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auto-detectar dirección exacta
          </button>
        )}

        <div className="pt-1 flex justify-center">
          <DirectionsCard
            query={
              selectedLead.direccion ||
              `${selectedLead.nombre_sala}, ${selectedLead.ciudad}`
            }
            locationName={selectedLead.nombre_sala}
            address={selectedLead.direccion || selectedLead.ciudad}
          />
        </div>
      </div>

      {/* ROSTER / ARTISTAS REPRESENTADOS (Si aplica) */}
      {(selectedLead.roster ||
        ["agencia", "manager", "productora", "sello", "grupo"].includes(
          String(selectedLead.tipo || "").toLowerCase(),
        )) && (
        <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 space-y-2">
          <p className="text-micro font-sans font-bold text-[var(--acc)] flex items-center gap-1.5">
            <span><ShowIcon inline emoji="🎸" /></span> Róster de Artistas y Servicios de Representación
          </p>
          {selectedLead.roster ? (
            <p className="text-xs font-sans text-[var(--ink)] bg-[var(--surface)] p-2.5 rounded-[var(--r-s)] leading-relaxed">
              {selectedLead.roster}
            </p>
          ) : (
            <p className="text-xs font-sans text-[var(--ink-2)] italic">
              Sin róster especificado. Haz clic en el botón de edición para
              añadir las bandas que gestiona.
            </p>
          )}
        </div>
      )}

      {/* NAVIGATION TABS (Pitch/Info | Email Thread | Bitácora) */}
      <div className="flex800 gap-2 pt-1">
        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={`pb-2 text-xs font-sans font-bold transition-ui px-3 cursor-pointer ${
            activeTab === "info"
              ? "border-b-2 text-[var(--acc)]"
              : "text-[var(--ink-2)] hover:text-[var(--ink)]"
          }`}
        >
          Propuesta / pitch
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("emails")}
          className={`pb-2 text-xs font-sans font-bold transition-ui px-3 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "emails"
              ? "border-b-2 text-[var(--acc)]"
              : "text-[var(--ink-2)] hover:text-[var(--ink)]"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Correos</span>
          {hiloCompleto.length > 0 && (
            <span className="text-micro font-bold px-1.5 py-0.2 rounded-[var(--r-pill)] bg-[var(--acc)] text-[var(--on-acc)]">
              {hiloCompleto.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("intelligence")}
          className={`pb-2 text-xs font-sans font-bold transition-ui px-3 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "intelligence"
              ? "border-b-2 border-[var(--acc)]/40 text-[var(--acc)]"
              : "text-[var(--ink-2)] hover:text-[var(--ink-2)]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
          <span>Inteligencia y APIs</span>
          {(selectedLead.spotify_city_demand ||
            selectedLead.google_places_info) && (
            <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--acc)]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("copilot")}
          className={`pb-2 text-xs font-sans font-bold transition-ui px-3 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "copilot"
              ? "border-b-2 border-[var(--ok)]/40 text-[var(--ok)]"
              : "text-[var(--ink-2)] hover:text-[var(--ink-2)]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--ok)]" />
          <span>Copiloto y P&L</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bitacora")}
          className={`pb-2 text-xs font-sans font-bold transition-ui px-3 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "bitacora"
              ? "border-b-2 text-[var(--acc)]"
              : "text-[var(--ink-2)] hover:text-[var(--ink)]"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Bitácora ({selectedLead.historial_contacto?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: PITCH & DIRECT EDITING FORM */}
      {activeTab === "info" && (
        <div className="space-y-4">
          {/* Edit Form Modal/Inline */}
          {isEditingLeadInfo && (
            <div className="p-4 rounded-[var(--r-m)] space-y-3 bg-[var(--surface)] text-[var(--ink)]">
              <div className="flex justify-between items-center pb-2800">
                <span className="font-bold text-xs text-[var(--acc)] flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" /> Editar Ficha (
                  {selectedLead.nombre_sala})
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingLeadInfo(false)}
                    className="px-2.5 py-1 text-xs rounded bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--ink-3)]/60 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveLeadInfo}
                    className="px-3 py-1 text-xs rounded bg-[var(--acc)] text-[var(--on-acc)] font-bold hover:bg-[var(--acc)]/60 cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                      Nombre sala / espacio / contacto
                    </label>
                    <Input size="sm" aria-label="Nombre sala / espacio / contacto"
                      type="text"
                      value={editedLeadInfo.nombre_sala || ""}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          nombre_sala: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-micro font-sans text-[var(--acc)] font-bold mb-1">
                      Tipo / categoría de lead
                    </label>
                    <Select size="sm" aria-label="Tipo / categoría de lead"
                      value={String(
                        editedLeadInfo.tipo || "sala",
                      ).toLowerCase()}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          tipo: e.target.value as LeadType,
                        })
                      }
                      wrapperClassName="w-full"
                    >
                      <option value="sala">Sala de conciertos</option>
                      <option value="festival">Festival</option>
                      <option value="ayuntamiento">
                        Ayuntamiento / fiestas
                      </option>
                      <option value="discoteca">Discoteca / Club</option>
                      <option value="grupo">Grupo / banda aliada</option>
                      <option value="agencia">Agencia de Booking</option>
                      <option value="manager">
                        Manager / Representante
                      </option>
                      <option value="productora">
                        Productora de eventos
                      </option>
                      <option value="sello">Discográfica / Sello</option>
                      <option value="medio">Medio / prensa / radio</option>
                    </Select>
                  </div>
                </div>

                {/* Logo Selector */}
                <div className="bg-[var(--bg)]/60 p-3 rounded-[var(--r-m)] space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="block text-micro font-sans text-[var(--ink-2)]">
                      Icono o logo del medio / sala
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="neutral"
                        size="xs"
                        type="button"
                        onClick={handleAutoSearchLogo}
                        disabled={isSearchingLogo}
                        className="items-center gap-1.5"
                      >
                        <Sparkles className="w-3 h-3 text-[var(--acc)]" />
                        <span>
                          {isSearchingLogo ? "Buscando..." : "Buscar Logo"}
                        </span>
                      </Button>
                      {onLeadLogoUpload && (
                        <label className="cursor-pointer px-2.5 py-1 bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--ink)] text-micro rounded-[var(--r-s)] flex items-center gap-1.5 font-bold transition-all700">
                          <Upload className="w-3 h-3 text-[var(--acc)]" />
                          <span>
                            {isUploadingLeadLogo ? "Subiendo..." : "Subir Logo"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const uploadedUrl =
                                  await onLeadLogoUpload(file);
                                if (uploadedUrl) {
                                  setEditedLeadInfo((prev) => ({
                                    ...prev,
                                    imagen_url: uploadedUrl,
                                  }));
                                }
                              }
                            }}
                            disabled={isUploadingLeadLogo}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {editedLeadInfo.imagen_url &&
                  editedLeadInfo.imagen_url.trim() !== "" ? (
                    <div className="flex items-center gap-3 p-2 bg-[var(--bg)] rounded-[var(--r-s)]">
                      <img
                        src={editedLeadInfo.imagen_url}
                        alt="Logo"
                        className="w-10 h-10 rounded-[var(--r-s)] object-contain bg-[var(--bg)] shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-micro text-[var(--ink-2)] font-bold truncate">
                          {editedLeadInfo.imagen_url}
                        </p>
                        <p className="text-micro text-[var(--ink-2)]">
                          Logo oficial guardado
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setEditedLeadInfo((prev) => ({
                            ...prev,
                            imagen_url: "",
                          }))
                        }
                        className="text-micro text-[var(--alert)] hover:underline px-2 py-1 cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-micro text-[var(--ink-2)]">
                        O selecciona un emoji característico:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "📻",
                          "📰",
                          "🌐",
                          "🎙️",
                          "📺",
                          "🏛️",
                          "🎪",
                          "🪩",
                          "🎸",
                          "💼",
                          "🎆",
                          "⚡",
                          "🔥",
                        ].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() =>
                              setEditedLeadInfo((prev) => ({
                                ...prev,
                                icono: emoji,
                              }))
                            }
                            className={`w-7 h-7 rounded-[var(--r-s)] text-sm flex items-center justify-center transition-ui cursor-pointer ${
                              editedLeadInfo.icono === emoji
                                ? "bg-[var(--ink)] text-[var(--bg)] font-bold scale-110"
                                : "bg-[var(--sunken)]/80 text-[var(--ink-2)] hover:bg-[var(--ink-3)]/60"
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* DIRECCIÓN / CALLE */}
                <div>
                  <label className="block text-micro font-sans text-[var(--acc)] font-bold mb-1 flex items-center gap-1">
                    <ShowIcon inline emoji="📍" />Dirección exacta (calle, número…)
                  </label>
                  <Input
                    size="sm"
                    type="text"
                    placeholder="Ej. Calle San Vicente Ferrer 33, 28004 Madrid"
                    value={editedLeadInfo.direccion || ""}
                    onChange={(e) =>
                      setEditedLeadInfo({
                        ...editedLeadInfo,
                        direccion: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                      Ciudad
                    </label>
                    <Input
                      size="sm"
                      type="text"
                      placeholder="Ej. Madrid"
                      value={editedLeadInfo.ciudad || ""}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          ciudad: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                      Región / provincia
                    </label>
                    <Input
                      size="sm"
                      type="text"
                      placeholder="Ej. Comunidad de Madrid"
                      value={editedLeadInfo.region || ""}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          region: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                      Persona de contacto
                    </label>
                    <Input
                      size="sm"
                      type="text"
                      placeholder="Ej. Carlos (Programador)"
                      value={editedLeadInfo.contacto_nombre || ""}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          contacto_nombre: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                      Email principal (Contratación)
                    </label>
                    <Input
                      size="sm"
                      type="email"
                      placeholder="info@salanazcaconciertos.com"
                      value={editedLeadInfo.email_contacto || ""}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          email_contacto: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-micro font-sans text-[var(--acc)] font-bold mb-1">
                    <ShowIcon inline emoji="✉️" />Email secundario / promotora / alternativo
                  </label>
                  <Input
                    size="sm"
                    type="email"
                    placeholder="info@magnetikproducciones.com (o varios separados por coma)"
                    value={editedLeadInfo.email_secundario || ""}
                    onChange={(e) =>
                      setEditedLeadInfo({
                        ...editedLeadInfo,
                        email_secundario: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-micro font-mono text-[var(--ok)] font-bold mb-1 flex items-center gap-1">
                      <span><ShowIcon inline emoji="📱" />Teléfono móvil (WhatsApp)</span>
                    </label>
                    <Input
                      size="sm"
                      type="tel"
                      placeholder="Ej. +34 612 345 678"
                      value={editedLeadInfo.telefono_movil || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          telefono_movil: val,
                          telefono:
                            val ||
                            editedLeadInfo.telefono_fijo ||
                            editedLeadInfo.telefono ||
                            "",
                        });
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-micro font-mono text-[var(--acc)] font-bold mb-1 flex items-center gap-1">
                      <span><ShowIcon inline emoji="☎️" />Teléfono fijo (sala / oficina)</span>
                    </label>
                    <Input
                      size="sm"
                      type="tel"
                      placeholder="Ej. +34 912 345 678"
                      value={editedLeadInfo.telefono_fijo || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          telefono_fijo: val,
                          telefono:
                            editedLeadInfo.telefono_movil ||
                            val ||
                            editedLeadInfo.telefono ||
                            "",
                        });
                      }}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                      Aforo (personas)
                    </label>
                    <Input
                      size="sm"
                      type="number"
                      placeholder="Ej. 500"
                      value={editedLeadInfo.aforo || 0}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          aforo: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-micro font-mono text-[var(--ink-2)] mb-1">
                      Contacto / programador
                    </label>
                    <Input
                      size="sm"
                      type="text"
                      placeholder="Ej. Laura González (Directora Artística)"
                      value={editedLeadInfo.contacto_nombre || ""}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          contacto_nombre: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-micro font-sans text-[var(--acc)] mb-1">
                    Róster de artistas / bandas que representa
                  </label>
                  <Input
                    size="sm"
                    type="text"
                    placeholder="Ej. Ska-P, Boikot, Zoo, La Raíz…"
                    value={editedLeadInfo.roster || ""}
                    onChange={(e) =>
                      setEditedLeadInfo({
                        ...editedLeadInfo,
                        roster: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-micro font-sans text-[var(--acc)]">
                      <ShowIcon inline emoji="🎪" />Fechas del festival (Inicio / fin)
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoExtractFestivalDates}
                      disabled={isExtractingDates}
                      className="px-2 py-0.5 rounded bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc-ink)] text-micro font-bold flex items-center gap-1 transition-ui cursor-pointer"
                      title="Buscar fechas del festival automáticamente con IA y base de datos de festivales"
                    >
                      <Sparkles className="w-3 h-3 text-[var(--acc)]" />
                      <span>
                        {isExtractingDates
                          ? "Buscando fechas..."
                          : "Rellenar Fechas con IA"}
                      </span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                        Inicio Festival (dd/mm/yyyy)
                      </label>
                      <Input size="sm" aria-label="Inicio Festival (dd/mm/yyyy)"
                        type="date"
                        value={toIsoDateString(
                          editedLeadInfo.festival_start_date,
                        )}
                        onChange={(e) =>
                          setEditedLeadInfo({
                            ...editedLeadInfo,
                            festival_start_date: e.target.value || undefined,
                          })
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-micro font-sans text-[var(--acc)] mb-1">
                        <ShowIcon inline emoji="🎪" />Fin Festival (dd/mm/yyyy)
                      </label>
                      <Input size="sm" aria-label="Fin Festival (dd/mm/yyyy)"
                        type="date"
                        value={toIsoDateString(
                          editedLeadInfo.festival_end_date,
                        )}
                        onChange={(e) =>
                          setEditedLeadInfo({
                            ...editedLeadInfo,
                            festival_end_date: e.target.value || undefined,
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                      Sitio Web
                    </label>
                    <Input
                      size="sm"
                      type="url"
                      placeholder="https://…"
                      value={editedLeadInfo.website || ""}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          website: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                      Instagram
                    </label>
                    <Input
                      size="sm"
                      type="text"
                      placeholder="@salaeltren"
                      value={editedLeadInfo.instagram || ""}
                      onChange={(e) =>
                        setEditedLeadInfo({
                          ...editedLeadInfo,
                          instagram: e.target.value,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ⏰ Gentle Nudge / Seguimiento Recomendado Banner */}
          {isLeadNeedsFollowup(selectedLead) && (
            <div className="p-3 bg-[var(--acc)]/40 rounded-[var(--r-m)] flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[var(--r-m)] bg-[var(--acc)]/20 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-[var(--acc)]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[var(--acc)] font-sans block">
                    <ShowIcon inline emoji="⏰" />Seguimiento Pendiente (
                    {getDaysSinceContact(selectedLead)} días sin respuesta)
                  </span>
                  <span className="text-xs text-[var(--ink-2)] font-sans">
                    Es el momento idóneo para un “Gentle Nudge” breve (&lt;50
                    palabras) y cordial.
                  </span>
                </div>
              </div>
              <Button
                variant="primary"
                size="xs"
                type="button"
                onClick={() => {
                  const draft = generateFollowupTemplate(
                    selectedLead,
                    bandName || "la banda",
                  );
                  setEditedPitch(draft);
                  setIsEditingPitch(true);
                }}
                className="items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3" />
                <span>Cargar Nudge (40 palabras)</span>
              </Button>
            </div>
          )}

          {/* 💰 Condiciones del Deal & Viabilidad (Break-Even) */}
          <QuickDealSimulator
            lead={selectedLead}
            onSaveDeal={handleRecalculateFinancial}
            isSaving={isRecalculatingFinancial}
            isStitchLight={isStitchLight}
          />

          {/* Pitch Generator Section */}
          <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 space-y-3800">
            {/* Tactical Playbook & Entity Extraction Banner if Available */}
            {(selectedLead.estrategia_playbook ||
              (selectedLead.fechas_propuestas_sala &&
                selectedLead.fechas_propuestas_sala.length > 0) ||
              selectedLead.condiciones_economicas_detectadas) && (
              <div className="p-3.5 bg-[var(--acc)]/40 rounded-[var(--r-m)] space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base"><ShowIcon inline emoji="⚡" /></span>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--acc)] font-mono">
                        Playbook táctico y extracción de condiciones
                      </h4>
                      <p className="text-xs text-[var(--ink-2)] font-medium">
                        {selectedLead.estrategia_playbook?.titulo ||
                          "Análisis de Respuesta y Condiciones Extraídas"}
                      </p>
                    </div>
                  </div>
                  {selectedLead.estrategia_playbook?.propuesta_rapida && (
                    <Button
                      variant="primary"
                      size="xs"
                      type="button"
                      onClick={() => {
                        const quick =
                          selectedLead.estrategia_playbook?.propuesta_rapida;
                        if (quick) {
                          setEditedPitch(quick);
                          setIsEditingPitch(true);
                        }
                      }}
                      className="items-center gap-1"
                      title="Cargar la propuesta de respuesta sugerida por el playbook táctico"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Cargar propuesta rápida</span>
                    </Button>
                  )}
                </div>

                {/* Detected Entities: Dates / Economics / Tech */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-[var(--acc)]/30 text-xs">
                  {selectedLead.fechas_propuestas_sala &&
                    selectedLead.fechas_propuestas_sala.length > 0 && (
                      <div className="p-2 bg-[var(--sunken)] rounded-[var(--r-m)] space-y-1">
                        <span className="text-micro font-mono text-[var(--acc)] font-bold block flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[var(--acc)]" />
                          Fechas Propuestas:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedLead.fechas_propuestas_sala.map((f, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--acc-ink)] text-micro font-mono"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {selectedLead.condiciones_economicas_detectadas && (
                    <div className="p-2 bg-[var(--sunken)] rounded-[var(--r-m)] space-y-1">
                      <span className="text-micro font-mono text-[var(--ok)] font-bold block flex items-center gap-1">
                        <Coins className="w-3 h-3 text-[var(--ok)]" />
                        Economía Detectada:
                      </span>
                      <span className="text-xs text-[var(--ink-2)] font-mono block">
                        {selectedLead.condiciones_economicas_detectadas.tipo ||
                          "Modelo"}
                        :{" "}
                        {selectedLead.condiciones_economicas_detectadas.cifra ||
                          "n/d"}
                      </span>
                      {selectedLead.condiciones_economicas_detectadas
                        .detalles && (
                        <span className="text-micro text-[var(--ink-2)] block leading-tight">
                          {
                            selectedLead.condiciones_economicas_detectadas
                              .detalles
                          }
                        </span>
                      )}
                    </div>
                  )}

                  {selectedLead.requisitos_tecnicos_detectados &&
                    selectedLead.requisitos_tecnicos_detectados.length > 0 && (
                      <div className="p-2 bg-[var(--sunken)] rounded-[var(--r-m)] space-y-1">
                        <span className="text-micro font-mono text-[var(--acc)] font-bold block flex items-center gap-1">
                          <Sliders className="w-3 h-3 text-[var(--acc)]" />
                          Requisitos Técnicos:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedLead.requisitos_tecnicos_detectados.map(
                            (r, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--acc-ink)] text-micro"
                              >
                                {r}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {selectedLead.estrategia_playbook?.pasos &&
                  selectedLead.estrategia_playbook.pasos.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-[var(--hair)]">
                      <span className="text-micro font-mono text-[var(--ink-2)] font-bold block">
                        Pasos Recomendados para Cerrar:
                      </span>
                      <ul className="space-y-0.5">
                        {selectedLead.estrategia_playbook.pasos.map(
                          (paso, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-[var(--ink-2)] flex items-start gap-1.5"
                            >
                              <span className="text-[var(--acc)] font-bold">
                                {idx + 1}.
                              </span>
                              <span>{paso}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold font-sans text-[var(--acc)]">
                {isReplyStage
                  ? "Respuesta Redactada por IA"
                  : "Propuesta de Pitch Redactada"}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowMultiModelModal(true)}
                  className="px-2.5 py-1 bg-[var(--acc)]/20  hover:bg-[var(--acc)]/30 rounded text-xs text-[var(--acc-ink)] font-bold flex items-center gap-1.5 cursor-pointer transition-ui"
                  title="Compara en paralelo propuestas generadas por DeepSeek V3 y Gemini Flash"
                >
                  <Layers className="w-3.5 h-3.5 text-[var(--acc)]" />
                  <span>Comparador A/B (DeepSeek vs Gemini) <ShowIcon inline emoji="🚀" /></span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPitch}
                  className="px-2 py-1 bg-[var(--surface)] hover:bg-[var(--ink-3)]/60 rounded text-xs text-[var(--ink)] font-sans flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedPitch ? "¡Copiado!" : "Copiar"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(true)}
                  className="px-2 py-1 bg-[var(--ok)] hover:bg-[var(--ok)] text-[var(--on-ok)] rounded text-xs font-sans flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  title="Abrir propuesta optimizada en WhatsApp"
                >
                  <MessageCircle className="w-3 h-3 text-[var(--ok)]" />
                  <span>WhatsApp</span>
                </button>

                {selectedLead.estado === "pendiente_aprobacion" ||
                selectedLead.estado === "nuevo" ? (
                  <button
                    type="button"
                    onClick={handleApprovePitchDirectly}
                    disabled={isCreatingDraft}
                    className="px-2.5 py-1 bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold rounded text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingDraft ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isCreatingDraft
                        ? "Creando borrador..."
                        : isReplyStage
                          ? "Aprobar Respuesta"
                          : "Aprobar Pitch"}
                    </span>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Active Campaign Context Banner in Pitch Section */}
            {activeCampaign && activeCampaign.isActive !== false && (
              <div className="mb-2.5 p-2.5 bg-[var(--acc)]/40  rounded-[var(--r-m)] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs shrink-0"><ShowIcon inline emoji="🎯" /></span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[var(--acc-ink)] truncate block">
                        Campaña: {activeCampaign.name}
                      </span>
                      <span className="text-micro text-[var(--tentative)]/80 truncate block">
                        Fechas objetivo:{" "}
                        {activeCampaign.targetDatesText ||
                          (Array.isArray(activeCampaign.targetDates)
                            ? activeCampaign.targetDates.join(",")
                            : "Próximos meses")}{" "}
                        · Aforo: {activeCampaign.minCapacity || 0}-
                        {activeCampaign.maxCapacity || "sin límite"} pax
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRegeneratePitchWithFeedback()}
                    disabled={isRegeneratingPitch}
                    className="px-2.5 py-1 bg-[var(--acc)] hover:bg-[var(--tentative)] text-[var(--on-acc)] font-bold rounded text-micro flex items-center gap-1 transition-ui cursor-pointer shrink-0 disabled:opacity-50"
                    title="Reescribe el pitch adaptándolo a las fechas y aforo de esta campaña"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Adaptar a campaña</span>
                  </button>
                </div>

                {/* Chequeo de festivos en fechas de campaña para la ciudad de este lead */}
                {Array.isArray(activeCampaign.targetDates) &&
                  activeCampaign.targetDates.length > 0 &&
                  selectedLead.ciudad && (
                    <div className="flex flex-wrap gap-1 pt-1/20">
                      {activeCampaign.targetDates.map((tDate) => (
                        <HolidayDateWarning
                          key={tDate}
                          date={tDate}
                          city={selectedLead.ciudad}
                          compact
                        />
                      ))}
                    </div>
                  )}
              </div>
            )}

            {/* Quick Available Dates Insertion Pills */}
            {(() => {
              const fechasLibres =
                editedLeadInfo?.fechas_libres_detectadas &&
                editedLeadInfo.fechas_libres_detectadas.length > 0
                  ? editedLeadInfo.fechas_libres_detectadas
                  : selectedLead?.fechas_libres_detectadas || [];
              if (!fechasLibres || fechasLibres.length === 0) return null;
              return (
                <div className="bg-[var(--acc)]/40 p-2.5 rounded-[var(--r-m)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-micro font-mono font-bold text-[var(--acc)] flex items-center gap-1">
                      <CalendarCheck className="w-3.5 h-3.5 text-[var(--acc)]" />
                      Fechas Libres Detectadas por Radar (Insertar en 1 clic):
                    </span>
                    <span className="text-micro text-[var(--acc)]/80 font-sans">
                      Basado en agenda pública del recinto
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {fechasLibres.map((fecha, idx) => (
                      <Button
                        variant="primary"
                        size="xs"
                        key={`quick-pitch-date-${idx}`}
                        type="button"
                        onClick={() => {
                          const dateText = `\n\nHemos visto que tenéis disponible en vuestra programación el ${fecha}, así que esa fecha nos encajaría ideal para celebrar el concierto.`;
                          const current =
                            editedPitch || selectedLead?.pitch_generado || "";
                          if (!current.includes(fecha)) {
                            const updated = (current + dateText).trim();
                            setEditedPitch(updated);
                            setIsEditingPitch(true);
                          }
                        }}
                        className="items-center gap-1"
                        title={`Inserta la propuesta para la fecha libre ${fecha} en el borrador`}
                      >
                        <span><ShowIcon inline emoji="📅" />Proponer {fecha}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 💰 Commercial Deal Snippets (Punto 2: Taquilla 100%, Garantía Mínima + %, Caché Fijo) */}
            <div className="bg-[var(--sunken)]/90 p-2.5 rounded-[var(--r-m)] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-micro font-mono font-bold text-[var(--ok)] flex items-center gap-1.5">
                  <Handshake className="w-3.5 h-3.5 text-[var(--ok)]" />
                  Condiciones Comerciales (Insertar propuesta con 1 clic):
                </span>
                <span className="text-micro text-[var(--ink-2)] font-sans">
                  Fórmulas estándar de mánager profesional
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                {getCommercialDealSnippets(
                  bandName || "la banda",
                  selectedLead,
                ).map((deal) => (
                  <button
                    key={deal.id}
                    type="button"
                    onClick={() => {
                      const current =
                        editedPitch || selectedLead.pitch_generado || "";
                      if (!current.includes(deal.textoCompleto.trim())) {
                        const updated = current
                          ? `${current}\n\n${deal.textoCompleto}`
                          : deal.textoCompleto;
                        setEditedPitch(updated);
                        setIsEditingPitch(true);
                        if (onUpdateLead) {
                          onUpdateLead(selectedLead.id, {
                            pitch_generado: updated,
                          });
                        }
                      }
                    }}
                    className="p-2 rounded-[var(--r-m)] bg-[var(--sunken)] hover:bg-[var(--surface)]/80 text-left transition-ui group cursor-pointer"
                    title={deal.descripcionCorta}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-[var(--ink-2)] group-hover:text-[var(--ok)] transition-colors">
                        {deal.label}
                      </span>
                      <span className="text-micro font-medium px-1.5 py-0.2 rounded bg-[var(--surface)] text-[var(--ink-2)] group-hover:bg-[var(--ok)]/20 group-hover:text-[var(--ok)]">
                        {deal.badge}
                      </span>
                    </div>
                    <p className="text-micro text-[var(--ink-2)] line-clamp-1 group-hover:text-[var(--ink-2)]">
                      {deal.descripcionCorta}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Manager Safeguard Pills */}
            <div className="bg-[var(--sunken)]/80 p-2.5 rounded-[var(--r-m)] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-micro font-mono font-bold text-[var(--acc)] flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-[var(--acc)]" />
                  Salvaguardas de Mánager (Insertar cláusula con 1 clic):
                </span>
                <span className="text-micro text-[var(--ink-2)] font-sans">
                  Protege a la banda antes de enviar
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    id: "hold",
                    label: "Pedir Pre-reserva (Hold 48h)",
                    text: "\n\nPara dejarla asegurada mientras cuadramos la logística de viaje y disponibilidad de los músicos, ¿os parece bien dejar la fecha en Pre-reserva (Hold / Option 1) durante 48 horas? En cuanto lo coordinemos os damos confirmación definitiva para formalizar contrato y rider.",
                    color:
                      "text-[var(--acc-ink)] bg-[var(--acc)]/10 hover:brightness-95",
                  },
                  {
                    id: "curfew",
                    label: "Preguntar Curfew / Horarios",
                    text: "\n\nPor coordinar bien la duración del pase y prueba de sonido: ¿cuál es el horario estricto de finalización de música en vivo (curfew) de la sala y tenéis limitador de decibelios?",
                    color:
                      "text-[var(--acc-ink)] bg-[var(--acc)]/10 hover:brightness-95",
                  },
                  {
                    id: "taquilla",
                    label: "Clarificar Gastos Taquilla",
                    text: "\n\nRespecto a las condiciones de taquilla: ¿en el reparto pactado están ya incluidos el técnico de sonido de la sala y portería, o existe algún canon o gasto fijo deducible antes de la liquidación?",
                    color:
                      "text-[var(--ok)] bg-[var(--ok)]/10 hover:brightness-95",
                  },
                  {
                    id: "rider",
                    label: "Confirmar D.I. y Rider",
                    text: "\n\nEn cuanto a producción: os pasamos nuestro rider técnico para que lo reviséis. ¿Nos podéis facilitar el rider técnico de la sala para revisarlo con el equipo?",
                    color:
                      "text-[var(--acc-ink)] bg-[var(--acc)]/10 hover:brightness-95",
                  },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => {
                      const current =
                        editedPitch || selectedLead.pitch_generado || "";
                      if (!current.includes(pill.text.trim())) {
                        const updated = (current + pill.text).trim();
                        setEditedPitch(updated);
                        setIsEditingPitch(true);
                      }
                    }}
                    className={`px-2 py-1 rounded-[var(--r-m)] text-micro font-sans font-medium flex items-center gap-1 transition-ui cursor-pointer ${pill.color}`}
                    title="Inserta esta cláusula protectora al final del borrador actual"
                  >
                    <span>{pill.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {isEditingPitch ? (
              <div className="space-y-2">
                <Textarea
                  rows={10}
                  value={editedPitch}
                  onChange={(e) => setEditedPitch(e.target.value)}
                  className="w-full min-h-[180px]"
                />
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-micro text-[var(--ink-2)] font-sans"
                    title="Esta corrección se suma a las demás para refinar automáticamente cómo escribe la IA en esta categoría (ver ADN de Tono > Reglas Aprendidas). Si es un caso puntual y no quieres que influya, usa'Regenerar' con estrellas/comentario y marca'Solo para esta sala' en vez de editar aquí."
                  >
                    <ShowIcon inline emoji="✏️" />Esta edición se usará también para entrenar al Redactor
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setIsEditingPitch(false)}
                      className="px-3 py-1 bg-[var(--surface)] text-[var(--ink-2)] rounded text-xs hover:bg-[var(--ink-3)]/60 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSavePitch}
                      className="px-3 py-1 bg-[var(--acc)] text-[var(--on-acc)] font-bold rounded text-xs hover:bg-[var(--acc)]/60 cursor-pointer"
                    >
                      Guardar y aprobar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  setEditedPitch(
                    editedPitch || selectedLead.pitch_generado || "",
                  );
                  setIsEditingPitch(true);
                }}
                className="p-3 bg-[var(--surface)] rounded-[var(--r-m)] text-xs text-[var(--ink)] font-sans whitespace-pre-wrap leading-relaxed cursor-pointer  transition-colors group relative"
              >
                {editedPitch ||
                  selectedLead.pitch_generado ||
                  "Sin pitch generado."}
                <span className="absolute bottom-2 right-2 text-micro text-[var(--acc)] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  Clic para editar <ShowIcon inline emoji="✏️" />
                </span>
              </div>
            )}

            {/* SECCIÓN DE FEEDBACK Y ENTRENAMIENTO IA DEL PITCH (DYNAMIC FEW-SHOT & SELF-REFINING TONE DNA) */}
            <div className="mt-4 p-3.5 bg-[var(--surface)]  rounded-[var(--r-m)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--acc)]/70 font-sans flex items-center gap-1.5">
                    Aprendizaje agéntico y ADN de tono
                    <span className="text-micro bg-[var(--acc)]/20 text-[var(--acc-ink)] px-1.5 py-0.5 rounded font-sans font-normal">
                      Dynamic Few-Shot
                    </span>
                  </span>
                </div>
                {selectedLead.historial_feedback_pitch &&
                  selectedLead.historial_feedback_pitch.length > 0 && (
                    <LinkButton
                      size="xs"
                      type="button"
                      onClick={() =>
                        setShowFeedbackHistory(!showFeedbackHistory)
                      }
                    >
                      {showFeedbackHistory
                        ? "Ocultar historial"
                        : `Historial (${selectedLead.historial_feedback_pitch.length})`}
                    </LinkButton>
                  )}
              </div>

              {/* Ratings for Tone and Content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Tono Rating */}
                <div className="p-2.5 bg-[var(--sunken)] rounded-[var(--r-s)] space-y-1.5">
                  <span className="text-xs font-bold text-[var(--ink-2)] block">
                    Tono e Intención
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={`tone-${star}`}
                        type="button"
                        onClick={() => setToneRating(star)}
                        className={`p-1 rounded hover:bg-[var(--surface)] transition-colors cursor-pointer ${
                          toneRating >= star
                            ? "text-[var(--acc)]"
                            : "text-[var(--ink-2)]"
                        }`}
                        title={`Calificar tono: ${star}/5`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                    <span className="text-micro font-sans text-[var(--ink-2)] ml-1">
                      {toneRating > 0 ? `${toneRating}/5` : "Sin calificar"}
                    </span>
                  </div>
                </div>

                {/* Content Rating */}
                <div className="p-2.5 bg-[var(--sunken)] rounded-[var(--r-s)] space-y-1.5">
                  <span className="text-xs font-bold text-[var(--ink-2)] block">
                    Contenido y Estructura
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={`content-${star}`}
                        type="button"
                        onClick={() => setContentRating(star)}
                        className={`p-1 rounded hover:bg-[var(--surface)] transition-colors cursor-pointer ${
                          contentRating >= star
                            ? "text-[var(--acc)]"
                            : "text-[var(--ink-2)]"
                        }`}
                        title={`Calificar contenido: ${star}/5`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                    <span className="text-micro font-sans text-[var(--ink-2)] ml-1">
                      {contentRating > 0
                        ? `${contentRating}/5`
                        : "Sin calificar"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comments Area */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--ink-2)] flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-[var(--acc)]" />
                  <span>
                    Sugerencias o comentarios para mejorar este pitch:
                  </span>
                </label>
                <Textarea
                  rows={4}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Ej:'Menciona que tocamos en el Viña Rock','Hazlo más corto y directo','Insiste en fecha para un sábado'…"
                  className="w-full min-h-[90px]"
                />
              </div>

              {/* Scope Selector: Solo este pitch vs Memoria Global Futura */}
              <div className="p-2.5 bg-[var(--sunken)] rounded-[var(--r-m)] space-y-2">
                <span className="text-micro font-bold text-[var(--ink-2)] font-sans block">
                  <ShowIcon inline emoji="🎯" />Alcance del entrenamiento IA:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    onClick={() => setFeedbackScope("este_pitch")}
                    className={`p-2 rounded-[var(--r-s)] cursor-pointer flex items-start gap-2 transition-ui ${
                      feedbackScope === "este_pitch"
                        ? "bg-[var(--acc)]/15  text-[var(--ink)]"
                        : "bg-[var(--bg)]/60 text-[var(--ink-2)] "
                    } hover:brightness-95`}
                  >
                    <input
                      type="radio"
                      name="feedbackScope"
                      checked={feedbackScope === "este_pitch"}
                      onChange={() => setFeedbackScope("este_pitch")}
                      className="mt-0.5 accent-[var(--acc)] shrink-0"
                    />
                    <div className="text-xs leading-tight">
                      <span className="font-bold text-[var(--ink)] block">
                        Solo para este pitch
                      </span>
                      <span className="text-micro opacity-80">
                        Ajuste puntual exclusivo para {selectedLead.nombre_sala}
                        .
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setFeedbackScope("global")}
                    className={`p-2 rounded-[var(--r-s)] cursor-pointer flex items-start gap-2 transition-ui ${
                      feedbackScope === "global"
                        ? "bg-[var(--acc)]/15  text-[var(--ink)]"
                        : "bg-[var(--bg)]/60 text-[var(--ink-2)] "
                    } hover:brightness-95`}
                  >
                    <input
                      type="radio"
                      name="feedbackScope"
                      checked={feedbackScope === "global"}
                      onChange={() => setFeedbackScope("global")}
                      className="mt-0.5 accent-[var(--acc)] shrink-0"
                    />
                    <div className="text-xs leading-tight">
                      <span className="font-bold text-[var(--acc)]/70 flex items-center gap-1">
                        Memoria general (Futuros pitches)
                      </span>
                      <span className="text-micro opacity-80">
                        El Agente Redactor lo recordará como preferencia global.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Success Banner */}
              {feedbackSuccessMsg && (
                <div className="p-2 bg-[var(--ok)]/20 rounded-[var(--r-s)] text-[var(--ink)] text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--ok)]" />
                  <span>{feedbackSuccessMsg}</span>
                </div>
              )}

              {/* Model selection pills for single-click regenerate */}
              <div className="flex items-center justify-between flex-wrap gap-2 p-2 bg-[var(--sunken)] rounded-[var(--r-m)]">
                <span className="text-micro font-sans text-[var(--ink-2)] font-bold">
                  <ShowIcon inline emoji="🤖" />Motor de Redacción y Coste:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    {
                      id: "deepseek" as const,
                      name: "DeepSeek V3 (Recomendado)",
                      cost: "~0,00014 €",
                      icon: "🚀",
                    },
                    {
                      id: "gemini" as const,
                      name: "Gemini Flash (Free Tier)",
                      cost: "~0,00018 €",
                      icon: "⚡",
                    },
                  ].map((m) => {
                    const isSelected = selectedAiModel === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedAiModel(m.id)}
                        className={`px-2 py-1 rounded-[var(--r-pill)] text-micro font-bold flex items-center gap-1.5 transition-ui cursor-pointer ${
                          isSelected
                            ? "bg-[var(--acc)]/20 text-[var(--acc-ink)] "
                            : "bg-[var(--bg)]/60 text-[var(--ink-2)] "
                        } hover:brightness-95`}
                        title={`Coste aproximado por pitch: ${m.cost}`}
                      >
                        <span><ShowIcon inline emoji={m.icon} /></span>
                        <span>{m.name}</span>
                        <span className="font-sans text-micro text-[var(--ok)] bg-[var(--sunken)] px-1 py-0.2 rounded">
                          {m.cost}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 pt-1">
                {selectedLead.historial_feedback_pitch &&
                  selectedLead.historial_feedback_pitch.some(
                    (l) => !l.deshecho && l.pitch_previo,
                  ) && (
                    <Button
                      variant="neutral"
                      size="sm"
                      type="button"
                      onClick={() => handleRevertPitch()}
                      disabled={isRevertingPitch || isRegeneratingPitch}
                      className="items-center justify-center gap-1.5"
                      title="Deshacer el último entrenamiento y restaurar la versión del pitch anterior"
                    >
                      {isRevertingPitch ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--acc)]" />
                      ) : (
                        <Undo2 className="w-3.5 h-3.5 text-[var(--acc)]" />
                      )}
                      <span>Deshacer y volver al pitch anterior</span>
                    </Button>
                  )}

                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() => handleRegeneratePitchWithFeedback()}
                  disabled={isRegeneratingPitch || isRevertingPitch}
                  className="items-center justify-center gap-2"
                >
                  {isRegeneratingPitch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        Entrenando{" "}
                        {selectedAiModel === "deepseek" ? "DeepSeek" : "Gemini"}
                        ...
                      </span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>
                        Reescribir con{" "}
                        {selectedAiModel === "deepseek"
                          ? "DeepSeek V3"
                          : "Gemini Flash"}
                      </span>
                    </>
                  )}
                </Button>
              </div>

              {/* History drawer if enabled */}
              {showFeedbackHistory &&
                selectedLead.historial_feedback_pitch &&
                selectedLead.historial_feedback_pitch.length > 0 && (
                  <div className="mt-3 pt-3800 space-y-2">
                    <span className="text-xs font-bold text-[var(--acc)] font-sans block">
                      Historial de aprendizaje e iteraciones IA
                    </span>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedLead.historial_feedback_pitch.map((log) => (
                        <div
                          key={log.id}
                          className={`p-2.5 rounded-[var(--r-s)] text-xs space-y-1.5 transition-ui ${
                            log.deshecho
                              ? "bg-[var(--sunken)]/50 opacity-60"
                              : "bg-[var(--sunken)]/80"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[var(--ink-2)] text-micro font-sans">
                            <span>{new Date(log.fecha).toLocaleString()}</span>
                            <div className="flex items-center gap-2">
                              {log.alcance === "global" ? (
                                <span className="px-1.5 py-0.5 bg-[var(--acc)]/20 text-[var(--acc-ink)] rounded text-micro font-bold flex items-center gap-1">
                                  Memoria global
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-[var(--sunken)] text-[var(--ink-2)] rounded text-micro">
                                  Solo este pitch
                                </span>
                              )}
                              <span>
                                Tono:{" "}
                                {log.tono_rating ? `${log.tono_rating}/5` : "-"}{" "}
                                | Contenido:{" "}
                                {log.contenido_rating
                                  ? `${log.contenido_rating}/5`
                                  : "-"}
                              </span>
                              {log.deshecho && (
                                <span className="px-1.5 py-0.5 bg-[var(--acc-soft)] text-[var(--acc)] rounded text-micro font-bold">
                                  [Deshecho]
                                </span>
                              )}
                            </div>
                          </div>

                          {log.comentario && (
                            <p className="text-[var(--ink)]/90 italic font-sans">
                              &ldquo;{log.comentario}&rdquo;
                            </p>
                          )}

                          {log.pitch_previo && !log.deshecho && (
                            <div className="flex items-center justify-between pt-1800/60">
                              <span
                                className="text-micro text-[var(--ink-2)] font-sans truncate max-w-[220px]"
                                title={log.pitch_previo}
                              >
                                Pitch previo: {log.pitch_previo.slice(0, 38)}...
                              </span>
                              <LinkButton
                                size="xs"
                                type="button"
                                onClick={() => handleRevertPitch(log.id)}
                                disabled={isRevertingPitch}
                                className="shrink-0"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Volver a este pitch anterior
                              </LinkButton>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMAIL THREAD & REPLY SIMULATION */}
      {activeTab === "emails" && (
        <div className="space-y-3">
          {/* ⏰ Gentle Nudge / Seguimiento Recomendado Banner */}
          {isLeadNeedsFollowup(selectedLead) && (
            <div className="p-3 bg-[var(--acc)]/40 rounded-[var(--r-m)] flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[var(--r-m)] bg-[var(--acc)]/20 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-[var(--acc)]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[var(--acc)] font-sans block">
                    <ShowIcon inline emoji="⏰" />Seguimiento Pendiente (
                    {getDaysSinceContact(selectedLead)} días sin respuesta)
                  </span>
                  <span className="text-xs text-[var(--ink-2)] font-sans">
                    Envía un recordatorio educado de 40 palabras para reactivar
                    la conversación con la sala.
                  </span>
                </div>
              </div>
              <Button
                variant="primary"
                size="xs"
                type="button"
                onClick={() => {
                  const draft = generateFollowupTemplate(
                    selectedLead,
                    bandName || "la banda",
                  );
                  setEditedPitch(draft);
                  setIsEditingPitch(true);
                  if (onUpdateLead) {
                    onUpdateLead(selectedLead.id, { pitch_generado: draft });
                  }
                  setActiveTab("info");
                }}
                className="items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3" />
                <span>Cargar nudge de seguimiento</span>
              </Button>
            </div>
          )}

          {hiloCompleto.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-6">
              <PublicoSilhouette opacity={0.12} size="small" />
              <p className="mt-4 font-medium text-[var(--ink)] text-xs">
                Sin correspondencia
              </p>
              <p className="mt-2 text-[var(--ink-2)] text-xs max-w-xs text-center">
                Los correos y conversaciones con esta sala aparecerán aquí.
              </p>
            </div>
          ) : (
            hiloCompleto.map((msg) => (
              <div
                key={msg.id}
                className={`p-3.5 rounded-[var(--r-m)] space-y-2 text-xs font-sans transition-ui ${
                  msg.remitente === "sala"
                    ? "bg-[var(--acc-soft)]  text-[var(--acc)]"
                    : "bg-[var(--bg)] text-[var(--ink)]"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={
                        msg.remitente === "sala"
                          ? "text-[var(--acc)]"
                          : "text-[var(--ink-2)]"
                      }
                    >
                      {msg.remitente_nombre} (
                      {msg.remitente === "sala" ? "Programador" : (bandName || "La banda")})
                    </span>
                    {msg.remitente === "sala" && msg.sentimiento && (
                      <span
                        className={`px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold flex items-center gap-1 ${
                          msg.sentimiento.includes("positivo")
                            ? "bg-[var(--ok)] text-[var(--on-ok)]"
                            : msg.sentimiento.includes("negativo")
                              ? "bg-[var(--alert)] text-[var(--on-alert)]"
                              : "bg-[var(--sunken)] text-[var(--ink-2)]"
                        }`}
                      >
                        {msg.sentimiento_label || msg.sentimiento}
                        {msg.sentimiento_score !== undefined && (
                          <span className="font-mono text-micro opacity-80">
                            (
                            {msg.sentimiento_score > 0
                              ? `+${msg.sentimiento_score}`
                              : msg.sentimiento_score}
                            )
                          </span>
                        )}
                      </span>
                    )}
                    {msg.remitente === "sala" && msg.intencion_etiqueta && (
                      <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-medium bg-[var(--acc)]/20 text-[var(--acc-ink)]">
                        {msg.intencion_etiqueta}
                      </span>
                    )}
                    {msg.remitente === "sala" && msg.temperatura && (
                      <span className="px-1.5 py-0.5 rounded text-micro bg-[var(--sunken)] text-[var(--ink-2)] font-mono">
                        {msg.temperatura === "muy_caliente"
                          ? "Muy Caliente"
                          : msg.temperatura === "caliente"
                            ? "Caliente"
                            : msg.temperatura === "tibio"
                              ? "Tibio"
                              : "Frío"}
                      </span>
                    )}
                  </div>
                  <span className="text-[var(--ink-2)] text-micro font-sans">
                    {msg.fecha}
                  </span>
                </div>

                <div className="font-bold text-[var(--ink)]">{msg.asunto}</div>
                <p className="whitespace-pre-wrap text-[var(--ink-2)] leading-snug">
                  {msg.mensaje}
                </p>

                {/* Sentiment & Intent Deep Dive for Sala Messages */}
                {msg.remitente === "sala" && (
                  <div className="pt-2 border-t border-[var(--hair)] space-y-2">
                    {msg.resumen_ejecutivo && (
                      <div className="p-2 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs space-y-1 bg-[var(--acc)]/10">
                        <div className="flex items-center justify-between text-micro font-mono text-[var(--acc)] font-bold">
                          <span>Resumen y estrategia lector IA</span>
                        </div>
                        <p className="text-[var(--ink-2)] italic">
                          {msg.resumen_ejecutivo}
                        </p>
                        {msg.sugerencia_estrategia && (
                          <p className="text-[var(--acc)]/90 font-medium">
                            <ShowIcon inline emoji="💡" />{msg.sugerencia_estrategia}
                          </p>
                        )}
                      </div>
                    )}

                    {msg.objeciones && msg.objeciones.length > 0 && (
                      <div className="p-2 rounded-[var(--r-m)] bg-[var(--alert)]/30 text-xs text-[var(--ink)] space-y-1">
                        <span className="font-bold text-[var(--alert)] text-micro font-mono block">
                          Objeciones / Reticencias Detectadas:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-[var(--ink-2)]">
                          {msg.objeciones.map((obj, i) => (
                            <li key={i}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {!msg.sentimiento && (
                      <div className="flex justify-end pt-1">
                        <Button
                          variant="neutral"
                          size="xs"
                          type="button"
                          onClick={() =>
                            handleAnalyzeMessageSentiment(msg.id, msg.mensaje)
                          }
                          disabled={isAnalyzingMessageSentiment === msg.id}
                          className="items-center gap-1.5"
                        >
                          {isAnalyzingMessageSentiment === msg.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin text-[var(--acc)]" />
                              <span>Analizando sentimiento…</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-[var(--acc)]" />
                              <span>Analizar sentimiento e intención</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Quick Manager Reply Actions with Deal Snippets */}
          <div className="p-3 bg-[var(--sunken)]/90 rounded-[var(--r-m)] space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-micro font-mono font-bold text-[var(--ok)] flex items-center gap-1.5">
                <Handshake className="w-3.5 h-3.5 text-[var(--ok)]" />
                <span>
                  ¿La sala pide condiciones económicas? Inserta propuesta:
                </span>
              </span>
              <span className="text-micro text-[var(--ink-2)] font-sans">
                Carga borrador y pasa a revisión
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {getCommercialDealSnippets(
                bandName || "la banda",
                selectedLead,
              ).map((deal) => (
                <button
                  key={deal.id}
                  type="button"
                  onClick={() => {
                    const current =
                      editedPitch || selectedLead.pitch_generado || "";
                    const updated = current
                      ? `${current}\n\n${deal.textoCompleto}`
                      : deal.textoCompleto;
                    setEditedPitch(updated);
                    setIsEditingPitch(true);
                    if (onUpdateLead) {
                      onUpdateLead(selectedLead.id, {
                        pitch_generado: updated,
                      });
                    }
                    setActiveTab("info");
                  }}
                  className="p-2 rounded-[var(--r-m)] bg-[var(--sunken)] hover:bg-[var(--surface)]/80 text-left transition-ui group cursor-pointer"
                  title={deal.descripcionCorta}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-[var(--ink-2)] group-hover:text-[var(--ok)] transition-colors">
                      {deal.label}
                    </span>
                    <span className="text-micro font-medium px-1.5 py-0.2 rounded bg-[var(--surface)] text-[var(--ink-2)] group-hover:bg-[var(--ok)]/20 group-hover:text-[var(--ok)]">
                      {deal.badge}
                    </span>
                  </div>
                  <p className="text-micro text-[var(--ink-2)] line-clamp-1 group-hover:text-[var(--ink-2)]">
                    {deal.descripcionCorta}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2.5: INTELIGENCIA DE DATOS & APIS EXTERNAS */}
      {activeTab === "intelligence" && (
        <div className="space-y-4 font-sans animate-fadeIn">
          {/* Top Bar with Refresh All APIs button */}
          <div className="p-3 bg-[var(--sunken)] rounded-[var(--r-m)] flex items-center justify-between flex-wrap gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[var(--r-m)] bg-[var(--acc)]/10 flex items-center justify-center text-[var(--acc-ink)]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--ink-2)] flex items-center gap-2">
                  <span>Inteligencia multi-Fuente conectada</span>
                  <span className="text-micro px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--acc-ink)] font-mono font-bold ">
                    11 Herramientas activas
                  </span>
                </h4>
                <p className="text-micro text-[var(--ink-2)]">
                  Spotify • Google Places • Setlist.fm • DNS/MX • Rutas • Redes
                  • Break-Even • Booking Window • Clash/Eventos • Medios •
                  Co-Booking
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="xs"
              type="button"
              onClick={handleEnrichAllApis}
              disabled={isEnrichingApis}
              className="items-center gap-1.5"
              title="Volver a consultar todas las APIs en tiempo real"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isEnrichingApis ? "animate-spin" : ""}`}
              />
              <span>
                {isEnrichingApis
                  ? "Consultando APIs..."
                  : "Actualizar Todas las APIs"}
              </span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. SPOTIFY AUDIENCE & CITY DEMAND */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 relative overflow-hidden bg-[var(--ok)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--ok)] font-bold text-xs">
                  <Headphones className="w-4 h-4" />
                  <span>Spotify city demand</span>
                </div>
                <span className="text-micro font-mono px-2 py-0.5 rounded bg-[var(--ok)] text-[var(--on-ok)]">
                  {selectedLead.ciudad || "Madrid"}
                </span>
              </div>

              {selectedLead.spotify_city_demand ? (
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block font-medium">
                        Oyentes en la ciudad
                      </span>
                      <span className="text-base font-bold text-[var(--ok)] font-mono">
                        {selectedLead.spotify_city_demand.oyentes_ciudad.toLocaleString()}
                      </span>
                      <span className="text-micro text-[var(--ink-2)] block">
                        Top #
                        {selectedLead.spotify_city_demand.top_ciudades_ranking}{" "}
                        audiencia
                      </span>
                    </div>

                    <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block font-medium">
                        Afinidad de género
                      </span>
                      <span className="text-base font-bold text-[var(--ok)] font-mono">
                        {selectedLead.spotify_city_demand.afinidad_genero}%
                      </span>
                      <span className="text-micro text-[var(--ink-2)] block">
                        Match con público local
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--ink-2)]">
                        Demanda Estimada de Entradas:
                      </span>
                      <span className="font-bold text-[var(--ink-2)] font-mono">
                        {selectedLead.spotify_city_demand.prediccion_entradas}{" "}
                        pax / {selectedLead.aforo || 300} aforo
                      </span>
                    </div>
                    <div className="w-full bg-[var(--sunken)] h-2 rounded-[var(--r-pill)] overflow-hidden">
                      <div
                        className="bg-[var(--ok)] h-full rounded-[var(--r-pill)] transition-ui"
                        style={{
                          width: `${Math.min(100, selectedLead.spotify_city_demand.porcentaje_ocupacion_estimado)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-micro text-[var(--ink-2)]">
                      <span>Ocupación calculada:</span>
                      <span className="font-bold text-[var(--ok)]">
                        {
                          selectedLead.spotify_city_demand
                            .porcentaje_ocupacion_estimado
                        }
                        % de aforo
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-[var(--ink-2)] text-xs italic">
                  Pulsa “Actualizar Todas las APIs” para calcular la demanda de
                  Spotify en {selectedLead.ciudad || "Madrid"}.
                </div>
              )}
            </div>

            {/* 2. GOOGLE PLACES & FICHA TÉCNICA */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 relative bg-[var(--acc)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold text-xs">
                  <MapPin className="w-4 h-4" />
                  <span>Google Places y escenario</span>
                </div>
                {selectedLead.google_places_info?.rating && (
                  <span className="text-micro font-mono px-2 py-0.5 rounded bg-[var(--acc)] text-[var(--on-acc)] flex items-center gap-1 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-[var(--acc)]" />
                    {selectedLead.google_places_info.rating} (
                    {selectedLead.google_places_info.total_reviews})
                  </span>
                )}
              </div>

              {selectedLead.google_places_info ? (
                <div className="space-y-2 text-xs">
                  {selectedLead.google_places_info.fotos &&
                    selectedLead.google_places_info.fotos.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 rounded-[var(--r-m)] overflow-hidden ">
                        {selectedLead.google_places_info.fotos
                          .slice(0, 2)
                          .map((url, i) => (
                            <div
                              key={i}
                              className="h-20 bg-[var(--surface)] relative group overflow-hidden"
                            >
                              <img
                                src={url}
                                alt={`${selectedLead.nombre_sala} foto ${i + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300"
                                referrerPolicy="no-referrer"
                                onError={(e: any) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          ))}
                      </div>
                    )}

                  <div className="space-y-1.5 text-xs bg-[var(--surface)] p-2.5 rounded-[var(--r-m)] ">
                    <div className="flex items-start gap-1.5">
                      <span className="text-[var(--ink-2)] font-bold shrink-0">
                        <ShowIcon inline emoji="🔊" />Acústica:
                      </span>
                      <span className="text-[var(--ink-2)] leading-tight">
                        {selectedLead.google_places_info.resumen_acustica ||
                          "Sala con equipo de PA profesional instalado."}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[var(--ink-2)] font-bold shrink-0">
                        <ShowIcon inline emoji="🚛" />Carga / Backline:
                      </span>
                      <span className="text-[var(--ink-2)] leading-tight">
                        {selectedLead.google_places_info.acceso_backline ||
                          "Acceso por calle peatonal / vado autorizado."}
                      </span>
                    </div>
                    {selectedLead.google_places_info.horario_carga && (
                      <div className="flex items-start gap-1.5">
                        <span className="text-[var(--ink-2)] font-bold shrink-0">
                          <ShowIcon inline emoji="⏰" />Horario prueba:
                        </span>
                        <span className="text-[var(--ink-2)] leading-tight">
                          {selectedLead.google_places_info.horario_carga}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-[var(--ink-2)] text-xs italic">
                  Pulsa “Actualizar Todas las APIs” para cargar la ficha técnica
                  de Google Places.
                </div>
              )}
            </div>

            {/* 3. SETLIST.FM & HISTORIAL DE CONCIERTOS */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 bg-[var(--acc)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold text-xs">
                  <Disc className="w-4 h-4" />
                  <span>Setlist.fm y Cartelera Reciente</span>
                </div>
                <span className="text-micro font-mono px-2 py-0.5 rounded bg-[var(--acc)] text-[var(--on-acc)]">
                  Histórico bolos
                </span>
              </div>

              {selectedLead.setlist_history ? (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1.5">
                    <span className="text-micro text-[var(--ink-2)] font-bold block">
                      Bandas Similares que han tocado:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedLead.setlist_history.bandas_similares_recientes.map(
                        (banda, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--acc-ink)] text-xs font-medium"
                          >
                            <ShowIcon inline emoji="🎸" />{banda}
                          </span>
                        ),
                      )}
                    </div>
                  </div>

                  {selectedLead.setlist_history.referencia_pitch_sugerida && (
                    <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/30 space-y-1.5">
                      <span className="text-micro text-[var(--acc)] font-bold flex items-center gap-1">
                        Gancho Recomendado para el Pitch:
                      </span>
                      <p className="text-xs text-[var(--ink-2)] italic leading-snug">
                        "
                        {selectedLead.setlist_history.referencia_pitch_sugerida}
                        "
                      </p>
                      <LinkButton
                        size="xs"
                        type="button"
                        onClick={() => {
                          const hook =
                            selectedLead.setlist_history
                              ?.referencia_pitch_sugerida;
                          if (hook && selectedLead.pitch_generado) {
                            const newPitch = `${selectedLead.pitch_generado}\n\nPD: ${hook}`;
                            onUpdateLead(selectedLead.id, {
                              pitch_generado: newPitch,
                            });
                            setEditedPitch(newPitch);
                            setScoutActionFeedback(
                              "✓ Gancho de Setlist.fm insertado en el borrador del pitch.",
                            );
                            setTimeout(
                              () => setScoutActionFeedback(null),
                              4000,
                            );
                          }
                        }}
                      >
                        + Añadir este gancho al final del Pitch
                      </LinkButton>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center text-[var(--ink-2)] text-xs italic">
                  Sin histórico de Setlist.fm cargado aún.
                </div>
              )}
            </div>

            {/* 4. VERIFICACIÓN EMAIL & SERVIDORES MX */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 bg-[var(--acc)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verificación de email y DNS MX</span>
                </div>
                {selectedLead.email_verification?.entregabilidad_score !==
                  undefined && (
                  <span
                    className={`text-micro font-mono px-2 py-0.5 rounded font-bold ${
                      selectedLead.email_verification.entregabilidad_score >= 80
                        ? "bg-[var(--ok)] text-[var(--on-ok)]"
                        : selectedLead.email_verification
                              .entregabilidad_score >= 50
                          ? "bg-[var(--ink)] text-[var(--bg)]"
                          : "bg-[var(--alert)] text-[var(--on-alert)]"
                    }`}
                  >
                    <ShowIcon inline emoji="🛡️" />{selectedLead.email_verification.entregabilidad_score}%
                    Entregable
                  </span>
                )}
              </div>

              {selectedLead.email_verification ? (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--ink-2)]">
                        Estado del Buzón:
                      </span>
                      <span className="font-bold text-[var(--ink-2)] capitalize">
                        {selectedLead.email_verification.estado === "valido"
                          ? "Buzón Válido"
                          : selectedLead.email_verification.estado}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--ink-2)]">
                        Registros DNS MX:
                      </span>
                      <span className="font-bold text-[var(--ok)]">
                        {selectedLead.email_verification.mx_valido
                          ? "✓ Servidores de correo activos"
                          : "Sin registros MX"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--ink-2)]">
                        Tipo de Dirección:
                      </span>
                      <span className="font-bold text-[var(--ink-2)]">
                        {selectedLead.email_verification.es_cuenta_rol
                          ? "Buzón de Booking / Programación"
                          : "Cuenta Personal Directa"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--ink)] bg-[var(--acc)]/20 p-2 rounded-[var(--r-m)] ">
                    <ShowIcon inline emoji="💡" />{selectedLead.email_verification.motivo}
                  </p>
                </div>
              ) : (
                <div className="py-4 text-center text-[var(--ink-2)] text-xs italic">
                  Pulsa “Actualizar Todas las APIs” para validar los registros
                  DNS y entregabilidad del email.
                </div>
              )}
            </div>

            {/* 5. HERRAMIENTA 1: RUTAS DE GIRA, GASOLINA & FURGONETA */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 bg-[var(--acc)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold text-xs">
                  <Truck className="w-4 h-4" />
                  <span>Ruta de Gira, gasolina y furgoneta</span>
                </div>
                <span className="text-micro font-mono px-2 py-0.5 rounded bg-[var(--acc)] text-[var(--on-acc)] font-bold">
                  Van Logistics
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1.5 bg-[var(--surface)] px-2.5 py-1.5 rounded-[var(--r-m)] text-xs">
                  <Navigation className="w-3.5 h-3.5 text-[var(--ink-2)] shrink-0" />
                  <span className="text-[var(--ink-2)] text-xs">
                    Origen:
                  </span>
                  <input data-raw
                    type="text"
                    value={routeOrigin}
                    onChange={(e) => setRouteOrigin(e.target.value)}
                    placeholder="Ciudad base (ej: Madrid)"
                    className="bg-transparent border-none text-[var(--ink-2)] font-bold focus:outline-none w-full text-xs"
                  />
                </div>
                <Button
                  variant="primary"
                  size="xs"
                  type="button"
                  onClick={handleCalculateRoute}
                  disabled={isCalculatingRoute}
                  className="items-center gap-1"
                  title="Recalcular ruta y gasolina"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isCalculatingRoute ? "animate-spin" : ""}`}
                  />
                  <span>Calcular</span>
                </Button>
              </div>

              {selectedLead.tour_logistics ? (
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Distancia
                      </span>
                      <span className="text-sm font-bold text-[var(--acc)] font-mono">
                        {selectedLead.tour_logistics.distancia_km} km
                      </span>
                      <span className="text-micro text-[var(--ink-2)] block">
                        {selectedLead.tour_logistics.tiempo_conduccion}
                      </span>
                    </div>

                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Gasolina (Ida)
                      </span>
                      <span className="text-sm font-bold text-[var(--acc)] font-mono">
                        {selectedLead.tour_logistics.coste_gasolina_estimado} €
                      </span>
                      <span className="text-micro text-[var(--ink-2)] block">
                        9L/100km Diésel
                      </span>
                    </div>

                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Total Viaje I/V
                      </span>
                      <span className="text-sm font-bold text-[var(--ok)] font-mono">
                        {selectedLead.tour_logistics.coste_total_viaje} €
                      </span>
                      <span className="text-micro text-[var(--ink-2)] block">
                        +{selectedLead.tour_logistics.peajes_estimados}€ peajes
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--ink)] bg-[var(--acc)]/20 p-2.5 rounded-[var(--r-m)] leading-snug">
                    <ShowIcon inline emoji="🚐" />{" "}
                    <span className="font-semibold text-[var(--acc)]">
                      Road Manager:
                    </span>{" "}
                    {selectedLead.tour_logistics.recomendacion_logistica}
                  </p>
                </div>
              ) : (
                <div className="py-3 text-center text-[var(--ink-2)] text-xs italic">
                  Introduce tu ciudad base y pulsa “Calcular” para obtener
                  kilometraje y combustible.
                </div>
              )}
            </div>

            {/* 6. HERRAMIENTA 2: RADAR DE REDES SOCIALES (INSTAGRAM & TIKTOK) */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 bg-[var(--alert)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold text-xs">
                  <Instagram className="w-4 h-4" />
                  <span>Radar redes sala (Instagram y TikTok)</span>
                </div>
                {selectedLead.social_engagement?.calidad_promo_sala && (
                  <span
                    className={`text-micro font-mono px-2 py-0.5 rounded font-bold ${
                      selectedLead.social_engagement.calidad_promo_sala ===
                      "alta"
                        ? "bg-[var(--ok)] text-[var(--on-ok)]"
                        : selectedLead.social_engagement.calidad_promo_sala ===
                            "media"
                          ? "bg-[var(--ink)] text-[var(--bg)]"
                          : "bg-[var(--alert)] text-[var(--on-alert)]"
                    }`}
                  >
                    Promo:{" "}
                    {selectedLead.social_engagement.calidad_promo_sala.toUpperCase()}
                  </span>
                )}
              </div>

              {selectedLead.social_engagement ? (
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Seguidores
                      </span>
                      <span className="text-sm font-bold text-[var(--acc)] font-mono">
                        {selectedLead.social_engagement.instagram_followers.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Engagement
                      </span>
                      <span className="text-sm font-bold text-[var(--acc)] font-mono">
                        {selectedLead.social_engagement.engagement_rate}%
                      </span>
                    </div>

                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Media Reels
                      </span>
                      <span className="text-sm font-bold text-[var(--acc)] font-mono">
                        {selectedLead.social_engagement.promedio_views_reels.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] flex items-center justify-between text-xs">
                    <span className="text-[var(--ink-2)]">
                      ¿Comparte a las bandas en Stories/Feed?
                    </span>
                    <span className="font-bold text-[var(--ink-2)] flex items-center gap-1">
                      {selectedLead.social_engagement
                        .promociona_bandas_activo ? (
                        <span className="text-[var(--ok)] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sí, sala
                          activa
                        </span>
                      ) : (
                        <span className="text-[var(--ink-2)]">
                          Pasivo / Solo cartel mensual
                        </span>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--ink)] bg-[var(--acc)]/20 p-2.5 rounded-[var(--r-m)] leading-snug">
                    <ShowIcon inline emoji="📢" />{selectedLead.social_engagement.resumen_social}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                  <p className="text-[var(--ink-2)] text-xs italic">
                    Sin datos de radar en redes aún.
                  </p>
                  <Button
                    variant="primary"
                    size="xs"
                    type="button"
                    onClick={handleFetchSocial}
                    disabled={isEnrichingSocial}
                    className="items-center gap-1.5"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isEnrichingSocial ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isEnrichingSocial
                        ? "Escaneando..."
                        : "Escanear Redes de la Sala"}
                    </span>
                  </Button>
                </div>
              )}
            </div>

            {/* 8. HERRAMIENTA 1: RADAR DE CALENDARIO & VENTANA DE PROGRAMACIÓN (BOOKING WINDOW) */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 bg-[var(--acc)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold text-xs">
                  <CalendarDays className="w-4 h-4" />
                  <span>Ventana de programación y lead time</span>
                </div>
                {selectedLead.booking_window_info
                  ?.estado_calendario_estimado && (
                  <span
                    className={`text-micro font-mono px-2 py-0.5 rounded font-bold ${
                      selectedLead.booking_window_info
                        .estado_calendario_estimado === "abierto"
                        ? "bg-[var(--ok)] text-[var(--on-ok)]"
                        : selectedLead.booking_window_info
                              .estado_calendario_estimado === "llenandose"
                          ? "bg-[var(--ink)] text-[var(--bg)]"
                          : "bg-[var(--alert)] text-[var(--on-alert)]"
                    }`}
                  >
                    Estado:{" "}
                    {selectedLead.booking_window_info.estado_calendario_estimado
                      .replace("_", " ")
                      .toUpperCase()}
                  </span>
                )}
              </div>

              {selectedLead.booking_window_info ? (
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Antelación ideal
                      </span>
                      <span className="text-sm font-bold text-[var(--acc)] font-mono">
                        {
                          selectedLead.booking_window_info
                            .antelacion_meses_recomendada
                        }{" "}
                        meses
                      </span>
                    </div>

                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Días Fuertes
                      </span>
                      <span className="text-xs font-bold text-[var(--ink-2)]">
                        {selectedLead.booking_window_info.dias_semana_ideales?.join(
                          ", ",
                        ) || "Viernes, Sábado"}
                      </span>
                    </div>

                    <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] ">
                      <span className="text-micro text-[var(--ink-2)] block">
                        Cierre / Vacaciones
                      </span>
                      <span className="text-xs font-bold text-[var(--alert)]">
                        {selectedLead.booking_window_info.meses_cierre_temporada?.join(
                          ", ",
                        ) || "Ninguno"}
                      </span>
                    </div>
                  </div>

                  {selectedLead.booking_window_info.consejo_antelacion && (
                    <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/20 space-y-1.5">
                      <p className="text-xs text-[var(--ink-2)] leading-snug">
                        <ShowIcon inline emoji="💡" />{" "}
                        <strong className="text-[var(--acc)]">
                          Consejo Táctico:
                        </strong>{" "}
                        {selectedLead.booking_window_info.consejo_antelacion}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                  <p className="text-[var(--ink-2)] text-xs italic">
                    Sin análisis de ventana de programación aún.
                  </p>
                  <Button
                    variant="primary"
                    size="xs"
                    type="button"
                    onClick={handleFetchBookingWindow}
                    disabled={isEnrichingBookingWindow}
                    className="items-center gap-1.5"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isEnrichingBookingWindow ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isEnrichingBookingWindow
                        ? "Calculando..."
                        : "Calcular Lead Time y Ventana"}
                    </span>
                  </Button>
                </div>
              )}
            </div>

            {/* 9. HERRAMIENTA 2: RADAR DE EVENTOS LOCALES & ALERTA DE CLASH */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 bg-[var(--alert)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--alert)] font-bold text-xs">
                  <Flame className="w-4 h-4" />
                  <span>Radar eventos locales y alerta clash</span>
                </div>
                {selectedLead.local_events_clash_info?.eventos_detectados && (
                  <span
                    className={`text-micro font-mono px-2 py-0.5 rounded font-bold ${
                      selectedLead.local_events_clash_info.eventos_detectados.some(
                        (e) => e.nivel_riesgo_solapamiento === "alto",
                      )
                        ? "bg-[var(--alert)] text-[var(--on-alert)]"
                        : selectedLead.local_events_clash_info.eventos_detectados.some(
                              (e) => e.nivel_riesgo_solapamiento === "medio",
                            )
                          ? "bg-[var(--ink)] text-[var(--bg)]"
                          : "bg-[var(--ok)] text-[var(--on-ok)]"
                    }`}
                  >
                    Riesgo Clash:{" "}
                    {selectedLead.local_events_clash_info.eventos_detectados.some(
                      (e) => e.nivel_riesgo_solapamiento === "alto",
                    )
                      ? "ALTO"
                      : selectedLead.local_events_clash_info.eventos_detectados.some(
                            (e) => e.nivel_riesgo_solapamiento === "medio",
                          )
                        ? "MEDIO"
                        : "BAJO"}
                  </span>
                )}
              </div>

              {selectedLead.local_events_clash_info ? (
                <div className="space-y-2.5 text-xs">
                  {selectedLead.local_events_clash_info
                    .fechas_favorables_sugeridas?.length > 0 && (
                    <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1.5">
                      <span className="text-micro text-[var(--ink-2)] font-bold block">
                        Ventanas Recomendadas en{" "}
                        {selectedLead.ciudad || "la ciudad"}:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedLead.local_events_clash_info.fechas_favorables_sugeridas.map(
                          (v, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--ok)]/15 text-[var(--ink)] text-xs font-medium"
                            >
                              ✓ {v}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {selectedLead.local_events_clash_info.eventos_detectados
                    ?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-micro text-[var(--ink-2)] font-bold block">
                        Eventos masivos detectados en la zona:
                      </span>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {selectedLead.local_events_clash_info.eventos_detectados.map(
                          (ev, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] flex items-center justify-between text-xs"
                            >
                              <div>
                                <strong className="text-[var(--ink-2)] block">
                                  {ev.nombre}
                                </strong>
                                <span className="text-micro text-[var(--ink-2)] font-mono">
                                  <ShowIcon inline emoji="📅" />{ev.fecha_aproximada} • {ev.tipo}
                                </span>
                              </div>
                              <span
                                className={`text-micro px-1.5 py-0.5 rounded font-bold shrink-0 ${
                                  ev.nivel_riesgo_solapamiento === "alto"
                                    ? "bg-[var(--alert)] text-[var(--on-alert)] "
                                    : ev.nivel_riesgo_solapamiento === "medio"
                                      ? "bg-[var(--ink)] text-[var(--bg)] "
                                      : "bg-[var(--ok)] text-[var(--on-ok)] "
                                }`}
                              >
                                Solape {ev.nivel_riesgo_solapamiento}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {selectedLead.local_events_clash_info.alerta_resumen && (
                    <p className="text-xs text-[var(--ink)] bg-[var(--alert)]/20 p-2.5 rounded-[var(--r-m)] leading-snug">
                      <ShowIcon inline emoji="⚠️" />{selectedLead.local_events_clash_info.alerta_resumen}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                  <p className="text-[var(--ink-2)] text-xs italic">
                    Sin escaneo de eventos locales aún.
                  </p>
                  <Button
                    variant="danger"
                    size="xs"
                    type="button"
                    onClick={handleFetchLocalEvents}
                    disabled={isEnrichingLocalEvents}
                    className="items-center gap-1.5"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isEnrichingLocalEvents ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isEnrichingLocalEvents
                        ? "Escaneando..."
                        : "Escanear Eventos Locales"}
                    </span>
                  </Button>
                </div>
              )}
            </div>

            {/* 10. HERRAMIENTA 4: RADAR DE MEDIOS, RADIOS & PRENSA CULTURAL LOCAL */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 bg-[var(--acc)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold text-xs">
                  <Megaphone className="w-4 h-4" />
                  <span>Medios, radios y prensa cultural local</span>
                </div>
                <span className="text-micro font-mono px-2 py-0.5 rounded bg-[var(--acc)] text-[var(--on-acc)] font-bold">
                  {selectedLead.ciudad || "Provincial"}
                </span>
              </div>

              {selectedLead.local_press_media_info ? (
                <div className="space-y-2.5 text-xs">
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedLead.local_press_media_info.medios?.map((m, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-[var(--acc)] block">
                            {m.nombre}
                          </strong>
                          <span className="text-micro text-[var(--ink-2)]">
                            {m.tipo.replace("_", " ")} • {m.alcance}
                          </span>
                        </div>
                        <span className="text-micro font-mono text-[var(--ink-2)] bg-[var(--sunken)] px-2 py-0.5 rounded ">
                          {m.contacto_sugerido || m.canal}
                        </span>
                      </div>
                    ))}
                  </div>

                  {selectedLead.local_press_media_info
                    .plantilla_nota_prensa_hook && (
                    <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/30 space-y-1.5">
                      <span className="text-micro text-[var(--acc)] font-bold flex items-center gap-1">
                        Gancho Titular para Medios / Radio:
                      </span>
                      <p className="text-xs text-[var(--ink-2)] italic leading-snug">
                        "
                        {
                          selectedLead.local_press_media_info
                            .plantilla_nota_prensa_hook
                        }
                        "
                      </p>
                      <LinkButton
                        size="xs"
                        type="button"
                        onClick={() => {
                          const hook =
                            selectedLead.local_press_media_info
                              ?.plantilla_nota_prensa_hook;
                          if (hook) {
                            navigator.clipboard.writeText(hook);
                            setScoutActionFeedback(
                              "✓ Titular de nota de prensa copiado al portapapeles.",
                            );
                            setTimeout(
                              () => setScoutActionFeedback(null),
                              3500,
                            );
                          }
                        }}
                      >
                        <ShowIcon inline emoji="📋" />Copiar titular de prensa
                      </LinkButton>
                    </div>
                  )}

                  {selectedLead.local_press_media_info.resumen_cobertura && (
                    <p className="text-micro text-[var(--ink-2)] bg-[var(--surface)] p-2 rounded-[var(--r-m)] ">
                      <ShowIcon inline emoji="📢" />{selectedLead.local_press_media_info.resumen_cobertura}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                  <p className="text-[var(--ink-2)] text-xs italic">
                    Sin medios locales detectados aún.
                  </p>
                  <Button
                    variant="primary"
                    size="xs"
                    type="button"
                    onClick={handleFetchPressMedia}
                    disabled={isEnrichingPressMedia}
                    className="items-center gap-1.5"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isEnrichingPressMedia ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isEnrichingPressMedia
                        ? "Buscando..."
                        : "Buscar Medios y Radios"}
                    </span>
                  </Button>
                </div>
              )}
            </div>

            {/* 11. HERRAMIENTA 5: RADAR DE BANDAS LOCALES AFINES (CO-BOOKING) */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3 bg-[var(--acc)]/10">
              <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold text-xs">
                  <Handshake className="w-4 h-4" />
                  <span>Bandas locales hermanadas (co-Booking)</span>
                </div>
                <span className="text-micro font-mono px-2 py-0.5 rounded bg-[var(--acc)] text-[var(--on-acc)] font-bold">
                  Taquilla Compartida
                </span>
              </div>

              {selectedLead.local_band_partners_info ? (
                <div className="space-y-2.5 text-xs">
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedLead.local_band_partners_info.bandas_compatibles?.map(
                      (b, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-[var(--acc)]">
                              <ShowIcon inline emoji="🎸" />{b.nombre}
                            </strong>
                            {b.oyentes_estimados !== undefined && (
                              <span className="text-micro font-mono text-[var(--ink-2)]">
                                {b.oyentes_estimados.toLocaleString()} oyentes
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-micro text-[var(--ink-2)]">
                            <span>
                              {b.genero} {b.instagram ? `• ${b.instagram}` : ""}
                            </span>
                            <span className="text-[var(--acc)] font-medium text-micro">
                              {b.motivo_afinidad}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  {selectedLead.local_band_partners_info
                    .gancho_propuesta_sala && (
                    <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/30 space-y-1.5">
                      <span className="text-micro text-[var(--acc)] font-bold flex items-center gap-1">
                        Propuesta Co-Booking para el Programador:
                      </span>
                      <p className="text-xs text-[var(--ink-2)] italic leading-snug">
                        "
                        {
                          selectedLead.local_band_partners_info
                            .gancho_propuesta_sala
                        }
                        "
                      </p>
                      <LinkButton
                        size="xs"
                        type="button"
                        onClick={() => {
                          const cobooking =
                            selectedLead.local_band_partners_info
                              ?.gancho_propuesta_sala;
                          if (cobooking && selectedLead.pitch_generado) {
                            const newPitch = `${selectedLead.pitch_generado}\n\nPD: ${cobooking}`;
                            onUpdateLead(selectedLead.id, {
                              pitch_generado: newPitch,
                            });
                            setEditedPitch(newPitch);
                            setScoutActionFeedback(
                              "✓ Propuesta de co-booking añadida al pitch.",
                            );
                            setTimeout(
                              () => setScoutActionFeedback(null),
                              4000,
                            );
                          }
                        }}
                      >
                        + Añadir propuesta de co-booking al Pitch
                      </LinkButton>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                  <p className="text-[var(--ink-2)] text-xs italic">
                    Sin bandas locales para co-booking cargadas.
                  </p>
                  <Button
                    variant="primary"
                    size="xs"
                    type="button"
                    onClick={handleFetchCoBooking}
                    disabled={isEnrichingCoBooking}
                    className="items-center gap-1.5"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isEnrichingCoBooking ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isEnrichingCoBooking
                        ? "Buscando..."
                        : "Buscar Bandas para Co-Booking"}
                    </span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 7. HERRAMIENTA 5: SIMULADOR INTERACTIVO DE TAQUILLA, CACHÉ & BREAK-EVEN (P&L FINANCIERO) */}
          <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3.5 bg-[var(--ok)]/10">
            <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-[var(--ok)] font-bold text-xs">
                <Calculator className="w-4 h-4" />
                <span className="text-sm">
                  Simulador de Taquilla, Caché y Break-Even (P&L por Concierto)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="xs"
                  type="button"
                  onClick={() => handleRecalculateFinancial()}
                  disabled={isRecalculatingFinancial}
                  className="items-center gap-1.5"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isRecalculatingFinancial ? "animate-spin" : ""}`}
                  />
                  <span>Recalcular y guardar P&L</span>
                </Button>
              </div>
            </div>

            {/* Inputs de simulación */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  <ShowIcon inline emoji="🎟️" />Anticipada (€)
                </label>
                <Input size="sm" aria-label="Anticipada (€)"
                  type="number"
                  value={simAnticipada}
                  onChange={(e) => setSimAnticipada(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  <ShowIcon inline emoji="🚪" />Puerta (€)
                </label>
                <Input size="sm" aria-label="Puerta (€)"
                  type="number"
                  value={simTaquilla}
                  onChange={(e) => setSimTaquilla(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  <ShowIcon inline emoji="🏢" />Alquiler sala (€)
                </label>
                <Input size="sm" aria-label="Alquiler sala (€)"
                  type="number"
                  value={simAlquiler}
                  onChange={(e) => setSimAlquiler(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  % Sala / taquilla
                </label>
                <Input size="sm" aria-label="% Sala / taquilla"
                  type="number"
                  value={simPctSala}
                  onChange={(e) => setSimPctSala(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  <ShowIcon inline emoji="🚐" />Gastos Viaje/Prod (€)
                </label>
                <Input size="sm" aria-label="Gastos Viaje/Prod (€)"
                  type="number"
                  value={simGastosProd}
                  onChange={(e) => setSimGastosProd(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  <ShowIcon inline emoji="🎸" />Nº Músicos
                </label>
                <Input size="sm" aria-label="Nº Músicos"
                  type="number"
                  value={simNumMusicos}
                  onChange={(e) => setSimNumMusicos(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Resultados de rentabilidad */}
            {selectedLead.financial_break_even ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-[var(--r-m)] bg-[var(--ok)]/30 text-center">
                    <span className="text-micro text-[var(--ok)] font-bold block">
                      Punto de Equilibrio
                    </span>
                    <span className="text-xl font-extrabold text-[var(--ok)] font-mono block">
                      {selectedLead.financial_break_even.entradas_break_even}
                    </span>
                    <span className="text-micro text-[var(--ink-2)] block">
                      entradas para no perder (€0)
                    </span>
                  </div>

                  <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] text-center">
                    <span className="text-micro text-[var(--ink-2)] font-bold block">
                      % Aforo Requerido
                    </span>
                    <span className="text-xl font-bold text-[var(--ink-2)] font-mono block">
                      {Math.round(
                        ((selectedLead.financial_break_even
                          .entradas_break_even || 1) /
                          (selectedLead.aforo || 250)) *
                          100,
                      )}
                      %
                    </span>
                    <span className="text-micro text-[var(--ink-2)] block">
                      de {selectedLead.aforo || 250} aforo máx.
                    </span>
                  </div>

                  <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] text-center">
                    <span className="text-micro text-[var(--ink-2)] font-bold block">
                      Beneficio Banda (80% lleno)
                    </span>
                    <span className="text-xl font-bold text-[var(--ok)] font-mono block">
                      {
                        selectedLead.financial_break_even
                          .beneficio_estimado_lleno
                      }{" "}
                      €
                    </span>
                    <span className="text-micro text-[var(--ink-2)] block">
                      margen neto total
                    </span>
                  </div>

                  <div className="p-3 rounded-[var(--r-m)] bg-[var(--ok)]/40 text-center">
                    <span className="text-micro text-[var(--ok)] font-bold block">
                      Limpio por músico
                    </span>
                    <span className="text-xl font-extrabold text-[var(--ok)] font-mono block">
                      {
                        selectedLead.financial_break_even
                          .beneficio_por_musico_estimado
                      }{" "}
                      €
                    </span>
                    <span className="text-micro text-[var(--ok)]/80 block">
                      / cada uno (
                      {selectedLead.financial_break_even.num_musicos}{" "}
                      integrantes)
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--ok)]/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[var(--ok)] shrink-0" />
                    <span className="text-[var(--ink-2)] text-xs">
                      Con{" "}
                      <strong className="text-[var(--ok)]">
                        {selectedLead.financial_break_even.entradas_break_even}{" "}
                        entradas
                      </strong>{" "}
                      cubrís íntegramente el alquiler de la sala ({simAlquiler}
                      €) y los gastos de furgoneta/sonido ({simGastosProd}€).
                    </span>
                  </div>
                  <span className="font-bold text-[var(--ok)] font-mono shrink-0 ml-2">
                    ✓ Margen Positivo
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-3 text-center text-[var(--ink-2)] text-xs italic">
                Ajusta los precios y pulsa “Recalcular y Guardar P&L” para
                simular la rentabilidad del concierto.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: COPILOTO DE CIERRE, LOGÍSTICA & P&L */}
      {activeTab === "copilot" && (
        <DealAndLogisticsCopilot
          lead={selectedLead}
          latestIncomingMessage={
            hiloCompleto.filter((m) => m.remitente === "sala").slice(-1)[0]
              ?.mensaje || selectedLead.ultimo_mensaje_recibido
          }
          isStitchLight={isStitchLight}
          onOpenRoadbookModal={onOpenRoadbookModal}
        />
      )}

      {/* TAB 4: CONTACT BITÁCORA */}
      {activeTab === "bitacora" && (
        <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[var(--acc)]" />
              <h4 className="text-xs font-bold text-[var(--ink)] font-sans">
                Bitácora de contacto y llamadas
              </h4>
            </div>
            <span className="text-micro text-[var(--acc)]/80 font-sans">
              {(selectedLead.historial_contacto || []).length} registros
            </span>
          </div>

          {/* Log Form */}
          <form
            onSubmit={handleAddInteractionLog}
            className="space-y-3 bg-[var(--surface)] p-3 rounded-[var(--r-m)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Interaction Type Selector */}
              <div className="flex items-center gap-1 bg-[var(--sunken)] p-1 rounded-[var(--r-s)]">
                {(
                  ["Llamada", "WhatsApp", "Email", "Reunión", "Otro"] as const
                ).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setInteractionType(type)}
                    className={`px-2 py-1 rounded text-micro font-bold transition-ui cursor-pointer ${
                      interactionType === type
                        ? "bg-[var(--ink)] text-[var(--bg)] font-bold"
                        : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {type === "Llamada"
                      ? "📞"
                      : type === "WhatsApp"
                        ? "💬"
                        : type === "Email"
                          ? "✉️"
                          : type === "Reunión"
                            ? "🤝"
                            : "📝"}
                    {" "}
                    {type}
                  </button>
                ))}
              </div>

              {/* Author input */}
              <Input
                size="sm"
                type="text"
                value={interactionAutor}
                onChange={(e) => setInteractionAutor(e.target.value)}
                placeholder="Tu nombre…"
                className="w-28"
              />
            </div>

            {/* Result Outcome Pills */}
            <div className="space-y-1">
              <span className="text-micro text-[var(--ink-2)] font-sans">
                Resultado del contacto:
              </span>
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    "Interesado",
                    "Enviar propuesta",
                    "Seguimiento pendiente",
                    "Acuerdo cerrado",
                    "Rechazado",
                    "Info recibida",
                  ] as const
                ).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setInteractionResultado(res)}
                    className={`px-2 py-0.5 rounded text-micro font-medium transition-ui cursor-pointer ${
                      interactionResultado === res
                        ? res === "Interesado" || res === "Acuerdo cerrado"
                          ? "bg-[var(--ok)]/30 text-[var(--ink)] font-bold"
                          : res === "Rechazado"
                            ? "bg-[var(--alert)]/30 text-[var(--ink)] font-bold"
                            : "bg-[var(--acc)]/30 text-[var(--ink)] font-bold"
                        : "bg-[var(--bg)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes textarea */}
            <Textarea
              rows={4}
              required
              value={interactionNotes}
              onChange={(e) => setInteractionNotes(e.target.value)}
              placeholder="Ej: Hablé con Carlos por WhatsApp. Pide propuesta de fechas para Noviembre…"
              className="w-full min-h-[90px]"
            />

            <button
              type="submit"
              className="w-full py-2 bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold text-xs rounded-[var(--r-s)] transition-ui cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Anotar en Bitácora</span>
            </button>
          </form>

          {/* Timeline Feed */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
            {(selectedLead.historial_contacto || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
                <PublicoSilhouette opacity={0.12} size="small" />
                <p className="mt-3 font-medium text-[var(--ink)] text-xs">
                  Sin interacciones
                </p>
                <p className="mt-1.5 text-[var(--ink-2)] text-micro max-w-xs text-center">
                  Registra llamadas y mensajes desde la entrada de contacto.
                </p>
              </div>
            ) : (
              (selectedLead.historial_contacto || []).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-[var(--r-s)] bg-[var(--bg)] space-y-1.5 text-xs font-sans relative group"
                >
                  <div className="flex items-center justify-between text-micro">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--sunken)] text-[var(--acc-ink)]">
                        {log.tipo === "Llamada"
                          ? "Llamada"
                          : log.tipo === "WhatsApp"
                            ? "WhatsApp"
                            : log.tipo === "Email"
                              ? "Email"
                              : log.tipo === "Reunión"
                                ? "Reunión"
                                : "Nota"}
                      </span>
                      <span className="text-[var(--ink-2)]">
                        {log.autor || "Agente"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--ink-2)] font-sans">
                        {log.fecha}
                      </span>
                      <IconButton
                        label="Borrar entrada"
                        variant="danger"
                        size="icon-xs"
                        type="button"
                        onClick={() => handleDeleteInteractionLog(log.id)}
                        className="opacity-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </IconButton>
                    </div>
                  </div>

                  {log.resultado && (
                    <div>
                      <span
                        className={`inline-block text-micro px-1.5 py-0.2 rounded font-bold ${
                          log.resultado === "Interesado" ||
                          log.resultado === "Acuerdo cerrado"
                            ? "bg-[var(--ok)]/20 text-[var(--ink)]"
                            : log.resultado === "Rechazado"
                              ? "bg-[var(--alert)]/20 text-[var(--ink)]"
                              : "bg-[var(--acc)]/20 text-[var(--ink)]"
                        }`}
                      >
                        {log.resultado}
                      </span>
                    </div>
                  )}

                  <p className="text-[var(--ink)] text-xs leading-snug whitespace-pre-wrap select-text">
                    {log.notas}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Multi-Model Parallel Pitch Comparator Modal (A/B/C Testing) */}
      <MultiModelPitchComparatorModal
        isOpen={showMultiModelModal}
        onClose={() => setShowMultiModelModal(false)}
        lead={selectedLead}
        activeCampaign={activeCampaign}
        onSelectProposal={(text, providerName) => {
          setEditedPitch(text);
          selectedLead.pitch_generado = text;
          onUpdateLead(selectedLead.id, { pitch_generado: text });
          const label =
            providerName === "deepseek" ? "DeepSeek V3" : "Gemini 3.7 Flash";
          setFeedbackSuccessMsg(
            `¡Propuesta de ${label} seleccionada y aplicada a la sala!`,
          );
          setTimeout(() => setFeedbackSuccessMsg(null), 5000);
        }}
      />

      {/* Modal de Conexión CRM -> Bolo -> Repertorio Óptimo */}
      <BoloConfirmadoSetlistModal
        isOpen={showBoloConfirmadoModal}
        lead={selectedLead}
        onClose={() => setShowBoloConfirmadoModal(false)}
        onConfirmWithSetlist={handleConfirmWithSetlist}
        onConfirmWithoutSetlist={handleConfirmWithoutSetlist}
      />

      {/* Modal / Drawer WhatsApp Preview Interactivo */}
      {selectedLead && (
        <WhatsAppPreviewModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          lead={selectedLead}
          isStitchLight={isStitchLight}
          onLogInteraction={(leadId, logData) => {
            const nowStr = new Date()
              .toISOString()
              .replace("T", " ")
              .slice(0, 16);
            const newLog: InteractionLog = {
              id: `log-${Date.now()}`,
              fecha: nowStr,
              tipo: "WhatsApp",
              autor: interactionAutor || "Mánager / Booking",
              notas: logData.notas,
              resultado: (logData.resultado as any) || "Interesado",
            };
            const existingLogs = selectedLead.historial_contacto || [];
            onUpdateLead(leadId, {
              historial_contacto: [newLog, ...existingLogs],
              fecha_ultima_respuesta: new Date().toISOString().slice(0, 10),
            });
          }}
          onUpdateLeadPhone={(leadId, updates) => {
            onUpdateLead(leadId, updates);
            setEditedLeadInfo((prev) => ({ ...prev, ...updates }));
          }}
        />
      )}
    </div>
  );
};
