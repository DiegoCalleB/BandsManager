/**
 * Vista actual, navegación, notificaciones y sección del CRM.
 * Extraído de App.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch,SetStateAction,useCallback,useEffect,useState } from "react";
import { findNavGroupIdForItem } from "../../config/navGroups";
import type { SupportedLanguage } from "../../context/LanguageContext";
import { useBrowserPushNotifications } from "../../hooks/useBrowserPushNotifications";
import { api } from "../../services/api";
import type { Message } from "../../types";
import { Lead,LeadStatus } from "../../types";
import { aplicarModuloDeVista } from "../../utils/moduloGlobal";
import { hasModuleAccess } from "../../utils/planPermissions";
import type { MainView } from "../appViews";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface AppNavigationParams {
  language: SupportedLanguage;
  refreshTranslation: () => void;
  isLoggedIn: boolean;
  currentActiveBandPlan: "promo" | "promo_plus" | "ensayo" | "local" | "de_gira" | "cabeza_de_cartel";
  isAdmin: boolean;
  setShowUserProfileModal: Dispatch<SetStateAction<boolean>>;
  isPromoPlan: boolean;
  setIsMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
  setOpenNavGroupIds: Dispatch<SetStateAction<Record<string, boolean>>>;
  leads: Lead[];
  messages: Message[];
  currentActiveBandId: string;
}

/**
 * Vista actual, navegación, notificaciones y sección del CRM.
 * @param params Estado y callbacks del contenedor ({@link AppNavigationParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAppNavigation({ language, refreshTranslation, isLoggedIn, currentActiveBandPlan, isAdmin, setShowUserProfileModal, isPromoPlan, setIsMobileMenuOpen, setOpenNavGroupIds, leads, messages, currentActiveBandId }: AppNavigationParams) {
  // Active View State mapping directly to the Stitch Design doc
  const VALID_VIEWS: MainView[] = [
    "resumen",
    "booking",
    "medios",
    "management",
    "bandas",
    "calendario",
    "ensayos",
    "reels",
    "repertorio",
    "catalogo",
    "discografia",
    "finanzas",
    "chat",
    "giras",
    "merchan",
    "epk",
    "fans",
    "planes",
  ];

  const CURRENT_VIEW_STORAGE_KEY = "bandmanager_current_view";

  const [currentView, setCurrentView] = useState<MainView>(() => {
    // 1. Soporte para enlaces directos con parámetros de vista en URL (?view=calendario, ?modulo=..., ?tab=...)
    try {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const rawViewParam = (
          urlParams.get("view") ||
          urlParams.get("modulo") ||
          urlParams.get("module") ||
          urlParams.get("tab")
        )?.toLowerCase();

        const resolvedView =
          rawViewParam === "calendar"
            ? "calendario"
            : rawViewParam === "repertoire"
              ? "repertorio"
              : rawViewParam === "tours"
                ? "giras"
                : rawViewParam;

        if (resolvedView && (VALID_VIEWS as string[]).includes(resolvedView)) {
          return resolvedView as MainView;
        }
      }
    } catch {
      // Fallback seguro
    }

    // 2. Recordar la última pantalla entre recargas (F5)
    try {
      const saved = localStorage.getItem(CURRENT_VIEW_STORAGE_KEY);
      const migrated = saved === "directo" ? "repertorio" : saved;
      if (migrated && (VALID_VIEWS as string[]).includes(migrated))
        return migrated as MainView;
    } catch {
      // localStorage puede no estar disponible
    }
    return "resumen";
  });

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const rawViewParam = (
        urlParams.get("view") ||
        urlParams.get("modulo") ||
        urlParams.get("module") ||
        urlParams.get("tab")
      )?.toLowerCase();

      const resolvedView =
        rawViewParam === "calendar"
          ? "calendario"
          : rawViewParam === "repertoire"
            ? "repertorio"
            : rawViewParam === "tours"
              ? "giras"
              : rawViewParam;

      if (resolvedView && (VALID_VIEWS as string[]).includes(resolvedView)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza la vista con la URL, el plan y el almacenamiento
        setCurrentView(resolvedView as MainView);
      }
    } catch {
      // Ignorado a propósito
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_VIEW_STORAGE_KEY, currentView);
    } catch {
      // Ignorado a propósito: perder la persistencia de la vista no debe romper la navegación.
    }
    if (language !== "es") {
      refreshTranslation();
    }
  }, [currentView, language]);

  useEffect(() => {
    aplicarModuloDeVista(isLoggedIn ? currentView : null);
  }, [isLoggedIn, currentView]);

  // Si la vista actual no está permitida para el plan de la banda activa (ej. plan Promo), redirigir inmediatamente a'resumen'
  useEffect(() => {
    if (!hasModuleAccess(currentActiveBandPlan, currentView)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza la vista con la URL, el plan y el almacenamiento
      setCurrentView("resumen");
    }
  }, [currentActiveBandPlan, currentView]);

  const [bookingOptions, setBookingOptions] = useState<{
    sectionTab?: "salas" | "medios" | "grupos";
    statusFilter?: LeadStatus | "todos" | string;
    selectedLeadId?: string;
    selectedEventId?: string;
    selectedDate?: string;
    concertId?: string;
  }>({});

  const handleNavigate = (
    view: MainView,
    options?: {
      sectionTab?: "salas" | "medios" | "grupos";
      statusFilter?: LeadStatus | "todos" | string;
      selectedLeadId?: string;
      selectedEventId?: string;
      selectedDate?: string;
      concertId?: string;
    },
  ) => {
    // Antes, si el plan no incluía el módulo, el código igualmente navegaba a `view` salvo para
    //'finanzas' (el único caso con un `return` real): el control de acceso por plan no bloqueaba
    // nada en el resto de módulos. Y en finanzas, el bloqueo dependía de `isAdmin`, no del plan
    // contratado, así que un admin con un plan que no incluye finanzas entra igualmente.
    if (view === "finanzas" && !isAdmin) {
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
        prev[targetGroupId] ? prev : { ...prev, [targetGroupId]: true },
      );
    }
    if (options) {
      setBookingOptions({
        sectionTab:
          view === "medios"
            ? "medios"
            : view === "management"
              ? "grupos"
              : view === "booking"
                ? "salas"
                : undefined,
        ...options,
      });
    } else if (view === "medios") {
      setBookingOptions({ sectionTab: "medios", statusFilter: "todos" });
    } else if (view === "management") {
      setBookingOptions({ sectionTab: "grupos", statusFilter: "todos" });
    } else if (view === "booking") {
      setBookingOptions({ sectionTab: "salas", statusFilter: "todos" });
    } else {
      setBookingOptions({});
    }
  };

  // Browser Push Notifications Engine & State
  const {
    permission: notificationPermission,
    config: notificationConfig,
    history: notificationHistory,
    unreadCount: notificationUnreadCount,
    requestPermission: requestNotificationPermission,
    updateConfig: updateNotificationConfig,
    markAllAsRead: markAllNotificationsAsRead,
    markAsRead: markNotificationAsRead,
    clearHistory: clearNotificationHistory,
    triggerTest: triggerTestNotification,
    triggerTestSound: triggerTestNotificationSound,
  } = useBrowserPushNotifications({
    leads,
    messages,
    isLoggedIn,
    onSelectLead: (leadId) => {
      handleNavigate("booking", { selectedLeadId: leadId });
    },
  });

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
    (section: "salas" | "medios" | "grupos" | "bandas") => {
      if (section === "bandas") {
        setCurrentView((prev) => {
          if (prev !== "bandas") {
            const targetGroupId = findNavGroupIdForItem("bandas");
            if (targetGroupId) {
              setOpenNavGroupIds((openPrev) =>
                openPrev[targetGroupId]
                  ? openPrev
                  : { ...openPrev, [targetGroupId]: true },
              );
            }
            return "bandas";
          }
          return prev;
        });
        return;
      }

      const targetView: "booking" | "medios" | "management" =
        section === "medios"
          ? "medios"
          : section === "grupos"
            ? "management"
            : "booking";

      setCurrentView((prev) => {
        if (prev !== targetView) {
          const targetGroupId = findNavGroupIdForItem(targetView);
          if (targetGroupId) {
            setOpenNavGroupIds((openPrev) =>
              openPrev[targetGroupId]
                ? openPrev
                : { ...openPrev, [targetGroupId]: true },
            );
          }
          return targetView;
        }
        return prev;
      });

      setBookingOptions((prev) => ({
        ...prev,
        sectionTab: section,
        statusFilter: "todos",
      }));
    },
    [],
  );

  // Redirect non-admins away from finanzas if they end up there
  useEffect(() => {
    if (!isAdmin && (currentView as string) === "finanzas") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza la vista con la URL, el plan y el almacenamiento
      setCurrentView("resumen");
    }
  }, [isAdmin, currentView]);

  return { bandsCount, currentView, notificationPermission, notificationConfig, notificationHistory, notificationUnreadCount, requestNotificationPermission, markAllNotificationsAsRead, markNotificationAsRead, clearNotificationHistory, handleNavigate, bookingOptions, handleCrmSectionChange, updateNotificationConfig, triggerTestNotification, triggerTestNotificationSound };
}
