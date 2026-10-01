import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  Heart,
  QrCode,
  Download,
  Search,
  Plus,
  Trash2,
  Sparkles,
  Copy,
  Check,
  FileSpreadsheet,
  ShieldCheck,
  Mail,
  MapPin,
  Calendar,
  ExternalLink,
  Filter,
  LayoutGrid,
  List,
  Map as MapIcon,
  X,
  TrendingUp,
  Printer,
  Share2,
  MessageCircle,
  Gift,
  Tag,
  Music,
  Save,
  CheckCircle2,
  Flame,
  Star,
  Award,
  Instagram,
  FileCode,
  Layers,
  Eye,
  MoreHorizontal,
  Settings2,
} from "lucide-react";
import QRCode from "react-qr-code";
import * as XLSX from "xlsx";
import { Fan, Concert, EPKConfig, SocialMetric, ThemeColors } from "../types";
import { THEMES } from "../utils/theme";
import { Onda } from "./ui/Onda";
import { Tabs } from "./ui/Tabs";
import { ReelsMetricsView } from "./reels/ReelsMetricsView";
import { FansCommunityView } from "./fans/FansCommunityView";
import {
  FAN_FORM_LANGUAGES,
  FanFormLanguage,
  DEFAULT_FAN_FORM_LANGUAGE,
  isFanFormLanguage,
} from "../i18n/fansTranslations";
import { QrExportModal } from "./QrExportModal";
import { FansLandingPreviewModal } from "./FansLandingPreviewModal";
import {
  downloadQrAsSvg,
  downloadQrAsHighResPng,
  printHighQualityFlyer,
} from "../utils/qrExport";
import { useModuleTutorial } from "../hooks/useModuleTutorial";
import { ModuleTutorialModal } from "./common/ModuleTutorialModal";
import { ModuleTutorialTrigger } from "./common/ModuleTutorialTrigger";
import { PublicoSilhouette } from "./ui/PublicoSilhouette";
import { openWhatsAppChat } from "../utils/whatsapp";
import { encodeBandIdClient } from "../utils/bandHash";
import { ShowIcon } from './ui/ShowIcon';

import { FansDashboardView } from "./fans/FansDashboardView";
import { Button, IconButton, Input, LinkButton, MenuItem, Select, Textarea } from './ui';

interface FansPanelProps {
  fans: Fan[];
  concerts: Concert[];
  epkConfig: Partial<EPKConfig>;
  onAddFan: (fan: Fan) => void;
  onDeleteFan: (id: string) => void;
  onUpdateFan?: (id: string, updates: Partial<Fan>) => void;
  onUpdateIncentive?: (newIncentive: EPKConfig["incentivoFans"]) => void;
  onUpdateEpkConfig?: (newConfig: Partial<EPKConfig>) => void;
  currentBandId?: string;
  currentBandName?: string;
  currentBandLogo?: string;
  metrics?: SocialMetric[];
  onAddMetric?: (metric: SocialMetric) => Promise<void>;
  onUpdateMetric?: (
    id: string,
    updatedFields: Partial<SocialMetric>,
  ) => Promise<void>;
  onDeleteMetric?: (id: string) => Promise<void>;
  onScanRealMetrics?: () => Promise<void>;
  onSyncMetrics?: () => Promise<void>;
  isScanningMetrics?: boolean;
  isSyncingMetrics?: boolean;
  colors?: ThemeColors;
  onNavigate?: (view: "epk") => void;
  isPromo?: boolean;
  onUpdateConcert?: (id: string, updates: Partial<Concert>) => void;
  initialConcertId?: string;
}

const COLORS = [
  "var(--acc)",
  "var(--ok)",
  "var(--acc)",
  "var(--acc)",
  "var(--alert)",
  "var(--ok)",
  "var(--ink-2)",
];

