import type { User } from "../../../types";
/**
 * Aislamiento por banda de los datos de plantilla: identidad normalizada de la banda, roster real y saneado de canciones y setlists de ejemplo ajenos.
 * Extraído de RepertorioSetlists.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
 
import React,{ useMemo } from "react";
import { BAKANDEYA_DEMO_MEMBERS } from "../../../config/defaultRepertoire";
import { Setlist,Song } from "../../../types";
import { BandMemberOption,resolveBandMembers } from "../../../utils/repertorioUtils";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BandRepertoireScopeParams {
  bandId: string;
  bandUsers: User[];
}

/**
 * Aislamiento por banda de los datos de plantilla: identidad normalizada de la banda, roster real y saneado de canciones y setlists de ejemplo ajenos.
 * @param params Estado y callbacks del contenedor ({@link BandRepertoireScopeParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBandRepertoireScope({ bandId, bandUsers }: BandRepertoireScopeParams) {
  const cleanBand = (bandId || "").replace(/^(band|reg)-/, "").toLowerCase();
  const isBakandeya = cleanBand === "bakandeya";
  const isMasterOfPrompts = cleanBand === "master-of-prompts";

  // Plantilla de Bakandeya solo para la propia Bakandeya; el resto de bandas ven a sus
  // miembros reales (bandUsers, ya filtrados por banda en el servidor) y nunca el roster
  // de otra banda — este mismo bug (ver MemberNotesModal/PdfExportModal/SongModal más abajo)
  // hacía que cualquier banda viera hardcodeados los músicos de Bakandeya en"Repertorios".
  const bandRosterMembers: BandMemberOption[] = useMemo(() => {
    if (isBakandeya) return BAKANDEYA_DEMO_MEMBERS;
    return resolveBandMembers(bandUsers);
  }, [isBakandeya, bandUsers]);

  // Helper to filter out template songs for non-Bakandeya bands
  const sanitizeBandSongs = React.useCallback(
    (rawList: Song[]): Song[] => {
      if (!Array.isArray(rawList)) return [];
      if (isBakandeya) return rawList;
      return rawList.filter((s) => {
        if (!s || typeof s !== "object") return false;
        const sId = (s.id || "").toLowerCase();
        if (sId.startsWith("mop-song-") && isMasterOfPrompts) return true;
        if (sId.startsWith("sample-track-")) return true;
        if (
          sId.startsWith("song-cm-") ||
          /^song-[1-8]$/.test(sId) ||
          sId.startsWith("live_song_")
        ) {
          return false;
        }
        return true;
      });
    },
    [isBakandeya, isMasterOfPrompts],
  );

  const sanitizeBandSetlists = React.useCallback(
    (rawList: Setlist[]): Setlist[] => {
      if (!Array.isArray(rawList)) return [];
      if (isBakandeya) return rawList;
      return rawList.filter((sl) => {
        if (!sl || typeof sl !== "object") return false;
        const slId = (sl.id || "").toLowerCase();
        if (slId.startsWith("setlist-sample-")) return true;
        if (slId === "setlist-1" || slId === "setlist-2") return false;
        return true;
      });
    },
    [isBakandeya],
  );

  return { cleanBand, isBakandeya, sanitizeBandSongs, sanitizeBandSetlists, bandRosterMembers };
}
