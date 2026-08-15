import React, { useState } from 'react';
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
  Radio,
  Users,
  Truck,
  Video,
  Coins,
  Bot,
  Heart,
  FileSpreadsheet,
  HelpCircle,
  ArrowRight,
  Info,
  Guitar,
  Clock,
  DownloadCloud,
  ChevronDown,
  ChevronUp,
  Gift,
  PackageCheck,
  Palette,
  Printer,
  Home
} from 'lucide-react';
import { ThemeColors } from '../types';

interface PlanesProps {
  colors?: ThemeColors;
  onSelectPlan?: (planId: string) => void;
  onNavigateToModule?: (moduleId: string) => void;
}

interface PlanCardData {
  id: 'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel';
  name: string;
  badgeLabel: string;
  badgeType: 'blue' | 'silver' | 'gold' | 'emerald';
  monthlyPrice: number;
  annualPrice: number;
  annualEquivalentMonthly: number;
  description: string;
  creditsLabel: string;
  creditsSub: string;
  isPopular?: boolean;
  ctaText: string;
  ctaVariant: 'secondary' | 'silver' | 'gold' | 'emerald';
  stickerGift?: {
    qty: string;
    description: string;
    tag: string;
  };
  features: { text: string; included: boolean; highlight?: boolean }[];
}

