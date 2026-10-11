/**
 * Insignias, grupos abiertos y eventos de la banda activa para la navegación.
 * Extraído de App.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ Dispatch,SetStateAction } from "react";
import { shouldGroupNavForPlan } from "../../config/navGroups";
import type { Concert,Rehearsal } from "../../types";
import { Lead } from "../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface NavStateParams {
  concerts: Concert[];
  isSameBand: (id1?: string, id2?: string, name1?: string, name2?: string) => boolean;
  currentActiveBandId: string;
  currentActiveBandName: string;
  rehearsals: Rehearsal[];
  leads: Lead[];
  bandsCount: number;
  currentActiveBandPlan: "promo" | "promo_plus" | "ensayo" | "local" | "de_gira" | "cabeza_de_cartel";
  setOpenNavGroupIds: Dispatch<SetStateAction<Record<string, boolean>>>;
}

/**
 * Insignias, grupos abiertos y eventos de la banda activa para la navegación.
 * @param params Estado y callbacks del contenedor ({@link NavStateParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useNavState({ concerts, isSameBand, currentActiveBandId, currentActiveBandName, rehearsals, leads, bandsCount, currentActiveBandPlan, setOpenNavGroupIds }: NavStateParams) {
  const activeBandConcerts = React.useMemo(() => {
    return concerts.filter((c) => {
      if (!c.band_id && !c.bandName) return false;
      return isSameBand(
        c.band_id,
        currentActiveBandId,
        c.bandName,
        currentActiveBandName,
      );
    });
  }, [concerts, currentActiveBandId, currentActiveBandName]);

  const activeBandRehearsals = React.useMemo(() => {
    return rehearsals.filter((r) => {
      if (!r.band_id && !r.bandName) return false;
      return isSameBand(
        r.band_id,
        currentActiveBandId,
        r.bandName,
        currentActiveBandName,
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
        s.includes("medio") ||
        s.includes("radio") ||
        s.includes("prensa") ||
        s.includes("tv") ||
        s.includes("podc")
      );
    };
    const isManagement = (l: Lead) => {
      if (!l.tipo) return false;
      const s = String(l.tipo).trim().toLowerCase();
      return [
        "agencia",
        "manager",
        "productora",
        "sello",
        "promotora",
        "management",
      ].some((t) => s.includes(t));
    };
    const isBanda = (l: Lead) => {
      if (!l.tipo) return false;
      const s = String(l.tipo).trim().toLowerCase();
      return (
        s === "grupo" ||
        s.includes("grup") ||
        s.includes("banda") ||
        s.includes("artist") ||
        s.includes("musico") ||
        s.includes("músico")
      );
    };
    const totalEvents = concerts.length + rehearsals.length;
    const activeEvents =
      activeBandConcerts.length + activeBandRehearsals.length;
    return {
      booking: leads.filter(
        (l) => !isMedio(l) && !isBanda(l) && !isManagement(l),
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

  return { navBadges, shouldGroupNav, toggleNavGroup, activeBandConcerts, activeBandRehearsals };
}
