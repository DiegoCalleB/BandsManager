import { useCallback, useEffect, useState } from "react";
import { sobrescribirModulo } from "../utils/moduloGlobal";

/** Pestaña principal del módulo Repertorio. */
export type RepertorioTab = "catalogo" | "setlists";

/** Modo de vista dentro de la pestaña de catálogo. */
export type CatalogoViewMode = "albumes" | "canciones";

/** Estado de navegación derivado de la prop `view` de la aplicación. */
export interface RepertorioTabState {
  tab: RepertorioTab;
  /** `null` cuando la pestaña no es el catálogo: se conserva el modo elegido. */
  catalogoMode: CatalogoViewMode | null;
}

/**
 * Traduce la vista del sidebar a pestaña y modo de catálogo.
 * Función pura: cualquier valor desconocido (incluido el antiguo `directo`)
 * aterriza en Repertorio en lugar de en una vista muerta.
 */
export function resolveRepertorioTab(view: string | undefined): RepertorioTabState {
  if (view === "catalogo") return { tab: "catalogo", catalogoMode: "canciones" };
  if (view === "discografia") return { tab: "catalogo", catalogoMode: "albumes" };
  return { tab: "setlists", catalogoMode: null };
}

/**
 * Gestiona la navegación interna del módulo Repertorio: pestaña activa, modo del
 * catálogo, sincronización con la vista externa y acento global del módulo.
 *
 * @param view Vista activa de la aplicación (`repertorio`, `catalogo`, `discografia`...).
 * @param onNavigate Callback opcional para notificar el cambio de pestaña a la app.
 */
export function useRepertorioTabs(
  view: string | undefined,
  onNavigate?: (view: string) => void,
) {
  const [activeTab, setActiveTab] = useState<RepertorioTab>("setlists");
  const [catalogoViewMode, setCatalogoViewMode] =
    useState<CatalogoViewMode>("albumes");

  // El acento global (sidebar, modales) sigue a la subpestaña: Discografía tiene su propio verde.
  useEffect(() => {
    sobrescribirModulo(activeTab === "catalogo" ? "discografia" : null);
    return () => sobrescribirModulo(null);
  }, [activeTab]);

  // Sincroniza con la prop `view` (navegación desde el sidebar) ajustando el estado
  // durante el render, patrón recomendado por React en lugar de un efecto con setState.
  const [syncedView, setSyncedView] = useState<string | undefined>(undefined);
  const [hasSynced, setHasSynced] = useState(false);
  if (!hasSynced || syncedView !== view) {
    const { tab, catalogoMode } = resolveRepertorioTab(view);
    setHasSynced(true);
    setSyncedView(view);
    setActiveTab(tab);
    if (catalogoMode) setCatalogoViewMode(catalogoMode);
  }

  const handleTabChange = useCallback(
    (newTab: RepertorioTab) => {
      setActiveTab(newTab);
      onNavigate?.(newTab === "setlists" ? "repertorio" : "discografia");
    },
    [onNavigate],
  );

  return {
    activeTab,
    catalogoViewMode,
    setCatalogoViewMode,
    handleTabChange,
  };
}
