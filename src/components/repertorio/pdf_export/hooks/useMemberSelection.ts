/**
 * Miembros cuya hoja se imprime y miembro mostrado en la vista previa.
 * Extraído de PdfExportModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { BandMemberOption } from "../../../../utils/repertorioUtils";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface MemberSelectionParams {
  resolvedMembers: BandMemberOption[];
  selectedMemberId: string;
  printMode: "all_members" | "single_member" | "master";
}

/**
 * Miembros cuya hoja se imprime y miembro mostrado en la vista previa.
 * @param params Estado y callbacks del contenedor ({@link MemberSelectionParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useMemberSelection({ resolvedMembers, selectedMemberId, printMode }: MemberSelectionParams) {
  // Preview Pagination
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(0);

  const selectedMember = resolvedMembers.find(
    (m) => m.id === selectedMemberId,
  ) ||
    resolvedMembers[0] || {
      id: "usr-1",
      name: "Músico",
      instrument: "Instrumento",
    };

  const membersToExport =
    printMode === "single_member"
      ? [selectedMember]
      : printMode === "all_members"
        ? resolvedMembers
        : [
            {
              id: "master",
              name: "Master Escenario / Sonido",
              instrument: "Técnico FOH / Backstage",
            },
          ];

  // Preview page member
  // Una banda sin miembros cargados deja `membersToExport` vacío en «todos los miembros»: se cae al
  // músico por defecto para que la vista previa (y las marcas por miembro) nunca reciban `undefined`.
  const currentPreviewMember =
    membersToExport[previewPageIndex] || membersToExport[0] || selectedMember;

  return { currentPreviewMember, previewPageIndex, membersToExport, setPreviewPageIndex };
}