const PLANS_DATA: PlanCardData[] = [
  {
    id: 'ensayo',
    name: 'ENSAYO',
    badgeLabel: 'Iniciación',
    badgeType: 'blue',
    monthlyPrice: 0,
    annualPrice: 0,
    annualEquivalentMonthly: 0,
    description: 'Para solistas y bandas noveles que arrancan su local de ensayo.',
    creditsLabel: '20 créditos IA / mes',
    creditsSub: 'Pitches básicos y consultas IA',
    ctaText: 'Empezar gratis',
    ctaVariant: 'secondary',
    // No stickerGift (incentivo de subida)
    features: [
      { text: '1 banda o proyecto', included: true },
      { text: '10 salas en base de datos', included: true },
      { text: 'Calendario de ensayos y bolos', included: true },
      { text: 'Repertorio y setlists', included: true },
      { text: 'Metrónomo y Afinador WebAudio', included: true },
      { text: 'Dossier EPK básico', included: true },
      { text: 'Exportación a CSV', included: true },
      { text: 'Medios y prensa musical', included: false },
      { text: 'Captación de fans con QR', included: false },
      { text: 'Reels & Social Center', included: false },
      { text: 'Agente Mánager IA autónomo', included: false },
      { text: 'Tour Manager & Logística', included: false }
    ]
  },
  {
    id: 'local',
    name: 'LOCAL',
    badgeLabel: 'Crecimiento',
    badgeType: 'silver',
    monthlyPrice: 12,
    annualPrice: 115,
    annualEquivalentMonthly: 9.58,
    description: 'El kit esencial para bandas activas tocando en su circuito local.',
    creditsLabel: '150 créditos IA / mes',
    creditsSub: 'Booking guiado y generación de ideas',
    ctaText: 'Elegir Local',
    ctaVariant: 'silver',
    stickerGift: {
      qty: '250 pegatinas',
      description: 'Pack de pegatinas de tu banda, gratis con tu primera suscripción',
      tag: '250 uds gratis'
    },
    features: [
      { text: '1 banda o proyecto', included: true },
      { text: '50 salas de conciertos', included: true },
      { text: '20 medios y radios musicales', included: true },
      { text: 'Hasta 100 fans registrados', included: true },
      { text: 'Dossier EPK interactivo completo', included: true },
      { text: '5 clips de Reels / mes con IA', included: true, highlight: true },
      { text: 'Soporte prioritario por email', included: true },
      { text: 'Exportación a CSV y PDF', included: true },
      { text: 'Tour Manager & Rutas de viaje', included: false },
      { text: 'Agente Mánager en batch', included: false },
      { text: 'Control financiero & Merchandising', included: false },
      { text: 'Acceso a red de bandas y swap', included: false }
    ]
  },
  {
    id: 'de_gira',
    name: 'DE GIRA',
    badgeLabel: 'Recomendado',
    badgeType: 'gold',
    monthlyPrice: 29,
    annualPrice: 278,
    annualEquivalentMonthly: 23.16,
    isPopular: true,
    description: 'La suite definitiva para bandas de carretera, directos y booking intensivo.',
    creditsLabel: '800 créditos IA / mes',
    creditsSub: 'Flujos agénticos completos y auto-booking',
    ctaText: 'Probar 30 días gratis',
    ctaVariant: 'gold',
    stickerGift: {
      qty: '500 pegatinas',
      description: 'Pack de pegatinas de tu banda, gratis con tu primera suscripción',
      tag: '500 uds gratis'
    },
    features: [
      { text: 'Salas y festivales ilimitados', included: true, highlight: true },
      { text: 'Medios y prensa ilimitados', included: true },
      { text: 'Base de fans ilimitada', included: true },
      { text: 'Tour Manager & Cálculo de rutas y dietas', included: true, highlight: true },
      { text: '30 clips Reels / mes con guión IA', included: true },
      { text: 'Agente Mánager en batch (Human-in-the-loop)', included: true, highlight: true },
      { text: 'Módulo de Finanzas & Balances', included: true },
      { text: 'Diseño IA de Merchandising (5/mes)', included: true },
      { text: 'Grupos & Agencias aliadas para bolos compartidos', included: true },
      { text: 'Dossier EPK Pro con reproductor y descargas', included: true },
      { text: 'Soporte prioritario WhatsApp / Chat', included: true },
      { text: 'Uso de API Key propia (opcional)', included: false }
    ]
  },
  {
    id: 'cabeza_de_cartel',
    name: 'CABEZA DE CARTEL',
    badgeLabel: 'Élite 360',
    badgeType: 'emerald',
    monthlyPrice: 79,
    annualPrice: 758,
    annualEquivalentMonthly: 63.16,
    description: 'Control 360° para artistas consolidados, sellos independientes y mánagers.',
    creditsLabel: '2.500 créditos IA / mes',
    creditsSub: 'Capacidad multi-banda y agentes en paralelo',
    ctaText: 'Elegir Cabeza de Cartel',
    ctaVariant: 'emerald',
    stickerGift: {
      qty: '1.000 pegatinas + entrega prioritaria',
      description: 'Pack de pegatinas de tu banda, gratis con tu primera suscripción',
      tag: '1.000 uds + Envío Express'
    },
    features: [
      { text: 'Hasta 5 bandas gestionadas en paralelo', included: true, highlight: true },
      { text: 'Todo ilimitado sin restricciones de volumen', included: true },
      { text: 'Agente Mánager autónomo multi-agente', included: true, highlight: true },
      { text: 'Módulo de Royalties & Reparto de porcentajes', included: true },
      { text: 'Gestión de Stock físico de Merchandising', included: true },
      { text: 'Dominio propio personalizado para EPK y Fans', included: true },
      { text: 'Usar tu propia API Key (Gemini/OpenAI)', included: true, highlight: true },
      { text: 'Despacho automático sincronizado con CRM', included: true },
      { text: 'Soporte VIP 24/7 con mánager dedicado', included: true },
      { text: 'Acceso anticipado a funciones beta', included: true },
      { text: 'Exportación completa y backups automáticos', included: true },
      { text: 'Multi-usuario con roles de banda y mánager', included: true }
    ]
  }
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
    title: 'Gestión de Bandas y Proyectos',
    icon: Layers,
    items: [
      {
        name: 'Bandas o proyectos simultáneos',
        ensayo: '1 banda',
        local: '1 banda',
        de_gira: '1 banda (ampliable)',
        cabeza_de_cartel: 'Hasta 5 bandas'
      },
      {
        name: 'Miembros de banda por proyecto',
        ensayo: 'Ilimitados',
        local: 'Ilimitados',
        de_gira: 'Ilimitados',
        cabeza_de_cartel: 'Ilimitados'
      },
      {
        name: 'Exportación de datos (CSV / PDF / JSON)',
        ensayo: 'CSV básico',
        local: 'CSV y PDF',
        de_gira: 'Completa sin límites',
        cabeza_de_cartel: 'Backups automáticos + Todo'
      },
      {
        name: 'Dominio personalizado (tupropiaweb.com)',
        ensayo: false,
        local: false,
        de_gira: false,
        cabeza_de_cartel: true
      }
    ]
  },
  {
    title: 'Inteligencia Artificial y Agentes',
    icon: Bot,
    items: [
      {
        name: 'Créditos de IA incluidos al mes',
        ensayo: '20 créditos',
        local: '150 créditos',
        de_gira: '800 créditos',
        cabeza_de_cartel: '2.500 créditos'
      },
      {
        name: 'Redacción de pitches de booking personalizados',
        ensayo: 'Básico (manual)',
        local: 'IA Avanzada',
        de_gira: 'IA Adaptada al género + tono',
        cabeza_de_cartel: 'IA Ultracontextual multi-estilo'
      },
      {
        name: 'Agente Mánager (Chatbot con Function Calling)',
        ensayo: false,
        local: 'Consultas básicas',
        de_gira: 'Acciones y batch completo',
        cabeza_de_cartel: 'Autónomo multi-agente'
      },
      {
        name: 'Uso de tu propia API Key de IA',
        ensayo: false,
        local: false,
        de_gira: false,
        cabeza_de_cartel: true
      }
    ]
  },
  {
    title: 'Booking de Salas, Medios y Grupos',
    icon: Building2,
    items: [
      {
        name: 'Base de salas y promotores',
        ensayo: '10 salas',
        local: '50 salas',
        de_gira: 'Ilimitadas',
        cabeza_de_cartel: 'Ilimitadas'
      },
      {
        name: 'Medios de prensa, radios y playlists',
        ensayo: false,
        local: '20 contactos',
        de_gira: 'Ilimitados',
        cabeza_de_cartel: 'Ilimitados'
      },
      {
        name: 'Grupos & Agencias aliadas (intercambio de bolos)',
        ensayo: false,
        local: false,
        de_gira: true,
        cabeza_de_cartel: true
      },
      {
        name: 'Pipeline Kanban en 2 dimensiones (CRM + IA)',
        ensayo: '1 columna',
        local: 'Embudo completo',
        de_gira: 'Embudo completo + Aprobaciones',
        cabeza_de_cartel: 'Embudo 360 + Automatizaciones'
      }
    ]
  },
  {
    title: 'Tour Logistics & Carretera',
    icon: Truck,
    items: [
      {
        name: 'Calendario unificado de ensayos y conciertos',
        ensayo: true,
        local: true,
        de_gira: true,
        cabeza_de_cartel: true
      },
      {
        name: 'Tour Manager & Hoja de ruta por ciudades',
        ensayo: false,
        local: false,
        de_gira: true,
        cabeza_de_cartel: true
      },
      {
        name: 'Cálculo automático de kilometraje, gasolina y dietas',
        ensayo: false,
        local: false,
        de_gira: true,
        cabeza_de_cartel: true
      },
      {
        name: 'Checklist de equipo, furgoneta y prueba de sonido',
        ensayo: 'Básico',
        local: 'Básico',
        de_gira: 'Interactiva en vivo',
        cabeza_de_cartel: 'Interactiva en vivo + Roles'
      }
    ]
  },
  {
    title: 'Contenido en Redes, Fans & EPK',
    icon: Video,
    items: [
      {
        name: 'Dossier de prensa interactivo (EPK público)',
        ensayo: 'Versión reducida',
        local: 'Completo con Spotify',
        de_gira: 'Pro con Rider y Prensa',
        cabeza_de_cartel: 'Pro sin marca de agua'
      },
      {
        name: 'Captación de Fans mediante QR en bolos',
        ensayo: false,
        local: 'Hasta 100 fans',
        de_gira: 'Fans ilimitados',
        cabeza_de_cartel: 'Fans ilimitados + Segmentación'
      },
      {
        name: 'Reels & Social Center (Guiones virales IA)',
        ensayo: false,
        local: '5 clips/mes',
        de_gira: '30 clips/mes',
        cabeza_de_cartel: 'Ilimitados'
      },
      {
        name: 'Metrónomo WebAudio Pro & Afinador Cromático',
        ensayo: true,
        local: true,
        de_gira: true,
        cabeza_de_cartel: true
      }
    ]
  },
  {
    title: 'Finanzas, Merchandising & Royalties',
    icon: Coins,
    items: [
      {
        name: 'Control de gastos, ingresos y márgenes de bolo',
        ensayo: false,
        local: false,
        de_gira: true,
        cabeza_de_cartel: true
      },
      {
        name: 'Generador de mockups de Merchandising con IA',
        ensayo: false,
        local: false,
        de_gira: '5 diseños/mes',
        cabeza_de_cartel: 'Ilimitados'
      },
      {
        name: 'Control de stock físico de merchan y tallas',
        ensayo: false,
        local: false,
        de_gira: false,
        cabeza_de_cartel: true
      },
      {
        name: 'Reparto automático de cachés y royalties entre miembros',
        ensayo: false,
        local: false,
        de_gira: false,
        cabeza_de_cartel: true
      }
    ]
  }
];

