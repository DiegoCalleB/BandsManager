import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Lead, LeadStatus, Rehearsal, Concert, SocialPost, Payment, Message, ThemeName, ThemeColors, SocialMetric, User, Fan, BookingCampaign } from './types';
import { THEMES } from './utils/theme';
import { useAuth } from './hooks/useAuth';
import { useAppData } from './hooks/useAppData';
import { api } from './services/api';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
// Vistas grandes cargadas bajo demanda: sin esto, visitar /unete o abrir cualquier pestaña
// metía en el mismo bundle inicial el CRM, calendario, reels, repertorio, etc. — un fan que
// solo quiere donar por Revolut/PayPal pagaba el peso entero de todo el panel interno.
const BookingCRM = lazy(() => import('./components/BookingCRM'));
const BandCRM = lazy(() => import('./components/BandCRM'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const ReelsCenter = lazy(() => import('./components/ReelsCenter'));
const Finanzas = lazy(() => import('./components/Finanzas'));
const TourManager = lazy(() => import('./components/TourManager'));
const RepertorioSetlists = lazy(() => import('./components/RepertorioSetlists'));
const Merchan = lazy(() => import('./components/Merchan'));
const Chatbot = lazy(() => import('./components/Chatbot'));
const EPKManager = lazy(() => import('./components/EPKManager'));
const FansPanel = lazy(() => import('./components/FansPanel'));
const FansLanding = lazy(() => import('./components/FansLanding'));
const PublicMusiciansLanding = lazy(() => import('./components/PublicMusiciansLanding').then(m => ({ default: m.PublicMusiciansLanding })));
const PublicEPK = lazy(() => import('./components/PublicEPK').then(m => ({ default: m.PublicEPK })));
const Planes = lazy(() => import('./components/Planes'));
import { LoginModal } from './components/LoginModal';
import { SimplePromoLoginModal } from './components/SimplePromoLoginModal';
import { UserManagementModal } from './components/UserManagementModal';
import { UserProfileModal } from './components/UserProfileModal';
import { FontSelectorModal } from './components/FontSelectorModal';
import { MetronomeModal } from './components/MetronomeModal';
import { TunerModal } from './components/TunerModal';
import { BandSwitcherModal } from './components/BandSwitcherModal';
import { PlanLimitModal } from './components/PlanLimitModal';
import { GlobalCampaignBar } from './components/campaign/GlobalCampaignBar';
import { CampaignManagerModal } from './components/campaign/CampaignManagerModal';
import { FontPresetKey, applyFontPreset, getStoredFontPreset } from './utils/typography';
import { hasModuleAccess, getPlanDefinition, checkRecordLimit, normalizePlan, getRequiredPlanForModule } from './utils/planPermissions';
import { NAV_ITEMS, NAV_GROUPS, NAV_GROUPS_DESKTOP, NAV_GROUPS_MOBILE, NAV_PINNED_TOP_IDS, NAV_PINNED_BOTTOM_IDS, FLAT_NAV_ORDER_IDS, TOP_TABS_ORDER_IDS, MIN_MODULES_FOR_GROUPED_NAV, findNavGroupIdForItem, NavItemId } from './config/navGroups';
import { NavGroupSection } from './components/common/NavGroupSection';
import { NavItemButton } from './components/common/NavItemButton';
import { useLanguage } from './context/LanguageContext';
import {
  Menu, Music, Sparkles, LogOut, ShieldAlert, Shield, UserCheck,
  FileCheck, CheckSquare, MessageSquareCode, RefreshCw,
  Settings, X, Bot, Guitar, Flame, Type, Heart, ChevronDown, Lock, Zap, Target
} from 'lucide-react';

export default function App() {
  const { t } = useLanguage();

  // Authentication Custom Hook
  const {
    currentUser,
    authToken,
    isLoggedIn,
    isAdmin,
    availableBands,
    setCurrentUser,
    refreshSession,
    handleLoginSuccess,
    handleSwitchBand,
    handleSetMainBand,
    handleLogout
  } = useAuth();

  // Application Data & Sync Custom Hook
  const {
    leads,
    rehearsals,
    tours,
    concerts,
    posts,
    payments,
    messages,
    metrics,
    bandUsers,
    fans,
    epkConfig,
    campaigns,
    activeCampaign,
    isLoading,
    syncStatus,
    fetchState,
    handleSaveCampaign,
    handleDeleteCampaign,
    handleSetActiveCampaign,
    handleUpdateEpkConfig,
    handleUpdateLead,
    handleUpdateRehearsal,
    handleUpdateConcert,
    handleDeleteRehearsal,
    handleDeleteConcert,
    handleAddLead,
    handleDeleteLead,
    handleBulkDeleteLeads,
    handleDeleteBand,
    handleAddRehearsal,
    handleAddConcert,
    handleAddPost,
    handleUpdatePost,
    handleAddMetric,
    handleUpdateMetric,
    handleDeleteMetric,
    handleAddPayment,
    handleUpdatePayment,
    handleSaveTour,
    handleDeleteTour,
    handleAddFan,
    handleUpdateFan,
    handleDeleteFan,
    handleUpdateIncentive
  } = useAppData(isLoggedIn, currentUser?.band_id);

  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  // Antes, sin banda activa (cuenta nueva sin banda asignada todavía, o un estado transitorio),
  // se caía en 'band-bakandeya' en silencio y la app operaba -en lectura y escritura- sobre los
  // datos reales de esa banda. Sin id de banda, cleanActiveBandId queda vacío (no coincide con
  // 'bakandeya') y el resto de componentes deben tratarlo como "sin banda seleccionada".
  const currentActiveBandId = currentUser?.band_id || '';
  const cleanActiveBandId = currentActiveBandId.replace(/^(band|reg)-/, '');
  const currentActiveBandName = currentUser?.bandName || currentUser?.name || 'Mi Banda';
  const currentActiveBandLogo = (epkConfig?.logoUrl && epkConfig.logoUrl.trim().length > 0)
    ? epkConfig.logoUrl
    : ((currentUser as any)?.logoUrl || (currentUser as any)?.logo_url || (currentUser as any)?.imagen_url ||
       (cleanActiveBandId === 'bakandeya' ? '/logo_bakandeya_bueno_sin_fondo.png' : ''));

  const isSameBand = (id1?: string, id2?: string, name1?: string, name2?: string) => {
    if (name1 && name2 && name1.trim().toLowerCase() === name2.trim().toLowerCase()) {
      return true;
    }
    if (!id1 && !id2) return true;
    if (!id1 || !id2) return false;
    if (id1 === id2) return true;
    const clean1 = id1.replace(/^(band|reg)-/, "").replace(/-\d+$/, "").trim().toLowerCase();
    const clean2 = id2.replace(/^(band|reg)-/, "").replace(/-\d+$/, "").trim().toLowerCase();
    if (clean1 === clean2) return true;
    if (clean1 && clean2 && (clean1.includes(clean2) || clean2.includes(clean1))) return true;
    return false;
  };

  const currentActiveBandPlan = React.useMemo(() => {
    if (normalizePlan(currentUser?.plan) === 'promo') {
      return 'promo';
    }
    if (availableBands && Array.isArray(availableBands) && availableBands.length > 0) {
      const match = availableBands.find((b: any) =>
        isSameBand(b.band_id || b.id, currentActiveBandId, b.bandName || b.nombre_banda || b.name, currentActiveBandName)
      );
      if (match && match.plan) {
        return normalizePlan(match.plan);
      }
    }
    return normalizePlan(currentUser?.plan || 'promo');
  }, [availableBands, currentActiveBandId, currentActiveBandName, currentUser?.plan]);

  // Plan Promo (fase beta, festivales): a diferencia del resto de planes, que enseñan los
  // módulos no incluidos con un candado "Plan" (invitando a mejorar), Promo no debe ni
  // enseñar que esos módulos existen — así que el nav los oculta del todo en vez de bloquearlos.
  const isPromoPlan = currentActiveBandPlan === 'promo';

  // Soft Limit Modal State
  const [planLimitModal, setPlanLimitModal] = useState<{
    isOpen: boolean;
    resourceType: 'leads' | 'medios' | 'fans' | 'songs' | 'bands';
    currentCount: number;
  }>({
    isOpen: false,
    resourceType: 'leads',
    currentCount: 0
  });

  // Guarded Handlers respecting Band Contracted Plan Limits
  const handleAddLeadWithLimitCheck = async (newLead: Lead) => {
    const isMedio = newLead.tipo === 'medio' || String(newLead.tipo || '').toLowerCase().includes('prensa') || String(newLead.tipo || '').toLowerCase().includes('radio');
    const currentCount = isMedio
      ? leads.filter(l => String(l.tipo || '').toLowerCase().includes('medio') || String(l.tipo || '').toLowerCase().includes('radio') || String(l.tipo || '').toLowerCase().includes('prensa')).length
      : leads.filter(l => !String(l.tipo || '').toLowerCase().includes('medio') && !String(l.tipo || '').toLowerCase().includes('radio') && !String(l.tipo || '').toLowerCase().includes('prensa')).length;

    const limitCheck = checkRecordLimit(currentActiveBandPlan, isMedio ? 'medios' : 'leads', currentCount);
    if (!limitCheck.allowed) {
      setPlanLimitModal({
        isOpen: true,
        resourceType: isMedio ? 'medios' : 'leads',
        currentCount
      });
      return;
    }
    return handleAddLead(newLead);
  };

  const handleAddFanWithLimitCheck = async (fanData: any) => {
    const currentCount = fans.length;
    const limitCheck = checkRecordLimit(currentActiveBandPlan, 'fans', currentCount);
    if (!limitCheck.allowed) {
      setPlanLimitModal({
        isOpen: true,
        resourceType: 'fans',
        currentCount
      });
      return;
    }
    return handleAddFan(fanData);
  };

  // Active View State mapping directly to the Stitch Design doc
  type MainView = 'resumen' | 'booking' | 'medios' | 'bandas' | 'calendario' | 'reels' | 'repertorio' | 'catalogo' | 'discografia' | 'directo' | 'finanzas' | 'chat' | 'giras' | 'merchan' | 'epk' | 'fans' | 'planes';
  const VALID_VIEWS: MainView[] = ['resumen', 'booking', 'medios', 'bandas', 'calendario', 'reels', 'repertorio', 'catalogo', 'discografia', 'directo', 'finanzas', 'chat', 'giras', 'merchan', 'epk', 'fans', 'planes'];
  const CURRENT_VIEW_STORAGE_KEY = 'bandmanager_current_view';
  const [currentView, setCurrentView] = useState<MainView>(() => {
    // Recordar la última pantalla entre recargas (F5): sin esto, cualquier refresh (incluido el
    // que hace un deploy nuevo, o simplemente el usuario comprobando algo) manda siempre de
    // vuelta a "Resumen" perdiendo dónde estaba trabajando.
    try {
      const saved = localStorage.getItem(CURRENT_VIEW_STORAGE_KEY);
      if (saved && (VALID_VIEWS as string[]).includes(saved)) return saved as MainView;
    } catch {
      // localStorage puede no estar disponible (modo privado estricto, etc.) — no es crítico.
    }
    return 'resumen';
  });

  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_VIEW_STORAGE_KEY, currentView);
    } catch {
      // Ignorado a propósito: perder la persistencia de la vista no debe romper la navegación.
    }
  }, [currentView]);
  const [bookingOptions, setBookingOptions] = useState<{
    sectionTab?: 'salas' | 'medios';
    statusFilter?: LeadStatus | 'todos';
    selectedLeadId?: string;
    selectedEventId?: string;
    selectedDate?: string;
    concertId?: string;
  }>({});

  const handleNavigate = (
    view: 'resumen' | 'booking' | 'medios' | 'bandas' | 'calendario' | 'reels' | 'repertorio' | 'catalogo' | 'discografia' | 'directo' | 'finanzas' | 'chat' | 'giras' | 'merchan' | 'epk' | 'fans' | 'planes' | 'metronome' | 'tuner',
    options?: {
      sectionTab?: 'salas' | 'medios';
      statusFilter?: LeadStatus | 'todos';
      selectedLeadId?: string;
      selectedEventId?: string;
      selectedDate?: string;
      concertId?: string;
    }
  ) => {
    // Herramientas (metronome/tuner): abren modal sin cambiar vista
    if (view === 'metronome') {
      setShowMetronomeModal(true);
      setIsMobileMenuOpen(false);
      return;
    }
    if (view === 'tuner') {
      setShowTunerModal(true);
      setIsMobileMenuOpen(false);
      return;
    }

    // Antes, si el plan no incluía el módulo, el código igualmente navegaba a `view` salvo para
    // 'finanzas' (el único caso con un `return` real): el control de acceso por plan no bloqueaba
    // nada en el resto de módulos. Y en finanzas, el bloqueo dependía de `isAdmin`, no del plan
    // contratado, así que un admin con un plan que no incluye finanzas entraba igualmente.
    if (view === 'finanzas' && !isAdmin) {
      setShowUserProfileModal(true);
      return;
    }
    if (!hasModuleAccess(currentActiveBandPlan, view)) {
      setShowUserProfileModal(true);
      return;
    }
    setCurrentView(view);
    setIsMobileMenuOpen(false);
    const targetGroupId = findNavGroupIdForItem(view);
    if (targetGroupId) {
      setOpenNavGroupIds(prev => (prev[targetGroupId] ? prev : { ...prev, [targetGroupId]: true }));
    }
    if (options) {
      setBookingOptions(options);
    } else if (view === 'medios') {
      setBookingOptions({ sectionTab: 'medios', statusFilter: 'todos' });
    } else if (view === 'booking') {
      setBookingOptions({ sectionTab: 'salas', statusFilter: 'todos' });
    } else {
      setBookingOptions({});
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const handleChatLoadingChange = useCallback((loading: boolean) => {
    setTimeout(() => {
      setIsChatLoading(loading);
    }, 0);
  }, []);
  const [showMetronomeModal, setShowMetronomeModal] = useState(false);
  const [showTunerModal, setShowTunerModal] = useState(false);
  const [showBandSwitcherModal, setShowBandSwitcherModal] = useState(false);

  // Redirect non-admins away from finanzas if they end up there
  useEffect(() => {
    if (!isAdmin && (currentView as string) === 'finanzas') {
      setCurrentView('resumen');
    }
  }, [isAdmin, currentView]);

  // Active Theme State
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('bakandeya_theme') as ThemeName;
    if (!saved || saved === ('stitch_light' as any) || !(saved in THEMES)) {
      return 'indie_velvet';
    }
    return saved;
  });

  // Active Font State
  const [currentFont, setCurrentFont] = useState<FontPresetKey>(getStoredFontPreset);
  const [showFontModal, setShowFontModal] = useState(false);

  useEffect(() => {
    applyFontPreset(currentFont);
  }, [currentFont]);

  const handleFontChange = (newFont: FontPresetKey) => {
    setCurrentFont(newFont);
    applyFontPreset(newFont);
  };

  // Handle Stripe Payment Redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const planParam = urlParams.get('plan');
    const bandParam = urlParams.get('band');
    const sessionParam = urlParams.get('session_id');

    if (paymentStatus === 'success') {
      const planName = planParam ? planParam.toUpperCase().replace('_', ' ') : 'PRO';

      // Clean URL params immediately
      window.history.replaceState({}, document.title, window.location.pathname);

      // Confirm to backend and update Supabase & memory state
      const targetBand = bandParam || currentUser?.band_id;

      // El plan lo decide Stripe, no esta URL: le pasamos el id de la sesión de Checkout para
      // que el servidor lo verifique. Sin él no hay nada que confirmar y basta con refrescar,
      // que el webhook de Stripe ya habrá hecho (o hará) el alta.
      if (sessionParam) {
        api.confirmPaymentSuccess({
          sessionId: sessionParam,
          bandId: targetBand
        }).then(() => {
          refreshSession();
          fetchState();
        }).catch((err) => {
          console.warn('Error confirming payment with backend:', err);
          refreshSession();
          fetchState();
        });
        // El plan del usuario ya no se escribe aquí desde el `?plan=` de la URL: eso desbloqueaba
        // en local la interfaz del plan de pago con solo visitar la dirección. Lo trae
        // `refreshSession()` del servidor, que es quien sabe qué se ha pagado.
      } else {
        refreshSession();
        fetchState();
      }

      alert(`🎉 ¡Suscripción completada con éxito! Tu banda ahora cuenta con el Plan ${planName} activado.`);
    } else if (paymentStatus === 'cancelled') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const colors: ThemeColors = THEMES[currentTheme] || THEMES.indie_velvet;

  // Persist Theme Selection
  const handleThemeChange = (theme: ThemeName) => {
    setCurrentTheme(theme);
    localStorage.setItem('bakandeya_theme', theme);
  };

  const activeBandConcerts = React.useMemo(() => {
    return concerts.filter(c => {
      if (!c.band_id && !c.bandName) return isSameBand(currentActiveBandId, "band-bakandeya", "", currentActiveBandName);
      return isSameBand(c.band_id, currentActiveBandId, c.bandName, currentActiveBandName);
    });
  }, [concerts, currentActiveBandId, currentActiveBandName]);

  const activeBandRehearsals = React.useMemo(() => {
    return rehearsals.filter(r => {
      if (!r.band_id && !r.bandName) return isSameBand(currentActiveBandId, "band-bakandeya", "", currentActiveBandName);
      return isSameBand(r.band_id, currentActiveBandId, r.bandName, currentActiveBandName);
    });
  }, [rehearsals, currentActiveBandId, currentActiveBandName]);

  // Badges del menú de navegación (booking/medios/calendario), calculados una sola vez
  // y reutilizados por la barra de tabs móvil, el drawer y el <aside> de escritorio —
  // antes cada uno recalculaba esto por su cuenta con su propia copia de isMedio/isBanda.
  const navBadges = React.useMemo(() => {
    const isMedio = (l: Lead) => {
      if (!l.tipo) return false;
      const s = String(l.tipo).trim().toLowerCase();
      return s.includes('medio') || s.includes('radio') || s.includes('prensa') || s.includes('tv') || s.includes('podc');
    };
    const isBanda = (l: Lead) => {
      if (!l.tipo) return false;
      const s = String(l.tipo).trim().toLowerCase();
      return s === 'grupo' || s.includes('grup') || s.includes('banda') || s.includes('artist') || s.includes('musico') || s.includes('músico');
    };
    const totalEvents = concerts.length + rehearsals.length;
    const activeEvents = activeBandConcerts.length + activeBandRehearsals.length;
    return {
      booking: leads.filter(l => !isMedio(l) && !isBanda(l)).length,
      medios: leads.filter(l => isMedio(l)).length,
      calendario: totalEvents === 0 ? 0 : `${activeEvents}/${totalEvents}`,
    } as Record<string, number | string>;
  }, [leads, concerts, rehearsals, activeBandConcerts, activeBandRehearsals]);

  // Vista agrupada del menú (secciones colapsables) solo para planes con menú largo;
  // `promo` (4 módulos) ya es corto de por sí y se queda con la lista plana de siempre.
  const shouldGroupNav = getPlanDefinition(currentActiveBandPlan).allowedModules.length > MIN_MODULES_FOR_GROUPED_NAV;

  const [openNavGroupIds, setOpenNavGroupIds] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('bm_nav_open_groups');
      if (stored) return JSON.parse(stored);
    } catch { /* localStorage no disponible o corrupto: se ignora */ }
    const initialGroupId = findNavGroupIdForItem('resumen');
    return initialGroupId ? { [initialGroupId]: true } : {};
  });

  useEffect(() => {
    try {
      localStorage.setItem('bm_nav_open_groups', JSON.stringify(openNavGroupIds));
    } catch { /* localStorage no disponible: el toggle sigue funcionando en memoria */ }
  }, [openNavGroupIds]);

  const toggleNavGroup = (groupId: string) => {
    setOpenNavGroupIds(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Public Landing Routes
  const isFanRoute = React.useMemo(() => {
    const p = window.location.pathname.toLowerCase();
    return p.startsWith('/fans') || p.startsWith('/unete') || p.startsWith('/directo') || p.startsWith('/fan');
  }, []);

  const isMusicianRoute = React.useMemo(() => {
    const p = window.location.pathname.toLowerCase();
    return p.startsWith('/musicos') || p.startsWith('/landing-musicos') || p.startsWith('/musicians') || p.startsWith('/artistas') || p.startsWith('/waitlist') || p.startsWith('/bandas-registro');
  }, []);

  const isEpkRoute = React.useMemo(() => {
    const p = window.location.pathname.toLowerCase();
    return p.startsWith('/epk') || p.startsWith('/dossier') || p.startsWith('/press');
  }, []);

  if (isMusicianRoute) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#0d0c0c] flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-[#f2ca50]" /></div>}>
        <PublicMusiciansLanding />
      </Suspense>
    );
  }

  if (isEpkRoute) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#121111] flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-[#f2ca50]" /></div>}>
        <PublicEPK />
      </Suspense>
    );
  }

  if (isFanRoute) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#121111] flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-[#f2ca50]" /></div>}>
        <FansLanding
          currentBandId={currentActiveBandId}
          currentBandName={currentActiveBandName}
          currentBandLogo={currentActiveBandLogo}
        />
      </Suspense>
    );
  }

 // Auth Screen Render
 // Fase beta: ventana de acceso simplificada (login + alta directa en plan Promo, sin
 // selector de planes) para los primeros usuarios (bandas del festival Buskers). El
 // LoginModal completo (con la parrilla de 4 planes) se conserva intacto para cuando se
 // quiera reabrir el registro público con todos los planes — basta con volver a poner
 // esta constante a false.
 const USE_SIMPLE_LOGIN = true;
 if (!isLoggedIn) {
 return USE_SIMPLE_LOGIN ? (
 <SimplePromoLoginModal onLoginSuccess={handleLoginSuccess} />
 ) : (
 <LoginModal
 onLoginSuccess={handleLoginSuccess}
 isStitchLight={false}
 />
 );
 }

 return (
 <div 
 className={`min-h-screen ${colors.bg} flex flex-col md:flex-row transition-colors duration-500 font-sans w-full max-w-[100vw] overflow-clip`}
 >
 {/* LEFT SIDEBAR */}
 {/* MOBILE TOP BAR */}
 <header className="md:hidden flex flex-col bg-[#121110] border-b border-[#22211F] sticky top-0 z-30 shrink-0 shadow-md">
 {/* Top Brand & Menu Row */}
 <div className="flex items-center justify-between px-4 pt-3 pb-2">
 <div 
  onClick={() => setShowBandSwitcherModal(true)}
  className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-all p-1 -ml-1 rounded-xl hover:bg-neutral-900/60"
  title="Toca para cambiar de banda (Estilo Netflix)"
 >
  <div className="relative shrink-0">
   {currentActiveBandLogo ? (
    <img 
     src={currentActiveBandLogo} 
     alt="Logo" 
     className="w-12 h-12 sm:w-14 sm:h-14 object-contain p-1 bg-neutral-950/90 rounded-xl border border-amber-500/50 shadow-md shrink-0 group-hover:border-amber-400"
     referrerPolicy="no-referrer"
    />
   ) : (
    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
     {currentActiveBandName[0]?.toUpperCase() || 'B'}
    </div>
   )}

  </div>

  <div className="flex flex-col">
   <div className="flex items-center gap-1.5">
    <h1 className={`font-bold font-display tracking-wider uppercase text-zinc-100 group-hover:text-amber-400 transition-colors leading-none truncate max-w-[150px] sm:max-w-[200px] notranslate ${currentActiveBandName.length > 20 ? 'text-xs' : 'text-xs sm:text-sm'}`} translate="no">
     {currentActiveBandName}
    </h1>
    <ChevronDown className="w-3.5 h-3.5 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${syncStatus === 'synced' ? 'bg-emerald-400/20' : syncStatus === 'error' ? 'bg-rose-500' : 'bg-zinc-400 animate-pulse'}`} />
   </div>
   <button
    type="button"
    onClick={(e) => { e.stopPropagation(); setShowUserProfileModal(true); }}
    className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-0.5 rounded-full text-[8.5px] font-mono font-extrabold uppercase tracking-wider bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 w-fit cursor-pointer transition-all hover:scale-105"
    title="Plan actual. Clic para gestionar suscripción (Upgrade / Downgrade)"
   >
    <Sparkles className="w-2 h-2 text-amber-400" />
    <span>{getPlanDefinition(currentActiveBandPlan).name}</span>
   </button>
  </div>
 </div>
 <div className="flex items-center gap-2">
  {!isPromoPlan && (
  <button
   onClick={() => setShowCampaignModal(true)}
   className={`px-2 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
     activeCampaign
       ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-xs'
       : 'bg-[#1A1918] text-neutral-400 border-[#22211F] hover:text-white'
   }`}
   title="Gestionar Campañas de Booking"
  >
   <Target className="w-3.5 h-3.5 text-purple-400" />
   <span className="text-[10px] hidden xs:inline font-mono">{activeCampaign ? 'Campaña' : 'Campañas'}</span>
  </button>
  )}
  <button
  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
  className="p-2 text-neutral-300 hover:text-white rounded-lg bg-[#1A1918] border-[#22211F] cursor-pointer active:scale-95 transition-all"
  aria-label="Menu"
  >
  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
  </button>
 </div>
 </div>

 {/* Horizontal Quick Tabs Bar */}
 <div className="flex items-center gap-1.5 px-3 pb-2.5 overflow-x-auto no-scrollbar scroll-smooth">
 {TOP_TABS_ORDER_IDS
 .map((id) => NAV_ITEMS[id])
 .filter((item) => (!item.adminOnly || isAdmin) && (!isPromoPlan || hasModuleAccess(currentActiveBandPlan, item.id)))
 .map((item) => {
 const isSelected = currentView === item.id;
 const isAllowed = hasModuleAccess(currentActiveBandPlan, item.id);
 const IconComp = item.icon;
 const badge = navBadges[item.id];
 return (
 <button
 key={`top-tab-${item.id}`}
 onClick={() => handleNavigate(item.id as any)}
 className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-mono font-medium whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer active:scale-95 ${
 isSelected
 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-xs'
 : !isAllowed
 ? 'bg-[#151413] text-neutral-500 border border-[#22211F]/60 hover:bg-[#1a1918]'
 : 'bg-[#1A1918] text-neutral-300 border border-[#22211F] hover:bg-[#22211F] hover:text-white'
 }`}
 >
 <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : !isAllowed ? 'text-neutral-500' : 'text-neutral-400'}`} />
 <span>{t(item.labelKey, item.labelDefault)}</span>
 {!isAllowed ? (
   <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/90 border border-amber-500/20">
     <Lock className="w-2.5 h-2.5" />
     <span>Plan</span>
   </span>
 ) : badge !== undefined && badge !== 0 && badge !== "0" ? (
 <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
 isSelected ? 'bg-amber-500/30 text-amber-200' : 'bg-[#2b2927] text-zinc-400'
 }`}>
 {badge}
 </span>
 ) : null}
 </button>
 );
 })}
 </div>
 </header>

 {/* MOBILE SLIDE-OVER DRAWER */}
 {isMobileMenuOpen && (
 <div className="md:hidden fixed inset-0 z-50 flex">
 {/* Backdrop */}
 <div 
 className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
 onClick={() => setIsMobileMenuOpen(false)}
 />
 {/* Drawer panel */}
 <div className="relative w-[280px] max-w-[85vw] bg-[#121110] border-[#22211F] flex flex-col h-full z-10 overflow-y-auto shadow-2xl">
 {/* Drawer Header */}
 <div className="p-4 flex items-center justify-between border-[#22211F]/50 bg-gradient-to-b from-[#1A1918] to-[#121110]">
 <div className="flex items-center gap-2.5">
 {currentActiveBandLogo ? (
 <img 
 src={currentActiveBandLogo} 
 alt="Logo" 
 className="w-14 h-14 object-contain p-1 bg-neutral-950/90 rounded-xl border border-amber-500/50 shadow-md shrink-0"
 referrerPolicy="no-referrer"
 />
 ) : (
 <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
 {currentActiveBandName[0]?.toUpperCase() || 'B'}
 </div>
 )}
 <div className="flex flex-col">
 <h1 className={`font-bold font-display tracking-wider uppercase text-zinc-100 leading-tight notranslate ${currentActiveBandName.length > 20 ? 'text-xs' : currentActiveBandName.length > 12 ? 'text-sm' : 'text-base'}`} translate="no">
 {currentActiveBandName}
 </h1>
 <div className="flex items-center gap-1.5 mt-1">
 <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${syncStatus === 'synced' ? 'bg-emerald-400/20' : syncStatus === 'error' ? 'bg-rose-500' : 'bg-zinc-400 animate-pulse'}`} />
 <span className="text-[10px] font-sans text-[#9a9591]">Banda activa</span>
 </div>
 </div>
 </div>
 <button
 onClick={() => setIsMobileMenuOpen(false)}
 className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-[#22211F] cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Drawer Nav */}
 <nav className="flex flex-col gap-1 px-3 pt-3 flex-1">
 {NAV_PINNED_TOP_IDS.map((id) => {
   const item = NAV_ITEMS[id];
   return (
     <NavItemButton
       key={item.id}
       item={item}
       label={t(item.labelKey, item.labelDefault)}
       isSelected={currentView === item.id}
       isAllowed={hasModuleAccess(currentActiveBandPlan, item.id)}
       badge={navBadges[item.id]}
       onNavigate={() => handleNavigate(item.id as any)}
       variant="mobile"
     />
   );
 })}
 {shouldGroupNav ? (
   NAV_GROUPS_MOBILE.map((group) => (
     <NavGroupSection
       key={group.id}
       group={group}
       currentView={currentView}
       currentActiveBandPlan={currentActiveBandPlan}
       isAdmin={isAdmin}
       navBadges={navBadges}
       onNavigate={(id) => handleNavigate(id as any)}
       isOpen={!!openNavGroupIds[group.id]}
       onToggleOpen={() => toggleNavGroup(group.id)}
       t={t}
       variant="mobile"
     />
   ))
 ) : (
   FLAT_NAV_ORDER_IDS
     .filter((id) => !(NAV_PINNED_TOP_IDS as NavItemId[]).includes(id))
     .map((id) => NAV_ITEMS[id])
     .filter((item) => (!item.adminOnly || isAdmin) && (!isPromoPlan || hasModuleAccess(currentActiveBandPlan, item.id)))
     .map((item) => (
       <NavItemButton
         key={item.id}
         item={item}
         label={t(item.labelKey, item.labelDefault)}
         isSelected={currentView === item.id}
         isAllowed={hasModuleAccess(currentActiveBandPlan, item.id)}
         badge={navBadges[item.id]}
         onNavigate={() => handleNavigate(item.id as any)}
         variant="mobile"
       />
     ))
 )}
 {shouldGroupNav && NAV_PINNED_BOTTOM_IDS.map((id) => {
   const item = NAV_ITEMS[id];
   return (
     <NavItemButton
       key={item.id}
       item={item}
       label={t(item.labelKey, item.labelDefault)}
       isSelected={currentView === item.id}
       isAllowed={hasModuleAccess(currentActiveBandPlan, item.id)}
       badge={navBadges[item.id]}
       onNavigate={() => handleNavigate(item.id as any)}
       variant="mobile"
     />
   );
 })}
 </nav>

 {/* Mobile AI Credits Widget (oculto en plan Promo: no tiene créditos IA ni acceso a Planes) */}
 {!isPromoPlan && (
 <div
   onClick={() => { handleNavigate('planes'); setIsMobileMenuOpen(false); }}
   className="mx-3 my-2 p-2.5 rounded-xl bg-gradient-to-b from-[#181716] to-[#121110] border border-amber-500/25 hover:border-amber-500/50 transition-all cursor-pointer group shadow-sm"
   title="Ver uso de créditos IA y planes"
 >
   <div className="flex items-center justify-between gap-1 mb-1.5">
     <div className="flex items-center gap-1.5">
       <Zap className="w-3 h-3 text-amber-400" />
       <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-300">Créditos IA</span>
     </div>
     <span className="text-[10px] font-mono font-bold text-amber-300">340 / 800</span>
   </div>
   <div className="w-full h-1.5 rounded-full bg-neutral-900 overflow-hidden border border-neutral-800">
     <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 shadow-xs" style={{ width: '42.5%' }} />
   </div>
   <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400 mt-1">
     <span>Plan De Gira</span>
     <span className="text-amber-400 group-hover:text-amber-300 font-bold transition-colors">Planes →</span>
   </div>
 </div>
 )}

 {/* Drawer User Footer */}
 <div className="p-4 mt-auto border-[#22211F]/50">
 {currentUser && (
  <div className="flex flex-col gap-2 mb-4 p-2.5 rounded-xl bg-[#1A1918] border border-[#22211F]">
   <div 
    onClick={() => { setShowUserProfileModal(true); setIsMobileMenuOpen(false); }}
    className="flex items-center gap-3 w-full cursor-pointer text-left group"
   >
    <div 
     className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[#121110] text-xs font-sans shrink-0 uppercase transition-transform group-hover:scale-105"
     style={{ backgroundColor: currentUser.avatarColor || '#eab308' }}
    >
     {currentUser.name ? currentUser.name.slice(0, 2) : 'US'}
    </div>
    <div className="flex flex-col min-w-0 flex-1">
     <span className="text-[12px] font-bold font-sans text-zinc-100 truncate">
      {currentUser.name}
     </span>
     <span className="text-[10px] font-mono text-[#9a9591] truncate" title={currentUser.email || currentUser.username}>
      {currentUser.email || currentUser.username}
     </span>
    </div>
   </div>


  </div>
 )}
 <div className="flex items-center justify-between px-2">
 <div className="flex items-center gap-2">
 <img 
 src="/logo_bandmanager_symbol.svg" 
 alt="BandManager.ai" 
 className="w-7 h-7 object-contain shrink-0 transition-all cursor-pointer"
 referrerPolicy="no-referrer"
 />
 <div className="flex flex-col text-left">
 <span className="text-[9px] font-bold font-display tracking-wider text-neutral-400 uppercase leading-none">
 BANDMANAGER<span className="text-[#f2ca50]">.OI</span>
 </span>
 </div>
 </div>
 <button
 onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
 className="p-1.5 text-neutral-500 hover:text-rose-300 rounded-lg hover:bg-[#22211F] transition-colors cursor-pointer"
 title="Cerrar Sesión"
 >
 <LogOut className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 <aside className="hidden md:flex w-[240px] shrink-0 bg-[#121110] border-[#22211F] flex-col h-screen sticky top-0 overflow-y-auto">
 
 {/* Brand Header (Clickable Netflix Style Switcher) */}
 <div 
  onClick={() => setShowBandSwitcherModal(true)}
  className="p-3.5 flex flex-col gap-2 items-center text-center border-b border-[#22211F]/60 bg-gradient-to-b from-[#1c1a18] to-[#121110] cursor-pointer group transition-all duration-300 hover:bg-[#181716] relative"
  title="Haz clic para cambiar de banda (Estilo Netflix)"
 >
  <div className="relative group/logo">
  {currentActiveBandLogo ? (
  <img 
  src={currentActiveBandLogo} 
  alt="Logo" 
  className="w-24 h-24 xl:w-28 xl:h-28 object-contain p-2 bg-neutral-950/80 rounded-2xl shadow-lg shadow-black/60 border border-[#333130] group-hover:border-amber-400/90 group-hover:scale-105 transition-all duration-300 shrink-0"
  referrerPolicy="no-referrer"
  />
  ) : (
  <div className="w-24 h-24 xl:w-28 xl:h-28 rounded-2xl shadow-lg shadow-black/50 border border-[#333130] group-hover:border-amber-400 bg-[#1A1918] flex flex-col items-center justify-center text-amber-400 gap-1 p-2 shrink-0 group-hover:scale-105 transition-all duration-300">
  <Guitar className="w-6 h-6 opacity-80 group-hover:scale-110 transition-transform" />
  <span className="text-[9px] font-bold font-mono text-zinc-300 uppercase tracking-widest text-center">
  {currentActiveBandName}
  </span>
  </div>
  )}
  </div>

  <div className="flex flex-col items-center w-full px-1 gap-1">
  <div className="flex items-center justify-center gap-1 w-full">
   <h1 className={`font-black font-display tracking-wider uppercase text-zinc-100 group-hover:text-amber-400 transition-colors leading-tight text-center break-words line-clamp-2 max-w-full notranslate ${
     currentActiveBandName.length > 22 
       ? 'text-xs' 
       : currentActiveBandName.length > 14 
       ? 'text-sm' 
       : currentActiveBandName.length > 9 
       ? 'text-base' 
       : 'text-lg'
   }`} translate="no">
   {currentActiveBandName}
   </h1>
   <ChevronDown className="w-4 h-4 text-amber-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
  </div>
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-sm">
   <Sparkles className="w-2.5 h-2.5 text-amber-400" />
   {getPlanDefinition(currentActiveBandPlan).name}
  </span>
  </div>
 </div>

 {/* Navigation */}
 <nav className="flex flex-col gap-0.5 px-3 pt-2 flex-1">
 {NAV_PINNED_TOP_IDS.map((id) => {
   const item = NAV_ITEMS[id];
   return (
     <NavItemButton
       key={item.id}
       item={item}
       label={t(item.labelKey, item.labelDefault)}
       isSelected={currentView === item.id}
       isAllowed={hasModuleAccess(currentActiveBandPlan, item.id)}
       badge={navBadges[item.id]}
       onNavigate={() => handleNavigate(item.id as any)}
       variant="desktop"
     />
   );
 })}
 {shouldGroupNav ? (
   NAV_GROUPS_DESKTOP.map((group) => (
     <NavGroupSection
       key={group.id}
       group={group}
       currentView={currentView}
       currentActiveBandPlan={currentActiveBandPlan}
       isAdmin={isAdmin}
       navBadges={navBadges}
       onNavigate={(id) => handleNavigate(id as any)}
       isOpen={!!openNavGroupIds[group.id]}
       onToggleOpen={() => toggleNavGroup(group.id)}
       t={t}
       variant="desktop"
     />
   ))
 ) : (
   FLAT_NAV_ORDER_IDS
     .filter((id) => !(NAV_PINNED_TOP_IDS as NavItemId[]).includes(id))
     .map((id) => NAV_ITEMS[id])
     .filter((item) => (!item.adminOnly || isAdmin) && (!isPromoPlan || hasModuleAccess(currentActiveBandPlan, item.id)))
     .map((item) => (
       <NavItemButton
         key={item.id}
         item={item}
         label={t(item.labelKey, item.labelDefault)}
         isSelected={currentView === item.id}
         isAllowed={hasModuleAccess(currentActiveBandPlan, item.id)}
         badge={navBadges[item.id]}
         onNavigate={() => handleNavigate(item.id as any)}
         variant="desktop"
       />
     ))
 )}
 {shouldGroupNav && NAV_PINNED_BOTTOM_IDS.map((id) => {
   const item = NAV_ITEMS[id];
   return (
     <NavItemButton
       key={item.id}
       item={item}
       label={t(item.labelKey, item.labelDefault)}
       isSelected={currentView === item.id}
       isAllowed={hasModuleAccess(currentActiveBandPlan, item.id)}
       badge={navBadges[item.id]}
       onNavigate={() => handleNavigate(item.id as any)}
       variant="desktop"
     />
   );
 })}
 </nav>

 {/* Campañas de Booking (oculto en plan Promo, no tiene acceso a Booking) */}
 {!isPromoPlan && (
   <div className="px-3 pt-3 pb-2 border-t border-[#22211F]/60 space-y-1.5">
     <div className="flex items-center justify-between px-1">
       <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">Campañas</p>
       <button
         onClick={() => setShowCampaignModal(true)}
         className="text-[10px] font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
         title="Gestionar Campañas de Booking"
       >
         <Target className="w-3 h-3" />
         <span>Configurar</span>
       </button>
     </div>

     {/* Quick Campaign Switcher / Status */}
     <button
       onClick={() => setShowCampaignModal(true)}
       className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer group ${
         activeCampaign
           ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-xs'
           : 'bg-[#181716] border-[#22211F] hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
       }`}
       title="Configurar y activar campañas de booking con fechas objetivo"
     >
       <div className="flex items-center gap-2 min-w-0">
         <div className={`p-1 rounded-lg ${activeCampaign ? 'bg-purple-500/30 text-purple-300' : 'bg-neutral-800 text-neutral-400'}`}>
           <Target className="w-3.5 h-3.5" />
         </div>
         <div className="flex flex-col min-w-0">
           <span className="text-[11px] font-bold truncate leading-tight">
             {activeCampaign ? activeCampaign.name : 'Modo Campaña'}
           </span>
           <span className="text-[9px] font-mono text-neutral-500 truncate">
             {activeCampaign ? `${activeCampaign.targetDates?.length || 0} fechas en calendario` : 'Sin campaña activa'}
           </span>
         </div>
       </div>
       <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 shrink-0">
         {activeCampaign ? 'ACTIVA' : 'ELEGIR'}
       </span>
     </button>
   </div>
 )}

 {/* Sidebar AI Credits Widget (oculto en plan Promo: no tiene créditos IA ni acceso a Planes) */}
 {!isPromoPlan && (() => {
   const userPlan = currentActiveBandPlan;
   const pDef = getPlanDefinition(userPlan);
   const totalCredits = userPlan === 'cabeza_de_cartel' ? 2500 : userPlan === 'de_gira' ? 800 : userPlan === 'local' ? 300 : 100;
   const estimatedUsed = Math.min(totalCredits, Math.max(12, (leads.length * 2) + posts.length));
   const pct = Math.min(100, Math.round((estimatedUsed / totalCredits) * 100));

   return (
     <div 
       onClick={() => handleNavigate('planes')}
       className="mx-3 my-2 p-2.5 rounded-xl bg-gradient-to-b from-[#181716] to-[#121110] border border-amber-500/25 hover:border-amber-500/50 transition-all cursor-pointer group shadow-sm"
       title="Ver consumo de créditos IA y planes"
     >
       <div className="flex items-center justify-between gap-1 mb-1.5">
         <div className="flex items-center gap-1.5">
           <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
           <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-300">Créditos IA</span>
         </div>
         <span className="text-[10px] font-mono font-bold text-amber-300">{estimatedUsed} / {totalCredits}</span>
       </div>
       <div className="w-full h-1.5 rounded-full bg-neutral-900 overflow-hidden border border-neutral-800">
         <div 
           className={`h-full rounded-full transition-all duration-500 ${
             pct > 85 ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 'bg-gradient-to-r from-amber-400 to-amber-500'
           }`} 
           style={{ width: `${pct}%` }} 
         />
       </div>
       <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400 mt-1">
         <span className="truncate max-w-[100px]">Plan {pDef.name}</span>
         <span className="text-amber-400 group-hover:text-amber-300 font-bold transition-colors">Planes →</span>
       </div>
     </div>
   );
 })()}

 {/* Bottom User Profile */}
 <div className="p-4 mt-auto border-[#22211F]/50">
 {currentUser && (
  <div className="flex flex-col gap-2 mb-4 p-2.5 rounded-xl bg-[#1A1918] border border-[#22211F]">
   <div 
    onClick={() => setShowUserProfileModal(true)}
    className="flex items-center gap-3 w-full cursor-pointer text-left group"
   >
    <div 
     className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[#121110] text-xs font-sans shrink-0 uppercase transition-transform group-hover:scale-105"
     style={{ backgroundColor: currentUser.avatarColor || '#eab308' }}
    >
     {currentUser.name ? currentUser.name.slice(0, 2) : 'US'}
    </div>
    <div className="flex flex-col min-w-0 flex-1">
     <span className="text-[12px] font-bold font-sans text-zinc-100 truncate">
      {currentUser.name}
     </span>
     <span className="text-[10px] font-mono text-[#9a9591] truncate" title={currentUser.email || currentUser.username}>
      {currentUser.email || currentUser.username}
     </span>
    </div>
   </div>


  </div>
 )}

 <div className="flex items-center justify-between px-2">
 <div className="flex items-center gap-2">
 <img 
 src="/logo_bandmanager_symbol.svg" 
 alt="BandManager.ai" 
 className="w-7 h-7 object-contain shrink-0 transition-all cursor-pointer"
 referrerPolicy="no-referrer"
 />
 <div className="flex flex-col text-left">
 <span className="text-[9px] font-bold font-display tracking-wider text-neutral-400 uppercase leading-none">
 BANDMANAGER<span className="text-[#f2ca50]">.OI</span>
 </span>
 </div>
 </div>
 <div className="flex items-center gap-1.5">
  <button
  onClick={handleLogout}
  className="p-1.5 text-neutral-500 hover:text-rose-300 rounded-lg hover:bg-[#22211F] transition-colors cursor-pointer"
  title="Cerrar Sesión"
  >
  <LogOut className="w-4 h-4" />
  </button>
 </div>
 </div>
 </div>
 </aside>

 {/* Main Content Area */}
 <main className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A] p-3 sm:p-5 md:p-8">
 {/* Global Active Campaign Banner */}
 {activeCampaign && (
   <GlobalCampaignBar
     campaign={activeCampaign}
     allLeads={leads}
     onOpenManager={() => setShowCampaignModal(true)}
     onDeactivate={() => handleSetActiveCampaign(null)}
     onNavigate={handleNavigate}
     currentView={currentView}
   />
 )}

 {/* Sync warning if backend fails */}
 {syncStatus === 'error' && (
 <div className="mb-4 p-3 bg-rose-500/10 border-rose-500/20 rounded-lg text-rose-300 text-xs flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
 <div className="flex gap-2 items-center">
 <ShieldAlert className="w-5 h-5 text-rose-300 shrink-0" />
 <span>
 <strong>Modo Simulación Activo:</strong> No se pudo conectar con el servidor Express backend local. Los cambios actuales se almacenarán temporalmente en memoria.
 </span>
 </div>
 <button
 onClick={() => fetchState()}
 className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-300 font-mono text-[10px] rounded-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
 >
 Reintentar Conexión
 </button>
 </div>
 )}

 {/* Dynamic Views */}
 <div key={currentView} className="flex-1 h-full min-h-[500px] flex flex-col animate-fade-in">
 {isLoading ? (
 <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
 <RefreshCw className="w-8 h-8 animate-spin text-[#f2ca50]" />
 <p className="text-xs text-neutral-400 font-mono">Cargando base de datos Bakandeya...</p>
 </div>
 ) : (
 <Suspense fallback={
 <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
 <RefreshCw className="w-8 h-8 animate-spin text-[#f2ca50]" />
 </div>
 }>
 {currentView === 'resumen' && (
 <Dashboard
 leads={leads}
 colors={colors}
 onUpdateLead={handleUpdateLead}
 onAddLead={handleAddLeadWithLimitCheck}
 metrics={metrics}
 concerts={concerts}
 rehearsals={rehearsals}
 currentUser={currentUser}
 bandName={currentActiveBandName}
 currentBandId={currentActiveBandId}
 availableBands={availableBands}
 onNavigate={handleNavigate}
 onOpenProfileModal={() => setShowUserProfileModal(true)}
 epkConfig={epkConfig}
 tours={tours}
 fans={fans}
 posts={posts}
 isPromoPlan={isPromoPlan}
 />
 )}
 {(currentView === 'booking' || currentView === 'medios') && (
 <BookingCRM 
 activeCampaign={activeCampaign} 
 onCampaignChange={handleSetActiveCampaign}
 leads={leads} 
 colors={colors}
 onUpdateLead={handleUpdateLead}
 onAddLead={handleAddLeadWithLimitCheck}
 onDeleteLead={handleDeleteLead}
 onBulkDeleteLeads={handleBulkDeleteLeads}
 epkConfig={epkConfig}
 onUpdateEpkConfig={handleUpdateEpkConfig}
 initialSection={bookingOptions.sectionTab || (currentView === 'medios' ? 'medios' : 'salas')}
 initialStatusFilter={bookingOptions.statusFilter || 'todos'}
 initialSelectedLeadId={bookingOptions.selectedLeadId}
 currentUser={currentUser}
 bandName={currentActiveBandName}
 currentBandId={currentActiveBandId}
 />
 )}
 {currentView === 'bandas' && (
 <BandCRM 
 colors={colors}
 leads={leads}
 onAddLead={handleAddLeadWithLimitCheck}
 onUpdateLead={handleUpdateLead}
 onDeleteBand={handleDeleteBand}
 currentBandId={currentActiveBandId}
 />
 )}
 {currentView === 'calendario' && (
 <CalendarView 
 colors={colors}
 rehearsals={rehearsals}
 concerts={concerts}
 campaigns={campaigns}
 activeCampaign={activeCampaign}
 onNavigate={handleNavigate}
 onUpdateRehearsal={handleUpdateRehearsal}
 onUpdateConcert={handleUpdateConcert}
 onDeleteRehearsal={handleDeleteRehearsal}
 onDeleteConcert={handleDeleteConcert}
 onAddRehearsal={handleAddRehearsal}
 onAddConcert={handleAddConcert}
 initialSelectedEventId={bookingOptions.selectedEventId}
 initialSelectedDate={bookingOptions.selectedDate}
 currentBandId={currentActiveBandId}
 currentBandName={currentActiveBandName}
 availableBands={availableBands}
 bandUsers={bandUsers}
 currentUser={currentUser}
 isPromoPlan={isPromoPlan}
 />
 )}
 {currentView === 'reels' && (
 <ReelsCenter
 colors={colors}
 posts={posts}
 onAddPost={handleAddPost}
 onUpdatePost={handleUpdatePost}
 metrics={metrics}
 onAddMetric={handleAddMetric}
 onUpdateMetric={handleUpdateMetric}
 onDeleteMetric={handleDeleteMetric}
 bandName={currentActiveBandName}
 instagramHandle={(epkConfig?.enlacesRedes?.instagram || '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/\/$/, '') || undefined}
 hasAnySocialLink={Boolean(
   epkConfig?.enlacesRedes?.instagram ||
   epkConfig?.enlacesRedes?.tiktok ||
   epkConfig?.enlacesRedes?.youtube ||
   epkConfig?.enlacesRedes?.facebook
 )}
 />
 )}
 {(currentView === 'repertorio' || currentView === 'catalogo' || currentView === 'discografia' || currentView === 'directo') && (
 <RepertorioSetlists
 key={currentActiveBandId}
 colors={colors}
 concerts={activeBandConcerts}
 rehearsals={activeBandRehearsals}
 bandName={currentActiveBandName}
 bandId={currentActiveBandId}
 bandUsers={bandUsers}
 bandLogoUrl={currentActiveBandLogo}
 onUpdateConcert={handleUpdateConcert}
 onUpdateRehearsal={handleUpdateRehearsal}
 view={currentView as any}
 currentUser={currentUser}
 />
 )}
{currentView === 'merchan' && (
 <Merchan
 colors={colors}
 currentTheme={currentTheme}
 bandId={currentActiveBandId}
 bandName={currentActiveBandName}
 bandLogoUrl={currentActiveBandLogo}
 />
 )}
        {currentView === 'epk' && (
          <ErrorBoundary fallbackTitle="EPK / Dossier Promocional">
            <EPKManager
              key={currentActiveBandId}
              epkConfig={epkConfig}
              onSave={handleUpdateEpkConfig}
              colors={colors}
              currentTheme={currentTheme}
              currentUser={currentUser}
              isPromoPlan={isPromoPlan}
            />
          </ErrorBoundary>
        )}
        {currentView === 'fans' && (
          <FansPanel
            fans={fans}
            concerts={activeBandConcerts}
            epkConfig={epkConfig}
            onAddFan={handleAddFanWithLimitCheck}
            onUpdateFan={handleUpdateFan}
            onDeleteFan={handleDeleteFan}
            onUpdateIncentive={handleUpdateIncentive}
            onUpdateEpkConfig={handleUpdateEpkConfig}
            currentBandId={currentActiveBandId}
            currentBandName={currentActiveBandName}
            currentBandLogo={currentActiveBandLogo}
            metrics={metrics}
            onAddMetric={handleAddMetric}
            onUpdateMetric={handleUpdateMetric}
            onDeleteMetric={handleDeleteMetric}
            colors={colors}
            isStitchLight={false}
            onNavigate={handleNavigate}
            isPromo={isPromoPlan}
            onUpdateConcert={handleUpdateConcert}
            initialConcertId={bookingOptions.concertId}
          />
        )}
        {currentView === 'giras' && (
          <ErrorBoundary fallbackTitle="Gestor de Giras">
            <TourManager 
              colors={colors}
              tours={tours}
              concerts={activeBandConcerts}
              leads={leads}
              activeCampaign={activeCampaign}
              setActiveCampaign={handleSetActiveCampaign}
              onAddLead={handleAddLeadWithLimitCheck}
              onDeleteLead={handleDeleteLead}
              onSaveTour={handleSaveTour}
              onDeleteTour={handleDeleteTour}
              bandUsers={bandUsers}
              currentUser={currentUser}
              currentBandId={currentActiveBandId}
              currentBandName={currentActiveBandName}
              onAddConcert={handleAddConcert}
              onUpdateConcert={handleUpdateConcert}
              onAddPayment={handleAddPayment}
              onNavigate={handleNavigate}
            />
          </ErrorBoundary>
        )}
 {currentView === 'finanzas' && (
 isAdmin ? (
 <Finanzas 
  colors={colors}
  payments={payments}
  concerts={activeBandConcerts}
  onAddPayment={handleAddPayment}
  onUpdatePayment={handleUpdatePayment}
  onUpdateConcert={handleUpdateConcert}
  tours={tours}
  bandUsers={bandUsers}
  />
 ) : (
 <div className={`p-8 rounded-2xl text-center space-y-3 ${colors.card} `}>
 <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
 <h3 className="text-sm font-mono font-bold text-rose-300 uppercase tracking-wider">Acceso Restringido</h3>
 <p className="text-xs text-neutral-400 max-w-md mx-auto">
 El apartado de Finanzas es confidencial y solo está accesible para los administradores de la banda.
 </p>
 </div>
 )
 )}
  {/* Full View Chatbot Instance */}
  {currentView === 'chat' && (
    <div className="w-full h-[calc(100vh-140px)] min-h-[600px] block">
      <Chatbot
        key={`main_${currentUser?.id || 'guest'}_${currentUser?.band_id || 'default'}`}
        colors={colors}
        leads={leads}
        rehearsals={rehearsals}
        concerts={concerts}
        epkConfig={epkConfig}
        onUpdateLead={handleUpdateLead}
        onCreateLead={handleAddLeadWithLimitCheck}
        onAddRehearsal={handleAddRehearsal}
        onAddConcert={handleAddConcert}
        onNavigate={handleNavigate}
        isFloating={false}
        userRole={currentUser?.role}
        currentUser={currentUser}
        activeBandName={currentActiveBandName}
        onLoadingChange={handleChatLoadingChange}
      />
    </div>
  )}

  {currentView === 'planes' && (
    <Planes
      colors={colors}
      currentUser={currentUser}
      activeBandName={currentActiveBandName}
      currentBandPlan={currentActiveBandPlan}
      onNavigateToModule={handleNavigate}
    />
  )}
 </Suspense>
 )}
 </div>
 </main>

 {/* User Management Modal for Band Leader */}
 {showUserManagementModal && isAdmin && !isPromoPlan && (
 <UserManagementModal
 currentUser={currentUser}
 users={bandUsers}
 onClose={() => setShowUserManagementModal(false)}
 onRefreshUsers={fetchState}
 isStitchLight={false}
 />
 )}

 {/* User Profile & Password Change Modal for All Users */}
 {showUserProfileModal && currentUser && (
 <UserProfileModal
 currentUser={currentUser}
 onClose={() => setShowUserProfileModal(false)}
 onUpdateUser={(updated) => {
 setCurrentUser(updated);
 localStorage.setItem('bakandeya_user', JSON.stringify(updated));
 fetchState();
 }}
 isStitchLight={false}
 isAdmin={isAdmin}
 onOpenBandManagement={!isPromoPlan ? () => setShowUserManagementModal(true) : undefined}
 currentTheme={currentTheme}
 onThemeChange={handleThemeChange}
 currentFont={currentFont}
 onFontChange={handleFontChange}
 epkConfig={epkConfig}
 onUpdateEpkConfig={handleUpdateEpkConfig}
 activeBandName={currentActiveBandName}
 onRefreshData={fetchState}
 availableBands={availableBands}
 onSetMainBand={handleSetMainBand}
 onOpenBandSwitcher={() => setShowBandSwitcherModal(true)}
 onNavigateToPlanes={() => handleNavigate('planes')}
 />
 )}

 {/* Font Selector Modal */}
 {showFontModal && (
 <FontSelectorModal
 onClose={() => setShowFontModal(false)}
 isStitchLight={false}
 currentFont={currentFont}
 onSelectFont={(f) => {
 handleFontChange(f);
 }}
 />
 )}

 {/* Floating Chatbot Overlay */}
 {currentView !== 'chat' && (
   <div
     className={`fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[420px] max-w-[440px] h-[580px] max-h-[80vh] z-[9999] shadow-2xl transition-all duration-200 ${
       isFloatingChatOpen ? 'block animate-in slide-in-from-bottom-5' : 'hidden'
     }`}
   >
     <Suspense fallback={null}>
       <Chatbot
         key={`floating_${currentUser?.id || 'guest'}_${currentUser?.band_id || 'default'}`}
         colors={colors}
         leads={leads}
         rehearsals={rehearsals}
         concerts={concerts}
         epkConfig={epkConfig}
         onUpdateLead={handleUpdateLead}
         onCreateLead={handleAddLeadWithLimitCheck}
         onAddRehearsal={handleAddRehearsal}
         onAddConcert={handleAddConcert}
         onNavigate={handleNavigate}
         isFloating={true}
         onClose={() => setIsFloatingChatOpen(false)}
         userRole={currentUser?.role}
         currentUser={currentUser}
         activeBandName={currentActiveBandName}
         onLoadingChange={handleChatLoadingChange}
       />
     </Suspense>
   </div>
 )}

 {/* Floating Chatbot Trigger Button */}
 {currentView !== 'chat' && !isPromoPlan && (
 <button
 id="floating-chat-trigger-btn"
 onClick={() => setIsFloatingChatOpen(!isFloatingChatOpen)}
 className={`fixed bottom-5 right-5 z-40 p-3.5 rounded-full shadow-2xl flex items-center gap-2.5 transition-all duration-300 cursor-pointer active:scale-95 group ${
 isFloatingChatOpen
 ? 'bg-rose-600 text-white hover:bg-rose-700'
 : isChatLoading
 ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/30 ring-2 ring-cyan-400/50'
 : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 hover:scale-105 shadow-emerald-500/20'
 }`}
 title={isChatLoading ? "Agente AI ejecutando en segundo plano..." : "Abrir Agente Mánager AI"}
 >
 {isFloatingChatOpen ? (
 <X className="w-5 h-5" />
 ) : (
 <>
 <div className="relative">
 {isChatLoading ? (
 <RefreshCw className="w-5 h-5 animate-spin text-cyan-300" />
 ) : (
 <Guitar className="w-5 h-5" />
 )}
 <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${isChatLoading ? 'bg-cyan-400 animate-ping' : 'bg-emerald-300 animate-ping'}`} />
 <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${isChatLoading ? 'bg-cyan-300' : 'bg-emerald-400'}`} />
 </div>
 <span className="text-xs font-mono font-bold uppercase tracking-wider hidden sm:inline-block pr-1">
 {isChatLoading ? 'Ejecutando...' : 'Agente AI'}
 </span>
 </>
 )}
 </button>
 )}

 {/* Metronome Pro Modal */}
 <MetronomeModal
 isOpen={showMetronomeModal}
 onClose={() => setShowMetronomeModal(false)}
 songs={[]}
 colors={colors}
 />

 {/* Tuner Pro Modal */}
 <TunerModal
 isOpen={showTunerModal}
 onClose={() => setShowTunerModal(false)}
 colors={colors}
 />

 {/* Band Switcher Modal (Netflix Style) */}
 <BandSwitcherModal
  isOpen={showBandSwitcherModal}
  onClose={() => setShowBandSwitcherModal(false)}
  currentUser={currentUser}
  availableBands={availableBands}
  epkConfig={epkConfig}
  onUpdateEpkConfig={handleUpdateEpkConfig}
  onRefreshData={fetchState}
  onSwitchBand={async (bandId) => {
    await handleSwitchBand(bandId);
    await fetchState();
  }}
  onSetMainBand={handleSetMainBand}
  onOpenRegisterBand={() => handleNavigate('bandas')}
 />

  {/* Soft Limits Upgrade Modal */}
  <PlanLimitModal
    isOpen={planLimitModal.isOpen}
    onClose={() => setPlanLimitModal(prev => ({ ...prev, isOpen: false }))}
    onNavigateToPlanes={() => {
      setPlanLimitModal(prev => ({ ...prev, isOpen: false }));
      handleNavigate('planes');
    }}
    currentUser={currentUser}
    activeBandName={currentActiveBandName}
    resourceType={planLimitModal.resourceType}
    currentCount={planLimitModal.currentCount}
  />

  {/* Campaign Manager Modal */}
  <CampaignManagerModal
    isOpen={showCampaignModal}
    onClose={() => setShowCampaignModal(false)}
    campaigns={campaigns}
    activeCampaign={activeCampaign}
    onSaveCampaign={handleSaveCampaign}
    onDeleteCampaign={handleDeleteCampaign}
    onSetActiveCampaign={handleSetActiveCampaign}
    onNavigate={handleNavigate}
  />

 </div>
 );
}

