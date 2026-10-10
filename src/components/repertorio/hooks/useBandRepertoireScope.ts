import type { User } from "../../../types";
/**
 * Identidad normalizada de la banda, roster real y saneado estructural de canciones y setlists.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
 
import React,{ useMemo } from "react";
import { Setlist,Song } from "../../../types";
import { BandMemberOption,resolveBandMembers } from "../../../utils/repertorioUtils";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BandRepertoireScopeParams {
  bandId: string;
  bandUsers: User[];
}

/**
 * Identidad normalizada de la banda, roster real y saneado estructural de canciones y setlists.
 * @param params Estado y callbacks del contenedor ({@link BandRepertoireScopeParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBandRepertoireScope({ bandId, bandUsers }: BandRepertoireScopeParams) {
  const cleanBand = (bandId || "").replace(/^(band|reg)-/, "").toLowerCase();

  // El roster sale siempre de los miembros reales de la banda (bandUsers, ya filtrados por
  // banda en el servidor): ninguna banda lleva una plantilla de músicos embebida.
  const bandRosterMembers: BandMemberOption[] = useMemo(() => resolveBandMembers(bandUsers), [bandUsers]);

  // El servidor ya aísla canciones y setlists por banda; aquí solo se descartan entradas mal formadas.
  const sanitizeBandSongs = React.useCallback(
    (rawList: Song[]): Song[] => (Array.isArray(rawList) ? rawList.filter((s) => s && typeof s === "object") : []),
    [],
  );

  const sanitizeBandSetlists = React.useCallback(
    (rawList: Setlist[]): Setlist[] => (Array.isArray(rawList) ? rawList.filter((sl) => sl && typeof sl === "object") : []),
    [],
  );

  return { cleanBand, sanitizeBandSongs, sanitizeBandSetlists, bandRosterMembers };
}
