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
  Info
} from 'lucide-react';
import { ThemeColors } from '../types';
import { CheckoutButton } from './CheckoutButton';

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
    features: [
      { text: '20 créditos IA / mes', included: true },
      { text: '10 salas', included: true },
      { text: 'Calendario', included: true },
      { text: 'Repertorio', included: true },
      { text: 'EPK básico', included: true },
      { text: 'Exportar a CSV', included: true },
      { text: 'Medios y prensa musical', included: false },
      { text: 'Captación de fans con QR', included: false },
      { text: 'Agente Mánager IA', included: false }
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
      qty: '50 pegatinas de tu banda gratis',
      description: 'Pack de pegatinas de vinilo gratis con tu suscripción',
      tag: '50 uds gratis'
    },
    features: [
      { text: '150 créditos IA / mes', included: true },
      { text: '50 salas', included: true },
      { text: '20 medios', included: true },
      { text: '100 fans', included: true },
      { text: 'EPK completo', included: true },
      { text: '5 clips Reels/mes', included: true, highlight: true },
      { text: 'Soporte por email', included: true },
      { text: 'Tour Manager & Rutas', included: false },
      { text: 'Agente Mánager en batch', included: false }
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
      qty: '100 pegatinas de tu banda gratis',
      description: 'Pack de pegatinas de vinilo gratis con tu suscripción',
      tag: '100 uds gratis'
    },
    features: [
      { text: '800 créditos IA / mes', included: true, highlight: true },
      { text: 'Salas y medios ilimitados', included: true, highlight: true },
      { text: 'Fans ilimitados', included: true },
      { text: 'Tour Manager', included: true, highlight: true },
      { text: '30 clips Reels/mes', included: true },
      { text: 'Agente Mánager en batch', included: true, highlight: true },
      { text: 'Finanzas', included: true },
      { text: 'Diseño de merchan (5/mes)', included: true },
      { text: 'Grupos y Agencias', included: true }
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
      qty: '200 pegatinas + entrega prioritaria',
      description: 'Pack de pegatinas de vinilo con envío express gratis',
      tag: '200 uds + Envío Express'
    },
    features: [
      { text: '2.500 créditos IA / mes', included: true, highlight: true },
      { text: 'Todo ilimitado', included: true, highlight: true },
      { text: 'Agente Mánager autónomo multi-agente', included: true, highlight: true },
      { text: 'Royalties y reparto', included: true },
      { text: 'Stock de merchandising', included: true },
      { text: 'Dominio propio', included: true },
      { text: 'Usar tu propia API key', included: true, highlight: true },
      { text: 'Soporte VIP', included: true }
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
        name: 'Proyectos simultáneos',
        ensayo: '1 proyecto',
        local: '1 proyecto',
        de_gira: '1 proyecto (ampliable)',
        cabeza_de_cartel: 'Hasta 5 proyectos'
      },
      {
        name: 'Exportación de datos (CSV / PDF)',
        ensayo: 'CSV básico',
        local: 'CSV y PDF',
        de_gira: 'Completa sin límites',
        cabeza_de_cartel: 'Backups automáticos + Todo'
      },
      {
        name: 'Dominio propio personalizado',
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
        name: 'Redacción de pitches de booking',
        ensayo: 'Básico (manual)',
        local: 'IA Avanzada',
        de_gira: 'IA Adaptada al género',
        cabeza_de_cartel: 'IA Ultracontextual multi-estilo'
      },
      {
        name: 'Agente Mánager (Chatbot Inteligente)',
        ensayo: false,
        local: 'Consultas básicas',
        de_gira: 'Acciones en batch',
        cabeza_de_cartel: 'Autónomo multi-agente'
      },
      {
        name: 'Usar tu propia API Key',
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
        name: 'Base de salas de conciertos',
        ensayo: '10 salas',
        local: '50 salas',
        de_gira: 'Ilimitadas',
        cabeza_de_cartel: 'Ilimitadas'
      },
      {
        name: 'Medios de prensa y radios',
        ensayo: false,
        local: '20 medios',
        de_gira: 'Ilimitados',
        cabeza_de_cartel: 'Ilimitados'
      },
      {
        name: 'Grupos y Agencias aliadas',
        ensayo: false,
        local: false,
        de_gira: true,
        cabeza_de_cartel: true
      }
    ]
  },
  {
    title: 'Tour Logistics & Carretera',
    icon: Truck,
    items: [
      {
        name: 'Calendario unificado',
        ensayo: true,
        local: true,
        de_gira: true,
        cabeza_de_cartel: true
      },
      {
        name: 'Tour Manager & Rutas',
        ensayo: false,
        local: false,
        de_gira: true,
        cabeza_de_cartel: true
      },
      {
        name: 'Cálculo de kilometraje y dietas',
        ensayo: false,
        local: false,
        de_gira: true,
        cabeza_de_cartel: true
      }
    ]
  },
  {
    title: 'Contenido en Redes, Fans & EPK',
    icon: Video,
    items: [
      {
        name: 'Dossier EPK interactivo',
        ensayo: 'Básico',
        local: 'Completo',
        de_gira: 'Pro con reproductor',
        cabeza_de_cartel: 'Pro sin marca de agua'
      },
      {
        name: 'Captación de fans mediante QR',
        ensayo: false,
        local: '100 fans',
        de_gira: 'Ilimitados',
        cabeza_de_cartel: 'Ilimitados + Segmentación'
      },
      {
        name: 'Clips Reels/mes con IA',
        ensayo: false,
        local: '5 clips/mes',
        de_gira: '30 clips/mes',
        cabeza_de_cartel: 'Ilimitados'
      }
    ]
  },
  {
    title: 'Finanzas, Merchandising & Royalties',
    icon: Coins,
    items: [
      {
        name: 'Control de finanzas y bolos',
        ensayo: false,
        local: false,
        de_gira: true,
        cabeza_de_cartel: true
      },
      {
        name: 'Diseño de merchandising (IA)',
        ensayo: false,
        local: false,
        de_gira: '5 diseños/mes',
        cabeza_de_cartel: 'Ilimitados'
      },
      {
        name: 'Stock de merchandising',
        ensayo: false,
        local: false,
        de_gira: false,
        cabeza_de_cartel: true
      },
      {
        name: 'Royalties y reparto de cachés',
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
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
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

  const handleSubscribe = async (planId: string) => {
    if (planId === 'ensayo') {
      if (onSelectPlan) onSelectPlan(planId);
      return;
    }
    try {
      setLoadingPlan(planId);
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingInterval: billingPeriod,
          userEmail: 'diego.delacalleb@gmail.com'
        })
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Error al iniciar la pasarela de pago con Stripe');
      }
    } catch (err: any) {
      alert('Error de red al conectar con Stripe: ' + err.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 font-sans">
      {/* 1. Banner superior */}
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

      {/* 2. Header & Toggle Mensual / Anual */}
      <div className="flex flex-col items-center text-center space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Planes & Suscripciones</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-zinc-100 uppercase">
          Planes diseñados para <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">músicos independientes</span>
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 max-w-2xl leading-relaxed">
          Desde tus primeros ensayos hasta giras nacionales. Elige el ritmo de automatización y créditos de inteligencia artificial que tu proyecto necesita.
        </p>

        {/* Toggle Mensual / Anual con badge "-20% · 2 meses gratis" */}
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
              Mensual
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
              <span>Anual</span>
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

      {/* 3. 4 Cards en fila (apiladas en móvil) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch pt-2">
        {PLANS_DATA.map((plan) => {
          const isAnnual = billingPeriod === 'annual';
          const priceDisplay = isAnnual ? plan.annualPrice : plan.monthlyPrice;
          const periodSuffix = isAnnual ? '€/año' : '€/mes';

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
                      Equivalente a {plan.annualEquivalentMonthly.toFixed(2).replace('.', ',')}€/mes
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

                {/* 🎁 Sticker Gift */}
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
                          <span className="text-[9px] font-mono text-neutral-400 uppercase">Regalo</span>
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
                    <span className="text-[10px] font-mono font-bold text-neutral-600 uppercase">Solo pago</span>
                  </div>
                )}

                {/* Feature List */}
                <div className="pt-2 space-y-2.5">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                    Características:
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
                <CheckoutButton
                  planId={plan.id}
                  billingInterval={billingPeriod}
                  className={`text-xs uppercase tracking-wider ${getCtaStyle(plan.ctaVariant)}`}
                >
                  <span>{plan.ctaText}</span>
                </CheckoutButton>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Complete Comparison Table */}
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
                          <div className="lg:col-span-4 space-y-0.5">
                            <p className="text-xs sm:text-sm font-semibold text-zinc-200">{row.name}</p>
                            {row.description && (
                              <p className="text-[11px] text-neutral-500">{row.description}</p>
                            )}
                          </div>

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
    </div>
  );
};
export default Planes;
