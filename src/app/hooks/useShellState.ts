/**
 * Estado del armazón: menú móvil, chat flotante y grupos de navegación.
 * Extraído de App.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useCallback,useEffect,useState } from "react";
import { findNavGroupIdForItem } from "../../config/navGroups";

/**
 * Estado del armazón: menú móvil, chat flotante y grupos de navegación.
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useShellState() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [openGroupSheetId, setOpenGroupSheetId] = useState<string | null>(null);

  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);

  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleChatLoadingChange = useCallback((loading: boolean) => {
    setTimeout(() => {
      setIsChatLoading(loading);
    }, 0);
  }, []);

  const [showBandSwitcherModal, setShowBandSwitcherModal] = useState(false);

  const [openNavGroupIds, setOpenNavGroupIds] = useState<
    Record<string, boolean>
  >(() => {
    try {
      const stored = localStorage.getItem("bm_nav_open_groups");
      if (stored) return JSON.parse(stored);
    } catch {
      /* localStorage no disponible o corrupto: se ignora */
    }
    const initialGroupId = findNavGroupIdForItem("resumen");
    return initialGroupId ? { [initialGroupId]: true } : {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "bm_nav_open_groups",
        JSON.stringify(openNavGroupIds),
      );
    } catch {
      /* localStorage no disponible: el toggle sigue funcionando en memoria */
    }
  }, [openNavGroupIds]);

  return { setIsMobileMenuOpen, setOpenNavGroupIds, setShowBandSwitcherModal, openGroupSheetId, isMobileMenuOpen, setOpenGroupSheetId, openNavGroupIds, handleChatLoadingChange, isFloatingChatOpen, setIsFloatingChatOpen, isChatLoading, showBandSwitcherModal };
}
