import React, { useState } from "react";
import {
  Sparkles,
  Check,
  X,
  Zap,
  ShieldCheck,
  Crown,
  Star,
  Layers,
  Building2,
  Video,
  Coins,
  Bot,
  Truck,
  DownloadCloud,
  ChevronDown,
  ChevronUp,
  Gift,
  PackageCheck,
  Palette,
  Printer,
  Home,
  Info,
  ExternalLink,
  CreditCard,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Lock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { ThemeColors, User } from "../types";
import { CheckoutButton } from "./CheckoutButton";
import { api } from "../services/api";
import {
  normalizePlan,
  getPlanTierLevel,
  getPlanDefinition,
} from "../utils/planPermissions";

interface PlanesProps {
  colors?: ThemeColors;
  currentUser?: User;
  activeBandName?: string;
  currentBandPlan?: string;
  onSelectPlan?: (planId: string) => void;
  onNavigateToModule?: (moduleId: string) => void;
}

interface PlanCardData {
  id: "ensayo" | "local" | "de_gira" | "cabeza_de_cartel";
  name: string;
  badgeLabel: string;
  badgeType: "blue" | "silver" | "gold" | "emerald";
  monthlyPrice: number;
  annualPrice: number;
  annualEquivalentMonthly: number;
  description: string;
  creditsLabel: string;
  creditsSub: string;
  isPopular?: boolean;
  ctaText: string;
  ctaVariant: "secondary" | "silver" | "gold" | "emerald";
  stickerGift?: {
    qty: string;
    description: string;
    tag: string;
  };
  features: { text: string; included: boolean; highlight?: boolean }[];
}

const PLANS_DATA: PlanCardData[] = [
  {
    id: "ensayo",
    name: "ENSAYO",
    badgeLabel: "Iniciación",
    badgeType: "blue",
    monthlyPrice: 0,
    annualPrice: 0,
    annualEquivalentMonthly: 0,
    description:
      "Para solistas y bandas noveles que arrancan su local de ensayo.",
    creditsLabel: "20 créditos IA / mes",
    creditsSub: "Pitches básicos y consultas IA",
    ctaText: "Empezar gratis",
    ctaVariant: "secondary",
    features: [
      { text: "20 créditos IA / mes", included: true },
      { text: "10 salas", included: true },
      { text: "Calendario", included: true },
      { text: "Repertorio", included: true },
      { text: "EPK básico", included: true },
      { text: "Exportar a CSV", included: true },
      { text: "Medios y prensa musical", included: false },
      { text: "Captación de fans con QR", included: false },
      { text: "Agente Mánager IA", included: false },
    ],
  },
  {
    id: "local",
    name: "LOCAL",
    badgeLabel: "Crecimiento",
    badgeType: "silver",
    monthlyPrice: 12,
    annualPrice: 115,
    annualEquivalentMonthly: 9.58,
    description:
      "El kit esencial para bandas activas tocando en su circuito local.",
    creditsLabel: "150 créditos IA / mes",
    creditsSub: "Booking guiado y generación de ideas",
    ctaText: "Elegir Local",
    ctaVariant: "silver",
    stickerGift: {
      qty: "50 pegatinas de tu banda gratis",
      description: "Pack de pegatinas de vinilo gratis con tu suscripción",
      tag: "50 uds gratis",
    },
    features: [
      { text: "150 créditos IA / mes", included: true },
      { text: "50 salas", included: true },
      { text: "20 medios", included: true },
      { text: "100 fans", included: true },
      { text: "EPK completo", included: true },
      { text: "5 clips Reels/mes", included: true, highlight: true },
      { text: "Soporte por email", included: true },
      { text: "Tour Manager & Rutas", included: false },
      { text: "Agente Mánager en batch", included: false },
    ],
  },
  {
    id: "de_gira",
    name: "DE GIRA",
    badgeLabel: "Recomendado",
    badgeType: "gold",
    monthlyPrice: 29,
    annualPrice: 278,
    annualEquivalentMonthly: 23.16,
    isPopular: true,
    description:
      "La suite definitiva para bandas de carretera, directos y booking intensivo.",
    creditsLabel: "800 créditos IA / mes",
    creditsSub: "Flujos agénticos completos y auto-booking",
    ctaText: "Probar 30 días gratis",
    ctaVariant: "gold",
    stickerGift: {
      qty: "100 pegatinas de tu banda gratis",
      description: "Pack de pegatinas de vinilo gratis con tu suscripción",
      tag: "100 uds gratis",
    },
    features: [
      { text: "800 créditos IA / mes", included: true, highlight: true },
      { text: "Salas y medios ilimitados", included: true, highlight: true },
      { text: "Fans ilimitados", included: true },
      { text: "Tour Manager", included: true, highlight: true },
      { text: "30 clips Reels/mes", included: true },
      { text: "Agente Mánager en batch", included: true, highlight: true },
      { text: "Finanzas", included: true },
      { text: "Diseño de merchan (5/mes)", included: true },
      { text: "Grupos y Agencias", included: true },
    ],
  },
  {
    id: "cabeza_de_cartel",
    name: "CABEZA DE CARTEL",
    badgeLabel: "Élite 360",
    badgeType: "emerald",
    monthlyPrice: 79,
    annualPrice: 758,
    annualEquivalentMonthly: 63.16,
    description:
      "Control 360° para artistas consolidados, sellos independientes y mánagers.",
    creditsLabel: "2.500 créditos IA / mes",
    creditsSub: "Capacidad multi-banda y agentes en paralelo",
    ctaText: "Elegir Cabeza de Cartel",
    ctaVariant: "emerald",
    stickerGift: {
      qty: "200 pegatinas + entrega prioritaria",
      description: "Pack de pegatinas de vinilo con envío express gratis",
      tag: "200 uds + Envío Express",
    },
    features: [
      { text: "2.500 créditos IA / mes", included: true, highlight: true },
      { text: "Todo ilimitado", included: true, highlight: true },
      {
        text: "Agente Mánager autónomo multi-agente",
        included: true,
        highlight: true,
      },
      { text: "Royalties y reparto", included: true },
      { text: "Stock de merchandising", included: true },
      { text: "Dominio propio", included: true },
      { text: "Usar tu propia API key", included: true, highlight: true },
      { text: "Soporte VIP", included: true },
    ],
  },
];

interface ComparisonSection {
  title: string;
  icon: any;
  items: {
    name: string;
    description?: string;
    ensayo: string | boolean;
    local: string | boolean;
    de_gira: string | boolean;
    cabeza_de_cartel: string | boolean;
  }[];
}

const COMPARISON_TABLE: ComparisonSection[] = [
  {
    title: "Gestión de Bandas y Proyectos",
    icon: Layers,
    items: [
      {
        name: "Proyectos simultáneos",
        ensayo: "1 proyecto",
        local: "1 proyecto",
        de_gira: "1 proyecto (ampliable)",
        cabeza_de_cartel: "Hasta 5 proyectos",
      },
      {
        name: "Exportación de datos (CSV / PDF)",
        ensayo: "CSV básico",
        local: "CSV y PDF",
        de_gira: "Completa sin límites",
        cabeza_de_cartel: "Backups automáticos + Todo",
      },
      {
        name: "Dominio propio personalizado",
        ensayo: false,
        local: false,
        de_gira: false,
        cabeza_de_cartel: true,
      },
    ],
  },
  {
    title: "Inteligencia Artificial y Agentes",
    icon: Bot,
    items: [
      {
        name: "Créditos de IA incluidos al mes",
        ensayo: "20 créditos",
        local: "150 créditos",
        de_gira: "800 créditos",
        cabeza_de_cartel: "2.500 créditos",
      },
      {
        name: "Redacción de pitches de booking",
        ensayo: "Básico (manual)",
        local: "IA Avanzada",
        de_gira: "IA Adaptada al género",
        cabeza_de_cartel: "IA Ultracontextual multi-estilo",
      },
      {
        name: "Agente Mánager (Chatbot Inteligente)",
        ensayo: false,
        local: "Consultas básicas",
        de_gira: "Acciones en batch",
        cabeza_de_cartel: "Autónomo multi-agente",
      },
      {
        name: "Usar tu propia API Key",
        ensayo: false,
        local: false,
        de_gira: false,
        cabeza_de_cartel: true,
      },
    ],
  },
  {
    title: "Booking de Salas, Medios y Grupos",
    icon: Building2,
    items: [
      {
        name: "Base de salas de conciertos",
        ensayo: "10 salas",
        local: "50 salas",
        de_gira: "Ilimitadas",
        cabeza_de_cartel: "Ilimitadas",
      },
      {
        name: "Medios de prensa y radios",
        ensayo: false,
        local: "20 medios",
        de_gira: "Ilimitados",
        cabeza_de_cartel: "Ilimitados",
      },
      {
        name: "Grupos y Agencias aliadas",
        ensayo: false,
        local: false,
        de_gira: true,
        cabeza_de_cartel: true,
      },
    ],
  },
  {
    title: "Tour Logistics & Carretera",
    icon: Truck,
    items: [
      {
        name: "Calendario unificado",
        ensayo: true,
        local: true,
        de_gira: true,
        cabeza_de_cartel: true,
      },
      {
        name: "Tour Manager & Rutas",
        ensayo: false,
        local: false,
        de_gira: true,
        cabeza_de_cartel: true,
      },
      {
        name: "Cálculo de kilometraje y dietas",
        ensayo: false,
        local: false,
        de_gira: true,
        cabeza_de_cartel: true,
      },
    ],
  },
  {
    title: "Contenido en Redes, Fans & EPK",
    icon: Video,
    items: [
      {
        name: "Dossier EPK interactivo",
        ensayo: "Básico",
        local: "Completo",
        de_gira: "Pro con reproductor",
        cabeza_de_cartel: "Pro sin marca de agua",
      },
      {
        name: "Captación de fans mediante QR",
        ensayo: false,
        local: "100 fans",
        de_gira: "Ilimitados",
        cabeza_de_cartel: "Ilimitados + Segmentación",
      },
      {
        name: "Clips Reels/mes con IA",
        ensayo: false,
        local: "5 clips/mes",
        de_gira: "30 clips/mes",
        cabeza_de_cartel: "Ilimitados",
      },
    ],
  },
  {
    title: "Finanzas, Merchandising & Royalties",
    icon: Coins,
    items: [
      {
        name: "Control de finanzas y bolos",
        ensayo: false,
        local: false,
        de_gira: true,
        cabeza_de_cartel: true,
      },
      {
        name: "Diseño de merchandising (IA)",
        ensayo: false,
        local: false,
        de_gira: "5 diseños/mes",
        cabeza_de_cartel: "Ilimitados",
      },
      {
        name: "Stock de merchandising",
        ensayo: false,
        local: false,
        de_gira: false,
        cabeza_de_cartel: true,
      },
      {
        name: "Royalties y reparto de cachés",
        ensayo: false,
        local: false,
        de_gira: false,
        cabeza_de_cartel: true,
      },
    ],
  },
];

export const Planes: React.FC<PlanesProps> = ({
  colors,
  currentUser,
  activeBandName,
  currentBandPlan,
  onSelectPlan,
  onNavigateToModule,
}) => {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    "Gestión de Bandas y Proyectos": true,
    "Inteligencia Artificial y Agentes": true,
    "Booking de Salas, Medios y Grupos": true,
    "Tour Logistics & Carretera": true,
    "Contenido en Redes, Fans & EPK": false,
    "Finanzas, Merchandising & Royalties": false,
  });
  const [showBanner, setShowBanner] = useState(true);

  const currentPlan = normalizePlan(
    currentBandPlan || currentUser?.plan || "ensayo",
  );
  const currentTierLevel = getPlanTierLevel(currentPlan);

  const handleOpenCustomerPortal = async () => {
    setIsOpeningPortal(true);
    setPortalError(null);
    try {
      // Sin email de repuesto: el que había mandaba el del dueño de la plataforma, así que
      // cualquiera acababa abriendo SU portal de facturación. El servidor resuelve el cliente
      // de Stripe a partir de la sesión.
      const res = await api.createPortalSession({
        bandId: currentUser?.band_id,
        returnUrl: window.location.href,
      });
      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        setPortalError(res.error || "No se pudo abrir el portal de Stripe.");
      }
    } catch (err: any) {
      setPortalError(
        err.message || "Error al conectar con Stripe Customer Portal",
      );
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const expandAllSections = () => {
    const allExpanded: Record<string, boolean> = {};
    COMPARISON_TABLE.forEach((sec) => {
      allExpanded[sec.title] = true;
    });
    setExpandedSections(allExpanded);
  };

  const collapseAllSections = () => {
    const allCollapsed: Record<string, boolean> = {};
    COMPARISON_TABLE.forEach((sec) => {
      allCollapsed[sec.title] = false;
    });
    setExpandedSections(allCollapsed);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 font-sans">
      {/* Pending Payment Alert */}
      {currentUser?.estado_suscripcion === "pago_pendiente" && (
        <div className="p-4 sm:p-5 rounded-[var(--r-l)] bg-[var(--alert)]/15/50 text-[var(--ink)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--alert)]/20 text-[var(--alert)] shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-bold text-[var(--alert)]/40">
                Problema con el cobro de tu suscripción
              </p>
              <p className="text-xs text-[var(--ink-2)]/90 mt-0.5">
                Stripe no pudo procesar tu último pago. Actualiza tu método de
                pago para evitar la interrupción de tus servicios y créditos
                agénticos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenCustomerPortal}
            disabled={isOpeningPortal}
            className="px-4 py-2.5 rounded-[var(--r-m)] bg-[var(--alert)] hover:bg-[var(--alert)] text-[var(--ink)] font-bold text-xs tracking-wider transition-all shrink-0 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isOpeningPortal ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            <span>Actualizar tarjeta en Stripe</span>
          </button>
        </div>
      )}

      {/* Scheduled Downgrade Notice Banner */}
      {currentUser?.plan_pendiente && (
        <div className="p-4 sm:p-5 rounded-[var(--r-l)] bg-[var(--acc)]/15 /40 text-[var(--ink)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/20 text-[var(--acc)] shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-bold text-[var(--acc)] flex items-center gap-2">
                <span>Cambio de plan programado:</span>
                <span className="uppercase text-[var(--acc)] font-sans underline decoration-amber-0/60">
                  {currentUser.plan_pendiente.replace("_", "")}
                </span>
              </p>
              <p className="text-xs text-[var(--acc)]/70/90 mt-0.5">
                Tu plan actual{" "}
                <strong className="text-[var(--ink)] font-sans">
                  {currentPlan.replace("_", "")}
                </strong>{" "}
                seguirá 100% activo hasta el final de tu ciclo de facturación
                {currentUser.fecha_cambio_plan
                  ? ` (${new Date(currentUser.fecha_cambio_plan).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })})`
                  : ""}
                . Ninguno de tus datos creados será eliminado jamás.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenCustomerPortal}
            disabled={isOpeningPortal}
            className="px-4 py-2.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--acc)]/70 font-bold text-xs tracking-wider transition-all shrink-0 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isOpeningPortal ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            <span>Gestionar en Portal</span>
          </button>
        </div>
      )}

      {/* Stripe Customer Portal Floating / Top Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-[var(--r-l)] bg-[var(--surface)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[var(--r-m)] bg-[var(--acc)]/60/10 flex items-center justify-center text-[var(--acc)] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-sans text-[var(--ink-2)]">
                Plan activo:
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[var(--acc)]/60/20 text-[var(--acc)]/70 text-xs font-sans font-bold">
                {currentPlan.replace("_", "")}
              </span>
              {activeBandName && (
                <span className="text-xs text-[var(--ink-2)] font-sans">
                  • Proyecto:{" "}
                  <strong className="text-[var(--ink)]">
                    {activeBandName}
                  </strong>
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--ink-2)] mt-0.5">
              Tus pagos, facturas, tarjetas y cancelaciones se gestionan de
              forma 100% segura con Stripe.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCustomerPortal}
          disabled={isOpeningPortal}
          className="w-full sm:w-auto px-4 py-2 rounded-[var(--r-m)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] text-xs font-bold font-sans tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isOpeningPortal ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[var(--acc)]" />
              <span>Abriendo Stripe...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 text-[var(--acc)]" />
              <span>Portal de Clientes Stripe</span>
              <ExternalLink className="w-3.5 h-3.5 text-[var(--ink-2)]" />
            </>
          )}
        </button>
      </div>

      {portalError && (
        <p className="text-xs text-[var(--alert)] font-sans bg-[var(--alert)]/10 p-3 rounded-[var(--r-m)]">
          {portalError}
        </p>
      )}

      {/* 1. Banner superior */}
      {showBanner && currentPlan === "ensayo" && (
        <div className="relative overflow-hidden rounded-[var(--r-l)] bg-gradient-to-r from-amber-0/20 via-amber-400/10 to-emerald-500/20 p-4 sm:p-5 text-[var(--ink)] shadow-black/40">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc)]/60/20 flex items-center justify-center text-[var(--acc)]/70 shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold text-[var(--ink)] flex items-center justify-center sm:justify-start gap-2">
                  <span>30 días gratis del plan De Gira. Sin compromiso.</span>
                </p>
                <p className="text-xs text-[var(--ink-2)] mt-0.5">
                  Desbloquea el Booking IA ilimitado, Tour Manager y la suite
                  completa durante un mes completo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const deGiraBtn = document.getElementById("btn-plan-de_gira");
                  if (deGiraBtn)
                    deGiraBtn.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-4 py-2 rounded-[var(--r-m)] bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[var(--ink)] text-xs font-black tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>Probar Ahora</span>
              </button>
              <button
                type="button"
                onClick={() => setShowBanner(false)}
                className="p-2 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--r-s)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
                title="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Header & Toggle Mensual / Anual */}
      <div className="flex flex-col items-center text-center space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--acc)]/60/10 text-[var(--acc)]/70 text-xs font-sans font-bold tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
          <span>Planes & Suscripciones</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-[var(--ink)]">
          Planes diseñados para{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">
            músicos independientes
          </span>
        </h1>

        <p className="text-sm sm:text-base text-[var(--ink-2)] max-w-2xl leading-relaxed">
          Desde tus primeros ensayos hasta giras nacionales. Elige el ritmo de
          automatización y créditos de inteligencia artificial que tu proyecto
          necesita.
        </p>

        {/* Toggle Mensual / Anual con badge"-20% · 2 meses gratis" */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="inline-flex p-1.5 rounded-[var(--r-l)] bg-[var(--surface)]">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={`px-5 py-2 rounded-[var(--r-m)] text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                billingPeriod === "monthly"
                  ? "bg-[var(--surface)]/80 text-[var(--ink)]"
                  : "text-[var(--ink-2)] hover:text-[var(--ink)]"
              }`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("annual")}
              className={`relative px-5 py-2 rounded-[var(--r-m)] text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                billingPeriod === "annual"
                  ? "bg-[var(--acc)]/60 text-[var(--on-acc)] font-black"
                  : "text-[var(--ink-2)] hover:text-[var(--ink)]"
              }`}
            >
              <span>Anual</span>
              <span
                className={`text-[10px] font-sans px-2 py-0.5 rounded-full font-extrabold ${
                  billingPeriod === "annual"
                    ? "bg-[var(--sunken)] text-[var(--acc)]/70"
                    : "bg-[var(--ok)]/20 text-[var(--ok)]"
                }`}
              >
                -20% · 2 meses gratis
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. 4 Cards en fila (apiladas en móvil) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch pt-2">
        {PLANS_DATA.map((plan) => {
          const isAnnual = billingPeriod === "annual";
          const priceDisplay = isAnnual ? plan.annualPrice : plan.monthlyPrice;
          const periodSuffix = isAnnual ? "€/año" : "€/mes";

          const getBadgeStyle = (type: PlanCardData["badgeType"]) => {
            switch (type) {
              case "blue":
                return "bg-[var(--acc)]/15 text-[var(--ink-3)]/30";
              case "silver":
                return "bg-[var(--sunken)]/15 text-[var(--ink-2)] /30";
              case "gold":
                return "bg-[var(--acc)]/60/20 text-[var(--acc)]/70 /50";
              case "emerald":
                return "bg-[var(--ok)]/20 text-[var(--ink-2)]/40";
            }
          };

          const getCtaStyle = (variant: PlanCardData["ctaVariant"]) => {
            switch (variant) {
              case "secondary":
                return "bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)]";
              case "silver":
                return "bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)]";
              case "gold":
                return "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:brightness-110 text-[var(--ink)] font-black";
              case "emerald":
                return "bg-[var(--ok)] hover:bg-[var(--ok)] text-[var(--ink)] font-black";
            }
          };

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-[var(--r-l)] p-6 transition-all duration-300 ${
                plan.isPopular
                  ? "bg-gradient-to-b from-[var(--surface)] via-[var(--surface)] to-[var(--sunken)] /80 lg:-translate-y-2.5 z-10"
                  : "bg-[var(--surface)] hover:"
              }`}
            >
              {/* Popular Floating Badge */}
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-[var(--ink)] text-[10px] font-black font-sans tracking-widest">
                    <Star className="w-3 h-3 fill-[var(--ink)]" />
                    <span>MÁS POPULAR</span>
                  </span>
                </div>
              )}

              {/* Card Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black font-display tracking-wider text-[var(--ink)]">
                    {plan.name}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold ${getBadgeStyle(plan.badgeType)}`}
                  >
                    {plan.badgeLabel}
                  </span>
                </div>

                <p className="text-xs text-[var(--ink-2)] leading-relaxed min-h-[36px]">
                  {plan.description}
                </p>

                {/* Price block */}
                <div className="pt-2 pb-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black font-display tracking-tight text-[var(--ink)]">
                      {priceDisplay}
                    </span>
                    <span className="text-xs font-sans font-bold text-[var(--ink-2)]">
                      {periodSuffix}
                    </span>
                  </div>

                  {isAnnual && plan.annualPrice > 0 && (
                    <p className="text-[11px] font-sans text-[var(--ok)] mt-1">
                      Equivalente a{" "}
                      {plan.annualEquivalentMonthly
                        .toFixed(2)
                        .replace(".", ",")}
                      €/mes
                    </p>
                  )}
                  {isAnnual && plan.annualPrice === 0 && (
                    <p className="text-[11px] font-sans text-[var(--ink-2)] mt-1">
                      Para siempre sin coste
                    </p>
                  )}
                </div>

                {/* IA Credits Highlight Chip */}
                <div
                  className={`p-3 rounded-[var(--r-l)] flex items-start gap-2.5 ${
                    plan.isPopular
                      ? "bg-[var(--acc)]/60/10 /30 text-[var(--ink)]"
                      : "bg-[var(--surface)]/80 text-[var(--ink-2)]"
                  }`}
                >
                  <Sparkles
                    className={`w-4 h-4 mt-0.5 shrink-0 ${plan.isPopular ? "text-[var(--acc)]" : "text-[var(--ink-2)]"}`}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-sans font-black tracking-wide">
                      {plan.creditsLabel}
                    </span>
                    <span className="text-[10px] text-[var(--ink-2)] leading-tight">
                      {plan.creditsSub}
                    </span>
                  </div>
                </div>

                {/* 🎁 Sticker Gift */}
                {plan.stickerGift ? (
                  <div
                    className={`p-3 rounded-[var(--r-l)] transition-all relative overflow-hidden ${
                      plan.isPopular
                        ? "bg-gradient-to-r from-amber-0/20 via-amber-400/10 to-amber-0/15 /50"
                        : plan.id === "cabeza_de_cartel"
                          ? "bg-gradient-to-r from-[var(--ok)]/20 via-emerald-400/10 to-emerald-500/15/50"
                          : "bg-gradient-to-r from-neutral-500/20 viabg-[var(--surface)] to-neutral-500/10 /30"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`p-1.5 rounded-[var(--r-m)] shrink-0 ${
                          plan.isPopular
                            ? "bg-[var(--acc)]/60 text-[var(--on-acc)]"
                            : plan.id === "cabeza_de_cartel"
                              ? "bg-[var(--ok)] text-[var(--ink)]"
                              : "bg-[var(--surface)] text-[var(--ink)]"
                        }`}
                      >
                        <Gift className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 flex-wrap mb-1">
                          <span
                            className={`text-[10px] font-sans font-black tracking-wider px-1.5 py-0.5 rounded ${
                              plan.isPopular
                                ? "bg-[var(--acc)]/60/20 text-[var(--acc)]/70"
                                : plan.id === "cabeza_de_cartel"
                                  ? "bg-[var(--ok)]/20 text-[var(--ink-2)]"
                                  : "bg-[var(--sunken)]/20 text-[var(--ink-2)]"
                            }`}
                          >
                            {plan.stickerGift.tag}
                          </span>
                          <span className="text-[9px] font-sans text-[var(--ink-2)]">
                            Regalo
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-[var(--ink)] leading-snug">
                          🎁 {plan.stickerGift.qty}
                        </p>
                        <p className="text-[10px] text-[var(--ink-2)] leading-tight mt-0.5">
                          {plan.stickerGift.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)]/60 flex items-center justify-between gap-2 text-[var(--ink-2)]">
                    <div className="flex items-center gap-2">
                      <Gift className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                      <span className="text-[10px] font-sans">
                        Pack de pegatinas de bienvenida
                      </span>
                    </div>
                    <span className="text-[10px] font-sans font-bold text-[var(--ink-2)]">
                      Solo pago
                    </span>
                  </div>
                )}

                {/* Feature List */}
                <div className="pt-2 space-y-2.5">
                  <p className="text-[10px] font-sans font-bold tracking-wider text-[var(--ink-2)]">
                    Características:
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs"
                      >
                        {feat.included ? (
                          <div
                            className={`p-0.5 rounded-full mt-0.5 shrink-0 ${
                              plan.isPopular
                                ? "bg-[var(--acc)]/60 text-[var(--on-acc)]"
                                : "bg-[var(--ok)]/20 text-[var(--ok)]"
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="p-0.5 rounded-full mt-0.5 shrink-0 bg-[var(--surface)] text-[var(--ink-2)]">
                            <X className="w-3 h-3 stroke-[2]" />
                          </div>
                        )}
                        <span
                          className={`leading-tight ${
                            feat.included
                              ? feat.highlight
                                ? "text-[var(--ink)] font-bold"
                                : "text-[var(--ink-2)]"
                              : "text-[var(--ink-2)] line-through"
                          }`}
                        >
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CTA Button */}
              <div id={`btn-plan-${plan.id}`} className="pt-6 mt-4">
                {plan.id === currentPlan ? (
                  <div className="space-y-2">
                    <div className="w-full py-2.5 px-4 rounded-[var(--r-m)] bg-[var(--acc)]/60/15 text-[var(--acc)]/70 font-bold text-xs font-sans text-center flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Tu Plan Actual</span>
                    </div>
                    {plan.id !== "ensayo" && (
                      <button
                        type="button"
                        onClick={handleOpenCustomerPortal}
                        disabled={isOpeningPortal}
                        className="w-full py-2 px-3 rounded-[var(--r-s)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] hover:text-[var(--ink)] text-[11px] font-sans transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Gestionar en Stripe</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ) : getPlanTierLevel(plan.id) > currentTierLevel ? (
                  <CheckoutButton
                    planId={plan.id}
                    billingInterval={billingPeriod}
                    bandId={currentUser?.band_id}
                    userEmail={currentUser?.email}
                    className={`text-xs tracking-wider ${getCtaStyle(plan.ctaVariant)}`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mejorar a {plan.name}</span>
                    </span>
                  </CheckoutButton>
                ) : (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={handleOpenCustomerPortal}
                      disabled={isOpeningPortal}
                      className="w-full py-3 px-4 rounded-[var(--r-m)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] text-xs font-bold font-sans tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                      <span>Bajar a {plan.name}</span>
                    </button>
                    <p className="text-[10px] text-[var(--ink-2)] font-sans text-center leading-tight">
                      Efectivo al fin de ciclo en Stripe Portal
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Complete Comparison Table */}
      <div className="pt-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-wider text-[var(--ink)]">
              Tabla Comparativa de Módulos
            </h2>
            <p className="text-xs text-[var(--ink-2)]">
              Desglose detallado de capacidades técnicas, límites y herramientas
              de BandManager
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAllSections}
              className="px-3 py-1.5 rounded-[var(--r-s)] text-xs font-sans bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] cursor-pointer transition-colors"
            >
              Expandir todo
            </button>
            <button
              type="button"
              onClick={collapseAllSections}
              className="px-3 py-1.5 rounded-[var(--r-s)] text-xs font-sans bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] cursor-pointer transition-colors"
            >
              Colapsar todo
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-[var(--r-l)] bg-[var(--surface)] overflow-hidden">
          {/* Header Row on Desktop */}
          <div className="hidden lg:grid grid-cols-12 gap-4 p-4 bg-[var(--surface)] text-xs font-sans font-bold text-[var(--ink-2)]">
            <div className="col-span-4">Módulo / Funcionalidad</div>
            <div className="col-span-2 text-center text-[var(--ink-2)]">
              Ensayo (0€)
            </div>
            <div className="col-span-2 text-center text-[var(--ink-2)]">
              Local (12€/m)
            </div>
            <div className="col-span-2 text-center text-[var(--acc)]/70 font-black">
              De Gira (29€/m) ⭐
            </div>
            <div className="col-span-2 text-center text-[var(--ok)] font-black">
              Cabeza de Cartel (79€/m)
            </div>
          </div>

          {/* Sections Accordion */}
          <div className="divide-y divide-[var(--hair)]">
            {COMPARISON_TABLE.map((section) => {
              const IconComp = section.icon;
              const isExpanded = expandedSections[section.title];

              return (
                <div key={section.title} className="transition-colors">
                  {/* Section Title Header */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between bg-[var(--surface)] hover:bg-[var(--surface)] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--acc)]">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-sm sm:text-base font-bold font-display tracking-wider text-[var(--ink)]">
                        {section.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[var(--ink-2)] text-xs font-sans">
                      <span>{isExpanded ? "Ocultar" : "Ver detalles"}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {/* Section Content */}
                  {isExpanded && (
                    <div className="divide-y divide-[#222120]/60 bg-[var(--bg)]">
                      {section.items.map((row, rIdx) => (
                        <div
                          key={rIdx}
                          className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 p-4 items-center hover:bg-[var(--surface)]/80 transition-colors"
                        >
                          <div className="lg:col-span-4 space-y-0.5">
                            <p className="text-xs sm:text-sm font-semibold text-[var(--ink)]">
                              {row.name}
                            </p>
                            {row.description && (
                              <p className="text-[11px] text-[var(--ink-2)]">
                                {row.description}
                              </p>
                            )}
                          </div>

                          <div className="lg:col-span-2 flex items-center justify-between lg:justify-center text-xs">
                            <span className="lg:hidden text-[10px] font-sans text-[var(--ink-2)]">
                              Ensayo:
                            </span>
                            {typeof row.ensayo === "boolean" ? (
                              row.ensayo ? (
                                <Check className="w-4 h-4 text-[var(--ok)]" />
                              ) : (
                                <X className="w-4 h-4 text-[var(--ink-2)]" />
                              )
                            ) : (
                              <span className="text-[var(--ink-2)] text-center font-sans">
                                {row.ensayo}
                              </span>
                            )}
                          </div>

                          <div className="lg:col-span-2 flex items-center justify-between lg:justify-center text-xs">
                            <span className="lg:hidden text-[10px] font-sans text-[var(--ink-2)]">
                              Local:
                            </span>
                            {typeof row.local === "boolean" ? (
                              row.local ? (
                                <Check className="w-4 h-4 text-[var(--ok)]" />
                              ) : (
                                <X className="w-4 h-4 text-[var(--ink-2)]" />
                              )
                            ) : (
                              <span className="text-[var(--ink-2)] text-center font-sans">
                                {row.local}
                              </span>
                            )}
                          </div>

                          <div className="lg:col-span-2 flex items-center justify-between lg:justify-center text-xs bg-[var(--acc)]/5 lg:bg-transparent p-2 lg:p-0 rounded-[var(--r-s)]">
                            <span className="lg:hidden text-[10px] font-sans text-[var(--acc)] font-bold">
                              De Gira (⭐):
                            </span>
                            {typeof row.de_gira === "boolean" ? (
                              row.de_gira ? (
                                <div className="p-1 rounded-full bg-[var(--acc)]/60/20 text-[var(--acc)]/70">
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </div>
                              ) : (
                                <X className="w-4 h-4 text-[var(--ink-2)]" />
                              )
                            ) : (
                              <span className="text-[var(--acc)]/70 text-center font-sans font-bold">
                                {row.de_gira}
                              </span>
                            )}
                          </div>

                          <div className="lg:col-span-2 flex items-center justify-between lg:justify-center text-xs">
                            <span className="lg:hidden text-[10px] font-sans text-[var(--ok)] font-bold">
                              Cabeza de Cartel:
                            </span>
                            {typeof row.cabeza_de_cartel === "boolean" ? (
                              row.cabeza_de_cartel ? (
                                <div className="p-1 rounded-full bg-[var(--ok)]/20 text-[var(--ok)]">
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </div>
                              ) : (
                                <X className="w-4 h-4 text-[var(--ink-2)]" />
                              )
                            ) : (
                              <span className="text-[var(--ink-2)] text-center font-sans font-bold">
                                {row.cabeza_de_cartel}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Transparencia, Upgrades/Downgrades y Degradación No Destructiva */}
      <div className="rounded-[var(--r-l)] p-6 sm:p-8 bg-[var(--surface)] space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/60/10 text-[var(--acc)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display tracking-wide text-[var(--ink)]">
              Garantía BandManager: Política de Planes y Datos Protegidos
            </h3>
            <p className="text-xs text-[var(--ink-2)]">
              Transparencia total para bandas independientes sin letra pequeña.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-[var(--r-l)] bg-[var(--surface)]/60 space-y-2">
            <div className="flex items-center gap-2 text-[var(--acc)]/70 font-sans font-bold text-xs">
              <Sparkles className="w-4 h-4 text-[var(--acc)]" />
              <span>Upgrades Inmediatos</span>
            </div>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Si mejoras de plan, se activa al instante. Stripe prorratea
              automáticamente los días no disfrutados y recibes de inmediato la
              cuota completa de créditos IA y nuevos módulos.
            </p>
          </div>

          <div className="p-4 rounded-[var(--r-l)] bg-[var(--surface)]/60 space-y-2">
            <div className="flex items-center gap-2 text-[var(--ink-3)] font-sans font-bold text-xs">
              <Lock className="w-4 h-4 text-[var(--ink-2)]" />
              <span>Cero Borrado de Datos</span>
            </div>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Al bajar de plan o cancelar,{" "}
              <strong className="text-[var(--ink)]">
                NUNCA eliminamos tus salas, medios, fans, canciones o giras
              </strong>
              . Todo tu histórico sigue visible y editable. Únicamente se pausa
              la creación de nuevos registros si superas el cupo del nuevo plan.
            </p>
          </div>

          <div className="p-4 rounded-[var(--r-l)] bg-[var(--surface)]/60 space-y-2">
            <div className="flex items-center gap-2 text-[var(--ink-2)] font-sans font-bold text-xs">
              <Gift className="w-4 h-4 text-[var(--ok)]" />
              <span>Pegatinas y Regalos Tuyos</span>
            </div>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Los packs de pegatinas de vinilo de alta resistencia ya entregados
              son propiedad de tu banda para siempre. Sin devoluciones ni cargos
              adicionales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Planes;
