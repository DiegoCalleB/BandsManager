import { camposCambiados } from "../../utils/camposCambiados";
import { VenueIntelligenceSection } from "./venue_panel/VenueIntelligenceSection";
import { VenueBitacoraSection } from "./venue_panel/VenueBitacoraSection";
import { VenueEmailsSection } from "./venue_panel/VenueEmailsSection";
import { VenuePitchInfoSection } from "./venue_panel/VenuePitchInfoSection";
import { VenueContactRosterCards } from "./venue_panel/VenueContactRosterCards";
import { isStitchLight } from "./venue_panel/venueTheme";
import { VenueAgentWorkflowBanner } from "./venue_panel/VenueAgentWorkflowBanner";
import { VenueScoutToolbar } from "./venue_panel/VenueScoutToolbar";
import { VenueQuickActionBar } from "./venue_panel/VenueQuickActionBar";
import { VenueLeadHealthRow } from "./venue_panel/VenueLeadHealthRow";
import { VenueTitleBar } from "./venue_panel/VenueTitleBar";
import React, { useState, useEffect, useRef } from "react";
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
import { FastDealModal } from "./FastDealModal";
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
  Zap,
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
  // Foto del lead en el momento de pulsar «Editar»: sirve para mandar al guardar SOLO lo que
  // el usuario ha cambiado (ver src/utils/camposCambiados.ts).
  const leadAlEditarRef = useRef<Partial<Lead> | null>(null);

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
  const [showFastDealModal, setShowFastDealModal] = useState(false);
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

      <VenueTitleBar selectedLead={selectedLead} onFilterByRouteCity={onFilterByRouteCity} onClose={onClose} onUpdateLead={onUpdateLead} handleStartEdit={handleStartEdit} onDeleteLead={onDeleteLead} getStatusDotColor={getStatusDotColor} normalizeStatus={normalizeStatus} handleCorrectStatus={handleCorrectStatus} setShowFastDealModal={setShowFastDealModal} setShowWhatsAppModal={setShowWhatsAppModal} handleScanWithJina={handleScanWithJina} isScanningJina={isScanningJina} handleDetectVenueDates={handleDetectVenueDates} isDetectingDates={isDetectingDates} editedLeadInfo={editedLeadInfo} handleEnrichInstagram={handleEnrichInstagram} isEnrichingInstagram={isEnrichingInstagram} scoutActionFeedback={scoutActionFeedback} activeCampaign={activeCampaign} concerts={concerts} bandName={bandName} editedPitch={editedPitch} setEditedPitch={setEditedPitch} setIsEditingPitch={setIsEditingPitch} isReplyStage={isReplyStage} handleApprovePitchDirectly={handleApprovePitchDirectly} isCreatingDraft={isCreatingDraft} draftError={draftError} setIsCreatingDraft={setIsCreatingDraft} setDraftError={setDraftError} />

      <VenueContactRosterCards selectedLead={selectedLead} handleEnrichLead={handleEnrichLead} isEnrichingLead={isEnrichingLead} enrichStatusMsg={enrichStatusMsg} autoDetectVenueAddress={autoDetectVenueAddress} onUpdateLead={onUpdateLead} />

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

      <VenuePitchInfoSection activeTab={activeTab} isEditingLeadInfo={isEditingLeadInfo} selectedLead={selectedLead} setIsEditingLeadInfo={setIsEditingLeadInfo} handleSaveLeadInfo={handleSaveLeadInfo} editedLeadInfo={editedLeadInfo} setEditedLeadInfo={setEditedLeadInfo} handleAutoSearchLogo={handleAutoSearchLogo} isSearchingLogo={isSearchingLogo} onLeadLogoUpload={onLeadLogoUpload} isUploadingLeadLogo={isUploadingLeadLogo} handleAutoExtractFestivalDates={handleAutoExtractFestivalDates} isExtractingDates={isExtractingDates} bandName={bandName} setEditedPitch={setEditedPitch} setIsEditingPitch={setIsEditingPitch} handleRecalculateFinancial={handleRecalculateFinancial} isRecalculatingFinancial={isRecalculatingFinancial} isReplyStage={isReplyStage} setShowMultiModelModal={setShowMultiModelModal} handleCopyPitch={handleCopyPitch} copiedPitch={copiedPitch} setShowWhatsAppModal={setShowWhatsAppModal} handleApprovePitchDirectly={handleApprovePitchDirectly} isCreatingDraft={isCreatingDraft} activeCampaign={activeCampaign} handleRegeneratePitchWithFeedback={handleRegeneratePitchWithFeedback} isRegeneratingPitch={isRegeneratingPitch} editedPitch={editedPitch} onUpdateLead={onUpdateLead} isEditingPitch={isEditingPitch} handleSavePitch={handleSavePitch} setShowFeedbackHistory={setShowFeedbackHistory} showFeedbackHistory={showFeedbackHistory} setToneRating={setToneRating} toneRating={toneRating} setContentRating={setContentRating} contentRating={contentRating} feedbackComment={feedbackComment} setFeedbackComment={setFeedbackComment} setFeedbackScope={setFeedbackScope} feedbackScope={feedbackScope} feedbackSuccessMsg={feedbackSuccessMsg} selectedAiModel={selectedAiModel} setSelectedAiModel={setSelectedAiModel} handleRevertPitch={handleRevertPitch} isRevertingPitch={isRevertingPitch} />

      <VenueEmailsSection activeTab={activeTab} selectedLead={selectedLead} bandName={bandName} setEditedPitch={setEditedPitch} setIsEditingPitch={setIsEditingPitch} onUpdateLead={onUpdateLead} setActiveTab={setActiveTab} hiloCompleto={hiloCompleto} handleAnalyzeMessageSentiment={handleAnalyzeMessageSentiment} isAnalyzingMessageSentiment={isAnalyzingMessageSentiment} editedPitch={editedPitch} />

      <VenueIntelligenceSection activeTab={activeTab} handleEnrichAllApis={handleEnrichAllApis} isEnrichingApis={isEnrichingApis} selectedLead={selectedLead} onUpdateLead={onUpdateLead} setEditedPitch={setEditedPitch} setScoutActionFeedback={setScoutActionFeedback} routeOrigin={routeOrigin} setRouteOrigin={setRouteOrigin} handleCalculateRoute={handleCalculateRoute} isCalculatingRoute={isCalculatingRoute} handleFetchSocial={handleFetchSocial} isEnrichingSocial={isEnrichingSocial} handleFetchBookingWindow={handleFetchBookingWindow} isEnrichingBookingWindow={isEnrichingBookingWindow} handleFetchLocalEvents={handleFetchLocalEvents} isEnrichingLocalEvents={isEnrichingLocalEvents} handleFetchPressMedia={handleFetchPressMedia} isEnrichingPressMedia={isEnrichingPressMedia} handleFetchCoBooking={handleFetchCoBooking} isEnrichingCoBooking={isEnrichingCoBooking} handleRecalculateFinancial={handleRecalculateFinancial} isRecalculatingFinancial={isRecalculatingFinancial} simAnticipada={simAnticipada} setSimAnticipada={setSimAnticipada} simTaquilla={simTaquilla} setSimTaquilla={setSimTaquilla} simAlquiler={simAlquiler} setSimAlquiler={setSimAlquiler} simPctSala={simPctSala} setSimPctSala={setSimPctSala} simGastosProd={simGastosProd} setSimGastosProd={setSimGastosProd} simNumMusicos={simNumMusicos} setSimNumMusicos={setSimNumMusicos} />

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

      <VenueBitacoraSection activeTab={activeTab} selectedLead={selectedLead} handleAddInteractionLog={handleAddInteractionLog} setInteractionType={setInteractionType} interactionType={interactionType} interactionAutor={interactionAutor} setInteractionAutor={setInteractionAutor} setInteractionResultado={setInteractionResultado} interactionResultado={interactionResultado} interactionNotes={interactionNotes} setInteractionNotes={setInteractionNotes} handleDeleteInteractionLog={handleDeleteInteractionLog} />

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

      {/* Modal Hoja de Acuerdo 1-Click */}
      {selectedLead && (
        <FastDealModal
          isOpen={showFastDealModal}
          onClose={() => setShowFastDealModal(false)}
          lead={selectedLead}
          bandName={bandName || 'Nuestra Banda'}
          onDealConfirmed={() => {
            onUpdateLead(selectedLead.id, { estado: 'confirmado' });
          }}
        />
      )}
    </div>
  );
};
