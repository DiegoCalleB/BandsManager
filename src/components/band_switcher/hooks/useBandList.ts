/**
 * Lista única y ordenada de bandas del usuario con su logo.
 * Extraído de BandSwitcherModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { User } from "../../../types";
import { cleanBandId,isSameBandId } from "../../../utils/bandUtils";
import type { SwitcherBand,SwitcherEpkConfig } from "../bandSwitcherTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BandListParams {
  availableBands: SwitcherBand[];
  customLogos: Record<string, string>;
  currentActiveBandId: string;
  epkConfig: SwitcherEpkConfig | undefined;
  currentUser: User;
  activeClean: string;
  mainBandId: string;
  bandOrder: string[];
}

/**
 * Lista única y ordenada de bandas del usuario con su logo.
 * @param params Estado y callbacks del contenedor ({@link BandListParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBandList({ availableBands, customLogos, currentActiveBandId, epkConfig, currentUser, activeClean, mainBandId, bandOrder }: BandListParams) {
  // Ensure unique list of bands mapped by clean band ID
  const bandListMap = new Map<
    string,
    {
      band_id: string;
      bandName: string;
      role?: string;
      logoUrl?: string;
      plan?: string;
    }
  >();

  if (availableBands && availableBands.length > 0) {
    availableBands.forEach((b) => {
      const bid = b.band_id;
      if (bid) {
        const clean = cleanBandId(bid);
        let logo =
          customLogos[clean] ||
          b.logoUrl ||
          b.logo_url ||
          b.imagen_url ||
          "";
        if (
          isSameBandId(bid, currentActiveBandId) &&
          epkConfig?.logoUrl &&
          !customLogos[clean]
        ) {
          logo = epkConfig.logoUrl;
        }
        if (!bandListMap.has(clean)) {
          bandListMap.set(clean, {
            band_id: bid,
            bandName: b.bandName || "Banda",
            role: b.role || "member",
            logoUrl: logo,
            plan:
              b.plan ||
              (isSameBandId(bid, currentActiveBandId)
                ? currentUser?.plan
                : "emergente"),
          });
        }
      }
    });
  }

  // Ensure active band is present
  if (!bandListMap.has(activeClean)) {
    const logo = customLogos[activeClean] || epkConfig?.logoUrl || "";
    bandListMap.set(activeClean, {
      band_id: currentActiveBandId,
      bandName: currentUser?.bandName || currentUser?.name || "Banda",
      role: currentUser?.role || "leader",
      logoUrl: logo,
      plan: currentUser?.plan || "ensayo",
    });
  }

  const rawBands = Array.from(bandListMap.values());

  const uniqueBands = [...rawBands].sort((a, b) => {
    const aIsMain = isSameBandId(a.band_id, mainBandId);
    const bIsMain = isSameBandId(b.band_id, mainBandId);
    if (aIsMain && !bIsMain) return -1;
    if (!aIsMain && bIsMain) return 1;

    const aIdx = bandOrder.indexOf(cleanBandId(a.band_id));
    const bIdx = bandOrder.indexOf(cleanBandId(b.band_id));
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.bandName.localeCompare(b.bandName);
  });

  return { uniqueBands };
}
