import React, { useState, useRef, useEffect } from "react";
import { Lead, LeadStatus, LeadType, Concert } from "../../types";
import { LeadHealthBadge } from "./LeadHealthBadge";
import { VerifiedBadge } from "../common/VerifiedBadge";
import { ReliabilityBadge } from "../common/ReliabilityBadge";
import { FavoriteButton } from "../common/FavoriteButton";
import { isLeadVerificado } from "../../utils/leadReliability";
import {
  checkBandDateConflict,
  getCityTourHistory,
} from "../../utils/bookingTourContext";
import {
  MessageCircle,
  PhoneCall,
  Phone,
  Smartphone,
  CheckCircle2,
  Eye,
  Sparkles,
  Trash2,
  Camera,
  CheckSquare,
  Square,
  MinusSquare,
  AlertCircle,
  Instagram,
  CalendarCheck,
  Loader2,
  Calendar,
  Coins,
  Flame,
  TrendingUp,
  Zap,
  Clock,
  Sliders,
  ExternalLink,
  Compass,
} from "lucide-react";
import { ChangeLeadImageModal } from "./ChangeLeadImageModal";
import { LeadAvatar } from "./LeadAvatar";
import { EmailDeliveryTicks } from "./EmailDeliveryTicks";
import {
  useEmailValidation,
  getEmailStatus,
  isBouncedLead,
} from "../../hooks/useEmailValidation";
import {
  getWhatsAppUrl,
  openWhatsAppChat,
  WHATSAPP_WINDOW_NAME,
} from "../../utils/whatsapp";
import {
  isLeadNeedsFollowup,
  getDaysSinceContact,
  generateFollowupTemplate,
} from "../../utils/bookingFollowup";

