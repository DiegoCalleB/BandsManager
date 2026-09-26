/* eslint-disable
 @typescript-eslint/no-explicit-any,
 @typescript-eslint/no-unused-vars,
 react-hooks/set-state-in-effect,
 react-hooks/exhaustive-deps,
 no-empty
*/
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Lead, LeadStatus, ThemeName, ThemeColors } from './types';
import { THEMES, getEspectroColors } from './utils/theme';
import { useAuth } from './hooks/useAuth';
import { useAppData } from './hooks/useAppData';
import { api } from './services/api';
import { PlayerProvider } from './context/PlayerContext';
import { GlobalPlayer } from './components/GlobalPlayer';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
// Vistas grandes cargadas bajo demanda: sin esto, visitar /unete o abrir cualquier pestaña
// metía en el mismo bundle inicial el CRM, calendario, reels, repertorio, etc. — un fan que
// solo quiere donar por Revolut/PayPal pagaba el peso entero de todo el panel interno.
function safeLazy<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T } | any>
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      return mod.default ? mod : { default: mod };
    } catch (err: unknown) {
      console.warn('Retrying dynamic module load after error:', err);
      await new Promise((resolve) => setTimeout(resolve, 200));
      try {
        const modRetry = await factory();
        return modRetry.default ? modRetry : { default: modRetry };
      } catch (retryErr: unknown) {
        const key = 'last_dynamic_import_reload';
        const last = Number(sessionStorage.getItem(key) || 0);
        if (Date.now() - last > 10000 && typeof window !== 'undefined') {
          sessionStorage.setItem(key, String(Date.now()));
          window.location.reload();
          return new Promise(() => {}) as any;
        }
        throw retryErr;
      }
    }
  });
}

const BookingCRM = safeLazy(() => import('./components/BookingCRM'));
const BandCRM = safeLazy(() => import('./components/BandCRM'));
const CalendarView = safeLazy(() => import('./components/CalendarView'));
const ReelsCenter = safeLazy(() => import('./components/ReelsCenter'));
const Finanzas = safeLazy(() => import('./components/Finanzas'));
const TourManager = safeLazy(() => import('./components/TourManager'));
const RepertorioSetlists = safeLazy(
  () => import('./components/RepertorioSetlists')
);
const Merchan = safeLazy(() => import('./components/Merchan'));
const Chatbot = safeLazy(() => import('./components/Chatbot'));
const EPKManager = safeLazy(() => import('./components/EPKManager'));
const EnsayosManager = safeLazy(() =>
  import('./components/ensayos/EnsayosManager').then((m) => ({
    default: m.EnsayosManager,
  }))
);
const FansPanel = safeLazy(() => import('./components/FansPanel'));
const FansLanding = safeLazy(() => import('./components/FansLanding'));
const PublicMusiciansLanding = safeLazy(() =>
  import('./components/PublicMusiciansLanding').then((m) => ({
    default: m.PublicMusiciansLanding,
  }))
);
const PublicEPK = safeLazy(() =>
  import('./components/PublicEPK').then((m) => ({ default: m.PublicEPK }))
);
const Planes = safeLazy(() => import('./components/Planes'));
import { LoginModal } from './components/LoginModal';
import { SimplePromoLoginModal } from './components/SimplePromoLoginModal';
import { UserManagementModal } from './components/UserManagementModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AiSupportWidget } from './components/dashboard/AiUsageSupportWidget';
import { FontSelectorModal } from './components/FontSelectorModal';
import { ThemeToggle } from './components/common/ThemeToggle';
import { MetronomeModal } from './components/MetronomeModal';
import { TunerModal } from './components/TunerModal';
import { BandSwitcherModal } from './components/BandSwitcherModal';
import { PlanLimitModal } from './components/PlanLimitModal';
import { GlobalCampaignBar } from './components/campaign/GlobalCampaignBar';
import { CampaignManagerModal } from './components/campaign/CampaignManagerModal';
import {
  FontPresetKey,
  applyFontPreset,
  getStoredFontPreset,
} from './utils/typography';
import {
  hasModuleAccess,
  getPlanDefinition,
  checkRecordLimit,
  normalizePlan,
} from './utils/planPermissions';
import {
  NAV_ITEMS,
  NAV_GROUPS_DESKTOP,
  NAV_GROUPS_MOBILE,
  NAV_PINNED_TOP_IDS,
  NAV_PINNED_BOTTOM_IDS,
  FLAT_NAV_ORDER_IDS,
  NAV_BOTTOM_BAR_SLOTS,
  shouldGroupNavForPlan,
  findNavGroupIdForItem,
  NavItemId,
} from './config/navGroups';
import { NavGroupSection } from './components/common/NavGroupSection';
import { SkeletonDashboard } from './components/ui/Skeleton';
import { NavItemButton } from './components/common/NavItemButton';
import { MusicianOnboardingModal } from './components/onboarding/MusicianOnboardingModal';
import { OnboardingWizardModal } from './components/onboarding/OnboardingWizardModal';
import { isOnboardingCompleted } from './utils/userPreferences';
import { useLanguage } from './context/LanguageContext';
import {
  Menu,
  Sparkles,
  LogOut,
  ShieldAlert,
  UserCheck,
  RefreshCw,
  X,
  ChevronDown,
  Lock,
  Zap,
  Target,
  Guitar,
} from 'lucide-react';

