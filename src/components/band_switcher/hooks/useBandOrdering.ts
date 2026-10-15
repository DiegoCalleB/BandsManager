/**
 * Orden de bandas del usuario y su persistencia.
 * Extraído de BandSwitcherModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect,useState } from "react";
import { api } from "../../../services/api";
import { User } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BandOrderingParams {
  currentUser: User;
}

/**
 * Orden de bandas del usuario y su persistencia.
 * @param params Estado y callbacks del contenedor ({@link BandOrderingParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBandOrdering({ currentUser }: BandOrderingParams) {
  const [bandOrder, setBandOrder] = useState<string[]>(() => {
    if (
      currentUser?.band_order &&
      Array.isArray(currentUser.band_order) &&
      currentUser.band_order.length > 0
    ) {
      return currentUser.band_order;
    }
    try {
      const saved = localStorage.getItem(
        `bandmanager_band_order_${currentUser?.id || "default"}`,
      );
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync if currentUser updates
  useEffect(() => {
    if (
      currentUser?.band_order &&
      Array.isArray(currentUser.band_order) &&
      currentUser.band_order.length > 0
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el estado local con el usuario actualizado
      setBandOrder(currentUser.band_order);
    }
  }, [currentUser?.band_order]);

  const saveOrder = async (newOrder: string[]) => {
    setBandOrder(newOrder);
    try {
      localStorage.setItem(
        `bandmanager_band_order_${currentUser?.id || "default"}`,
        JSON.stringify(newOrder),
      );
    } catch (e) {
      console.warn("Could not save band order locally:", e);
    }
    try {
      await api.setBandOrder(newOrder);
    } catch (e) {
      console.warn("Could not sync band order to database:", e);
    }
  };

  return { bandOrder, saveOrder };
}