interface LeadsTableProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (
    lead: Lead,
    options?: {
      tab?: "info" | "emails" | "copilot" | "bitacora";
      pitchDraft?: string;
    },
  ) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onDeleteLead?: (id: string, name: string) => void;
  onLeadLogoUpload?: (file: File) => Promise<string | null> | void;
  viewMode: "grid" | "table";
  getStatusBadgeClass: (status: LeadStatus | string) => string;
  getStatusLabel: (status: LeadStatus | string) => string;
  normalizeType: (type?: string) => string;
  sectionTab?: "salas" | "medios" | "grupos";
  mediaTypeFilter?: "televisión" | "radio" | "redes" | "managements" | "todos";
  setMediaTypeFilter?: (
    type: "televisión" | "radio" | "redes" | "managements" | "todos",
  ) => void;
  selectedLeadIds?: string[];
  onToggleSelectLead?: (id: string, e?: React.MouseEvent) => void;
  onSelectAllFiltered?: () => void;
  onDeselectAll?: () => void;
  isAllSelected?: boolean;
  isSomeSelected?: boolean;
  activeCampaign?: any;
  onFilterByRouteCity?: (city: string) => void;
  effectiveBandName?: string;
  concerts?: Concert[];
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  selectedLead,
  onSelectLead,
  onUpdateLead,
  onDeleteLead,
  onLeadLogoUpload,
  viewMode,
  getStatusBadgeClass,
  getStatusLabel,
  normalizeType,
  sectionTab = "salas",
  mediaTypeFilter = "todos",
  setMediaTypeFilter,
  selectedLeadIds = [],
  onToggleSelectLead,
  onSelectAllFiltered,
  onDeselectAll,
  isAllSelected = false,
  isSomeSelected = false,
  activeCampaign,
  onFilterByRouteCity,
  effectiveBandName,
  concerts = [],
}) => {
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const renderLeadDatesInfo = (lead: Lead, isTable: boolean = false) => {
    // En la vista de tabla, evitar bloques gigantes de texto. Solo mostrar badges si hay datos reales
    if (isTable) {
      const targetDate =
        (lead as any).fecha_posible_evento ||
        (lead.fechas_propuestas_sala && lead.fechas_propuestas_sala[0]) ||
        (lead.fechas_libres_detectadas && lead.fechas_libres_detectadas[0]) ||
        (lead as any).fechas_libres_campana?.[0] ||
        (lead as any).fechas_propuestas?.[0] ||
        (lead as any).fechas_disponibles?.[0];
      const conflict = checkBandDateConflict(targetDate, concerts, lead.ciudad);
      const hist = getCityTourHistory(lead.ciudad, concerts);
      const freeDates = lead.fechas_libres_detectadas || [];
      const campaignFreeDates = (lead as any).fechas_libres_campana || [];
      const campaignIsActive =
        activeCampaign &&
        (activeCampaign.isActive ?? activeCampaign.is_active ?? true);

      const badges: React.ReactNode[] = [];

      if (conflict.status === "conflicto_directo") {
        badges.push(
          <span
            key="conf"
            className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8.5px] bg-[var(--alert)]/80 text-[var(--alert)] font-bold border border-[var(--alert)]/40"
            title={conflict.mensaje}
          >
            🔴 Conflicto
          </span>,
        );
      } else if (conflict.status === "cercano_compatible") {
        badges.push(
          <span
            key="compat"
            className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8.5px] bg-[var(--ok)]/80 text-[var(--ok)] font-bold border border-[var(--ok)]/40"
            title={conflict.mensaje}
          >
            🚗 Enlace 2x1
          </span>,
        );
      }

      if (campaignIsActive && campaignFreeDates.length > 0) {
        badges.push(
          <span
            key="camp"
            className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8.5px] bg-[var(--acc)]/80 text-[var(--acc)] font-semibold border border-[var(--acc)]/40"
            title={`Fechas campaña: ${campaignFreeDates.join(", ")}`}
          >
            🎯 {campaignFreeDates.length} d.
          </span>,
        );
      } else if (freeDates.length > 0) {
        badges.push(
          <span
            key="free"
            className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8.5px] bg-[var(--acc)]/80 text-[var(--acc)] font-semibold border border-[var(--acc)]/40"
            title={`Fechas libres detectadas: ${freeDates.join(", ")}`}
          >
            <CalendarCheck className="w-2.5 h-2.5 text-[var(--acc)] shrink-0" />
            <span>{freeDates.length} lib.</span>
          </span>,
        );
      }

      if (hist && hist.totalConciertos > 0) {
        badges.push(
          <span
            key="hist"
            className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8.5px] bg-[var(--acc)]/60 text-[var(--acc)] border border-[var(--acc)]/30"
            title={hist.resumenTexto}
          >
            🏛️ {hist.totalConciertos} prev.
          </span>,
        );
      }

      if (badges.length === 0) return null;

      return (
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">{badges}</div>
      );
    }

    const campaignIsActive =
      activeCampaign &&
      (activeCampaign.isActive ?? activeCampaign.is_active ?? true);

    // Status indicators de fuentes de radar
    const wegowStatus =
      (lead as any).radar_wegow_status ||
      (lead.fechas_ocupadas && lead.fechas_ocupadas.length > 0
        ? "ok"
        : undefined);
    const bandsintownStatus =
      (lead as any).radar_bandsintown_status ||
      (lead as any).contrastado_multi_fuente
        ? "ok"
        : undefined;
    const contrastado = Boolean(
      (lead as any).contrastado_multi_fuente ||
      (wegowStatus === "ok" && bandsintownStatus === "ok"),
    );
    const fiabilidad =
      (lead as any).fiabilidad_radar ||
      (contrastado
        ? "alta"
        : lead.fechas_ocupadas && lead.fechas_ocupadas.length > 0
          ? "media"
          : "sin_datos");

    const getVenueProgrammingUrl = (leadItem: Lead) => {
      if (leadItem.website && leadItem.website.trim().length > 0) {
        let url = leadItem.website.trim();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          url = "https://" + url;
        }
        return url;
      }
      const query =
        `${leadItem.nombre_sala} ${leadItem.ciudad || ""} programacion cartelera conciertos`.trim();
      return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    };

    const programmingUrl = getVenueProgrammingUrl(lead);

    const renderSourcePills = () => {
      const targetDate =
        (lead as any).fecha_posible_evento ||
        (lead.fechas_propuestas_sala && lead.fechas_propuestas_sala[0]) ||
        (lead.fechas_libres_detectadas && lead.fechas_libres_detectadas[0]) ||
        (lead as any).fechas_libres_campana?.[0] ||
        (lead as any).fechas_propuestas?.[0] ||
        (lead as any).fechas_disponibles?.[0];
      const conflict = checkBandDateConflict(targetDate, concerts, lead.ciudad);
      const hist = getCityTourHistory(lead.ciudad, concerts);

      return (
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[9px] font-mono">
          <a
            href={`https://www.wegow.com/es-es/busqueda?query=${encodeURIComponent(lead.nombre_sala)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded border hover:opacity-80 transition-opacity cursor-pointer ${
              wegowStatus === "ok"
                ? "bg-[var(--ok)]/80 border-[var(--ok)]/50 text-[var(--ok)]"
                : wegowStatus === "error"
                  ? "bg-[var(--alert)]/80 border-[var(--alert)]/50 text-[var(--alert)]"
                  : "bg-[var(--surface)]/80 border-[var(--hair)] text-[var(--ink-2)]"
            }`}
            title={
              wegowStatus === "ok"
                ? "Wegow API verificado - Clic para ver cartelera en Wegow"
                : "Buscar esta sala en Wegow"
            }
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            Wegow: {wegowStatus === "ok" ? "✓ OK" : "Sin datos"}
            <ExternalLink className="w-2 h-2 ml-0.5 opacity-60 shrink-0" />
          </a>

          <a
            href={`https://www.bandsintown.com/a/search?q=${encodeURIComponent(lead.nombre_sala)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded border hover:opacity-80 transition-opacity cursor-pointer ${
              bandsintownStatus === "ok"
                ? "bg-[var(--acc)]/80 border-[var(--acc)]/50 text-[var(--acc)]"
                : "bg-[var(--surface)]/80 border-[var(--hair)] text-[var(--ink-2)]"
            }`}
            title={
              bandsintownStatus === "ok"
                ? "Bandsintown verificado - Clic para ver en Bandsintown"
                : "Buscar esta sala en Bandsintown"
            }
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            Bandsintown: {bandsintownStatus === "ok" ? "✓ OK" : "Sin datos"}
            <ExternalLink className="w-2 h-2 ml-0.5 opacity-60 shrink-0" />
          </a>

          {contrastado && (
            <span className="text-[8.5px] text-[var(--acc)] font-bold bg-[var(--acc)]/70 border border-[var(--acc)]/40 px-1 py-0.2 rounded">
              ⭐ Contrastado (Fiabilidad {fiabilidad})
            </span>
          )}

          {conflict.status === "conflicto_directo" && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[var(--alert)]/90 text-[var(--alert)] border border-[var(--alert)]/50 font-bold"
              title={conflict.mensaje}
            >
              🔴 Conflicto agenda
            </span>
          )}

          {conflict.status === "cercano_compatible" && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[var(--ok)]/90 text-[var(--ok)] border border-[var(--ok)]/50 font-bold"
              title={conflict.mensaje}
            >
              🚗 Enlace 2x1
            </span>
          )}

          {hist && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[var(--acc)]/70 text-[var(--acc)] border border-[var(--acc)]/40"
              title={hist.resumenTexto}
            >
              🏛️ {hist.totalConciertos}{" "}
              {hist.totalConciertos === 1 ? "bolo" : "bolos"} prev.
            </span>
          )}
        </div>
      );
    };

    // Cuando la campaña está ACTIVA:
    if (campaignIsActive) {
      const targetDates =
        activeCampaign?.targetDates ||
        (activeCampaign as any)?.target_dates ||
        [];
      const targetDatesText =
        activeCampaign?.fechas_objetivo ||
        activeCampaign?.fechasObjetivo ||
        activeCampaign?.fechas ||
        activeCampaign?.nombre ||
        "";

      const campaignFreeDates = (lead as any).fechas_libres_campana || [];
      const hasVerifiedSources =
        Array.isArray(lead.radar_fuentes_verificadas) &&
        lead.radar_fuentes_verificadas.length > 0;
      const hasOccupied =
        Array.isArray(lead.fechas_ocupadas) && lead.fechas_ocupadas.length > 0;
      const hasWegowOk = (lead as any).radar_wegow_status === "ok";
      const hasBandsintownOk = (lead as any).radar_bandsintown_status === "ok";

      const hasConcertsOrSources =
        lead.datos_fechas_encontrados === true ||
        hasWegowOk ||
        hasBandsintownOk ||
        hasVerifiedSources ||
        hasOccupied;
      const isSinDatos =
        !hasConcertsOrSources || lead.datos_fechas_encontrados === false;

      // Si no se han encontrado datos de fechas ni cartelera verificada de esta sala
      if (isSinDatos) {
        return (
          <div className="flex flex-col gap-0.5 mt-0.5">
            <a
              href={programmingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={`Ver web u obtener programación de ${lead.nombre_sala}`}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-sans font-medium text-[var(--acc)]/90 bg-[var(--acc)]/50 border border-[var(--acc)]/50 hover:bg-[var(--acc)]/60 transition-colors cursor-pointer group"
            >
              <AlertCircle className="w-3 h-3 text-[var(--acc)] shrink-0" />
              <span>(no se han encontrado datos de fechas de esta sala)</span>
              <ExternalLink className="w-2.5 h-2.5 text-[var(--acc)]/70 group-hover:text-[var(--acc)] shrink-0 ml-0.5" />
            </a>
            {renderSourcePills()}
          </div>
        );
      }

      // Evaluar coincidencia exclusiva con fechas de la campaña y horizonte de cartelera
      const estadoCartelera = (lead as any).estado_cartelera;
      const maxFecha = (lead as any).max_fecha_publicada;
      const formatIsoShort = (isoStr?: string) => {
        if (!isoStr || !/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) return isoStr || "";
        const [y, m, d] = isoStr.split("-").map((n) => parseInt(n, 10));
        const months = [
          "Ene",
          "Feb",
          "Mar",
          "Abr",
          "May",
          "Jun",
          "Jul",
          "Ago",
          "Sep",
          "Oct",
          "Nov",
          "Dic",
        ];
        return `${d} ${months[m - 1] || ""}`.trim();
      };
      const maxFechaFmt = formatIsoShort(maxFecha);

      let isAvailableForCampaign = false;
      let matchingDatesInCampaign: string[] = [];

      if ((lead as any).disponible_para_campana !== undefined) {
        isAvailableForCampaign = Boolean((lead as any).disponible_para_campana);
        matchingDatesInCampaign = (lead as any).fechas_libres_campana || [];
      } else if (Array.isArray(targetDates) && targetDates.length > 0) {
        const occupiedSet = new Set(lead.fechas_ocupadas || []);
        matchingDatesInCampaign = targetDates.filter(
          (t) => !occupiedSet.has(t),
        );
        isAvailableForCampaign = matchingDatesInCampaign.length > 0;
      } else if (targetDatesText) {
        const terms = String(targetDatesText)
          .toLowerCase()
          .split(/[\s,;&\/]+/);
        matchingDatesInCampaign = campaignFreeDates.filter((f: string) => {
          const fLower = f.toLowerCase();
          return terms.some(
            (term) => term.length >= 2 && fLower.includes(term),
          );
        });
        isAvailableForCampaign = matchingDatesInCampaign.length > 0;
      } else {
        isAvailableForCampaign = campaignFreeDates.length > 0;
        matchingDatesInCampaign = campaignFreeDates;
      }

      // 1. Caso: Programación de la sala no llega aún a la fecha de la campaña
      if (estadoCartelera === "no_publicada_aun") {
        return (
          <div className="flex flex-col gap-0.5 mt-0.5">
            <a
              href={programmingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={`La agenda publicada de esta sala solo llega hasta ${maxFechaFmt || "meses anteriores"}. Oportunidad para enviar propuesta antes de que cierren agenda.`}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-sans font-bold bg-[var(--acc)]/90 border border-[var(--acc)]/80 text-[var(--acc)] hover:bg-[var(--acc)]/90 hover:border-[var(--acc)] transition-colors shadow-2xs group cursor-pointer"
            >
              <Clock className="w-3 h-3 text-[var(--acc)] shrink-0" />
              <span>
                📅 AGENDA AÚN NO PUBLICADA{" "}
                {maxFechaFmt ? `(Publicado hasta ${maxFechaFmt})` : ""}
              </span>
              <ExternalLink className="w-2.5 h-2.5 text-[var(--acc)]/80 group-hover:text-[var(--acc)] shrink-0 ml-0.5" />
            </a>
            {renderSourcePills()}
          </div>
        );
      }

      // 2. Caso: Fuera de temporada / vacaciones
      if (estadoCartelera === "fuera_temporada") {
        return (
          <div className="flex flex-col gap-0.5 mt-0.5">
            <a
              href={programmingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={`Cierre temporal o fuera de temporada en la época de la campaña`}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-sans font-bold bg-[var(--acc)]/90 border border-[var(--acc)]/80 text-[var(--acc)] hover:bg-[var(--acc)]/90 transition-colors shadow-2xs group cursor-pointer"
            >
              <AlertCircle className="w-3 h-3 text-[var(--acc)] shrink-0" />
              <span>🏖️ FUERA DE TEMPORADA / VACACIONES</span>
              <ExternalLink className="w-2.5 h-2.5 text-[var(--acc)]/80 group-hover:text-[var(--acc)] shrink-0 ml-0.5" />
            </a>
            {renderSourcePills()}
          </div>
        );
      }

      // 3. Caso: Cartelera confirmada publicada y fecha disponible ("Sándwich")
      if (isAvailableForCampaign || estadoCartelera === "publicada_libre") {
        return (
          <div className="flex flex-col gap-0.5 mt-0.5">
            <a
              href={programmingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={`Clic para verificar la programación oficial en la web de ${lead.nombre_sala} (${lead.website || "Buscar en Google"})`}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-sans font-bold bg-[var(--ok)] border border-[var(--ok)]/80 text-[var(--ok)] hover:bg-[var(--ok)]/90 hover:border-[var(--ok)] transition-colors shadow-2xs group cursor-pointer"
            >
              <CalendarCheck className="w-3 h-3 text-[var(--ok)] shrink-0" />
              <span>
                🎯 Campaña: ✅ DISPONIBLE ({matchingDatesInCampaign.join(", ")})
              </span>
              <ExternalLink className="w-2.5 h-2.5 text-[var(--ok)]/80 group-hover:text-[var(--ok)] shrink-0 ml-0.5" />
            </a>
            {renderSourcePills()}
          </div>
        );
      } else {
        return (
          <div className="flex flex-col gap-0.5 mt-0.5">
            <a
              href={programmingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={`Clic para verificar la programación oficial en la web de ${lead.nombre_sala} (${lead.website || "Buscar en Google"})`}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-sans font-bold bg-[var(--alert)]/90 border border-[var(--alert)]/80 text-[var(--alert)] hover:bg-[var(--alert)]/90 hover:border-[var(--alert)] transition-colors shadow-2xs group cursor-pointer"
            >
              <AlertCircle className="w-3 h-3 text-[var(--alert)] shrink-0" />
              <span>
                🎯 Campaña: ❌ NO DISPONIBLE (Ocupada en fechas de campaña)
              </span>
              <ExternalLink className="w-2.5 h-2.5 text-[var(--alert)]/80 group-hover:text-[var(--alert)] shrink-0 ml-0.5" />
            </a>
            {renderSourcePills()}
          </div>
        );
      }
    }

    // Modo estándar (sin campaña activa)
    const freeDates = lead.fechas_libres_detectadas || [];
    if (
      lead.datos_fechas_encontrados === false ||
      (!freeDates.length &&
        !(lead.fechas_ocupadas && lead.fechas_ocupadas.length > 0))
    ) {
      return lead.nombre_sala ? (
        <div className="flex flex-col gap-0.5 mt-0.5">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-sans font-medium text-[var(--acc)]/90 bg-[var(--acc)]/40 border border-[var(--acc)]/40">
            <AlertCircle className="w-3 h-3 text-[var(--acc)] shrink-0" />
            (no se han encontrado datos de fechas de esta sala)
          </span>
          {renderSourcePills()}
        </div>
      ) : null;
    }

    if (freeDates.length > 0) {
      return (
        <div className="flex flex-col gap-0.5 mt-0.5">
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-sans font-semibold bg-[var(--acc)]/90 border border-[var(--acc)]/80 text-[var(--acc)] shadow-2xs cursor-pointer hover:bg-[var(--acc)] transition-colors"
            title={`Fechas libres detectadas por radar: ${freeDates.join(", ")}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectLead(lead);
            }}
          >
            <CalendarCheck className="w-3 h-3 text-[var(--acc)] shrink-0" />
            <span>{freeDates.length} fecha(s) libre(s) detectadas</span>
          </span>
          {renderSourcePills()}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-0.5 mt-0.5">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-sans text-[var(--acc)]/90 bg-[var(--acc)]/40 border border-[var(--acc)]/40">
          (no se han encontrado datos de fechas de esta sala)
        </span>
        {renderSourcePills()}
      </div>
    );
  };

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        isSomeSelected && !isAllSelected;
    }
  }, [isSomeSelected, isAllSelected]);

  const filteredLeads =
    mediaTypeFilter === "todos" || !setMediaTypeFilter
      ? leads
      : leads.filter((l) => l.genero?.toLowerCase() === mediaTypeFilter);

  const [leadForImageChange, setLeadForImageChange] = useState<Lead | null>(
    null,
  );
  const [isScanningBatchDates, setIsScanningBatchDates] = useState(false);
  const [batchScanResult, setBatchScanResult] = useState<string | null>(null);
  const { emailValidities } = useEmailValidation();

  const handleBatchScanDates = async () => {
    try {
      setIsScanningBatchDates(true);
      setBatchScanResult(null);

      const targetIds =
        selectedLeadIds.length > 0
          ? selectedLeadIds
          : filteredLeads.map((l) => l.id);

      const res = await fetch("/api/leads/detect-all-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: targetIds }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.updatedLeads)) {
        data.updatedLeads.forEach((updated: Lead) => {
          onUpdateLead(updated.id, updated);
        });
        setBatchScanResult(
          `✅ Escaneados ${data.processedCount} recintos. ¡${data.totalFreeDates} fechas libres detectadas en total!`,
        );
      } else {
        setBatchScanResult(
          `⚠️ ${data.error || "No se pudieron detectar fechas en lote"}`,
        );
      }
    } catch (err: any) {
      setBatchScanResult(`❌ Error: ${err?.message || "Error de conexión"}`);
    } finally {
      setIsScanningBatchDates(false);
    }
  };

  const handleQuickApprovePitch = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    onUpdateLead(lead.id, { estado: "aprobado" });
  };

  const cleanPhone = (phone?: string) => {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
  };

  const renderTipoBadge = (tipoRaw?: string) => {
    const t = (tipoRaw || "sala").toLowerCase().trim();
    if (t === "festival") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-sans font-semibold bg-[var(--acc)]/80 text-[var(--acc)] border border-[var(--acc)]/60 shrink-0">
          🎪 Festival
        </span>
      );
    }
    if (t === "discoteca" || t === "club") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-sans font-semibold bg-[var(--acc)]/80 text-[var(--acc)] border border-[var(--alert)]/60 shrink-0">
          🪩 Club
        </span>
      );
    }
    if (t === "teatro" || t === "auditorio") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-sans font-semibold bg-[var(--acc)]/80 text-[var(--acc)] border border-[var(--acc)]/60 shrink-0">
          🎭 Teatro
        </span>
      );
    }
    if (t === "ayuntamiento") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-sans font-semibold bg-[var(--acc)]/80 text-[var(--acc)] border border-[var(--acc)]/60 shrink-0">
          🏛️ Ayto
        </span>
      );
    }
    if (
      t === "medio" ||
      t === "prensa" ||
      t === "radio" ||
      t === "televisión"
    ) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-sans font-semibold bg-[var(--acc)]/80 text-[var(--acc)] border border-[var(--acc)]/60 shrink-0">
          📻 Medio
        </span>
      );
    }
    if (
      t === "agencia" ||
      t === "manager" ||
      t === "promotor" ||
      t === "sello"
    ) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-sans font-semibold bg-[var(--ok)]/80 text-[var(--ok)] border border-[var(--ok)]/60 shrink-0">
          💼 Agencia
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-sans font-semibold bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--hair)]/60 shrink-0">
        🏛️ Sala
      </span>
    );
  };

  const renderTemperatureBadge = (lead: Lead) => {
    const temp = lead.temperatura_lead;
    if (temp === "muy_caliente" || lead.ultimo_sentimiento === "muy_positivo") {
      return (
        <span
          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-[var(--ok)]/20 text-[var(--ok)] border border-[var(--ok)]/40 shrink-0 animate-pulse shadow-xs"
          title="Lead muy receptivo / Cierre inminente"
        >
          <Flame className="w-2.5 h-2.5 text-[var(--ok)] fill-emerald-400" />
          <span>Muy Caliente</span>
        </span>
      );
    }
    if (
      temp === "caliente" ||
      (lead.ultimo_sentimiento_score && lead.ultimo_sentimiento_score >= 0.4)
    ) {
      return (
        <span
          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-[var(--acc)]/20 text-[var(--acc)] border border-[var(--acc)]/40 shrink-0 shadow-xs"
          title="Interés alto"
        >
          <Flame className="w-2.5 h-2.5 text-[var(--acc)]" />
          <span>Caliente</span>
        </span>
      );
    }
    if (temp === "tibio") {
      return (
        <span
          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-[var(--acc)]/15 text-[var(--acc)] border border-[var(--acc)]/30 shrink-0"
          title="En evaluación / Interés templado"
        >
          <span>🌤️ Tibio</span>
        </span>
      );
    }
    if (temp === "frio" || temp === "congelado") {
      return (
        <span
          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--hair)] shrink-0"
          title="Sin respuesta o baja tracción"
        >
          <span>❄️ Frío</span>
        </span>
      );
    }
    return null;
  };

  const renderIntentBadge = (lead: Lead) => {
    const intent = lead.ultima_intencion;
    if (!intent) return null;

    if (intent === "confirmar_fecha" || intent === "proponer_fechas") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--ok)]/15 text-[var(--ok)] border border-[var(--ok)]/30">
          📅 Pide Fechas
        </span>
      );
    }
    if (intent === "pedir_cache") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--acc)]/15 text-[var(--acc)] border border-[var(--acc)]/30">
          💰 Negociación Caché
        </span>
      );
    }
    if (intent === "pedir_info_tecnica") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--acc)]/15 text-[var(--acc)] border border-[var(--acc)]/30">
          🎛️ Pide Rider
        </span>
      );
    }
    if (intent === "rechazo_programacion_llena") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--acc)]/15 text-[var(--acc)] border border-[var(--acc)]/30">
          ⏳ Prog. Llena
        </span>
      );
    }
    if (intent === "derivar_contacto") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--acc)]/15 text-[var(--acc)] border border-[var(--acc)]/30">
          📋 Deriva Contacto
        </span>
      );
    }
    return null;
  };

  if (filteredLeads.length === 0) {
    return (
      <div className="p-8 text-center rounded-[var(--r-l)] bg-[var(--surface)] my-4">
        <Sparkles className="w-8 h-8 text-[var(--acc-ink)] mx-auto mb-2 opacity-60" />
        <p className="text-[var(--ink-2)] font-bold text-sm">
          No se encontraron medios o espacios
        </p>
        <p className="text-[var(--ink-2)] text-xs mt-1">
          Prueba a cambiar los filtros o los términos de búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Top Filter Tabs & Selection Bar if applicable */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        {sectionTab === "medios" && setMediaTypeFilter && (
          <div className="flex gap-1.5 overflow-x-auto shrink-0 no-scrollbar py-0.5">
            {["todos", "televisión", "radio", "redes", "managements"].map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setMediaTypeFilter(type as any)}
                  className={`px-3 py-1 rounded-[var(--r-pill)] text-xs font-bold capitalize transition-colors cursor-pointer ${
                    mediaTypeFilter === type
                      ? "bg-[var(--acc)] text-[var(--on-acc)]"
                      : "bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                  }`}
                >
                  {type}
                </button>
              ),
            )}
          </div>
        )}

        {/* Quick select buttons in Grid view */}
        {viewMode === "grid" && onToggleSelectLead && (
          <div className="flex items-center gap-2 text-xs font-sans ml-auto">
            <button
              type="button"
              onClick={isAllSelected ? onDeselectAll : onSelectAllFiltered}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--bg)]/90 hover:bg-[var(--surface)]700 text-[var(--ink-2)] hover:text-[var(--ink)] transition-all cursor-pointer"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-[var(--acc)]" />
                  <span>Deseleccionar todos ({filteredLeads.length})</span>
                </>
              ) : isSomeSelected ? (
                <>
                  <MinusSquare className="w-3.5 h-3.5 text-[var(--acc)]" />
                  <span>Seleccionar todos ({filteredLeads.length})</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                  <span>Seleccionar todos ({filteredLeads.length})</span>
                </>
              )}
            </button>
            {selectedLeadIds.length > 0 && (
              <span className="text-[var(--acc)] font-bold bg-[var(--acc)]/15 px-2 py-0.5 rounded-md text-[11px]">
                {selectedLeadIds.length} selecc.
              </span>
            )}

            <button
              type="button"
              onClick={handleBatchScanDates}
              disabled={isScanningBatchDates}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--acc)]/90 hover:bg-[var(--acc)] border border-[var(--acc)]/60 text-[var(--acc)] hover:text-[var(--ink)] transition-all cursor-pointer shadow-xs disabled:opacity-50 text-xs font-sans font-semibold"
              title="Escanea las carteleras de los recintos de la campaña para detectar sus fines de semana libres"
            >
              {isScanningBatchDates ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--acc)]" />
              ) : (
                <CalendarCheck className="w-3.5 h-3.5 text-[var(--acc)]" />
              )}
              <span>
                {isScanningBatchDates
                  ? "Escaneando carteleras..."
                  : `📡 Radar Fechas Libres (${selectedLeadIds.length > 0 ? selectedLeadIds.length : "Campaña"})`}
              </span>
            </button>
          </div>
        )}
      </div>

      {batchScanResult && (
        <div className="mb-3 p-2.5 rounded-xl bg-[var(--acc)]/60 border border-[var(--acc)]/50 text-[var(--acc)] text-xs font-sans flex items-center justify-between gap-2 animate-fadeIn">
          <span>{batchScanResult}</span>
          <button
            type="button"
            onClick={() => setBatchScanResult(null)}
            className="text-[var(--acc)] hover:text-[var(--ink)] text-xs font-bold px-1.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {viewMode === "grid" ? (
        <div
          className={`grid gap-4 pb-10 transition-all duration-300 ${
            selectedLead
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          }`}
        >
          {filteredLeads.map((lead, idx) => {
            const isDetailOpen = selectedLead?.id === lead.id;
            const isChecked = selectedLeadIds.includes(lead.id);
            const rawMovil =
              (lead.telefono_movil || "").trim() ||
              (!lead.telefono_fijo &&
              lead.telefono &&
              /^(?:\+?34\s*)?[67]/.test(lead.telefono.trim())
                ? lead.telefono.trim()
                : "");
            const rawFijo =
              (lead.telefono_fijo || "").trim() ||
              (!lead.telefono_movil &&
              lead.telefono &&
              /^(?:\+?34\s*)?[89]/.test(lead.telefono.trim())
                ? lead.telefono.trim()
                : "");
            const hasMovil = Boolean(rawMovil && rawMovil.length >= 6);
            const hasFijo = Boolean(rawFijo && rawFijo.length >= 6);
            // WhatsApp sólo disponible si se dispone de teléfono móvil
            const phoneForWhatsApp = hasMovil ? cleanPhone(rawMovil) : null;
            const phoneForCall = rawMovil || rawFijo || lead.telefono;
            const leadKey = lead.id
              ? `lead-grid-${lead.id}`
              : `lead-grid-${idx}`;

            // Check if there is high-value intelligence on this lead
            const hasIntelligence = Boolean(
              lead.ultimo_sentimiento_score !== undefined ||
              lead.temperatura_lead ||
              lead.ultima_intencion ||
              (lead.fechas_propuestas_sala &&
                lead.fechas_propuestas_sala.length > 0) ||
              lead.condiciones_economicas_detectadas ||
              lead.ultimo_analisis_resumen ||
              lead.estrategia_playbook ||
              lead.ultimo_mensaje_recibido,
            );

            return (
              <div
                key={leadKey}
                onClick={() => onSelectLead(lead)}
                className={`p-4 rounded-[var(--r-l)] transition-all cursor-pointer flex flex-col justify-between gap-3 relative group ${
                  isChecked
                    ? "bg-[var(--surface)] ring-2 ring-[var(--acc)]/25"
                    : isDetailOpen
                      ? "bg-[var(--sunken)] ring-1 ring-[var(--acc)]/30"
                      : "bg-[var(--bg)] hover:bg-[var(--sunken)]"
                }`}
              >
                {/* Header info */}
                <div className="flex items-start gap-2.5 min-w-0 w-full">
                  {/* Select Checkbox (Grid Mode) */}
                  {onToggleSelectLead && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectLead(lead.id, e);
                      }}
                      className="shrink-0 pt-0.5 cursor-pointer"
                      title={
                        isChecked
                          ? "Deseleccionar sala"
                          : "Seleccionar sala para acciones masivas"
                      }
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          isChecked
                            ? "bg-[var(--acc)] text-[var(--ink)]"
                            : "bg-[var(--bg)]/80 group-hover:bg-[var(--sunken)]"
                        }`}
                      >
                        {isChecked && <CheckSquare className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  )}

                  {/* Interactive Avatar Container */}
                  <LeadAvatar
                    lead={lead}
                    size="md"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLeadForImageChange(lead);
                    }}
                  />

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <h4
                          className="font-display font-bold text-base sm:text-lg tracking-wide text-[var(--ink)] truncate notranslate"
                          translate="no"
                        >
                          {lead.nombre_sala}
                        </h4>
                        <VerifiedBadge
                          isVerified={isLeadVerificado(lead)}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <FavoriteButton
                          isFavorite={!!lead.es_favorito}
                          onToggle={(newVal) =>
                            onUpdateLead(lead.id, { es_favorito: newVal })
                          }
                          size="sm"
                        />
                        <span
                          className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-sans font-medium shrink-0 ${getStatusBadgeClass(
                            lead.estado,
                          )}`}
                        >
                          {getStatusLabel(lead.estado)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-sans text-[var(--ink-2)] font-medium mt-1">
                      {renderTipoBadge(lead.tipo)}
                      <span className="text-[var(--ink)] font-semibold">
                        {lead.ciudad || "España"}
                      </span>
                      {lead.ciudad && onFilterByRouteCity && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onFilterByRouteCity(lead.ciudad!);
                          }}
                          className="p-1 rounded hover:bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors cursor-pointer shrink-0"
                          title={`Filtrar salas para fin de semana doble desde ${lead.ciudad} (< 2.5h de ruta)`}
                        >
                          <Compass className="w-3 h-3" />
                        </button>
                      )}
                      <span>•</span>
                      <span
                        className={
                          lead.roster
                            ? "text-[var(--acc)]/70 font-semibold"
                            : ""
                        }
                      >
                        {lead.roster
                          ? `Róster: ${lead.roster}`
                          : [
                                "agencia",
                                "manager",
                                "productora",
                                "sello",
                              ].includes(String(lead.tipo || "").toLowerCase())
                            ? "Agencia / Booking"
                            : lead.aforo
                              ? `${lead.aforo} pax`
                              : "Aforo n/d"}
                      </span>
                      {lead.financial_break_even?.entradas_break_even ? (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-sans font-semibold px-1.5 py-0.2 rounded ${
                            lead.financial_break_even.entradas_break_even /
                              (lead.aforo || 250) <=
                            0.4
                              ? "bg-[var(--ok)]/60 text-[var(--ok)] border border-[var(--ok)]/30"
                              : lead.financial_break_even.entradas_break_even /
                                    (lead.aforo || 250) <=
                                  0.7
                                ? "bg-[var(--acc)]/60 text-[var(--acc)] border border-[var(--acc)]/30"
                                : "bg-[var(--alert)]/60 text-[var(--alert)] border border-[var(--alert)]/30"
                          }`}
                          title={`Break-Even: Cubre gastos vendiendo ${lead.financial_break_even.entradas_break_even} entradas (${Math.round((lead.financial_break_even.entradas_break_even / (lead.aforo || 250)) * 100)}% del aforo)`}
                        >
                          🎯 B-E:{" "}
                          {lead.financial_break_even.entradas_break_even}
                        </span>
                      ) : null}
                      <span>•</span>
                      <span className="text-[var(--ink-2)]">
                        {lead.genero || "Variado"}
                      </span>
                    </div>

                    {/* Temperatura & Intención Directas */}
                    {(lead.temperatura_lead ||
                      lead.ultima_intencion ||
                      lead.ultimo_sentimiento_score !== undefined) && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {renderTemperatureBadge(lead)}
                        {renderIntentBadge(lead)}
                        {lead.ultimo_sentimiento_score !== undefined && (
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                              lead.ultimo_sentimiento_score >= 0.4
                                ? "text-[var(--ok)] bg-[var(--ok)]/10 border-[var(--ok)]/30"
                                : lead.ultimo_sentimiento_score <= -0.3
                                  ? "text-[var(--alert)] bg-[var(--alert)]/10 border-[var(--alert)]/30"
                                  : "text-[var(--ink-2)] bg-[var(--surface)] border-[var(--hair)]"
                            }`}
                          >
                            {lead.ultimo_sentimiento_score > 0
                              ? `+${(lead.ultimo_sentimiento_score * 100).toFixed(0)}%`
                              : `${(lead.ultimo_sentimiento_score * 100).toFixed(0)}%`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Intelligence & Deal Box (Fechas, Economía, Resumen o Playbook) */}
                {hasIntelligence && (
                  <div className="bg-[var(--sunken)] p-2.5 rounded-xl border border-[var(--hair)]/80 space-y-2 text-xs">
                    {/* Entidades Detectadas: Fechas y Economía */}
                    {((lead.fechas_propuestas_sala &&
                      lead.fechas_propuestas_sala.length > 0) ||
                      lead.condiciones_economicas_detectadas) && (
                      <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-[var(--hair)]/70">
                        {lead.fechas_propuestas_sala &&
                          lead.fechas_propuestas_sala.length > 0 && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--acc)]/15 text-[var(--acc)] border border-[var(--acc)]/30 text-[10px] font-mono font-semibold"
                              title={`Fechas propuestas por la sala: ${lead.fechas_propuestas_sala.join(", ")}`}
                            >
                              <Calendar className="w-3 h-3 text-[var(--acc)] shrink-0" />
                              <span>
                                {lead.fechas_propuestas_sala
                                  .slice(0, 2)
                                  .join(", ")}
                              </span>
                            </span>
                          )}
                        {lead.condiciones_economicas_detectadas?.cifra && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--ok)]/15 text-[var(--ok)] border border-[var(--ok)]/30 text-[10px] font-mono font-semibold"
                            title={`Condiciones económicas: ${lead.condiciones_economicas_detectadas.tipo || ""} ${lead.condiciones_economicas_detectadas.detalles || ""}`}
                          >
                            <Coins className="w-3 h-3 text-[var(--ok)] shrink-0" />
                            <span>
                              {lead.condiciones_economicas_detectadas.cifra}
                            </span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Resumen Ejecutivo / Último Mensaje */}
                    {(lead.ultimo_analisis_resumen ||
                      lead.ultimo_mensaje_recibido) && (
                      <p className="text-[11px] text-[var(--ink-2)] line-clamp-2 leading-relaxed italic">
                        "
                        {lead.ultimo_analisis_resumen ||
                          lead.ultimo_mensaje_recibido}
                        "
                      </p>
                    )}

                    {/* Tactical Playbook Chip */}
                    {lead.estrategia_playbook && (
                      <div className="p-1.5 rounded-lg bg-[var(--acc)]/10 border border-[var(--acc)]/20 text-[10px] text-[var(--acc)] flex items-center justify-between gap-1">
                        <span className="truncate font-medium flex items-center gap-1">
                          <Zap className="w-3 h-3 text-[var(--acc)] shrink-0" />
                          <span>{lead.estrategia_playbook.titulo}</span>
                        </span>
                        {lead.estrategia_playbook.propuesta_rapida && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectLead(lead);
                            }}
                            className="text-[9px] font-bold bg-[var(--acc)] text-[var(--ink)] px-1.5 py-0.5 rounded shrink-0 hover:bg-[var(--acc)] cursor-pointer shadow-xs"
                            title="Ver propuesta táctica en ficha"
                          >
                            Playbook ⚡
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Quality Badges, Delivery Status & Phone Indicators */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <EmailDeliveryTicks lead={lead} size="sm" showLabel={true} />
                  <LeadHealthBadge
                    lead={lead}
                    showDescription={true}
                    size="sm"
                  />
                  <ReliabilityBadge item={lead} size="sm" />

                  {/* Icono de Teléfono Móvil disponible */}
                  {hasMovil ? (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-sans font-semibold bg-[var(--ok)]/80 border border-[var(--ok)]/70 text-[var(--ok)] shadow-2xs"
                      title={`Teléfono móvil (WhatsApp disponible): ${rawMovil}`}
                    >
                      <Smartphone className="w-3 h-3 text-[var(--ok)] shrink-0" />
                      <span className="hidden xs:inline">Móvil</span>
                    </span>
                  ) : null}

                  {/* Icono de Teléfono Fijo disponible */}
                  {hasFijo ? (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-sans font-semibold bg-[var(--acc)]/80 border border-[var(--acc)]/70 text-[var(--acc)] shadow-2xs"
                      title={`Teléfono fijo de sala: ${rawFijo}`}
                    >
                      <Phone className="w-3 h-3 text-[var(--acc)] shrink-0" />
                      <span className="hidden xs:inline">Fijo</span>
                    </span>
                  ) : null}

                  {/* Icono de Instagram disponible */}
                  {lead.instagram ? (
                    <a
                      href={
                        lead.instagram.startsWith("http")
                          ? lead.instagram
                          : `https://instagram.com/${lead.instagram.replace(/^@/, "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-sans font-semibold bg-[var(--acc)]/80 border border-[var(--alert)]/70 text-[var(--acc)] shadow-2xs hover:bg-[var(--acc)] transition-colors"
                      title={`Instagram: ${lead.instagram}`}
                    >
                      <Instagram className="w-3 h-3 text-[var(--acc)] shrink-0" />
                      <span className="hidden xs:inline">
                        {lead.instagram.startsWith("@")
                          ? lead.instagram
                          : `@${lead.instagram}`}
                      </span>
                    </a>
                  ) : null}

                  {/* Icono de Fechas Libres / Disposicion de Campaña */}
                  {renderLeadDatesInfo(lead)}
                </div>

                {/* Direct Action Bar (WhatsApp, Call, Quick Pitch Approve, View) */}
                <div className="pt-2.5800/80 flex flex-wrap items-center justify-between gap-2 w-full mt-1">
                  <div className="flex items-center gap-1.5">
                    {/* Direct WhatsApp Button — SOLO se muestra si tenemos teléfono móvil */}
                    {hasMovil && phoneForWhatsApp ? (
                      <a
                        href={getWhatsAppUrl(rawMovil)}
                        target={WHATSAPP_WINDOW_NAME}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openWhatsAppChat(rawMovil);
                        }}
                        className="p-2 sm:px-2.5 sm:py-1.5 bg-[var(--ok-soft)] hover:bg-[var(--ok-soft)] text-[var(--ink-2)] rounded-[var(--r-m)] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px]"
                        title={`Enviar WhatsApp directo al móvil (${rawMovil})`}
                      >
                        <MessageCircle className="w-4 h-4 text-[var(--ok)]" />
                        <span className="hidden xs:inline text-[11px]">
                          WhatsApp
                        </span>
                      </a>
                    ) : null}

                    {/* Direct Instagram Button */}
                    {lead.instagram ? (
                      <a
                        href={
                          lead.instagram.startsWith("http")
                            ? lead.instagram
                            : `https://instagram.com/${lead.instagram.replace(/^@/, "")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 sm:px-2.5 sm:py-1.5 bg-[var(--acc)]/80 hover:bg-[var(--acc)] border border-[var(--alert)]/60 text-[var(--acc)] rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs min-h-[38px]"
                        title={`Abrir Instagram (${lead.instagram})`}
                      >
                        <Instagram className="w-4 h-4 text-[var(--acc)]" />
                        <span className="hidden xs:inline text-[11px]">
                          Instagram
                        </span>
                      </a>
                    ) : null}

                    {/* Direct Call Button */}
                    {phoneForCall ? (
                      <a
                        href={`tel:${phoneForCall}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 sm:px-2.5 sm:py-1.5 bg-[var(--bg)]/80 hover:bg-[var(--tentative)] text-[var(--ink-2)] rounded-[var(--r-m)] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px]"
                        title="Llamar directamente por teléfono"
                      >
                        <PhoneCall className="w-4 h-4 text-[var(--ink-2)]" />
                        <span className="hidden xs:inline text-[11px]">
                          Llamar
                        </span>
                      </a>
                    ) : null}

                    {/* Direct Pitch Approval Button if pending */}
                    {(lead.estado === "pendiente_aprobacion" ||
                      lead.estado === "nuevo") && (
                      <button
                        type="button"
                        onClick={(e) => handleQuickApprovePitch(e, lead)}
                        className="px-2.5 py-1.5 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc)]/70 rounded-[var(--r-m)] font-bold text-xs flex items-center gap-1 transition-all cursor-pointer min-h-[38px]"
                        title="Aprobar pitch directamente para envío"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--acc)]" />
                        <span className="text-[11px]">Aprobar</span>
                      </button>
                    )}

                    {/* Direct Nudge Button if waiting */}
                    {isLeadNeedsFollowup(lead) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nudgeText = generateFollowupTemplate(
                            lead,
                            effectiveBandName || "Bakandeya",
                          );
                          onSelectLead(lead, {
                            tab: "emails",
                            pitchDraft: nudgeText,
                          });
                        }}
                        className="px-2.5 py-1.5 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 border border-[var(--acc)]/60 text-[var(--acc)] rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer min-h-[38px] shadow-xs"
                        title={`Han pasado ${getDaysSinceContact(lead)} días sin respuesta. Cargar recordatorio de seguimiento`}
                      >
                        <Clock className="w-3.5 h-3.5 text-[var(--acc)]" />
                        <span className="text-[11px]">
                          Nudge ({getDaysSinceContact(lead)}d)
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLead(lead);
                      }}
                      className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1 min-h-[38px] ${
                        isDetailOpen
                          ? "bg-[var(--acc)] text-[var(--on-acc)]"
                          : "bg-[var(--sunken)] text-[var(--ink)] hover:bg-[var(--ink-3)]/60"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{hasIntelligence ? "Copiloto" : "Ficha"}</span>
                    </button>
                    {onDeleteLead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLead(lead.id, lead.nombre_sala);
                        }}
                        className="p-2 bg-[var(--alert-soft)] hover:bg-[var(--alert-soft)] text-[var(--ink-2)] rounded-[var(--r-m)] transition-all cursor-pointer min-h-[38px] flex items-center justify-center"
                        title="Eliminar y guardar en lista negra"
                      >
                        <Trash2 className="w-4 h-4 text-[var(--alert)]" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="overflow-x-auto shrink-0 rounded-[var(--r-l)] bg-[var(--surface)] pb-10">
          <table className="w-full text-left min-w-[980px]">
            <thead>
              <tr className="text-[10px] font-semibold tracking-wider text-[var(--ink-2)] bg-[var(--sunken)]">
                {/* Select All Checkbox Header */}
                {onToggleSelectLead && (
                  <th className="py-2.5 px-2.5 w-10 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        ref={headerCheckboxRef}
                        checked={isAllSelected}
                        onChange={
                          isAllSelected ? onDeselectAll : onSelectAllFiltered
                        }
                        className="w-4 h-4 rounded-[var(--r-s)] text-[var(--acc)] focus:ring-[var(--acc)]/40 bg-[var(--sunken)] cursor-pointer accent-[var(--acc)]"
                        title={
                          isAllSelected
                            ? "Deseleccionar todos"
                            : "Seleccionar todos los resultados"
                        }
                      />
                    </div>
                  </th>
                )}

                <th className="py-2.5 px-2 w-8 text-center whitespace-nowrap">
                  Fav
                </th>
                <th className="py-2.5 px-3 min-w-[190px] whitespace-nowrap">
                  {sectionTab === "medios"
                    ? "Medio / Contacto"
                    : sectionTab === "grupos"
                      ? "Banda / Management"
                      : "Espacio / Nombre"}
                </th>
                <th className="py-2.5 px-2.5 min-w-[80px] whitespace-nowrap">
                  Tipo
                </th>
                <th className="py-2.5 px-2.5 min-w-[100px] whitespace-nowrap">
                  Fiabilidad
                </th>
                <th className="py-2.5 px-2.5 min-w-[110px] whitespace-nowrap">
                  Salud / Temp
                </th>
                <th className="py-2.5 px-3 min-w-[100px] whitespace-nowrap">
                  Ciudad
                </th>
                <th className="py-2.5 px-2.5 min-w-[70px] whitespace-nowrap">
                  {sectionTab === "grupos" ? "Róster / Aforo" : "Aforo"}
                </th>
                <th className="py-2.5 px-3 min-w-[110px] whitespace-nowrap">
                  Estado
                </th>
                <th className="py-2.5 px-3 min-w-[150px] whitespace-nowrap">
                  Contacto / Directo
                </th>
                <th className="py-2.5 px-3 min-w-[130px] text-right whitespace-nowrap">
                  Acciones Rápidas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hair)] text-xs align-middle">
              {filteredLeads.map((lead, idx) => {
                const isDetailOpen = selectedLead?.id === lead.id;
                const isChecked = selectedLeadIds.includes(lead.id);
                const rawMovil =
                  (lead.telefono_movil || "").trim() ||
                  (!lead.telefono_fijo &&
                  lead.telefono &&
                  /^(?:\+?34\s*)?[67]/.test(lead.telefono.trim())
                    ? lead.telefono.trim()
                    : "");
                const rawFijo =
                  (lead.telefono_fijo || "").trim() ||
                  (!lead.telefono_movil &&
                  lead.telefono &&
                  /^(?:\+?34\s*)?[89]/.test(lead.telefono.trim())
                    ? lead.telefono.trim()
                    : "");
                const hasMovil = Boolean(rawMovil && rawMovil.length >= 6);
                const hasFijo = Boolean(rawFijo && rawFijo.length >= 6);
                // WhatsApp sólo disponible si se dispone de teléfono móvil
                const phoneForWhatsApp = hasMovil ? cleanPhone(rawMovil) : null;
                const phoneForCall = rawMovil || rawFijo || lead.telefono;
                const leadKey = lead.id
                  ? `lead-row-${lead.id}`
                  : `lead-row-${idx}`;

                return (
                  <tr
                    key={leadKey}
                    onClick={() => onSelectLead(lead)}
                    className={`transition-colors cursor-pointer ${
                      isChecked
                        ? "bg-[var(--acc-soft)]"
                        : isDetailOpen
                          ? "bg-[var(--sunken)]"
                          : "hover:bg-[var(--sunken)]"
                    }`}
                  >
                    {/* Row Select Checkbox */}
                    {onToggleSelectLead && (
                      <td
                        className="py-1.5 px-2.5 text-center align-middle"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelectLead(lead.id, e);
                        }}
                      >
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSelectLead(lead.id, e);
                            }}
                            className="w-4 h-4 rounded-[var(--r-s)] text-[var(--acc)] focus:ring-[var(--acc)]/40 bg-[var(--sunken)] cursor-pointer accent-[var(--acc)]"
                            title={isChecked ? "Deseleccionar" : "Seleccionar"}
                          />
                        </div>
                      </td>
                    )}

                    <td
                      className="py-1.5 px-2 text-center align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FavoriteButton
                        isFavorite={!!lead.es_favorito}
                        onToggle={(newVal) =>
                          onUpdateLead(lead.id, { es_favorito: newVal })
                        }
                        size="sm"
                      />
                    </td>

                    <td className="py-1.5 px-3 min-w-[190px] align-middle">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Interactive Avatar Container Table View */}
                        <LeadAvatar
                          lead={lead}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLeadForImageChange(lead);
                          }}
                        />
                        <div className="min-w-0 flex-1 leading-tight">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="truncate font-bold text-xs sm:text-sm text-[var(--ink)] block max-w-[160px] notranslate"
                              translate="no"
                              title={lead.nombre_sala}
                            >
                              {lead.nombre_sala}
                            </span>
                            <VerifiedBadge
                              isVerified={isLeadVerificado(lead)}
                              size="sm"
                            />
                          </div>
                          <span className="text-[10px] text-[var(--ink-2)] font-sans font-normal truncate block">
                            {lead.genero || "Sin género"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-1.5 px-2.5 min-w-[80px] whitespace-nowrap align-middle">
                      {renderTipoBadge(lead.tipo)}
                    </td>

                    <td className="py-1.5 px-2.5 min-w-[100px] whitespace-nowrap align-middle">
                      <ReliabilityBadge item={lead} size="sm" />
                    </td>

                    <td className="py-1.5 px-2.5 min-w-[110px] whitespace-nowrap align-middle">
                      <div className="flex items-center gap-1 flex-wrap">
                        <LeadHealthBadge
                          lead={lead}
                          showDescription={false}
                          size="sm"
                        />
                        {renderTemperatureBadge(lead)}
                        {renderIntentBadge(lead)}
                      </div>
                    </td>

                    <td className="py-1.5 px-3 min-w-[100px] text-[var(--ink-2)] align-middle">
                      <div className="flex items-center gap-1 leading-snug">
                        <span className="font-semibold text-xs text-[var(--ink-2)] block truncate">
                          {lead.ciudad || "España"}
                        </span>
                        {lead.ciudad && onFilterByRouteCity && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFilterByRouteCity(lead.ciudad!);
                            }}
                            className="p-0.5 rounded hover:bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors cursor-pointer shrink-0"
                            title={`Filtrar salas para fin de semana doble desde ${lead.ciudad} (< 2.5h de ruta)`}
                          >
                            <Compass className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {renderLeadDatesInfo(lead, true)}
                    </td>

                    <td className="py-3.5 px-4 min-w-[90px] text-[var(--ink-2)] align-middle">
                      <span
                        className={
                          lead.roster
                            ? "text-[var(--acc-ink)] font-semibold"
                            : "text-[var(--ink)]"
                        }
                      >
                        {lead.roster
                          ? `Róster: ${lead.roster}`
                          : lead.aforo
                            ? `${lead.aforo} pax`
                            : "n/d"}
                      </span>
                    </td>

                    <td className="py-1.5 px-3 min-w-[110px] whitespace-nowrap align-middle">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-sans font-medium ${getStatusBadgeClass(
                            lead.estado,
                          )}`}
                        >
                          {getStatusLabel(lead.estado)}
                        </span>
                        <EmailDeliveryTicks
                          lead={lead}
                          size="sm"
                          showLabel={false}
                        />
                      </div>
                    </td>

                    {/* Direct Contact Column */}
                    <td className="py-1.5 px-3 min-w-[150px] align-middle">
                      <div className="flex flex-col justify-center leading-tight">
                        {lead.email_contacto ? (
                          <div className="flex items-center gap-1">
                            {(() => {
                              const bounced = isBouncedLead(lead.notas);
                              const invalid =
                                getEmailStatus(
                                  lead.id,
                                  lead.email_contacto,
                                  emailValidities,
                                ) === "invalid";
                              const broken = bounced || invalid;
                              return (
                                <>
                                  <a
                                    href={`mailto:${lead.email_contacto}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`font-normal truncate max-w-[130px] text-xs inline-block ${
                                      broken
                                        ? "text-[var(--alert)] hover:text-[var(--alert)] line-through"
                                        : "text-[var(--acc)] hover:text-[var(--acc)]"
                                    }`}
                                    title={lead.email_contacto}
                                  >
                                    {lead.email_contacto}
                                  </a>
                                  {broken && (
                                    <div
                                      title={
                                        bounced
                                          ? "Email rebotado"
                                          : "Email inválido"
                                      }
                                    >
                                      <AlertCircle className="w-3 h-3 text-[var(--alert)] shrink-0" />
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="text-[var(--ink-2)] italic text-[10px]">
                            Sin email
                          </span>
                        )}
                        {(hasMovil || hasFijo || lead.instagram) && (
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                            {hasMovil ? (
                              <span
                                className="inline-flex items-center gap-0.5 text-[var(--ok)]"
                                title={`Móvil: ${rawMovil}`}
                              >
                                <Smartphone className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate max-w-[75px]">
                                  {rawMovil}
                                </span>
                              </span>
                            ) : hasFijo ? (
                              <span
                                className="inline-flex items-center gap-0.5 text-[var(--acc)]"
                                title={`Fijo: ${rawFijo}`}
                              >
                                <Phone className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate max-w-[75px]">
                                  {rawFijo}
                                </span>
                              </span>
                            ) : null}
                            {lead.instagram ? (
                              <a
                                href={
                                  lead.instagram.startsWith("http")
                                    ? lead.instagram
                                    : `https://instagram.com/${lead.instagram.replace(/^@/, "")}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-0.5 text-[var(--acc)] hover:text-[var(--acc)]"
                                title={`Instagram: ${lead.instagram}`}
                              >
                                <Instagram className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate max-w-[65px]">
                                  {lead.instagram.replace(/^@/, "")}
                                </span>
                              </a>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Direct Quick Action Buttons in Table View */}
                    <td className="py-1.5 px-3 min-w-[130px] text-right whitespace-nowrap align-middle">
                      <div className="flex items-center justify-end gap-1">
                        {/* WhatsApp: SOLO si tiene teléfono móvil */}
                        {hasMovil && phoneForWhatsApp ? (
                          <a
                            href={getWhatsAppUrl(rawMovil)}
                            target={WHATSAPP_WINDOW_NAME}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openWhatsAppChat(rawMovil);
                            }}
                            className="p-1 bg-[var(--ok)]/80 hover:bg-[var(--ok)] border border-[var(--ok)]/60 text-[var(--ok)] rounded transition-colors inline-flex items-center"
                            title={`WhatsApp directo al móvil (${rawMovil})`}
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                          </a>
                        ) : null}

                        {/* Instagram: SOLO si tiene instagram */}
                        {lead.instagram ? (
                          <a
                            href={
                              lead.instagram.startsWith("http")
                                ? lead.instagram
                                : `https://instagram.com/${lead.instagram.replace(/^@/, "")}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 bg-[var(--acc)]/80 hover:bg-[var(--acc)] border border-[var(--alert)]/60 text-[var(--acc)] rounded transition-colors inline-flex items-center"
                            title={`Abrir perfil de Instagram (${lead.instagram})`}
                          >
                            <Instagram className="w-3.5 h-3.5 text-[var(--acc)]" />
                          </a>
                        ) : null}

                        {phoneForCall ? (
                          <a
                            href={`tel:${phoneForCall}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 bg-[var(--acc)]/80 hover:bg-[var(--acc)] border border-[var(--acc)]/60 text-[var(--acc)] rounded transition-colors inline-flex items-center"
                            title={
                              hasMovil && hasFijo
                                ? `Llamar (Móvil: ${rawMovil} / Fijo: ${rawFijo})`
                                : hasMovil
                                  ? `Llamar al móvil (${rawMovil})`
                                  : `Llamar al fijo (${rawFijo})`
                            }
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                          </a>
                        ) : null}

                        {(lead.estado === "pendiente_aprobacion" ||
                          lead.estado === "nuevo") && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickApprovePitch(e, lead)}
                            className="px-2 py-1 bg-[var(--ok-soft)] hover:brightness-95 text-[var(--ok)] rounded-[var(--r-s)] text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Aprobar pitch directamente"
                          >
                            <CheckCircle2 className="w-3 h-3 text-[var(--ok)]" />
                            <span>Aprobar</span>
                          </button>
                        )}

                        {isLeadNeedsFollowup(lead) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nudgeText = generateFollowupTemplate(
                                lead,
                                effectiveBandName || "Bakandeya",
                              );
                              onSelectLead(lead, {
                                tab: "emails",
                                pitchDraft: nudgeText,
                              });
                            }}
                            className="px-1.5 py-0.5 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 border border-[var(--acc)]/60 text-[var(--acc)] rounded text-[9px] font-bold transition-all cursor-pointer inline-flex items-center gap-0.5 shadow-xs"
                            title={`Han pasado ${getDaysSinceContact(lead)} días sin respuesta. Cargar recordatorio de seguimiento`}
                          >
                            <Clock className="w-3 h-3 text-[var(--acc)]" />
                            <span>Nudge</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLead(lead);
                          }}
                          className={`p-1.5 rounded-[var(--r-s)] transition-colors inline-flex items-center ${
                            isDetailOpen
                              ? "bg-[var(--acc)] text-[var(--on-acc)] font-bold"
                              : "bg-[var(--sunken)] hover:brightness-95 text-[var(--ink-2)]"
                          }`}
                          title="Abrir ficha"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Change Image Modal */}
      {leadForImageChange && (
        <ChangeLeadImageModal
          lead={leadForImageChange}
          isOpen={Boolean(leadForImageChange)}
          onClose={() => setLeadForImageChange(null)}
          onUpdateLead={(id, updates) => {
            onUpdateLead(id, updates);
            setLeadForImageChange(null);
          }}
          onLeadLogoUpload={onLeadLogoUpload}
        />
      )}
    </div>
  );
};