export default function App() {
  const { t, language, isTranslating, refreshTranslation } = useLanguage();

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
    handleLogout,
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
    handleUpdateIncentive,
  } = useAppData(isLoggedIn, currentUser?.band_id);

  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showProfileWizardModal, setShowProfileWizardModal] =
    useState<boolean>(false);
  const [showOnboardingModal, setShowOnboardingModal] =
    useState<boolean>(false);

  // Antes, sin banda activa (cuenta nueva sin banda asignada todavía, o un estado transitorio),
  // se caía en'band-bakandeya' en silencio y la app operaba -en lectura y escritura- sobre los
  // datos reales de esa banda. Sin id de banda, cleanActiveBandId queda vacío (no coincide con
  //'bakandeya') y el resto de componentes deben tratarlo como "sin banda seleccionada".
  const currentActiveBandId = currentUser?.band_id || '';
  const cleanActiveBandId = currentActiveBandId.replace(/^(band|reg)-/, '');
  const activeBandFromList = (availableBands || []).find(
    (b: any) =>
      (b.band_id &&
        (b.band_id === currentActiveBandId ||
          b.band_id.replace(/^(band|reg)-/, '') === cleanActiveBandId)) ||
      (b.id &&
        (b.id === currentActiveBandId ||
          b.id.replace(/^(band|reg)-/, '') === cleanActiveBandId))
  );
  const currentActiveBandName =
    activeBandFromList?.nombre_banda ||
    activeBandFromList?.bandName ||
    currentUser?.bandName ||
    currentUser?.name ||
    'Mi Banda';
  const currentActiveBandLogo =
    epkConfig?.logoUrl && epkConfig.logoUrl.trim().length > 0
      ? epkConfig.logoUrl
      : activeBandFromList?.logo_url ||
        activeBandFromList?.imagen_url ||
        (currentUser as any)?.logoUrl ||
        (currentUser as any)?.logo_url ||
        (currentUser as any)?.imagen_url ||
        (cleanActiveBandId === 'bakandeya'
          ? '/logo_bakandeya_bueno_sin_fondo.png'
          : '');

  const isSameBand = (
    id1?: string,
    id2?: string,
    name1?: string,
    name2?: string
  ) => {
    if (
      name1 &&
      name2 &&
      name1.trim().toLowerCase() === name2.trim().toLowerCase()
    ) {
      return true;
    }
    if (!id1 && !id2) return true;
    if (!id1 || !id2) return false;
    if (id1 === id2) return true;
    const clean1 = id1
      .replace(/^(band|reg)-/, '')
      .replace(/-\d+$/, '')
      .trim()
      .toLowerCase();
    const clean2 = id2
      .replace(/^(band|reg)-/, '')
      .replace(/-\d+$/, '')
      .trim()
      .toLowerCase();
    if (clean1 === clean2) return true;
    if (
      clean1 &&
      clean2 &&
      (clean1.includes(clean2) || clean2.includes(clean1))
    )
      return true;
    return false;
  };

  const currentActiveBandPlan = React.useMemo(() => {
    if (
      availableBands &&
      Array.isArray(availableBands) &&
      availableBands.length > 0
    ) {
      const match = availableBands.find((b: any) =>
        isSameBand(
          b.band_id || b.id,
          currentActiveBandId,
          b.bandName || b.nombre_banda || b.name,
          currentActiveBandName
        )
      );
      if (match && match.plan) {
        return normalizePlan(match.plan);
      }
    }
    return normalizePlan(currentUser?.plan || 'ensayo');
  }, [
    availableBands,
    currentActiveBandId,
    currentActiveBandName,
    currentUser?.plan,
  ]);

  // Plan Promo y Promo+ (fase beta, festivales): a diferencia del resto de planes, que enseñan los
  // módulos no incluidos con un candado "Plan" (invitando a mejorar), Promo no debe ni
  // enseñar que esos módulos existen — así que el nav los oculta del todo en vez de bloquearlos.
  const isPromoPlan =
    currentActiveBandPlan === 'promo' || currentActiveBandPlan === 'promo_plus';

  // Disparar reactivamente el asistente de perfil o bienvenida si la banda activa actual aún no lo ha completado
  useEffect(() => {
    if (isLoggedIn && cleanActiveBandId) {
      try {
        const { wizardCompleted, onboardingCompleted } = isOnboardingCompleted(
          cleanActiveBandId,
          currentUser
        );

        // Si es una banda nueva o sin asistente completado para este usuario, abrir el asistente
        if (!wizardCompleted) {
          setShowProfileWizardModal(true);
        }
        if (!onboardingCompleted) {
          setShowOnboardingModal(true);
        }
      } catch {
        // En caso de modo incógnito o localStorage restringido
      }
    }
  }, [isLoggedIn, cleanActiveBandId, currentUser]);

  // Soft Limit Modal State
  const [planLimitModal, setPlanLimitModal] = useState<{
    isOpen: boolean;
    resourceType: 'leads' | 'medios' | 'fans' | 'songs' | 'bands';
    currentCount: number;
  }>({
    isOpen: false,
    resourceType: 'leads',
    currentCount: 0,
  });

  // Guarded Handlers respecting Band Contracted Plan Limits
  const handleAddLeadWithLimitCheck = async (newLead: Lead) => {
    const isMedio =
      newLead.tipo === 'medio' ||
      String(newLead.tipo || '')
        .toLowerCase()
        .includes('prensa') ||
      String(newLead.tipo || '')
        .toLowerCase()
        .includes('radio');
    const currentCount = isMedio
      ? leads.filter(
          (l) =>
            String(l.tipo || '')
              .toLowerCase()
              .includes('medio') ||
            String(l.tipo || '')
              .toLowerCase()
              .includes('radio') ||
            String(l.tipo || '')
              .toLowerCase()
              .includes('prensa')
        ).length
      : leads.filter(
          (l) =>
            !String(l.tipo || '')
              .toLowerCase()
              .includes('medio') &&
            !String(l.tipo || '')
              .toLowerCase()
              .includes('radio') &&
            !String(l.tipo || '')
              .toLowerCase()
              .includes('prensa')
        ).length;

    const limitCheck = checkRecordLimit(
      currentActiveBandPlan,
      isMedio ? 'medios' : 'leads',
      currentCount
    );
    if (!limitCheck.allowed) {
      setPlanLimitModal({
        isOpen: true,
        resourceType: isMedio ? 'medios' : 'leads',
        currentCount,
      });
      return;
    }
    return handleAddLead(newLead);
  };

  const handleAddFanWithLimitCheck = async (fanData: any) => {
    const currentCount = fans.length;
    const limitCheck = checkRecordLimit(
      currentActiveBandPlan,
      'fans',
      currentCount
    );
    if (!limitCheck.allowed) {
      setPlanLimitModal({
        isOpen: true,
        resourceType: 'fans',
        currentCount,
      });
      return;
    }
    return handleAddFan(fanData);
  };

  // Active View State mapping directly to the Stitch Design doc
  type MainView =
    | 'resumen'
    | 'booking'
    | 'medios'
    | 'management'
    | 'bandas'
    | 'calendario'
    | 'ensayos'
    | 'reels'
    | 'repertorio'
    | 'catalogo'
    | 'discografia'
    | 'finanzas'
    | 'chat'
    | 'giras'
    | 'merchan'
    | 'epk'
    | 'fans'
    | 'planes';
  const VALID_VIEWS: MainView[] = [
    'resumen',
    'booking',
    'medios',
    'management',
    'bandas',
    'calendario',
    'ensayos',
    'reels',
    'repertorio',
    'catalogo',
    'discografia',
    'finanzas',
    'chat',
    'giras',
    'merchan',
    'epk',
    'fans',
    'planes',
  ];
  const CURRENT_VIEW_STORAGE_KEY = 'bandmanager_current_view';
  const [currentView, setCurrentView] = useState<MainView>(() => {
    // Recordar la última pantalla entre recargas (F5): sin esto, cualquier refresh (incluido el
    // que hace un deploy nuevo, o simplemente el usuario comprobando algo) manda siempre de
    // vuelta a "Resumen" perdiendo dónde estaba trabajando.
    try {
      //'directo' era el módulo "Directo", eliminado y fusionado dentro de Repertorio — un
      // usuario que lo tuviera como última pantalla aterriza en Repertorio, no en Resumen.
      const saved = localStorage.getItem(CURRENT_VIEW_STORAGE_KEY);
      const migrated = saved === 'directo' ? 'repertorio' : saved;
      if (migrated && (VALID_VIEWS as string[]).includes(migrated))
        return migrated as MainView;
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
    if (language !== 'es') {
      refreshTranslation();
    }
  }, [currentView, language]);

  // Si la vista actual no está permitida para el plan de la banda activa (ej. plan Promo), redirigir inmediatamente a'resumen'
  useEffect(() => {
    if (!hasModuleAccess(currentActiveBandPlan, currentView)) {
      setCurrentView('resumen');
    }
  }, [currentActiveBandPlan, currentView]);
  const [bookingOptions, setBookingOptions] = useState<{
    sectionTab?: 'salas' | 'medios' | 'grupos';
    statusFilter?: LeadStatus | 'todos' | string;
    selectedLeadId?: string;
    selectedEventId?: string;
    selectedDate?: string;
    concertId?: string;
  }>({});

  const handleNavigate = (
    view:
      | 'resumen'
      | 'booking'
      | 'medios'
      | 'management'
      | 'bandas'
      | 'calendario'
      | 'ensayos'
      | 'reels'
      | 'repertorio'
      | 'catalogo'
      | 'discografia'
      | 'finanzas'
      | 'chat'
      | 'giras'
      | 'merchan'
      | 'epk'
      | 'fans'
      | 'planes'
      | 'metronome'
      | 'tuner',
    options?: {
      sectionTab?: 'salas' | 'medios' | 'grupos';
      statusFilter?: LeadStatus | 'todos' | string;
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
    //'finanzas' (el único caso con un `return` real): el control de acceso por plan no bloqueaba
    // nada en el resto de módulos. Y en finanzas, el bloqueo dependía de `isAdmin`, no del plan
    // contratado, así que un admin con un plan que no incluye finanzas entra igualmente.
    if (view === 'finanzas' && !isAdmin) {
      setShowUserProfileModal(true);
      return;
    }
    if (!hasModuleAccess(currentActiveBandPlan, view)) {
      if (!isPromoPlan) {
        setShowUserProfileModal(true);
      }
      return;
    }
    setCurrentView(view);
    setIsMobileMenuOpen(false);
    const targetGroupId = findNavGroupIdForItem(view);
    if (targetGroupId) {
      setOpenNavGroupIds((prev) =>
        prev[targetGroupId] ? prev : { ...prev, [targetGroupId]: true }
      );
    }
    if (options) {
      setBookingOptions({
        sectionTab:
          view === 'medios'
            ? 'medios'
            : view === 'management'
              ? 'grupos'
              : view === 'booking'
                ? 'salas'
                : undefined,
        ...options,
      });
    } else if (view === 'medios') {
      setBookingOptions({ sectionTab: 'medios', statusFilter: 'todos' });
    } else if (view === 'management') {
      setBookingOptions({ sectionTab: 'grupos', statusFilter: 'todos' });
    } else if (view === 'booking') {
      setBookingOptions({ sectionTab: 'salas', statusFilter: 'todos' });
    } else {
      setBookingOptions({});
    }
  };

  const [bandsCount, setBandsCount] = useState<number>(0);

  useEffect(() => {
    api
      .getBands()
      .then((res) => {
        if (Array.isArray(res?.bands)) {
          setBandsCount(res.bands.length);
        }
      })
      .catch(() => {});
  }, [currentActiveBandId]);

  const handleCrmSectionChange = useCallback(
    (section: 'salas' | 'medios' | 'grupos' | 'bandas') => {
      if (section === 'bandas') {
        setCurrentView((prev) => {
          if (prev !== 'bandas') {
            const targetGroupId = findNavGroupIdForItem('bandas');
            if (targetGroupId) {
              setOpenNavGroupIds((openPrev) =>
                openPrev[targetGroupId]
                  ? openPrev
                  : { ...openPrev, [targetGroupId]: true }
              );
            }
            return 'bandas';
          }
          return prev;
        });
        return;
      }

      const targetView: 'booking' | 'medios' | 'management' =
        section === 'medios'
          ? 'medios'
          : section === 'grupos'
            ? 'management'
            : 'booking';

      setCurrentView((prev) => {
        if (prev !== targetView) {
          const targetGroupId = findNavGroupIdForItem(targetView);
          if (targetGroupId) {
            setOpenNavGroupIds((openPrev) =>
              openPrev[targetGroupId]
                ? openPrev
                : { ...openPrev, [targetGroupId]: true }
            );
          }
          return targetView;
        }
        return prev;
      });

      setBookingOptions((prev) => ({
        ...prev,
        sectionTab: section,
        statusFilter: 'todos',
      }));
    },
    []
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openGroupSheetId, setOpenGroupSheetId] = useState<string | null>(null);
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
  const [currentFont, setCurrentFont] =
    useState<FontPresetKey>(getStoredFontPreset);
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
      const planName = planParam
        ? planParam.toUpperCase().replace('_', '')
        : 'PRO';

      // Clean URL params immediately
      window.history.replaceState({}, document.title, window.location.pathname);

      // Confirm to backend and update Supabase & memory state
      const targetBand = bandParam || currentUser?.band_id;

      // El plan lo decide Stripe, no esta URL: le pasamos el id de la sesión de Checkout para
      // que el servidor lo verifique. Sin él no hay nada que confirmar y basta con refrescar,
      // que el webhook de Stripe ya habrá hecho (o hará) el alta.
      if (sessionParam) {
        api
          .confirmPaymentSuccess({
            sessionId: sessionParam,
            bandId: targetBand,
          })
          .then(() => {
            refreshSession();
            fetchState();
          })
          .catch((err) => {
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

      alert(
        `🎉 ¡Suscripción completada con éxito! Tu banda ahora cuenta con el Plan ${planName} activado.`
      );
    } else if (paymentStatus === 'cancelled') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Detecta cambios en data-theme para sincronizar colores Espectro
  const [dataTheme, setDataTheme] = React.useState<string>(() => {
    if (typeof document === 'undefined') return 'classic';
    return document.documentElement.getAttribute('data-theme') || 'classic';
  });

  useEffect(() => {
    // Observa cambios en el atributo data-theme
    const observer = new MutationObserver(() => {
      const newTheme =
        document.documentElement.getAttribute('data-theme') || 'classic';
      setDataTheme(newTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  const isEspectroActive = dataTheme === 'light' || dataTheme === 'dark';

  // Proporciona colores del sistema Espectro o fallback al sistema antiguo
  const colors: ThemeColors = isEspectroActive
    ? getEspectroColors()
    : THEMES[currentTheme] || THEMES.indie_velvet;

  // Persist Theme Selection - sincroniza tanto currentTheme como data-theme
  const handleThemeChange = (theme: ThemeName) => {
    setCurrentTheme(theme);
    localStorage.setItem('bakandeya_theme', theme);
    // Actualiza data-theme para que Espectro sepa qué tema usar
    const resolvedTheme = theme === 'classic' ? 'classic' : 'light';
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  };

  const handleOpenStudio = (song: any) => {
    // Placeholder for Studio editor integration
    console.log('Open Studio for song:', song);
  };

  const handleOpenIris = (song: any) => {
    // Placeholder for Iris integration
    console.log('Open Iris for song:', song);
  };

  const activeBandConcerts = React.useMemo(() => {
    return concerts.filter((c) => {
      if (!c.band_id && !c.bandName)
        return isSameBand(
          currentActiveBandId,
          'band-bakandeya',
          '',
          currentActiveBandName
        );
      return isSameBand(
        c.band_id,
        currentActiveBandId,
        c.bandName,
        currentActiveBandName
      );
    });
  }, [concerts, currentActiveBandId, currentActiveBandName]);

  const activeBandRehearsals = React.useMemo(() => {
    return rehearsals.filter((r) => {
      if (!r.band_id && !r.bandName)
        return isSameBand(
          currentActiveBandId,
          'band-bakandeya',
          '',
          currentActiveBandName
        );
      return isSameBand(
        r.band_id,
        currentActiveBandId,
        r.bandName,
        currentActiveBandName
      );
    });
  }, [rehearsals, currentActiveBandId, currentActiveBandName]);

  // Badges del menú de navegación (booking/medios/calendario), calculados una sola vez
  // y reutilizados por la barra de tabs móvil, el drawer y el <aside> de escritorio —
  // antes cada uno recalculaba esto por su cuenta con su propia copia de isMedio/isBanda.
  const navBadges = React.useMemo(() => {
    const isMedio = (l: Lead) => {
      if (!l.tipo) return false;
      const s = String(l.tipo).trim().toLowerCase();
      return (
        s.includes('medio') ||
        s.includes('radio') ||
        s.includes('prensa') ||
        s.includes('tv') ||
        s.includes('podc')
      );
    };
    const isManagement = (l: Lead) => {
      if (!l.tipo) return false;
      const s = String(l.tipo).trim().toLowerCase();
      return [
        'agencia',
        'manager',
        'productora',
        'sello',
        'promotora',
        'management',
      ].some((t) => s.includes(t));
    };
    const isBanda = (l: Lead) => {
      if (!l.tipo) return false;
      const s = String(l.tipo).trim().toLowerCase();
      return (
        s === 'grupo' ||
        s.includes('grup') ||
        s.includes('banda') ||
        s.includes('artist') ||
        s.includes('musico') ||
        s.includes('músico')
      );
    };
    const totalEvents = concerts.length + rehearsals.length;
    const activeEvents =
      activeBandConcerts.length + activeBandRehearsals.length;
    return {
      booking: leads.filter(
        (l) => !isMedio(l) && !isBanda(l) && !isManagement(l)
      ).length,
      medios: leads.filter((l) => isMedio(l)).length,
      management: leads.filter((l) => isManagement(l)).length,
      bandas: bandsCount,
      calendario: totalEvents === 0 ? 0 : `${activeEvents}/${totalEvents}`,
    } as Record<string, number | string>;
  }, [
    leads,
    concerts,
    rehearsals,
    activeBandConcerts,
    activeBandRehearsals,
    bandsCount,
  ]);

  // Vista agrupada del menú (secciones colapsables) para planes con menú largo y para `promo_plus`/`promo_music`;
  // `promo` (4 módulos) se queda con la lista plana de siempre sin agrupaciones.
  const shouldGroupNav = shouldGroupNavForPlan(currentActiveBandPlan);

  const [openNavGroupIds, setOpenNavGroupIds] = useState<
    Record<string, boolean>
  >(() => {
    try {
      const stored = localStorage.getItem('bm_nav_open_groups');
      if (stored) return JSON.parse(stored);
    } catch {
      /* localStorage no disponible o corrupto: se ignora */
    }
    const initialGroupId = findNavGroupIdForItem('resumen');
    return initialGroupId ? { [initialGroupId]: true } : {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        'bm_nav_open_groups',
        JSON.stringify(openNavGroupIds)
      );
    } catch {
      /* localStorage no disponible: el toggle sigue funcionando en memoria */
    }
  }, [openNavGroupIds]);

  const toggleNavGroup = (groupId: string) => {
    setOpenNavGroupIds((prev) => {
      const isCurrentlyOpen = !!prev[groupId];
      if (isCurrentlyOpen) {
        // Cierra el grupo
        const newState = { ...prev };
        delete newState[groupId];
        return newState;
      } else {
        // Abre solo este grupo (accordion)
        return { [groupId]: true };
      }
    });
  };

  // Public Landing Routes
  const isFanRoute = React.useMemo(() => {
    const p = window.location.pathname.toLowerCase();
    return (
      p.startsWith('/fans') ||
      p.startsWith('/unete') ||
      p.startsWith('/directo') ||
      p.startsWith('/fan')
    );
  }, []);

  const isMusicianRoute = React.useMemo(() => {
    const p = window.location.pathname.toLowerCase();
    return (
      p.startsWith('/musicos') ||
      p.startsWith('/landing-musicos') ||
      p.startsWith('/musicians') ||
      p.startsWith('/artistas') ||
      p.startsWith('/waitlist') ||
      p.startsWith('/bandas-registro')
    );
  }, []);

  const isEpkRoute = React.useMemo(() => {
    const p = window.location.pathname.toLowerCase();
    return (
      p.startsWith('/epk') || p.startsWith('/dossier') || p.startsWith('/press')
    );
  }, []);

  if (isMusicianRoute) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[var(--acc)]" />
          </div>
        }
      >
        <PublicMusiciansLanding />
      </Suspense>
    );
  }

  if (isEpkRoute) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[var(--acc)]" />
          </div>
        }
      >
        <PublicEPK />
      </Suspense>
    );
  }

  if (isFanRoute) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[var(--acc)]" />
          </div>
        }
      >
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
      <LoginModal onLoginSuccess={handleLoginSuccess} />
    );
  }

  return (
    <PlayerProvider>
      <div
        className={`min-h-screen ${colors.bg} flex flex-col md:flex-row transition-colors duration-500 font-sans w-full max-w-[100vw] overflow-clip`}
      >
        {/* LEFT SIDEBAR */}
        {/* MOBILE TOP BAR */}
        <header className="md:hidden flex flex-col bg-[var(--surface)] sticky top-0 z-30 shrink-0">
          {/* Top Brand & Menu Row */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div
              onClick={() => setShowBandSwitcherModal(true)}
              className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-colors p-1 -ml-1 rounded-[var(--r-m)] hover:bg-[var(--sunken)]"
              title="Toca para cambiar de banda"
            >
              <div className="relative shrink-0">
                {currentActiveBandLogo ? (
                  <img
                    src={currentActiveBandLogo}
                    alt="Logo"
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain p-1 bg-[var(--sunken)] rounded-[var(--r-m)] shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc-soft)] text-[var(--acc-ink)] flex items-center justify-center font-bold text-xs shrink-0">
                    {currentActiveBandName[0]?.toUpperCase() || 'B'}
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h1
                    className={`font-bold font-display tracking-wide text-[var(--ink)] group-hover:text-[var(--acc-ink)] transition-colors leading-none truncate max-w-[150px] sm:max-w-[200px] notranslate ${currentActiveBandName.length > 20 ? 'text-xs' : 'text-xs sm:text-sm'}`}
                    translate="no"
                  >
                    {currentActiveBandName}
                  </h1>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--acc-ink)] group-hover:translate-y-0.5 transition-transform" />
                  <span
                    className={`w-1.5 h-1.5 rounded-[var(--r-pill)] shrink-0 ${syncStatus === 'synced' ? 'bg-[var(--ok)]/30' : syncStatus === 'error' ? 'bg-[var(--alert)]' : 'bg-[var(--ink-3)]'}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserProfileModal(true);
                  }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-0.5 rounded-[var(--r-pill)] text-[9px] font-bold bg-[var(--acc-soft)] hover:brightness-95 text-[var(--acc-ink)] w-fit cursor-pointer transition-colors"
                  title="Plan actual. Clic para gestionar suscripción (Upgrade / Downgrade)"
                >
                  <Sparkles className="w-2 h-2" />
                  <span>{getPlanDefinition(currentActiveBandPlan).name}</span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowOnboardingModal(true)}
                className="px-2 py-1.5 rounded-[var(--r-pill)] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer bg-[var(--acc-soft)] text-[var(--acc-ink)] hover:brightness-95"
                title="Guía rápida: ¿Por dónde empezar?"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden xs:inline">Guía</span>
              </button>
              {!isPromoPlan && (
                <button
                  onClick={() => setShowCampaignModal(true)}
                  className={`px-2 py-1.5 rounded-[var(--r-pill)] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeCampaign
                      ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
                      : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`}
                  title="Gestionar Campañas de Booking"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden xs:inline">
                    {activeCampaign ? 'Campaña' : 'Campañas'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* MOBILE BOTTOM TAB BAR — sustituye la fila de tabs + el hamburger de antes: 5
 slots fijos, solo iconos (sin texto), siempre visibles sin scroll ni gestos.
 Resumen/Calendario navegan directo; Música/Promoción abren un sheet con sus
 sub-módulos; Más abre el drawer completo (Contactos, Negocio, Herramientas,
 Chat, perfil...). Ver NAV_BOTTOM_BAR_SLOTS en config/navGroups.tsx. */}
        <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 h-16 flex bg-[var(--surface)]">
          {NAV_BOTTOM_BAR_SLOTS.map((slot) => {
            let isActive = false;
            if (openGroupSheetId) {
              isActive =
                slot.kind === 'group' && openGroupSheetId === slot.groupId;
            } else if (isMobileMenuOpen) {
              isActive = slot.kind === 'more';
            } else {
              if (slot.kind === 'view') {
                isActive = currentView === slot.itemId;
              } else if (slot.kind === 'group') {
                isActive =
                  (slot.itemId ? currentView === slot.itemId : false) ||
                  findNavGroupIdForItem(currentView) === slot.groupId;
              } else if (slot.kind === 'more') {
                const groupOfView = findNavGroupIdForItem(currentView);
                const isDirectBottomSlot =
                  currentView === 'resumen' ||
                  currentView === 'calendario' ||
                  groupOfView === 'musica' ||
                  groupOfView === 'promocion';
                isActive = !isDirectBottomSlot;
              }
            }
            const IconComp = slot.itemId
              ? NAV_ITEMS[slot.itemId as NavItemId].icon
              : slot.kind === 'group' && slot.groupId
                ? NAV_ITEMS[
                    NAV_GROUPS_MOBILE.find((g) => g.id === slot.groupId)!
                      .itemIds[0]
                  ].icon
                : Menu;
            const slotLabel = t(slot.labelKey, slot.labelDefault);
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => {
                  if (slot.kind === 'view') {
                    setOpenGroupSheetId(null);
                    setIsMobileMenuOpen(false);
                    handleNavigate(slot.itemId as any);
                  } else if (slot.kind === 'group') {
                    setIsMobileMenuOpen(false);
                    const isAlreadyInGroup =
                      (slot.itemId && currentView === slot.itemId) ||
                      findNavGroupIdForItem(currentView) === slot.groupId;
                    if (isAlreadyInGroup) {
                      setOpenGroupSheetId((prev) =>
                        prev === slot.groupId ? null : (slot.groupId as string)
                      );
                    } else {
                      setOpenGroupSheetId(null);
                      const defaultTarget =
                        slot.itemId ||
                        (slot.groupId === 'musica' ? 'repertorio' : 'epk');
                      handleNavigate(defaultTarget as any);
                    }
                  } else {
                    setOpenGroupSheetId(null);
                    setIsMobileMenuOpen((prev) => !prev);
                  }
                }}
                className="flex-1 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                aria-label={slotLabel}
                title={slotLabel}
              >
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-[var(--r-pill)] transition-colors ${
                    isActive
                      ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
                      : 'text-[var(--ink-2)]'
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                </span>
              </button>
            );
          })}
        </nav>

        {/* MOBILE GROUP SHEET (Música / Promoción): lista los itemIds del grupo tocado
 en la bottom bar, reusando NavItemButton tal cual lo usa el drawer completo. */}
        {openGroupSheetId &&
          (() => {
            const group = NAV_GROUPS_MOBILE.find(
              (g) => g.id === openGroupSheetId
            );
            if (!group) return null;
            return (
              <>
                <div
                  className="md:hidden fixed inset-x-0 top-0 bottom-16 z-40 bg-[var(--sunken)]"
                  onClick={() => setOpenGroupSheetId(null)}
                />
                <div className="md:hidden fixed inset-x-0 bottom-16 z-40 max-h-[60vh] overflow-y-auto bg-[var(--surface)] rounded-t-[var(--r-xl)]">
                  <div className="w-9 h-1 rounded-[var(--r-pill)] bg-[var(--sunken)] mx-auto mt-2.5 mb-1" />
                  <div className="px-4 pt-1 pb-2 text-[12px] font-semibold text-[var(--ink-2)]">
                    {t(group.titleKey, group.titleDefault)}
                  </div>
                  <div className="px-3 pb-4 flex flex-col gap-1">
                    {group.itemIds
                      .filter(
                        (id) =>
                          (!NAV_ITEMS[id].adminOnly || isAdmin) &&
                          hasModuleAccess(currentActiveBandPlan, id)
                      )
                      .map((id) => {
                        const item = NAV_ITEMS[id];
                        return (
                          <NavItemButton
                            key={item.id}
                            item={item}
                            label={t(item.labelKey, item.labelDefault)}
                            isSelected={currentView === item.id}
                            isAllowed={hasModuleAccess(
                              currentActiveBandPlan,
                              item.id
                            )}
                            badge={navBadges[item.id]}
                            onNavigate={() => {
                              handleNavigate(item.id as any);
                              setOpenGroupSheetId(null);
                            }}
                            variant="mobile"
                          />
                        );
                      })}
                  </div>
                </div>
              </>
            );
          })()}

        {/* MOBILE SLIDE-OVER DRAWER */}
        {/* z-[9999], no z-50: mismo motivo que el resto de overlays de esta sesión — la barra del
 reproductor y la nav inferior (z-40, en su propio contexto de apilamiento) pueden tapar
 un z-50 local a este árbol. Encontrado por scripts/design-audit.js, no a mano. */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[9999] flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-[var(--scrim)]/75 transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Drawer panel */}
            <div className="relative w-[280px] max-w-[85vw] bg-[var(--surface)] flex flex-col h-full z-10 overflow-y-auto">
              {/* Drawer Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {currentActiveBandLogo ? (
                    <img
                      src={currentActiveBandLogo}
                      alt="Logo"
                      className="w-14 h-14 object-contain p-1 bg-[var(--sunken)] rounded-[var(--r-m)] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc-soft)] text-[var(--acc-ink)] flex items-center justify-center font-bold text-sm shrink-0">
                      {currentActiveBandName[0]?.toUpperCase() || 'B'}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <h1
                      className={`font-bold font-display tracking-wide text-[var(--ink)] leading-tight notranslate ${currentActiveBandName.length > 20 ? 'text-xs' : currentActiveBandName.length > 12 ? 'text-sm' : 'text-base'}`}
                      translate="no"
                    >
                      {currentActiveBandName}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-[var(--r-pill)] shrink-0 ${syncStatus === 'synced' ? 'bg-[var(--ok)]/30' : syncStatus === 'error' ? 'bg-[var(--alert)]' : 'bg-[var(--ink-3)]'}`}
                      />
                      <span className="text-[10px] font-sans text-[var(--ink-2)]">
                        Banda activa
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--r-s)] hover:bg-[var(--sunken)] cursor-pointer"
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
                      isAllowed={hasModuleAccess(
                        currentActiveBandPlan,
                        item.id
                      )}
                      badge={navBadges[item.id]}
                      onNavigate={() => handleNavigate(item.id as any)}
                      variant="mobile"
                    />
                  );
                })}
                {shouldGroupNav
                  ? NAV_GROUPS_MOBILE.map((group) => (
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
                  : FLAT_NAV_ORDER_IDS.filter(
                      (id) => !(NAV_PINNED_TOP_IDS as NavItemId[]).includes(id)
                    )
                      .map((id) => NAV_ITEMS[id])
                      .filter(
                        (item) =>
                          (!item.adminOnly || isAdmin) &&
                          (!isPromoPlan ||
                            hasModuleAccess(currentActiveBandPlan, item.id))
                      )
                      .map((item) => (
                        <NavItemButton
                          key={item.id}
                          item={item}
                          label={t(item.labelKey, item.labelDefault)}
                          isSelected={currentView === item.id}
                          isAllowed={hasModuleAccess(
                            currentActiveBandPlan,
                            item.id
                          )}
                          badge={navBadges[item.id]}
                          onNavigate={() => handleNavigate(item.id as any)}
                          variant="mobile"
                        />
                      ))}
                {shouldGroupNav &&
                  NAV_PINNED_BOTTOM_IDS.filter((id) =>
                    hasModuleAccess(currentActiveBandPlan, id)
                  ).map((id) => {
                    const item = NAV_ITEMS[id];
                    return (
                      <NavItemButton
                        key={item.id}
                        item={item}
                        label={t(item.labelKey, item.labelDefault)}
                        isSelected={currentView === item.id}
                        isAllowed={hasModuleAccess(
                          currentActiveBandPlan,
                          item.id
                        )}
                        badge={navBadges[item.id]}
                        onNavigate={() => handleNavigate(item.id as any)}
                        variant="mobile"
                      />
                    );
                  })}
              </nav>

              {/* Mobile AI Credits Widget (oculto en plan Promo: no tiene créditos IA ni acceso a Planes).
 Antes tenía datos inventados a fuego ("340 / 800", "Plan De Gira" fijos, sin mirar el plan
 real de la banda) - se sustituye por el mismo cálculo que ya usa la versión de escritorio,
 para no enseñar un número que no tiene nada que ver con la banda que estás viendo. */}
              {!isPromoPlan &&
                (() => {
                  const userPlan = currentActiveBandPlan;
                  const pDef = getPlanDefinition(userPlan);
                  const totalCredits =
                    userPlan === 'cabeza_de_cartel'
                      ? 2500
                      : userPlan === 'de_gira'
                        ? 800
                        : userPlan === 'local'
                          ? 300
                          : 100;
                  const estimatedUsed = Math.min(
                    totalCredits,
                    Math.max(12, leads.length * 2 + posts.length)
                  );
                  const pct = Math.min(
                    100,
                    Math.round((estimatedUsed / totalCredits) * 100)
                  );

                  return (
                    <div
                      onClick={() => {
                        handleNavigate('planes');
                        setIsMobileMenuOpen(false);
                      }}
                      className="mx-3 my-2 p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)] hover:brightness-95 transition-colors cursor-pointer group"
                      title="Ver uso de créditos IA y planes"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-[var(--acc-ink)]" />
                          <span className="text-[11px] font-semibold text-[var(--ink-2)]">
                            Créditos IA
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold tabular-nums text-[var(--ink-2)]">
                          {estimatedUsed} / {totalCredits}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-[var(--r-pill)] bg-[var(--surface)] overflow-hidden">
                        <div
                          className={`h-full rounded-[var(--r-pill)] transition-all duration-500 ${
                            pct > 85 ? 'bg-[var(--alert)]' : 'bg-[var(--acc)]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[var(--ink-2)] mt-1">
                        <span className="truncate max-w-[100px]">
                          Plan {pDef.name}
                        </span>
                        <span className="text-[var(--acc-ink)] font-semibold transition-colors">
                          Planes →
                        </span>
                      </div>
                    </div>
                  );
                })()}

              {/* Ko-fi en el menú móvil: sin esto, en móvil el CTA de apoyo solo salía en la tarjeta del
 Resumen - un usuario que vive navegando por Booking/Repertorio/etc. y nunca entra en
 Resumen no lo veía nunca. Sin gate de plan: el gasto de IA (y el apoyo a él) no depende
 de qué plan tengas. */}
              <AiSupportWidget variant="sidebar" />

              {/* Drawer User Footer */}
              <div className="p-4 mt-auto">
                {currentUser && (
                  <div className="flex flex-col gap-2 mb-4 p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)]">
                    <div
                      onClick={() => {
                        setShowUserProfileModal(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full cursor-pointer text-left group"
                    >
                      <div
                        className="w-8 h-8 rounded-[var(--r-s)] flex items-center justify-center font-bold text-[var(--ink)] text-xs font-sans shrink-0 transition-transform group-hover:scale-105"
                        style={{
                          backgroundColor:
                            currentUser.avatarColor || 'var(--acc)',
                        }}
                      >
                        {currentUser.name ? currentUser.name.slice(0, 2) : 'US'}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[12px] font-bold font-sans text-[var(--ink)] truncate">
                          {currentUser.name}
                        </span>
                        <span
                          className="text-[10px] text-[var(--ink-2)] truncate"
                          title={currentUser.email || currentUser.username}
                        >
                          {currentUser.email || currentUser.username}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <img
                      src="/logo_bandmanager_symbol.png?v=4"
                      alt="BandManager.io"
                      className="w-7 h-7 object-contain shrink-0 transition-all cursor-pointer"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] font-bold font-display tracking-wider text-[var(--ink-2)] leading-none">
                        BANDMANAGER
                        <span className="text-[var(--acc)]">.io</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-1.5 text-[var(--ink-2)] hover:text-[var(--alert)] rounded-[var(--r-s)] hover:bg-[var(--sunken)] transition-colors cursor-pointer"
                    title="Cerrar Sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <aside className="hidden md:flex w-[240px] shrink-0 bg-[var(--surface)] flex-col h-screen sticky top-0 overflow-y-auto">
          {/* Brand Header (Clickable Netflix Style Switcher) */}
          <div
            onClick={() => setShowBandSwitcherModal(true)}
            className="p-3.5 flex flex-col gap-2 items-center text-center cursor-pointer group transition-colors duration-300 hover:bg-[var(--sunken)] relative"
            title="Haz clic para cambiar de banda"
          >
            <div className="relative group/logo">
              {currentActiveBandLogo ? (
                <img
                  src={currentActiveBandLogo}
                  alt="Logo"
                  className="w-24 h-24 xl:w-28 xl:h-28 object-contain p-2 bg-[var(--sunken)] rounded-[var(--r-l)] group-hover:scale-105 transition-transform duration-300 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-24 h-24 xl:w-28 xl:h-28 rounded-[var(--r-l)] bg-[var(--sunken)] flex flex-col items-center justify-center text-[var(--acc-ink)] gap-1 p-2 shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <Guitar className="w-6 h-6 opacity-80 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold text-[var(--ink-2)] text-center">
                    {currentActiveBandName}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center w-full px-1 gap-1">
              <div className="flex items-center justify-center gap-1 w-full">
                <h1
                  className={`font-black font-display tracking-wide text-[var(--ink)] group-hover:text-[var(--acc-ink)] transition-colors leading-tight text-center break-words line-clamp-2 max-w-full notranslate ${
                    currentActiveBandName.length > 22
                      ? 'text-xs'
                      : currentActiveBandName.length > 14
                        ? 'text-sm'
                        : currentActiveBandName.length > 9
                          ? 'text-base'
                          : 'text-lg'
                  }`}
                  translate="no"
                >
                  {currentActiveBandName}
                </h1>
                <ChevronDown className="w-4 h-4 text-[var(--acc-ink)] group-hover:translate-y-0.5 transition-transform shrink-0" />
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-pill)] text-[10px] font-bold bg-[var(--acc-soft)] text-[var(--acc-ink)]">
                <Sparkles className="w-2.5 h-2.5" />
                {getPlanDefinition(currentActiveBandPlan).name}
              </span>
            </div>
          </div>

          <div className="px-3 pt-2.5 pb-1">
            <button
              type="button"
              onClick={() => setShowOnboardingModal(true)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-[var(--r-pill)] text-[11px] font-bold bg-[var(--acc-soft)] hover:brightness-95 text-[var(--acc-ink)] transition-colors cursor-pointer active:scale-95"
              title="Guía interactiva para nuevos músicos"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>¿Por dónde empezar?</span>
            </button>
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
            {shouldGroupNav
              ? NAV_GROUPS_DESKTOP.map((group) => (
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
              : FLAT_NAV_ORDER_IDS.filter(
                  (id) => !(NAV_PINNED_TOP_IDS as NavItemId[]).includes(id)
                )
                  .map((id) => NAV_ITEMS[id])
                  .filter(
                    (item) =>
                      (!item.adminOnly || isAdmin) &&
                      (!isPromoPlan ||
                        hasModuleAccess(currentActiveBandPlan, item.id))
                  )
                  .map((item) => (
                    <NavItemButton
                      key={item.id}
                      item={item}
                      label={t(item.labelKey, item.labelDefault)}
                      isSelected={currentView === item.id}
                      isAllowed={hasModuleAccess(
                        currentActiveBandPlan,
                        item.id
                      )}
                      badge={navBadges[item.id]}
                      onNavigate={() => handleNavigate(item.id as any)}
                      variant="desktop"
                    />
                  ))}
            {shouldGroupNav &&
              NAV_PINNED_BOTTOM_IDS.filter((id) =>
                hasModuleAccess(currentActiveBandPlan, id)
              ).map((id) => {
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
            <div className="px-3 pt-3 pb-2 space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-semibold text-[var(--ink-2)]">
                  Campañas
                </p>
                <button
                  onClick={() => setShowCampaignModal(true)}
                  className="text-[11px] font-semibold text-[var(--acc-ink)] hover:brightness-90 flex items-center gap-1 cursor-pointer"
                  title="Gestionar Campañas de Booking"
                >
                  <Target className="w-3 h-3" />
                  <span>Configurar</span>
                </button>
              </div>

              {/* Quick Campaign Switcher / Status */}
              <button
                onClick={() => setShowCampaignModal(true)}
                className={`w-full flex items-center justify-between p-2 rounded-[var(--r-m)] text-left transition-colors cursor-pointer group ${
                  activeCampaign
                    ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
                    : 'bg-[var(--sunken)] hover:brightness-95 text-[var(--ink-2)] hover:text-[var(--ink-2)]'
                }`}
                title="Configurar y activar campañas de booking con fechas objetivo"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`p-1 rounded-[var(--r-s)] ${activeCampaign ? 'bg-[var(--acc)]/25 text-[var(--on-acc)]' : 'bg-[var(--surface)] text-[var(--ink-2)]'}`}
                  >
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold truncate leading-tight">
                      {activeCampaign ? activeCampaign.name : 'Modo Campaña'}
                    </span>
                    <span className="text-[10px] text-[var(--ink-2)] truncate">
                      {activeCampaign
                        ? `${activeCampaign.targetDates?.length || 0} fechas en calendario`
                        : 'Sin campaña activa'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--on-acc)] shrink-0">
                  {activeCampaign ? 'Activa' : 'Elegir'}
                </span>
              </button>
            </div>
          )}

          {/* Sidebar AI Credits Widget (oculto en plan Promo: no tiene créditos IA ni acceso a Planes) */}
          {!isPromoPlan &&
            (() => {
              const userPlan = currentActiveBandPlan;
              const pDef = getPlanDefinition(userPlan);
              const totalCredits =
                userPlan === 'cabeza_de_cartel'
                  ? 2500
                  : userPlan === 'de_gira'
                    ? 800
                    : userPlan === 'local'
                      ? 300
                      : 100;
              const estimatedUsed = Math.min(
                totalCredits,
                Math.max(12, leads.length * 2 + posts.length)
              );
              const pct = Math.min(
                100,
                Math.round((estimatedUsed / totalCredits) * 100)
              );

              return (
                <div
                  onClick={() => handleNavigate('planes')}
                  className="mx-3 my-2 p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)] hover:brightness-95 transition-colors cursor-pointer group"
                  title="Ver consumo de créditos IA y planes"
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-[var(--acc-ink)]" />
                      <span className="text-[11px] font-semibold text-[var(--ink-2)]">
                        Créditos IA
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold tabular-nums text-[var(--ink-2)]">
                      {estimatedUsed} / {totalCredits}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-[var(--r-pill)] bg-[var(--surface)] overflow-hidden">
                    <div
                      className={`h-full rounded-[var(--r-pill)] transition-all duration-500 ${
                        pct > 85 ? 'bg-[var(--alert)]' : 'bg-[var(--acc)]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[var(--ink-2)] mt-1">
                    <span className="truncate max-w-[100px]">
                      Plan {pDef.name}
                    </span>
                    <span className="text-[var(--acc-ink)] font-semibold transition-colors">
                      Planes →
                    </span>
                  </div>
                </div>
              );
            })()}

          <AiSupportWidget variant="sidebar" />

          {/* Bottom User Profile */}
          <div className="p-4 mt-auto">
            {currentUser && (
              <div className="flex flex-col gap-2 mb-4 p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)]">
                <div
                  onClick={() => setShowUserProfileModal(true)}
                  className="flex items-center gap-3 w-full cursor-pointer text-left group"
                >
                  <div
                    className="w-8 h-8 rounded-[var(--r-s)] flex items-center justify-center font-bold text-[var(--ink)] text-xs font-sans shrink-0 transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: currentUser.avatarColor || 'var(--acc)',
                    }}
                  >
                    {currentUser.name ? currentUser.name.slice(0, 2) : 'US'}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[12px] font-bold font-sans text-[var(--ink)] truncate">
                      {currentUser.name}
                    </span>
                    <span
                      className="text-[10px] text-[var(--ink-2)] truncate"
                      title={currentUser.email || currentUser.username}
                    >
                      {currentUser.email || currentUser.username}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <img
                  src="/logo_bandmanager_symbol.png?v=4"
                  alt="BandManager.io"
                  className="w-7 h-7 object-contain shrink-0 transition-all cursor-pointer"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-bold font-display tracking-wider text-[var(--ink-2)] leading-none">
                    BANDMANAGER<span className="text-[var(--acc)]">.io</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <ThemeToggle compact openUpward />
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-[var(--ink-2)] hover:text-[var(--alert)] rounded-[var(--r-s)] hover:bg-[var(--sunken)] transition-colors cursor-pointer"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[var(--bg)] p-3 sm:p-5 md:p-8 pb-24 md:pb-8">
          {/* Global Active Campaign Banner (solo en módulos de Booking: salas, medios, management, grupos) */}
          {activeCampaign &&
            ['booking', 'medios', 'management', 'bandas'].includes(
              currentView
            ) && (
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
            <div className="mb-4 p-3 bg-[var(--alert)]/10/20 rounded-lg text-[var(--alert)]/60 text-xs flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex gap-2 items-center">
                <ShieldAlert className="w-5 h-5 text-[var(--alert)]/60 shrink-0" />
                <span>
                  <strong>Modo Simulación Activo:</strong> No se pudo conectar
                  con el servidor Express backend local. Los cambios actuales se
                  almacenarán temporalmente en memoria.
                </span>
              </div>
              <button
                onClick={() => fetchState()}
                className="px-3 py-1.5 bg-[var(--alert)]/10 hover:bg-[var(--alert)]/20/20 text-[var(--alert)]/60 font-sans text-[10px] rounded-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                Reintentar Conexión
              </button>
            </div>
          )}

          {/* Dynamic Views */}
          <div
            key={currentView}
            className="flex-1 h-full min-h-[500px] flex flex-col animate-fade-in"
          >
            {isLoading ? (
              <SkeletonDashboard />
            ) : (
              <Suspense
                fallback={
                  <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-[var(--acc)]" />
                  </div>
                }
              >
                {currentView === 'resumen' && (
                  <Dashboard
                    leads={leads}
                    colors={colors}
                    onUpdateLead={handleUpdateLead}
                    onAddLead={handleAddLeadWithLimitCheck}
                    metrics={metrics}
                    concerts={concerts}
                    rehearsals={rehearsals}
                    onAddRehearsal={handleAddRehearsal}
                    bandUsers={bandUsers}
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
                {(currentView === 'booking' ||
                  currentView === 'medios' ||
                  currentView === 'management') && (
                  <BookingCRM
                    key="contacts-crm"
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
                    initialSection={
                      currentView === 'medios'
                        ? 'medios'
                        : currentView === 'management'
                          ? 'grupos'
                          : bookingOptions.sectionTab || 'salas'
                    }
                    onSectionChange={handleCrmSectionChange}
                    onNavigate={handleNavigate}
                    bandsCount={bandsCount}
                    initialStatusFilter={
                      (bookingOptions.statusFilter as LeadStatus | 'todos') ||
                      'todos'
                    }
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
                    onNavigate={handleNavigate}
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
                    currentBandLogo={currentActiveBandLogo}
                    availableBands={availableBands}
                    bandUsers={bandUsers}
                    currentUser={currentUser}
                    isPromoPlan={isPromoPlan}
                  />
                )}
                {currentView === 'ensayos' && (
                  <ErrorBoundary fallbackTitle="Ensayos & Local en Vivo">
                    <EnsayosManager
                      rehearsals={activeBandRehearsals}
                      onSaveRehearsal={(r) => {
                        if (r.id) {
                          handleUpdateRehearsal(r.id, r);
                        } else {
                          handleAddRehearsal(r as any);
                        }
                      }}
                      onDeleteRehearsal={handleDeleteRehearsal}
                      concerts={activeBandConcerts}
                      colors={colors}
                      currentBandId={currentActiveBandId}
                      bandUsers={bandUsers}
                    />
                  </ErrorBoundary>
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
                    instagramHandle={
                      (epkConfig?.enlacesRedes?.instagram || '')
                        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
                        .replace(/^@/, '')
                        .replace(/\/$/, '') || undefined
                    }
                    hasAnySocialLink={Boolean(
                      epkConfig?.enlacesRedes?.instagram ||
                      epkConfig?.enlacesRedes?.tiktok ||
                      epkConfig?.enlacesRedes?.youtube ||
                      epkConfig?.enlacesRedes?.facebook
                    )}
                  />
                )}
                {(currentView === 'repertorio' ||
                  currentView === 'catalogo' ||
                  currentView === 'discografia') && (
                  <ErrorBoundary fallbackTitle="Repertorio y Setlists">
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
                      onNavigate={handleNavigate}
                    />
                  </ErrorBoundary>
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
                {currentView === 'finanzas' &&
                  (isAdmin ? (
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
                    <div
                      className={`p-8 rounded-2xl text-center space-y-3 ${colors.card} `}
                    >
                      <ShieldAlert className="w-10 h-10 text-[var(--alert)] mx-auto" />
                      <h3 className="text-sm font-sans font-bold text-[var(--alert)]/60 tracking-wider">
                        Acceso Restringido
                      </h3>
                      <p className="text-xs text-[var(--ink-3)] max-w-md mx-auto">
                        El apartado de Finanzas es confidencial y solo está
                        accesible para los administradores de la banda.
                      </p>
                    </div>
                  ))}
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
        {showUserManagementModal &&
          (isAdmin ||
            currentUser?.role === 'leader' ||
            currentUser?.role === 'admin') && (
            <UserManagementModal
              currentUser={currentUser}
              users={bandUsers}
              onClose={() => setShowUserManagementModal(false)}
              onRefreshUsers={fetchState}
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
            isAdmin={isAdmin}
            onOpenBandManagement={() => setShowUserManagementModal(true)}
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
            onOpenProfileWizard={() => setShowProfileWizardModal(true)}
          />
        )}

        {/* Font Selector Modal */}
        {showFontModal && (
          <FontSelectorModal
            onClose={() => setShowFontModal(false)}
            currentFont={currentFont}
            onSelectFont={(f) => {
              handleFontChange(f);
            }}
          />
        )}

        {/* Floating Chatbot Overlay */}
        {currentView !== 'chat' && !isPromoPlan && (
          <div
            className={`fixed bottom-36 md:bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[420px] max-w-[440px] h-[580px] max-h-[80vh] z-[9999] transition-all duration-200 ${
              isFloatingChatOpen
                ? 'block animate-in slide-in-from-bottom-5'
                : 'hidden'
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
            className={`fixed bottom-20 md:bottom-5 right-5 z-40 p-3.5 rounded-full flex items-center gap-2.5 transition-all duration-300 cursor-pointer active:scale-95 group ${
              isFloatingChatOpen
                ? 'bg-[var(--alert)] text-[var(--ink)] hover:bg-[var(--alert)]'
                : isChatLoading
                  ? 'bg-[var(--tentative)]/80 text-[var(--ink)] hover:bg-[var(--tentative)] ring-2 ring-cyan-400/50'
                  : 'bg-[var(--ok)] hover:bg-[var(--ok)] text-[var(--ink)] hover:scale-105'
            }`}
            title={
              isChatLoading
                ? 'Agente AI ejecutando en segundo plano...'
                : 'Abrir Agente Mánager AI'
            }
          >
            {isFloatingChatOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <>
                <div className="relative">
                  {isChatLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-[var(--acc)]/80" />
                  ) : (
                    <Guitar className="w-5 h-5" />
                  )}
                  <span
                    className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${isChatLoading ? 'bg-[var(--acc)]/80 animate-ping' : 'bg-[var(--ok)]/60 animate-ping'}`}
                  />
                  <span
                    className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${isChatLoading ? 'bg-[var(--tentative)]/50' : 'bg-[var(--ok)]'}`}
                  />
                </div>
                <span className="text-xs font-sans font-bold tracking-wider hidden sm:inline-block pr-1">
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
          onOpenBandManagement={() => setShowUserManagementModal(true)}
        />

        {/* Soft Limits Upgrade Modal */}
        <PlanLimitModal
          isOpen={planLimitModal.isOpen}
          onClose={() =>
            setPlanLimitModal((prev) => ({ ...prev, isOpen: false }))
          }
          onNavigateToPlanes={() => {
            setPlanLimitModal((prev) => ({ ...prev, isOpen: false }));
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

        {/* Musician First-Time Onboarding Modal ("Elige tu misión") */}
        <MusicianOnboardingModal
          isOpen={showOnboardingModal && !showProfileWizardModal}
          onClose={() => {
            setShowOnboardingModal(false);
            try {
              if (cleanActiveBandId) {
                localStorage.setItem(
                  `bandmanager_onboarding_completed_${cleanActiveBandId}`,
                  'true'
                );
              }
              localStorage.setItem('bandmanager_onboarding_completed', 'true');
            } catch {}
          }}
          onSelectMission={(targetView) => handleNavigate(targetView)}
          bandName={currentActiveBandName}
        />

        {/* Comprehensive Band Profile Setup Wizard */}
        <OnboardingWizardModal
          isOpen={showProfileWizardModal && isLoggedIn}
          onClose={() => {
            setShowProfileWizardModal(false);
            try {
              if (cleanActiveBandId) {
                localStorage.setItem(
                  `bandmanager_profile_wizard_completed_${cleanActiveBandId}`,
                  'true'
                );
              }
              localStorage.setItem(
                'bandmanager_profile_wizard_completed',
                'true'
              );
              window.dispatchEvent(
                new CustomEvent('bandmanager_onboarding_finished')
              );
            } catch {}
          }}
          currentUser={currentUser}
          epkConfig={epkConfig as any}
          onUpdateEpkConfig={handleUpdateEpkConfig}
          onSongsImported={() => {
            fetchState();
          }}
          onRefreshData={fetchState}
          onAddConcert={handleAddConcert}
          onAddRehearsal={handleAddRehearsal}
          bandId={currentActiveBandId}
          bandName={currentActiveBandName}
          bandLogoUrl={currentActiveBandLogo}
          bandPlan={currentActiveBandPlan}
        />

        <GlobalPlayer
          colors={colors}
          onOpenStudio={handleOpenStudio}
          onOpenIris={handleOpenIris}
        />
      </div>
    </PlayerProvider>
  );
}