export const Planes: React.FC<PlanesProps> = ({ colors, onSelectPlan, onNavigateToModule }) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Gestión de Bandas y Proyectos': true,
    'Inteligencia Artificial y Agentes': true,
    'Booking de Salas, Medios y Grupos': true,
    'Tour Logistics & Carretera': true,
    'Contenido en Redes, Fans & EPK': false,
    'Finanzas, Merchandising & Royalties': false
  });
  const [showBanner, setShowBanner] = useState(true);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title]
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
      {/* 1. Top Trial Banner */}
      {showBanner && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-emerald-500/20 border border-amber-400/30 p-4 sm:p-5 text-zinc-100 shadow-lg shadow-black/40">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
                <Crown className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold text-zinc-100 flex items-center justify-center sm:justify-start gap-2">
                  <span>30 días gratis del plan De Gira. Sin tarjeta.</span>
                  <span className="hidden md:inline-flex px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-black uppercase font-mono tracking-wider">
                    Oferta de Lanzamiento
                  </span>
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Desbloquea el Booking IA ilimitado, Tour Manager y la suite completa durante un mes completo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>Probar Ahora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowBanner(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/60 transition-colors cursor-pointer"
                title="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Header & Toggle */}
      <div className="flex flex-col items-center text-center space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Suscripciones & Inversión de Banda</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-zinc-100 uppercase">
          Planes diseñados para <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">músicos independientes</span>
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 max-w-2xl leading-relaxed">
          Desde tus primeros ensayos hasta giras nacionales. Elige el ritmo de automatización y créditos de inteligencia artificial que tu proyecto necesita.
        </p>

        {/* Monthly / Annual Toggle Switch */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="inline-flex p-1.5 rounded-2xl bg-[#181716] border border-[#2c2a28] shadow-inner">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                billingPeriod === 'monthly'
                  ? 'bg-neutral-800 text-zinc-100 shadow-md border border-neutral-700'
                  : 'text-neutral-400 hover:text-zinc-200'
              }`}
            >
              Facturación Mensual
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('annual')}
              className={`relative px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                billingPeriod === 'annual'
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20 font-black'
                  : 'text-neutral-400 hover:text-zinc-200'
              }`}
            >
              <span>Facturación Anual</span>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-extrabold ${
                billingPeriod === 'annual'
                  ? 'bg-black text-amber-300'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}>
                -20% · 2 meses gratis
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Hardcoded Sample Credit Consumption Widget (Preview) */}
      <div className="p-4 rounded-2xl bg-[#141312] border border-[#262422] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                Tu Consumo de Créditos IA
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                Visualización de muestra
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Se recargan automáticamente al inicio de cada ciclo de facturación.
            </p>
          </div>
        </div>

        <div className="w-full md:w-80 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-amber-400 font-bold">340 / 800 créditos</span>
            <span className="text-neutral-400">42% consumido</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 shadow-sm shadow-amber-400/50"
              style={{ width: '42.5%' }}
            />
          </div>
        </div>
      </div>

      {/* 4. Pricing Cards Grid (4 Cards Row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch pt-2">
        {PLANS_DATA.map((plan) => {
          const isAnnual = billingPeriod === 'annual';
          const priceDisplay = isAnnual ? plan.annualPrice : plan.monthlyPrice;
          const periodSuffix = isAnnual ? '€ / año' : '€ / mes';

          const getBadgeStyle = (type: PlanCardData['badgeType']) => {
            switch (type) {
              case 'blue':
                return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
              case 'silver':
                return 'bg-slate-400/15 text-slate-300 border-slate-400/30';
              case 'gold':
                return 'bg-amber-400/20 text-amber-300 border-amber-400/50';
              case 'emerald':
                return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
            }
          };

          const getCtaStyle = (variant: PlanCardData['ctaVariant']) => {
            switch (variant) {
              case 'secondary':
                return 'bg-neutral-800 hover:bg-neutral-700 text-zinc-100 border border-neutral-700';
              case 'silver':
                return 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600';
              case 'gold':
                return 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:brightness-110 text-black font-black shadow-lg shadow-amber-500/20';
              case 'emerald':
                return 'bg-emerald-500 hover:bg-emerald-400 text-black font-black shadow-lg shadow-emerald-500/20';
            }
          };

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 ${
                plan.isPopular
                  ? 'bg-gradient-to-b from-[#1c1813] via-[#141210] to-[#0f0e0d] border-2 border-amber-400/80 shadow-2xl shadow-amber-500/10 lg:-translate-y-2.5 z-10'
                  : 'bg-[#141312] border border-[#262422] hover:border-neutral-700 shadow-xl'
              }`}
            >
              {/* Popular Floating Badge */}
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black text-[10px] font-black uppercase font-mono tracking-widest shadow-md">
                    <Star className="w-3 h-3 fill-black" />
                    <span>MÁS POPULAR</span>
                  </span>
                </div>
              )}

              {/* Card Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black font-display tracking-wider uppercase text-zinc-100">
                    {plan.name}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${getBadgeStyle(plan.badgeType)}`}>
                    {plan.badgeLabel}
                  </span>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed min-h-[36px]">
                  {plan.description}
                </p>

                {/* Price block */}
                <div className="pt-2 pb-1 border-y border-[#262422]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black font-display tracking-tight text-zinc-100">
                      {priceDisplay}
                    </span>
                    <span className="text-xs font-mono font-bold text-neutral-400 uppercase">
                      {periodSuffix}
                    </span>
                  </div>

                  {isAnnual && plan.annualPrice > 0 && (
                    <p className="text-[11px] font-mono text-emerald-400 mt-1">
                      Equivalente a {plan.annualEquivalentMonthly.toFixed(2).replace('.', ',')}€/mes (pago anual único)
                    </p>
                  )}
                  {isAnnual && plan.annualPrice === 0 && (
                    <p className="text-[11px] font-mono text-neutral-500 mt-1">
                      Para siempre sin coste
                    </p>
                  )}
                </div>

                {/* IA Credits Highlight Chip */}
                <div className={`p-3 rounded-2xl flex items-start gap-2.5 border ${
                  plan.isPopular
                    ? 'bg-amber-400/10 border-amber-400/30 text-amber-200'
                    : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
                }`}>
                  <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${plan.isPopular ? 'text-amber-400' : 'text-neutral-400'}`} />
                  <div className="flex flex-col">
                    <span className="text-xs font-mono font-black tracking-wide">
                      {plan.creditsLabel}
                    </span>
                    <span className="text-[10px] text-neutral-400 leading-tight">
                      {plan.creditsSub}
                    </span>
                  </div>
                </div>

                {/* 🎁 Welcome Gift: Physical Sticker Pack Badge / Mini-card */}
                {plan.stickerGift ? (
                  <div className={`p-3 rounded-2xl border transition-all relative overflow-hidden ${
                    plan.isPopular
                      ? 'bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/15 border-amber-400/50 shadow-md shadow-amber-500/10'
                      : plan.id === 'cabeza_de_cartel'
                      ? 'bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-emerald-500/15 border-emerald-400/50 shadow-md shadow-emerald-500/10'
                      : 'bg-gradient-to-r from-slate-500/20 via-neutral-800 to-slate-500/10 border-slate-400/30'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-xl shrink-0 ${
                        plan.isPopular
                          ? 'bg-amber-400 text-black shadow-sm'
                          : plan.id === 'cabeza_de_cartel'
                          ? 'bg-emerald-400 text-black shadow-sm'
                          : 'bg-slate-300 text-black'
                      }`}>
                        <Gift className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 flex-wrap mb-1">
                          <span className={`text-[10px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            plan.isPopular
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                              : plan.id === 'cabeza_de_cartel'
                              ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                              : 'bg-slate-400/20 text-slate-200 border border-slate-400/30'
                          }`}>
                            {plan.stickerGift.tag}
                          </span>
                          <span className="text-[9px] font-mono text-neutral-400 uppercase">Regalo Físico</span>
                        </div>
                        <p className="text-[11px] font-bold text-zinc-100 leading-snug">
                          🎁 {plan.stickerGift.qty}
                        </p>
                        <p className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                          {plan.stickerGift.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl border border-dashed border-neutral-800 bg-neutral-950/60 flex items-center justify-between gap-2 text-neutral-500">
                    <div className="flex items-center gap-2">
                      <Gift className="w-3.5 h-3.5 text-neutral-600" />
                      <span className="text-[10px] font-mono">Pack de pegatinas de bienvenida</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-neutral-600 uppercase">Solo planes de pago</span>
                  </div>
                )}

                {/* Feature List */}
                <div className="pt-2 space-y-2.5">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                    Incluido en el plan:
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs">
                        {feat.included ? (
                          <div className={`p-0.5 rounded-full mt-0.5 shrink-0 ${
                            plan.isPopular ? 'bg-amber-400 text-black' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          }`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="p-0.5 rounded-full mt-0.5 shrink-0 bg-neutral-900 text-neutral-600 border border-neutral-800">
                            <X className="w-3 h-3 stroke-[2]" />
                          </div>
                        )}
                        <span className={`leading-tight ${
                          feat.included
                            ? feat.highlight
                              ? 'text-zinc-100 font-bold'
                              : 'text-neutral-300'
                            : 'text-neutral-600 line-through'
                        }`}>
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-6 mt-4 border-t border-[#262422]">
                <button
                  type="button"
                  className={`w-full py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-98 flex items-center justify-center gap-2 ${getCtaStyle(
                    plan.ctaVariant
                  )}`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4.5. Bloque Explicativo del Regalo de Bienvenida: Pack de Pegatinas Físicas */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#1c1813] via-[#141210] to-[#0f0e0d] border-2 border-amber-500/40 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Text & Steps Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span>Regalo Exclusivo de Bienvenida</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display uppercase tracking-tight text-zinc-100">
                Tu primer merchan, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">invitamos nosotros</span>
              </h2>
              <p className="text-sm text-neutral-300 leading-relaxed max-w-xl">
                Al suscribirte a cualquier plan de pago (<span className="text-amber-300 font-bold">Local</span>, <span className="text-amber-300 font-bold">De Gira</span> o <span className="text-emerald-300 font-bold">Cabeza de Cartel</span>), te enviamos a casa un pack de pegatinas vinílicas troqueladas de alta resistencia para tu banda.
              </p>
            </div>

            {/* 3 Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#141312]/90 border border-amber-500/20 flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center justify-center font-mono font-black text-sm">
                  1
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Diseña</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Diseña tus pegatinas en el módulo Merchan (logo, portada de disco, QR a tu Instagram).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#141312]/90 border border-amber-500/20 flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center justify-center font-mono font-black text-sm">
                  2
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Imprimimos</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Nosotros las mandamos a imprimir en vinilo mate resistente a exteriores e instrumentos.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#141312]/90 border border-amber-500/20 flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center justify-center font-mono font-black text-sm">
                  3
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                  <Home className="w-3.5 h-3.5 text-amber-400" />
                  <span>Recibe</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Las recibes en casa, listas para repartir y pegar en tu próximo bolo o festival.
                </p>
              </div>
            </div>

            {/* Footnote */}
            <p className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5 pt-1">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>* Válido una vez por banda, con la primera suscripción de pago. Envío solo a España.</span>
            </p>
          </div>

          {/* Visual Sticker Mockup Column */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-sm aspect-square rounded-2xl bg-gradient-to-br from-[#181614] to-[#0c0b0a] border border-amber-500/30 p-6 flex flex-col items-center justify-center shadow-inner group">
              {/* Floating stickers visual composition */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                {/* Sticker 1: Logo Vinyl Die-cut */}
                <div className="absolute top-2 left-2 w-32 h-32 rounded-2xl bg-neutral-900 border-4 border-white shadow-2xl p-3 flex flex-col items-center justify-center transform -rotate-12 group-hover:-rotate-6 transition-transform duration-300 z-10">
                  <div className="w-12 h-12 rounded-xl bg-amber-400 text-black font-black flex items-center justify-center text-xl font-display mb-1 shadow-md">
                    BK
                  </div>
                  <span className="text-[10px] font-black font-display text-white uppercase tracking-wider">BAKANDEYA</span>
                  <span className="text-[8px] font-mono text-amber-400 font-bold">Rock Band Oficial</span>
                </div>

                {/* Sticker 2: Round QR Sticker */}
                <div className="absolute bottom-2 right-2 w-28 h-28 rounded-full bg-amber-400 text-black border-4 border-white shadow-2xl p-2.5 flex flex-col items-center justify-center transform rotate-12 group-hover:rotate-6 transition-transform duration-300 z-20">
                  <div className="w-10 h-10 bg-black p-1 rounded-md flex items-center justify-center mb-0.5">
                    <div className="w-full h-full bg-white rounded-xs flex items-center justify-center text-[7px] font-mono font-bold text-black">
                      QR
                    </div>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-tight text-center leading-tight">Escucha en Spotify</span>
                </div>

                {/* Sticker 3: Badge Tour */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-emerald-500 text-black border-2 border-white shadow-xl flex items-center gap-1.5 font-black text-[10px] uppercase font-mono tracking-wider transform -rotate-3 z-30">
                  <Gift className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Vinilo Troquelado</span>
                </div>
              </div>

              {/* Tag beneath mockup */}
              <div className="mt-4 flex items-center gap-2 text-xs font-mono text-amber-300/90 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Hasta 1.000 pegatinas de vinilo de alta calidad</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Complete Comparison Table */}
      <div className="pt-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-[#262422]">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-wider text-zinc-100">
              Tabla Comparativa de Módulos
            </h2>
            <p className="text-xs text-neutral-400">
              Desglose detallado de capacidades técnicas, límites y herramientas de BandManager.ai
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAllSections}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 cursor-pointer transition-colors"
            >
              Expandir todo
            </button>
            <button
              type="button"
              onClick={collapseAllSections}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 cursor-pointer transition-colors"
            >
              Colapsar todo
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-3xl border border-[#262422] bg-[#141312] overflow-hidden shadow-2xl">
          {/* Header Row on Desktop */}
          <div className="hidden lg:grid grid-cols-12 gap-4 p-4 bg-[#1a1918] border-b border-[#262422] text-xs font-mono font-bold uppercase text-neutral-400">
            <div className="col-span-4">Módulo / Funcionalidad</div>
            <div className="col-span-2 text-center text-sky-400">Ensayo (0€)</div>
            <div className="col-span-2 text-center text-slate-300">Local (12€/m)</div>
            <div className="col-span-2 text-center text-amber-300 font-black">De Gira (29€/m) ⭐</div>
            <div className="col-span-2 text-center text-emerald-400 font-black">Cabeza de Cartel (79€/m)</div>
          </div>

          {/* Sections Accordion */}
          <div className="divide-y divide-[#262422]">
            {COMPARISON_TABLE.map((section) => {
              const IconComp = section.icon;
              const isExpanded = expandedSections[section.title];

              return (
                <div key={section.title} className="transition-colors">
                  {/* Section Title Header */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between bg-[#171615] hover:bg-[#1c1b1a] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-sm sm:text-base font-bold font-display uppercase tracking-wider text-zinc-100">
                        {section.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono">
                      <span>{isExpanded ? 'Ocultar' : 'Ver detalles'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Section Content */}
                  {isExpanded && (
                    <div className="divide-y divide-[#222120]/60 bg-[#121110]">
                      {section.items.map((row, rIdx) => (
                        <div
                          key={rIdx}
                          className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 p-4 items-center hover:bg-[#181716]/80 transition-colors"
                        >
                          {/* Feature Name & Description */}
                          <div className="lg:col-span-4 space-y-0.5">
                            <p className="text-xs sm:text-sm font-semibold text-zinc-200">{row.name}</p>
                            {row.description && (
                              <p className="text-[11px] text-neutral-500">{row.description}</p>
                            )}
                          </div>

                          {/* Ensayo */}
                          <div className="lg:col-span-2 flex items-center justify-between lg:justify-center text-xs">
                            <span className="lg:hidden text-[10px] font-mono text-neutral-500">Ensayo:</span>
                            {typeof row.ensayo === 'boolean' ? (
                              row.ensayo ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <X className="w-4 h-4 text-neutral-600" />
                              )
                            ) : (
                              <span className="text-neutral-300 text-center font-mono">{row.ensayo}</span>
                            )}
                          </div>

                          {/* Local */}
                          <div className="lg:col-span-2 flex items-center justify-between lg:justify-center text-xs">
                            <span className="lg:hidden text-[10px] font-mono text-neutral-500">Local:</span>
                            {typeof row.local === 'boolean' ? (
                              row.local ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <X className="w-4 h-4 text-neutral-600" />
                              )
                            ) : (
                              <span className="text-neutral-300 text-center font-mono">{row.local}</span>
                            )}
                          </div>

                          {/* De Gira */}
                          <div className="lg:col-span-2 flex items-center justify-between lg:justify-center text-xs bg-amber-500/5 lg:bg-transparent p-2 lg:p-0 rounded-lg">
                            <span className="lg:hidden text-[10px] font-mono text-amber-400 font-bold">De Gira (⭐):</span>
                            {typeof row.de_gira === 'boolean' ? (
                              row.de_gira ? (
                                <div className="p-1 rounded-full bg-amber-400/20 text-amber-300">
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </div>
                              ) : (
                                <X className="w-4 h-4 text-neutral-600" />
                              )
                            ) : (
                              <span className="text-amber-300 text-center font-mono font-bold">{row.de_gira}</span>
                            )}
                          </div>

                          {/* Cabeza de Cartel */}
                          <div className="lg:col-span-2 flex items-center justify-between lg:justify-center text-xs">
                            <span className="lg:hidden text-[10px] font-mono text-emerald-400 font-bold">Cabeza de Cartel:</span>
                            {typeof row.cabeza_de_cartel === 'boolean' ? (
                              row.cabeza_de_cartel ? (
                                <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </div>
                              ) : (
                                <X className="w-4 h-4 text-neutral-600" />
                              )
                            ) : (
                              <span className="text-emerald-300 text-center font-mono font-bold">{row.cabeza_de_cartel}</span>
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

      {/* 6. Bottom Notice / Guarantees */}
      <div className="p-6 rounded-3xl bg-[#141312] border border-[#262422] flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left shadow-lg">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-zinc-100">
              Tus datos son siempre tuyos
            </h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              Puedes exportar tus salas, canciones, repertorios y fans en cualquier momento, incluso en el plan gratuito. Sin permanencia ni letra pequeña.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono font-bold text-neutral-300 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <DownloadCloud className="w-4 h-4 text-amber-400" />
            <span>Exportación Libre</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default Planes;