export const FansPanel: React.FC<FansPanelProps> = ({
  fans = [],
  concerts = [],
  epkConfig,
  onAddFan,
  onDeleteFan,
  onUpdateFan,
  onUpdateIncentive,
  onUpdateEpkConfig,
  currentBandId,
  currentBandName,
  currentBandLogo,
  metrics = [],
  onAddMetric,
  onUpdateMetric,
  onDeleteMetric,
  onScanRealMetrics,
  onSyncMetrics,
  isScanningMetrics,
  isSyncingMetrics,
  colors,
  onNavigate,
  isPromo = false,
  onUpdateConcert,
  initialConcertId,
}) => {
  const effectiveBandName =
    currentBandName ||
    epkConfig?.contactoBooking?.nombre ||
    (currentBandId?.includes("bakandeya") ? "Bakandeya" : "Tu Banda");
  const effectiveBandLogo =
    currentBandLogo ||
    epkConfig?.logoUrl ||
    (effectiveBandName.toLowerCase().includes("bakandeya")
      ? "/logo_bakandeya_bueno_sin_fondo.png"
      : "");
  const cleanBandId =
    (currentBandId || "").toLowerCase().replace(/^(band|reg)-/, "") || "banda";
  const {
    isOpen: isTutorialOpen,
    openTutorial,
    closeTutorial,
  } = useModuleTutorial("fans");
  const [activeTab, setActiveTab] = useState<
    "metrics" | "fans" | "qr" | "dashboard"
  >(initialConcertId || isPromo ? "qr" : "metrics");
  const [viewMode, setViewMode] = useState<"feed" | "grid" | "table" | "map">(
    "feed",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOrigen, setFilterOrigen] = useState<string>("");
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("");
  const [selectedNivelFilter, setSelectedNivelFilter] = useState<string>("");
  const [selectedConcertId, setSelectedConcertId] = useState<string>(
    initialConcertId || "",
  );
  const [savedToConcertFeedback, setSavedToConcertFeedback] = useState(false);
  const [clickStats, setClickStats] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/epk/clicks")
      .then((res) =>
        res.ok && res.headers.get("content-type")?.includes("application/json")
          ? res.json()
          : null,
      )
      .then((data) => {
        if (data && data.clicks) {
          setClickStats(data.clicks);
        }
      })
      .catch(() => {});
  }, [currentBandId]);

  useEffect(() => {
    if (initialConcertId) {
      setSelectedConcertId(initialConcertId);
      setActiveTab("qr");
    }
  }, [initialConcertId]);

  // Configurable City Tabs state (synced with DB epkConfig.ciudadesConfig)
  const [customCityChips, setCustomCityChips] = useState<string[]>(() => {
    if (
      epkConfig?.ciudadesConfig &&
      Array.isArray(epkConfig.ciudadesConfig) &&
      epkConfig.ciudadesConfig.length > 0
    ) {
      return epkConfig.ciudadesConfig;
    }
    try {
      const saved = localStorage.getItem("bakandeya_custom_cities");
      return saved
        ? JSON.parse(saved)
        : [
            "Madrid",
            "Sevilla",
            "Barcelona",
            "Málaga",
            "Valencia",
            "Granada",
            "Cádiz",
          ];
    } catch {
      return [
        "Madrid",
        "Sevilla",
        "Barcelona",
        "Málaga",
        "Valencia",
        "Granada",
        "Cádiz",
      ];
    }
  });

  const [isAddingCity, setIsAddingCity] = useState(false);
  const [newCityInput, setNewCityInput] = useState("");

  useEffect(() => {
    if (
      epkConfig?.ciudadesConfig &&
      Array.isArray(epkConfig.ciudadesConfig) &&
      epkConfig.ciudadesConfig.length > 0
    ) {
      setCustomCityChips(epkConfig.ciudadesConfig);
    }
  }, [epkConfig?.ciudadesConfig]);

  const handleAddCityTab = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCityInput.trim()) return;
    const formatted = newCityInput.trim();
    if (!customCityChips.includes(formatted)) {
      const updated = [...customCityChips, formatted];
      setCustomCityChips(updated);
      try {
        localStorage.setItem(
          "bakandeya_custom_cities",
          JSON.stringify(updated),
        );
      } catch {}
      if (onUpdateEpkConfig) {
        onUpdateEpkConfig({ ciudadesConfig: updated });
      }
    }
    setSelectedCityFilter(formatted);
    setNewCityInput("");
    setIsAddingCity(false);
  };

  const handleRemoveCityTab = (cityToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customCityChips.filter((c) => c !== cityToRemove);
    setCustomCityChips(updated);
    try {
      localStorage.setItem("bakandeya_custom_cities", JSON.stringify(updated));
    } catch {}
    if (selectedCityFilter === cityToRemove) {
      setSelectedCityFilter("");
    }
    if (onUpdateEpkConfig) {
      onUpdateEpkConfig({ ciudadesConfig: updated });
    }
  };

  // Incentive state. Antes, mientras una banda no configuraba su propio incentivo, este
  // formulario mostraba (y podía llegar a guardar) un enlace de descarga real de Bakandeya y un
  // código de descuento con su nombre — datos inventados de una banda concreta colándose como
  //"valor por defecto" en el panel de cualquier otra.
  const [incentivo, setIncentivo] = useState(
    epkConfig?.incentivoFans || {
      mensajeAgradecimiento:
        "¡Muchas gracias por unirte a la familia de la banda!",
      enlaceDescarga: "",
      codigoDescuento: "",
    },
  );
  const [savedIncentive, setSavedIncentive] = useState(false);

  useEffect(() => {
    if (epkConfig?.incentivoFans) {
      setIncentivo(epkConfig.incentivoFans);
    }
  }, [epkConfig?.incentivoFans]);

  const handleSaveIncentive = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onUpdateIncentive) {
      onUpdateIncentive(incentivo);
    }
    if (onUpdateEpkConfig) {
      onUpdateEpkConfig({ incentivoFans: incentivo });
    }
    setSavedIncentive(true);
    setTimeout(() => setSavedIncentive(false), 2500);
  };

  // Manual Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCiudad, setNewCiudad] = useState("");
  const [newOrigen, setNewOrigen] = useState("Manual");
  const [newCancionFavorita, setNewCancionFavorita] = useState("");
  const [newInstagram, setNewInstagram] = useState("");
  const [newMensaje, setNewMensaje] = useState("");
  const [newNivel, setNewNivel] = useState<
    "fiel" | "superfan" | "fundador" | "backstage"
  >("fiel");

  const filteredFans = useMemo(() => {
    return fans.filter((f) => {
      const matchQuery =
        f.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.ciudad &&
          f.ciudad.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.conciertoOrigenNombre &&
          f.conciertoOrigenNombre
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      const matchFilter = filterOrigen
        ? f.conciertoOrigenId === filterOrigen ||
          (filterOrigen === "Otros" && !f.conciertoOrigenId)
        : true;

      const matchCity = selectedCityFilter
        ? f.ciudad &&
          f.ciudad.toLowerCase().includes(selectedCityFilter.toLowerCase())
        : true;

      const matchNivel = selectedNivelFilter
        ? f.nivelFan === selectedNivelFilter
        : true;

      return matchQuery && matchFilter && matchCity && matchNivel;
    });
  }, [
    fans,
    searchQuery,
    filterOrigen,
    selectedCityFilter,
    selectedNivelFilter,
  ]);

  // Analytics Data - Channel of Origin (robust categorization)
  const originData = useMemo(() => {
    if (!fans || fans.length === 0) return [];
    const counts: Record<string, number> = {};

    fans.forEach((f) => {
      let raw = (f.comoConocio || f.conciertoOrigenNombre || "").trim();
      if (!raw) {
        if (f.conciertoOrigenId) raw = "Concierto en Directo";
        else raw = "Registro Directo / QR";
      }

      let category = raw;
      const lower = raw.toLowerCase();
      if (
        lower.includes("sala") ||
        lower.includes("concierto") ||
        lower.includes("festival") ||
        lower.includes("directo") ||
        lower.includes("bolo") ||
        lower.includes("caracol") ||
        lower.includes("viña")
      ) {
        category = "Conciertos / Directo";
      } else if (lower.includes("insta") || lower.includes("ig")) {
        category = "Instagram";
      } else if (lower.includes("tik")) {
        category = "TikTok";
      } else if (lower.includes("qr") || lower.includes("escenario")) {
        category = "Escaneo QR";
      } else if (lower.includes("amigo") || lower.includes("boca")) {
        category = "Boca a Boca / Amigos";
      } else if (
        lower.includes("spot") ||
        lower.includes("you") ||
        lower.includes("web")
      ) {
        category = "Web / Streaming";
      } else if (lower.includes("manual")) {
        category = "Registro Manual";
      }

      counts[category] = (counts[category] || 0) + 1;
    });

    const total = fans.length;
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / total) * 100),
      }))
      .sort((a, b) => b.value - a.value);
  }, [fans]);

  // Analytics Data - Evolutionary Cumulative Growth Chart
  const evolutionaryGrowthData = useMemo(() => {
    if (!fans || fans.length === 0) return [];

    const monthMap: Record<string, number> = {};
    fans.forEach((f) => {
      const month = f.fechaCaptura ? f.fechaCaptura.substring(0, 7) : "2026-05";
      monthMap[month] = (monthMap[month] || 0) + 1;
    });

    const sortedMonths = Object.keys(monthMap).sort();
    let runningTotal = 0;
    const monthNames = [
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

    return sortedMonths.map((month) => {
      const newCount = monthMap[month];
      runningTotal += newCount;
      const [y, m] = month.split("-");
      const mIdx = m ? parseInt(m, 10) - 1 : 0;
      const label = `${monthNames[mIdx] || m} '${y ? y.slice(2) : "26"}`;
      return {
        month,
        date: label,
        nuevos: newCount,
        total: runningTotal,
      };
    });
  }, [fans]);

  const uniqueConcertIds = useMemo(() => {
    const ids = new Set<string>();
    fans.forEach((f) => {
      if (f.conciertoOrigenId) ids.add(f.conciertoOrigenId);
    });
    return Array.from(ids).map((id) => {
      const concert = concerts.find((c) => c.id === id);
      return { id, name: concert ? `${concert.sala} (${concert.fecha})` : id };
    });
  }, [fans, concerts]);

  const handleExportCSV = () => {
    const dataToExport = filteredFans.map((f) => ({
      ID: f.id,
      Nombre: f.nombre,
      Email: f.email,
      Ciudad: f.ciudad || "",
      Origen: f.comoConocio || f.conciertoOrigenNombre || "",
      "Concierto ID": f.conciertoOrigenId || "",
      "Fecha Registro": f.fechaCaptura,
      "Consentimiento RGPD": f.consentimientoRGPD ? "SÍ" : "NO",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `Fans ${effectiveBandName}`,
    );
    XLSX.writeFile(
      workbook,
      `Fans_${effectiveBandName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim() || !newEmail.trim()) return;

    const fan: Fan = {
      id: `fan-${Date.now()}`,
      nombre: newNombre.trim(),
      email: newEmail.trim(),
      ciudad: newCiudad.trim() || undefined,
      comoConocio: newOrigen,
      cancionFavorita: newCancionFavorita.trim() || undefined,
      instagram: newInstagram.trim().replace(/^@/, "") || undefined,
      mensaje: newMensaje.trim() || undefined,
      nivelFan: newNivel,
      reacciones: { likes: 1, fire: 0, applause: 0, guitars: 0 },
      fechaCaptura: new Date().toISOString().split("T")[0],
      consentimientoRGPD: true,
    };
    onAddFan(fan);
    setShowAddModal(false);
    setNewNombre("");
    setNewEmail("");
    setNewCiudad("");
    setNewOrigen("Manual");
    setNewCancionFavorita("");
    setNewInstagram("");
    setNewMensaje("");
    setNewNivel("fiel");
  };

  const selectedConcert = concerts.find((c) => c.id === selectedConcertId);
  const [customSlug, setCustomSlug] = useState("");
  const [useCustomDomain, setUseCustomDomain] = useState(true); // Default to clean custom domain like bandmanager.io
  const defaultDomain = "bandmanager.io";
  const [customDomain, setCustomDomain] = useState(defaultDomain);
  const [routePrefix, setRoutePrefix] = useState("unete");
  const [qrLanguage, setQrLanguage] = useState<FanFormLanguage>(
    DEFAULT_FAN_FORM_LANGUAGE,
  );

  useEffect(() => {
    if (selectedConcert) {
      const defaultSlug = `${selectedConcert.ciudad}-${selectedConcert.sala}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");
      setCustomSlug(defaultSlug);
      // Precarga el idioma guardado en el concierto; el manager siempre puede cambiarlo a mano abajo.
      setQrLanguage(
        isFanFormLanguage(selectedConcert.idioma)
          ? selectedConcert.idioma
          : DEFAULT_FAN_FORM_LANGUAGE,
      );
    } else {
      setCustomSlug("");
    }
  }, [selectedConcertId]);

  // Build clean target URL
  const rawDomain = useCustomDomain
    ? customDomain.trim().startsWith("http")
      ? customDomain.trim()
      : `https://${customDomain.trim().replace(/\/$/, "")}`
    : typeof window !== "undefined"
      ? window.location.origin
      : "https://bandmanager.io";

  const cleanPrefix = routePrefix.trim().replace(/^\/+|\/+$/g, "");
  const cleanSlugVal = customSlug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");

  const pathFormatted = cleanSlugVal
    ? cleanPrefix
      ? `/${cleanPrefix}/${cleanSlugVal}`
      : `/${cleanSlugVal}`
    : cleanPrefix
      ? `/${cleanPrefix}`
      : "/unete";

  const qrQueryParams: string[] = [];
  if (currentBandId)
    qrQueryParams.push(
      `b=${encodeURIComponent(encodeBandIdClient(currentBandId))}`,
    );
  else if (cleanBandId)
    qrQueryParams.push(
      `b=${encodeURIComponent(encodeBandIdClient(cleanBandId))}`,
    );
  if (qrLanguage !== DEFAULT_FAN_FORM_LANGUAGE)
    qrQueryParams.push(`lang=${qrLanguage}`);
  if (selectedConcert) {
    // Permite que /api/public/fans guarde el concierto de origen real (concierto_origen_id)
    // en vez de depender solo del slug de la URL para adivinar el nombre.
    qrQueryParams.push(`concertId=${encodeURIComponent(selectedConcert.id)}`);
    qrQueryParams.push(
      `concertName=${encodeURIComponent(`${selectedConcert.sala} (${selectedConcert.ciudad})`)}`,
    );
  }
  const qrConcertUrl = `${rawDomain}${pathFormatted}${qrQueryParams.length ? `?${qrQueryParams.join("&")}` : ""}`;

  const copyLink = () => {
    navigator.clipboard.writeText(qrConcertUrl);
    alert("Enlace copiado al portapapeles.");
  };

  const [copiedQrUrl, setCopiedQrUrl] = useState(false);

  const handleCopyQrUrl = () => {
    navigator.clipboard.writeText(qrConcertUrl);
    setCopiedQrUrl(true);
    setTimeout(() => setCopiedQrUrl(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const concertTitle = selectedConcert
      ? `${selectedConcert.sala} (${selectedConcert.ciudad})`
      : effectiveBandName;
    const text = `¡Únete a ${effectiveBandName} en ${concertTitle}! 🎶 Escanea o entra en el enlace para recibir sorpresas exclusivas y estar al día:\n\n${qrConcertUrl}`;
    openWhatsAppChat(undefined, text);
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete a ${effectiveBandName}`,
          text: "Escanea o entra para unirte a nuestra comunidad.",
          url: qrConcertUrl,
        });
      } catch (err) {
        console.log("Share canceled or not supported", err);
      }
    } else {
      handleCopyQrUrl();
    }
  };

  const [showQrExportModal, setShowQrExportModal] = useState(false);
  const [showFansPreviewModal, setShowFansPreviewModal] = useState(false);
  const [isExportingDirect, setIsExportingDirect] = useState(false);
  const [showQrMoreMenu, setShowQrMoreMenu] = useState(false);
  const [showAdvancedQrConfig, setShowAdvancedQrConfig] = useState(false);
  const [showFansHeaderMenu, setShowFansHeaderMenu] = useState(false);

  const handleDownloadSvg = async () => {
    setIsExportingDirect(true);
    try {
      const concertTitle = selectedConcert
        ? `${selectedConcert.sala}`
        : effectiveBandName;
      await downloadQrAsSvg({
        svgElementId: "qr-code-svg-container",
        filename: `qr-${effectiveBandName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${concertTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-vectorial`,
        logoUrl: effectiveBandLogo,
      });
    } catch (err) {
      console.error("Error al descargar SVG:", err);
    } finally {
      setIsExportingDirect(false);
    }
  };

  const handleDownloadPng4k = async () => {
    setIsExportingDirect(true);
    try {
      const concertTitle = selectedConcert
        ? `${selectedConcert.sala}`
        : effectiveBandName;
      await downloadQrAsHighResPng({
        svgElementId: "qr-code-svg-container",
        filename: `qr-${effectiveBandName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${concertTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-4k`,
        template: "qr-only",
        logoUrl: effectiveBandLogo,
      });
    } catch (err) {
      console.error("Error al descargar PNG 4K:", err);
    } finally {
      setIsExportingDirect(false);
    }
  };

  const handlePrintQr = () => {
    const concertTitle = selectedConcert ? selectedConcert.sala : undefined;
    const dateCity = selectedConcert
      ? `${selectedConcert.ciudad} • ${selectedConcert.fecha}`
      : undefined;

    printHighQualityFlyer({
      svgElementId: "qr-code-svg-container",
      bandName: effectiveBandName,
      concertTitle,
      dateCity,
      url: qrConcertUrl,
      logoUrl: effectiveBandLogo,
      ctaText: "¡ESCANEA CON LA CÁMARA DE TU MÓVIL!",
      subtitle: `Únete a la comunidad oficial de ${effectiveBandName} para acceder a canciones inéditas, sorpresas exclusivas y descuentos en merchandising.`,
    });
  };

  return (
    <div data-modulo="fans" className="space-y-6">
      <div className="flex items-center justify-between gap-3 bg-[var(--surface)] rounded-[var(--r-l)] p-4 sm:p-6">
        <div className="min-w-0">
          <h2
            className="page-title flex items-center gap-2 sm:gap-3"
            title="Captura de fans en directo con códigos QR, métricas de redes, comunidad interactiva y analítica de crecimiento."
          >
            <QrCode className="size-5 sm:size-6 text-[var(--acc)] shrink-0" />
            <span className="truncate">Captura QR y fans</span>
          </h2>
          <p className="hidden sm:block text-[var(--ink-2)] font-sans text-sm mt-1">
            Captura de fans en directo con códigos QR, métricas de redes,
            comunidad interactiva y analítica de crecimiento.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ModuleTutorialTrigger
            moduleId="fans"
            onClick={openTutorial}
            label="Guía rápida"
          />

          <div className="relative shrink-0">
            <Button
              variant="neutral"
              type="button"
              onClick={() => setShowFansHeaderMenu((v) => !v)}
              title="Previsualizar formulario, copiar enlace, registrar fan manual, exportar CSV o ver guía"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            {showFansHeaderMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowFansHeaderMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 z-40 w-64 rounded-[var(--r-m)] bg-[var(--sunken)] p-1.5 space-y-0.5 text-xs font-sans">
                  <MenuItem
                    tone="acc"
                    type="button"
                    onClick={() => {
                      setShowFansHeaderMenu(false);
                      openTutorial();
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-[var(--acc)]" />{" "}
                    Guía rápida y tutorial
                  </MenuItem>
                  <MenuItem
                    tone="acc"
                    type="button"
                    onClick={() => {
                      setShowFansHeaderMenu(false);
                      setShowFansPreviewModal(true);
                    }}
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" /> Previsualizar
                    formulario
                  </MenuItem>
                  <MenuItem
                    tone="muted"
                    type="button"
                    onClick={() => {
                      setShowFansHeaderMenu(false);
                      copyLink();
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 shrink-0" /> Enlace de captura
                    corto
                  </MenuItem>
                  <MenuItem
                    tone="muted"
                    type="button"
                    onClick={() => {
                      setShowFansHeaderMenu(false);
                      setShowAddModal(true);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" /> Registrar fan
                    manual
                  </MenuItem>
                  <MenuItem
                    tone="muted"
                    id="fans-export-csv-btn"
                    type="button"
                    onClick={() => {
                      setShowFansHeaderMenu(false);
                      handleExportCSV();
                    }}
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" /> Exportar CSV
                  </MenuItem>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Tabs<typeof activeTab>
        aria-label="Secciones de fans"
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { id: "metrics", domId: "tab-btn-fans-metrics", icon: TrendingUp, label: "1. Seguimiento y métricas de redes", hidden: isPromo },
          { id: "qr", domId: "tab-btn-fans-qr", icon: QrCode, label: `${isPromo ? 1 : 2}. Captura en Vivo y QR` },
          { id: "dashboard", domId: "tab-btn-fans-dashboard", icon: Heart, label: `${isPromo ? 2 : 3}. Dashboard y Analítica` },
          { id: "fans", domId: "tab-btn-fans-directory", icon: Users, label: `${isPromo ? 3 : 4}. Comunidad y Red Social (${fans.length})` },
        ]}
      />

      {activeTab === "dashboard" && (
        <FansDashboardView
          fans={fans}
          clickStats={clickStats}
          effectiveBandName={effectiveBandName}
          evolutionaryGrowthData={evolutionaryGrowthData}
          originData={originData}
          COLORS={COLORS}
        />
      )}

      {activeTab === "fans" && (
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 space-y-5">
          {/* Configurable City Tabs Bar */}
          <div className="space-y-2 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--ink-2)] font-sans flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--acc)]" />
                Filtrar por Ciudad (Pestañas Configurables Guardadas en BBDD)
              </span>
              {selectedCityFilter && (
                <LinkButton
                  onClick={() => setSelectedCityFilter("")}
                >
                  Limpiar filtro ciudad
                </LinkButton>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                variant={selectedCityFilter === "" ? "inverse" : "neutral"}
                size="xs"
                type="button"
                onClick={() => setSelectedCityFilter("")}
              >
                Todas ({fans.length})
              </Button>

              {customCityChips.map((city) => {
                const count = fans.filter(
                  (f) =>
                    f.ciudad &&
                    f.ciudad.toLowerCase().includes(city.toLowerCase()),
                ).length;
                const isSelected =
                  selectedCityFilter.toLowerCase() === city.toLowerCase();
                return (
                  <div
                    key={city}
                    onClick={() => setSelectedCityFilter(city)}
                    className={`group/city inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-m)] text-xs font-sans font-bold transition-ui cursor-pointer ${
                      isSelected
                        ? "bg-[var(--ink)] text-[var(--bg)]"
                        : "bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)]"
                    }`}
                  >
                    <span>{city}</span>
                    <span
                      className={`text-micro px-1.5 py-0.5 rounded-[var(--r-pill)] font-bold ${
                        isSelected
                          ? "bg-[var(--surface)]/20 text-[var(--ink)]"
                          : "bg-[var(--surface)] text-[var(--acc)]"
                      }`}
                    >
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveCityTab(city, e)}
                      className={`p-0.5 rounded-[var(--r-pill)] hover:bg-[var(--alert)]/30 transition opacity-60 group-hover/city:opacity-100 ${
                        isSelected
                          ? "hover:text-[var(--alert)] text-[var(--ink)]"
                          : "hover:text-[var(--ink-2)] text-[var(--ink-2)]"
                      }`}
                      title={`Eliminar pestaña ${city}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {isAddingCity ? (
                <form
                  onSubmit={handleAddCityTab}
                  className="flex items-center gap-1"
                >
                  <Input
                    size="sm"
                    type="text"
                    autoFocus
                    placeholder="Nueva ciudad…"
                    value={newCityInput}
                    onChange={(e) => setNewCityInput(e.target.value)}
                    className="w-36"
                  />
                  <Button
                    variant="primary"
                    size="xs"
                    type="submit"
                    title="Guardar ciudad"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="neutral"
                    size="xs"
                    type="button"
                    onClick={() => {
                      setIsAddingCity(false);
                      setNewCityInput("");
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </form>
              ) : (
                <Button
                  variant="neutral"
                  size="xs"
                  type="button"
                  onClick={() => setIsAddingCity(true)}
                  className="items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir ciudad</span>
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[var(--ink-2)] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  size="sm"
                  type="text"
                  placeholder="Buscar por nombre, email o ciudad…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3"
                />
              </div>
              <div className="relative w-full sm:w-64">
                <Filter className="w-4 h-4 text-[var(--ink-2)] absolute left-3 top-1/2 -translate-y-1/2" />
                <select data-raw
                  value={filterOrigen}
                  onChange={(e) => setFilterOrigen(e.target.value)}
                  className="w-full bg-[var(--sunken)] focus:rounded-[var(--r-m)] pl-9 pr-3 py-2 text-xs text-[var(--ink)] outline-none appearance-none font-sans"
                >
                  <option value="">Todos los orígenes</option>
                  {uniqueConcertIds.map((c) => (
                    <option key={c.id} value={c.id}>
                      Concierto: {c.name}
                    </option>
                  ))}
                  <option value="Otros">Redes sociales / amigos / otros</option>
                </select>
              </div>
              <div className="relative w-full sm:w-48">
                <Select
                  size="sm"
                  value={selectedNivelFilter}
                  onChange={(e) => setSelectedNivelFilter(e.target.value)}
                  wrapperClassName="w-full"
                >
                  <option value="">Todos los niveles</option>
                  <option value="superfan">Superfan</option>
                  <option value="fundador">Fan Fundador</option>
                  <option value="fiel">Fan Fiel</option>
                  <option value="backstage">VIP Backstage</option>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Switcher */}
              <div className="flex items-center gap-1 p-1 bg-[var(--sunken)] rounded-[var(--r-m)]">
                <Button
                  variant={viewMode === "feed" ? "selected" : "ghost"}
                  size="xs"
                  type="button"
                  onClick={() => setViewMode("feed")}
                  className="items-center gap-1.5"
                  title="Muro social y comunidad"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Muro Social</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`px-2.5 py-1 rounded-[var(--r-s)] text-xs font-sans font-bold flex items-center gap-1.5 transition-ui cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-[var(--ink)] text-[var(--bg)]"
                      : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                  }`}
                  title="Vista en tarjetas"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Tarjetas</span>
                </button>
                <Button
                  variant={viewMode === "table" ? "selected" : "ghost"}
                  size="xs"
                  type="button"
                  onClick={() => setViewMode("table")}
                  className="items-center gap-1.5"
                  title="Vista en detalles / tabla"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Tabla CRM</span>
                </Button>
                <Button
                  variant={viewMode === "map" ? "selected" : "ghost"}
                  size="xs"
                  type="button"
                  onClick={() => setViewMode("map")}
                  className="items-center gap-1.5"
                  title="Vista en mapa por ciudades"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Mapa</span>
                </Button>
              </div>

              <span className="text-xs text-[var(--ink-2)] font-sans shrink-0 hidden sm:inline">
                {filteredFans.length} resultados
              </span>
            </div>
          </div>

          {viewMode === "feed" && (
            <FansCommunityView
              fans={filteredFans}
              concerts={concerts}
              effectiveBandName={effectiveBandName}
              effectiveBandLogo={effectiveBandLogo}
              colors={colors}
              onUpdateFan={onUpdateFan}
              onDeleteFan={onDeleteFan}
              onOpenAddModal={() => setShowAddModal(true)}
              selectedCityFilter={selectedCityFilter}
            />
          )}

          {viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFans.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12">
                  <PublicoSilhouette opacity={0.12} size="medium" />
                  <p className="mt-6 font-medium text-[var(--ink)] text-sm">
                    Sin fans que coincidan
                  </p>
                  <p className="mt-2 text-[var(--ink-2)] text-xs max-w-xs text-center">
                    Ajusta los filtros o espera a que tus primeros fans se unan.
                  </p>
                </div>
              ) : (
                filteredFans.map((fan) => (
                  <div
                    key={fan.id}
                    className="bg-[var(--sunken)]  rounded-[var(--r-l)] p-4 transition-ui space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc)]/10 flex items-center justify-center text-[var(--acc-ink)] font-bold text-sm">
                          {fan.nombre.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-[var(--ink)] text-sm truncate max-w-[160px]">
                            {fan.nombre}
                          </h4>
                          <p className="text-xs font-sans text-[var(--ink-2)] truncate max-w-[160px]">
                            {fan.email}
                          </p>
                        </div>
                      </div>
                      <IconButton
                        label="Eliminar Fan"
                        variant="danger"
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar fan ${fan.nombre}?`)) {
                            onDeleteFan(fan.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-sans pt-2 ">
                      <div className="bg-[var(--surface)]/80 p-2 rounded-[var(--r-s)]">
                        <span className="text-[var(--ink-2)] text-micro block">
                          Ciudad
                        </span>
                        <span className="text-[var(--ink-2)] flex items-center gap-1 font-semibold">
                          <MapPin className="w-3 h-3 text-[var(--acc)] shrink-0" />
                          <span className="truncate">
                            {fan.ciudad || "No especificada"}
                          </span>
                        </span>
                      </div>
                      <div className="bg-[var(--surface)]/80 p-2 rounded-[var(--r-s)]">
                        <span className="text-[var(--ink-2)] text-micro block">
                          Origen / canal
                        </span>
                        <span className="text-[var(--acc)] truncate block font-semibold">
                          {fan.comoConocio ||
                            fan.conciertoOrigenNombre ||
                            "Directo"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-micro font-sans text-[var(--ink-2)] pt-1">
                      <span>Registrado: {fan.fechaCaptura || "Reciente"}</span>
                      {fan.consentimientoRGPD && (
                        <span className="text-[var(--ok)] font-bold flex items-center gap-1 bg-[var(--ok)]/10 px-2 py-0.5 rounded-[var(--r-pill)]">
                          <Check className="w-3 h-3" /> RGPD Ok
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {viewMode === "map" && (
            <div className="space-y-4">
              <div className="bg-[var(--sunken)] rounded-[var(--r-l)] p-4 text-xs font-sans text-[var(--ink-2)]">
                <div className="flex items-center gap-2 text-[var(--acc)] font-bold mb-3">
                  <MapIcon className="w-4 h-4" />
                  <span>
                    Distribución Geográfica de la Comunidad de Fans por Ciudades
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(
                    filteredFans.reduce(
                      (acc, f) => {
                        const city = f.ciudad || "Ciudad no indicada";
                        acc[city] = (acc[city] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>,
                    ),
                  )
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .map(([city, count]) => (
                      <div
                        key={city}
                        className="bg-[var(--surface)] p-3 rounded-[var(--r-m)] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-4 h-4 text-[var(--acc)] shrink-0" />
                          <span className="font-bold text-[var(--ink)] truncate">
                            {city}
                          </span>
                        </div>
                        <span className="bg-[var(--acc)]/20 text-[var(--acc-ink)] text-micro font-bold px-2 py-0.5 rounded-[var(--r-pill)]">
                          {count} {count === 1 ? "fan" : "fans"}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === "table" && (
            <div className="overflow-x-auto shrink-0">
              <table className="w-full text-left text-xs text-[var(--ink-2)]">
                <thead className="bg-[var(--surface)] text-[var(--acc)] font-bold font-sans">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Correo electrónico</th>
                    <th className="p-3">Ciudad</th>
                    <th className="p-3">Canal</th>
                    <th className="p-3">Concierto Asociado</th>
                    <th className="p-3 text-center">RGPD</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hair)]">
                  {filteredFans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12">
                        <div className="flex flex-col items-center justify-center">
                          <PublicoSilhouette opacity={0.12} size="medium" />
                          <p className="mt-6 font-medium text-[var(--ink)] text-sm">
                            Sin fans que coincidan
                          </p>
                          <p className="mt-2 text-[var(--ink-2)] text-xs max-w-xs text-center">
                            Ajusta los filtros o espera a que tus primeros fans
                            se unan.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredFans.map((fan) => (
                      <tr
                        key={fan.id}
                        className="hover:bg-[var(--surface)]/20 transition group"
                      >
                        <td className="p-3 font-semibold text-[var(--ink)]">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-[var(--r-pill)] bg-[var(--acc)]/10 flex items-center justify-center text-[var(--acc-ink)] font-bold text-micro">
                              {fan.nombre.charAt(0)}
                            </div>
                            {fan.nombre}
                          </div>
                        </td>
                        <td className="p-3 font-sans">{fan.email}</td>
                        <td className="p-3">
                          {fan.ciudad ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[var(--ink-2)]" />{" "}
                              {fan.ciudad}
                            </span>
                          ) : (
                            <span className="text-[var(--ink-2)]">-</span>
                          )}
                        </td>
                        <td className="p-3 font-sans text-micro text-[var(--ink-2)]">
                          {fan.comoConocio || "-"}
                        </td>
                        <td className="p-3 text-xs text-[var(--ok)] font-sans">
                          {fan.conciertoOrigenNombre || "-"}
                        </td>
                        <td className="p-3 text-center">
                          {fan.consentimientoRGPD ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[var(--ok)]/10 text-[var(--ok)]">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <IconButton
                            label="Eliminar"
                            variant="danger"
                            onClick={() => {
                              if (confirm(`¿Eliminar fan ${fan.nombre}?`)) {
                                onDeleteFan(fan.id);
                              }
                            }}
                            className="opacity-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "qr" && (
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 lg:p-8 space-y-5">
          <div className="space-y-1 pb-4">
            <h3 className="text-xl font-bold text-[var(--ink)] flex items-center gap-2 font-display">
              <QrCode className="w-6 h-6 text-[var(--acc)]" /> Generador de QR
            </h3>
            <p className="text-xs text-[var(--ink-2)] font-sans">
              Genera el código, descárgalo o imprímelo. La recompensa al fan, el
              dominio y el idioma están abajo, plegados.
            </p>
          </div>

          {/* Vínculo a concierto: única decisión que cambia la URL, por eso va siempre visible */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label
              className="text-xs font-bold text-[var(--acc)] font-sans shrink-0"
              title="Los fans que escaneen se registrarán con este origen en el CRM"
            >
              Vincular a:
            </label>
            <Select
              size="sm"
              id="fans-concert-selector"
              value={selectedConcertId}
              onChange={(e) => setSelectedConcertId(e.target.value)}
              wrapperClassName="w-full"
            >
              <option value="">
                -- Campaña general / QR genérico de la banda --
              </option>
              {concerts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fecha} — {c.sala} ({c.ciudad})
                </option>
              ))}
            </Select>
          </div>

          {/* Contenido principal: el QR, grande y arriba del todo */}
          <div className="bg-[var(--sunken)] rounded-[var(--r-l)] p-6 flex flex-col items-center text-center space-y-4">
            <div
              id="qr-code-svg-container"
              className="p-4 bg-[var(--surface)] rounded-[var(--r-l)] inline-block relative"
            >
              <QRCode value={qrConcertUrl} size={210} level="H" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {effectiveBandLogo ? (
                  <div className="w-14 h-14 bg-[var(--sunken)] rounded-[var(--r-m)] flex items-center justify-center overflow-hidden p-0.5">
                    <img
                      src={effectiveBandLogo}
                      alt={`Logo ${effectiveBandName}`}
                      className="w-full h-full object-contain rounded-[var(--r-s)]"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-[var(--acc)] text-[var(--on-acc)] rounded-[var(--r-m)] flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-[var(--ink)] font-display text-lg">
                {selectedConcert
                  ? selectedConcert.sala
                  : `Únete a ${effectiveBandName}`}
              </h4>
              <p className="text-xs text-[var(--ink-2)] font-sans">
                {selectedConcert
                  ? `${selectedConcert.ciudad} • ${selectedConcert.fecha}`
                  : "Escanea para conseguir tema exclusivo y descuentos"}
              </p>
            </div>

            <div className="w-full flex items-center gap-2 bg-[var(--surface)] rounded-[var(--r-m)] px-3 py-2">
              <span className="flex-1 min-w-0 truncate font-sans text-[var(--acc)]/70 text-xs text-left">
                {qrConcertUrl}
              </span>
              <LinkButton
                type="button"
                onClick={handleCopyQrUrl}
                className="shrink-0"
              >
                {copiedQrUrl ? "¡Copiado!" : "Copiar"}
              </LinkButton>
            </div>

            {/* Acción principal + resto de acciones detrás de un único menú */}
            <div className="w-full flex items-center gap-2">
              <button
                id="fans-qr-export-btn"
                type="button"
                onClick={handlePrintQr}
                className="flex-1 py-3 px-4 bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold font-sans text-xs rounded-[var(--r-m)] flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Cartel A4 / PDF
              </button>
              <div className="relative shrink-0">
                <IconButton
                  label="Más opciones: SVG, PNG 4K, tarjetas, compartir, previsualizar el formulario…"
                  size="icon"
                  type="button"
                  onClick={() => setShowQrMoreMenu((v) => !v)}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </IconButton>
                {showQrMoreMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowQrMoreMenu(false)}
                    />
                    <div className="absolute right-0 bottom-full mb-1.5 z-40 w-64 rounded-[var(--r-m)] bg-[var(--surface)] p-1.5 space-y-0.5 text-xs font-sans">
                      <MenuItem
                        tone="muted"
                        type="button"
                        onClick={() => {
                          setShowQrMoreMenu(false);
                          handleDownloadSvg();
                        }}
                        disabled={isExportingDirect}
                      >
                        <FileCode className="w-3.5 h-3.5 shrink-0" /> Vector SVG
                        (imprenta/lonas)
                      </MenuItem>
                      <MenuItem
                        type="button"
                        onClick={() => {
                          setShowQrMoreMenu(false);
                          handleDownloadPng4k();
                        }}
                        disabled={isExportingDirect}
                      >
                        <Download className="w-3.5 h-3.5 shrink-0" /> PNG Ultra
                        HD 4K
                      </MenuItem>
                      <MenuItem
                        tone="acc"
                        type="button"
                        onClick={() => {
                          setShowQrMoreMenu(false);
                          setShowQrExportModal(true);
                        }}
                      >
                        <Layers className="w-3.5 h-3.5 shrink-0" /> Más formatos
                        (tarjeta, pegatina…)
                      </MenuItem>
                      <div className="h-px bg-[var(--surface)] my-1" />
                      <MenuItem
                        tone="muted"
                        type="button"
                        onClick={() => {
                          setShowQrMoreMenu(false);
                          handleShareWhatsApp();
                        }}
                      >
                        <MessageCircle className="w-3.5 h-3.5 shrink-0" />{" "}
                        Compartir por WhatsApp
                      </MenuItem>
                      <MenuItem
                        tone="muted"
                        type="button"
                        onClick={() => {
                          setShowQrMoreMenu(false);
                          handleShareNative();
                        }}
                      >
                        <Share2 className="w-3.5 h-3.5 shrink-0" /> Compartir
                        enlace
                      </MenuItem>
                      <a
                        href={qrConcertUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowQrMoreMenu(false)}
                        className="w-full text-left px-2.5 py-2 rounded-[var(--r-s)] text-[var(--ink-2)] hover:bg-[var(--surface)] transition cursor-pointer flex items-center gap-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Abrir
                        landing en pestaña nueva
                      </a>
                      <MenuItem
                        tone="muted"
                        type="button"
                        onClick={() => {
                          setShowQrMoreMenu(false);
                          setShowFansPreviewModal(true);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" /> Previsualizar
                        formulario “Únete”
                      </MenuItem>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Personalización avanzada: recompensa, dominio/slug e idioma — plegada porque no se toca en cada visita */}
          <div className=" pt-4">
            <button
              type="button"
              onClick={() => setShowAdvancedQrConfig((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-bold text-[var(--ink-2)] hover:text-[var(--acc)]/70 font-sans transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" /> Personalización avanzada
                (recompensa, dominio, idioma)
              </span>
              <span>{showAdvancedQrConfig ? "▲" : "▼"}</span>
            </button>

            {showAdvancedQrConfig && (
              <div className="mt-4 space-y-4">
                {/* Incentivo / Recompensa al Fan */}
                <div
                  id="fans-incentive-section"
                  className="bg-[var(--surface)]/80 p-5 rounded-[var(--r-l)] space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--acc)] font-sans flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[var(--acc)]" />
                      Recompensa / incentivo para el fan
                    </label>
                    {savedIncentive && (
                      <span className="text-xs font-sans text-[var(--ok)] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ¡Guardado!
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--ink-2)] font-sans">
                    Ofrece algo de valor al fan tras registrarse (un tema en
                    directo exclusivo o descuento de merchan) para disparar la
                    tasa de escaneos.
                  </p>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-sans text-[var(--ink-2)] flex items-center gap-1.5 mb-1">
                        {" "}
                        Mensaje de Bienvenida / Agradecimiento:
                      </label>
                      <Input
                        size="sm"
                        type="text"
                        value={incentivo.mensajeAgradecimiento}
                        onChange={(e) =>
                          setIncentivo((prev) => ({
                            ...prev,
                            mensajeAgradecimiento: e.target.value,
                          }))
                        }
                        placeholder="¡Muchas gracias por unirte a la familia de la banda!"
                        className="w-full"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-sans text-[var(--ink-2)] flex items-center gap-1.5 mb-1">
                          <Music className="w-3.5 h-3.5 text-[var(--acc)]" />{" "}
                          Enlace de Descarga (Tema inédito/directo):
                        </label>
                        <Input
                          size="sm"
                          type="url"
                          value={incentivo.enlaceDescarga}
                          onChange={(e) =>
                            setIncentivo((prev) => ({
                              ...prev,
                              enlaceDescarga: e.target.value,
                            }))
                          }
                          placeholder="https://…"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-sans text-[var(--ink-2)] flex items-center gap-1.5 mb-1">
                          <Tag className="w-3.5 h-3.5 text-[var(--acc)]" />{" "}
                          Código Cupón Merchandising:
                        </label>
                        <Input
                          size="sm"
                          type="text"
                          value={incentivo.codigoDescuento}
                          onChange={(e) =>
                            setIncentivo((prev) => ({
                              ...prev,
                              codigoDescuento: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="TUBANDA-FAN-10"
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        type="button"
                        onClick={() => handleSaveIncentive()}
                        className="items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" /> Guardar Incentivo
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Apoyo Económico / Revolut: se configura ahora desde el Dossier EPK, fuente única
 del resto de datos de marca (booking, redes, etc.) — aquí solo un acceso directo. */}
                <div className="bg-[var(--surface)]/80 p-5 rounded-[var(--r-l)] space-y-3">
                  <label className="text-xs font-bold text-[var(--ink-2)] font-sans flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[var(--ink-2)]" />
                    Colaboración Económica y Donaciones (Revolut, PayPal y
                    Bizum)
                  </label>
                  <p className="text-xs text-[var(--ink-2)] font-sans">
                    {epkConfig?.donacionRevolut?.habilitado !== false &&
                    epkConfig?.donacionRevolut?.revolutTag
                      ? `Activa para revolut.me/${epkConfig.donacionRevolut.revolutTag} — se muestra en el formulario público "Únete" y en la pantalla de confirmación.`
                      : "Aún no está configurada. Actívala para que tus fans puedan aportar directamente por Revolut, PayPal o Bizum, sin intermediarios."}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    onClick={() => onNavigate?.("epk")}
                    className="items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Configurar en el
                    dossier EPK
                  </Button>
                </div>

                {/* Ruta Limpia y Dominio */}
                <div className="bg-[var(--surface)]/80 p-5 rounded-[var(--r-l)] space-y-4">
                  <label className="text-xs font-bold text-[var(--acc)] font-sans flex items-center gap-2">
                    Ruta limpia y dominio base
                  </label>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setUseCustomDomain(true)}
                      className={`p-2.5 rounded-[var(--r-m)] text-left font-sans transition flex flex-col gap-1 ${
                        useCustomDomain
                          ? "bg-[var(--acc)]/15 text-[var(--acc-ink)] font-bold"
                          : "bg-[var(--surface)] text-[var(--ink-2)] hover:"
                      }`}
                    >
                      <span><ShowIcon inline emoji="🌐" />Dominio web oficial</span>
                      <span className="text-micro text-[var(--ink-2)] font-normal">
                        Para impresiones/carteles
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseCustomDomain(false)}
                      className={`p-2.5 rounded-[var(--r-m)] text-left font-sans transition flex flex-col gap-1 ${
                        !useCustomDomain
                          ? "bg-[var(--acc)]/15 text-[var(--acc-ink)] font-bold"
                          : "bg-[var(--surface)] text-[var(--ink-2)] hover:"
                      }`}
                    >
                      <span><ShowIcon inline emoji="🧪" />Servidor Dev</span>
                      <span className="text-micro text-[var(--ink-2)] font-normal">
                        Para pruebas en visor actual
                      </span>
                    </button>
                  </div>

                  {useCustomDomain && (
                    <div className="space-y-1">
                      <label className="text-xs font-sans text-[var(--ink-2)]">
                        Dominio del Proyecto:
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-sans text-[var(--ink-2)] bg-[var(--surface)] px-3 py-2.5 rounded-[var(--r-s)]">
                          https://
                        </span>
                        <Input
                          size="sm"
                          type="text"
                          value={customDomain}
                          onChange={(e) => setCustomDomain(e.target.value)}
                          placeholder="bandmanager.io"
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-sans text-[var(--ink-2)]">
                      Slug personalizado:
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-[var(--surface)] rounded-[var(--r-m)] px-2.5 shrink-0">
                        <span className="text-xs font-sans text-[var(--ink-2)]">
                          /
                        </span>
                        <input data-raw
                          type="text"
                          value={routePrefix}
                          onChange={(e) =>
                            setRoutePrefix(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, ""),
                            )
                          }
                          className="w-16 bg-transparent text-[var(--acc)] text-xs font-sans py-2.5 font-bold outline-none"
                          placeholder="unete"
                        />
                        <span className="text-xs font-sans text-[var(--ink-2)]">
                          /
                        </span>
                      </div>
                      <Input
                        size="sm"
                        type="text"
                        value={customSlug}
                        onChange={(e) =>
                          setCustomSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9-_]/g, ""),
                          )
                        }
                        placeholder="ej. madrid-sala-siroco"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-sans text-[var(--ink-2)]">
                      Idioma del formulario para este enlace:
                    </label>
                    {/* grid en vez de flex de una sola fila: con 4+ idiomas (español, inglés,
 italiano, checo) un flex sin wrap se salía de la pantalla en móvil en
 vez de pasar a una segunda fila. */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {FAN_FORM_LANGUAGES.map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => setQrLanguage(l.code)}
                          className={`py-2 px-2 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-colors ${
                            qrLanguage === l.code
                              ? "bg-[var(--acc)]/15  text-[var(--acc-ink)]"
                              : "bg-[var(--surface)] text-[var(--ink-2)] hover:"
                          }`}
                        >
                          <span>{l.flag}</span>
                          <span>{l.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-micro font-sans text-[var(--ink-2)]">
                      El formulario se abrirá en este idioma por defecto; quien
                      lo escanee siempre podrá cambiarlo a mano.
                    </p>
                  </div>

                  {selectedConcert && onUpdateConcert && (
                    <div className="pt-2 ">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateConcert(selectedConcert.id, {
                            customQrUrl: qrConcertUrl,
                          });
                          setSavedToConcertFeedback(true);
                          setTimeout(
                            () => setSavedToConcertFeedback(false),
                            3500,
                          );
                        }}
                        className={`w-full py-2.5 px-3 font-bold font-sans text-xs rounded-[var(--r-m)] flex items-center justify-center gap-2 transition cursor-pointer ${
                          savedToConcertFeedback
                            ? "bg-[var(--ok)] text-[var(--on-ok)]"
                            : "bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)]"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {savedToConcertFeedback
                          ? "¡QR Asignado a este Concierto en el Calendario!"
                          : "Asignar este QR a este Concierto en el Calendario"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal de Exportación Avanzada de QR */}
          <QrExportModal
            isOpen={showQrExportModal}
            onClose={() => setShowQrExportModal(false)}
            svgElementId="qr-code-svg-container"
            bandName={effectiveBandName}
            concertTitle={selectedConcert ? selectedConcert.sala : undefined}
            dateCity={
              selectedConcert
                ? `${selectedConcert.ciudad} • ${selectedConcert.fecha}`
                : undefined
            }
            url={qrConcertUrl}
            logoUrl={effectiveBandLogo}
          />
        </div>
      )}

      {activeTab === "metrics" && (
        <div className="space-y-6">
          <ReelsMetricsView
            colors={colors || THEMES.indie_velvet}
            metrics={metrics || []}
            epkConfig={epkConfig}
            currentBandName={effectiveBandName}
            onAddMetric={onAddMetric}
            onUpdateMetric={onUpdateMetric}
            onDeleteMetric={onDeleteMetric}
            onScanRealMetrics={onScanRealMetrics}
            onSyncMetrics={onSyncMetrics}
            isScanningMetrics={isScanningMetrics}
            isSyncingMetrics={isSyncingMetrics}
            fans={fans}
          />
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-[var(--surface)]/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-lg font-bold text-[var(--ink)] font-display flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--acc)]" />
                Registrar fan / seguidor manual
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[var(--ink-2)] hover:text-[var(--ink)] p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleManualAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                    Nombre *
                  </label>
                  <Input
                    size="sm"
                    type="text"
                    required
                    placeholder="Nombre completo o alias"
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                    Email *
                  </label>
                  <Input
                    size="sm"
                    type="email"
                    required
                    placeholder="email@ejemplo.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                    Ciudad
                  </label>
                  <Input
                    size="sm"
                    type="text"
                    placeholder="Ej: Madrid, Sevilla…"
                    value={newCiudad}
                    onChange={(e) => setNewCiudad(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                    Origen / canal
                  </label>
                  <Select size="sm" aria-label="Origen / canal"
                    value={newOrigen}
                    onChange={(e) => setNewOrigen(e.target.value)}
                    wrapperClassName="w-full"
                  >
                    <option value="Manual">Registro manual</option>
                    <option value="Concierto Directo">
                      Concierto / directo
                    </option>
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Spotify">Spotify / Streaming</option>
                    <option value="Web Oficial">Web Oficial / QR</option>
                    <option value="Recomendación">Recomendación / Amigo</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                    Nivel Fan
                  </label>
                  <Select size="sm" aria-label="Nivel Fan"
                    value={newNivel}
                    onChange={(e) => setNewNivel(e.target.value as any)}
                    wrapperClassName="w-full"
                  >
                    <option value="fiel">Oyente Fiel</option>
                    <option value="superfan">Superfan directos</option>
                    <option value="fundador">Fan Fundador</option>
                    <option value="backstage">Backstage VIP</option>
                  </Select>
                </div>
                <div>
                  <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                    Instagram (Opcional)
                  </label>
                  <Input
                    size="sm"
                    type="text"
                    placeholder="@usuario"
                    value={newInstagram}
                    onChange={(e) => setNewInstagram(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                  Canción favorita (opcional)
                </label>
                <Input
                  size="sm"
                  type="text"
                  placeholder="Ej: La Noche Entera, Balada…"
                  value={newCancionFavorita}
                  onChange={(e) => setNewCancionFavorita(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                  Mensaje / dedicatoria para el muro (opcional)
                </label>
                <Textarea
                  rows={2}
                  placeholder="Dedicatoria o saludo que aparecerá en el muro de la comunidad…"
                  value={newMensaje}
                  onChange={(e) => setNewMensaje(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button
                  variant="neutral"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  className="items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Guardar Fan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Simulador / Vista Previa In-App del Formulario Únete */}
      <FansLandingPreviewModal
        isOpen={showFansPreviewModal}
        onClose={() => setShowFansPreviewModal(false)}
        currentBandId={currentBandId}
        currentBandName={effectiveBandName}
        currentBandLogo={effectiveBandLogo}
        epkConfig={epkConfig}
        concerts={concerts}
        initialConcertId={selectedConcertId}
        initialLanguage={qrLanguage}
      />

      {/* Tutorial Interactivo Paso a Paso */}
      <ModuleTutorialModal
        moduleId="fans"
        isOpen={isTutorialOpen}
        onClose={closeTutorial}
      />
    </div>
  );
};
export default FansPanel;
