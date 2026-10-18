/**
 * Miembros disponibles de la banda y modo de impresión (todos, uno o maestra).
 * Extraído de PdfExportModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { BandMemberOption, resolveBandMembers } from "../../../../utils/repertorioUtils";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface PrintMembersParams {
  bandMembers: BandMemberOption[];
}

/**
 * Miembros disponibles de la banda y modo de impresión (todos, uno o maestra).
 * @param params Estado y callbacks del contenedor ({@link PrintMembersParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function usePrintMembers({ bandMembers }: PrintMembersParams) {
  const resolvedMembers = resolveBandMembers(bandMembers);

  // Print mode:'all_members' |'single_member' |'master'
  const [printMode, setPrintMode] = useState<
    "all_members" | "single_member" | "master"
  >("all_members");

  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    resolvedMembers[0]?.id || "member-1",
  );

  return { resolvedMembers, selectedMemberId, printMode, setPrintMode, setSelectedMemberId };
}
