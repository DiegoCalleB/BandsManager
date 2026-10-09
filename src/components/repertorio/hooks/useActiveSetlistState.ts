/**
 * Setlist activo recordado entre sesiones, modo de ejecución en escenario y atajos personalizados del setlist.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
 
import { useEffect,useMemo,useState } from "react";
import { Setlist,SetlistShortcut } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ActiveSetlistStateParams {
  setlists: Setlist[];
}

/**
 * Setlist activo recordado entre sesiones, modo de ejecución en escenario y atajos personalizados del setlist.
 * @param params Estado y callbacks del contenedor ({@link ActiveSetlistStateParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useActiveSetlistState({ setlists }: ActiveSetlistStateParams) {
  // Selected Active Setlist ID
  // Recuerda el último setlist con el que se trabajó entre sesiones/recargas, para no tener que
  // volver a buscarlo cada vez que se entra al módulo. Si el id guardado ya no existe (se borró
  // el setlist, o `setlists` aún no ha cargado en este render), activeSetlist más abajo ya cae a
  // setlists[0] como fallback — no hace falta validar aquí.
  const ACTIVE_SETLIST_STORAGE_KEY = "bandmanager_active_setlist_id";
  const [activeSetlistId, setActiveSetlistId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_SETLIST_STORAGE_KEY);
      if (saved) return saved;
    } catch {
      // localStorage puede no estar disponible (modo privado estricto, etc.)
    }
    return setlists[0]?.id || "";
  });

  useEffect(() => {
    if (!activeSetlistId) return;
    try {
      localStorage.setItem(ACTIVE_SETLIST_STORAGE_KEY, activeSetlistId);
    } catch {
      // Ignorado a propósito: perder la persistencia no debe romper la navegación.
    }
  }, [activeSetlistId]);

  const activeSetlist = useMemo(
    () => setlists.find((s) => s.id === activeSetlistId) || setlists[0] || null,
    [setlists, activeSetlistId],
  );

  // Performance mode for showing song structures during concert
  const [performanceSetlistId, setPerformanceSetlistId] = useState<
    string | null
  >(null);
  const [performanceInitialMode, setPerformanceInitialMode] = useState<
    "directo" | "ensayo"
  >("directo");

  // Custom"quick add" shortcuts the band created itself for the"Rápidos" row below, on top of
  // the built-in ones (Presentación, Chapa, BIS...). Persisted per band in Supabase via
  // /api/setlist-shortcuts so every member of the band sees the same set.
  const [customShortcuts, setCustomShortcuts] = useState<SetlistShortcut[]>([]);
  const [isAddingShortcut, setIsAddingShortcut] = useState(false);
  const [newShortcutIcon, setNewShortcutIcon] = useState("⭐");
  const [newShortcutLabel, setNewShortcutLabel] = useState("");

  return { activeSetlist, setActiveSetlistId, setCustomShortcuts, newShortcutLabel, newShortcutIcon, setNewShortcutLabel, setNewShortcutIcon, setIsAddingShortcut, activeSetlistId, setPerformanceInitialMode, setPerformanceSetlistId, customShortcuts, isAddingShortcut, performanceSetlistId, performanceInitialMode };
}
