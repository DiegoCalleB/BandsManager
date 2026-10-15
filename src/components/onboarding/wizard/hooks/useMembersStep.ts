/**
 * Paso de miembros de la banda.
 * Extraído de OnboardingWizardModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { EPKConfig,User } from "../../../../types";
import { WizardMemberItem } from "../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface MembersStepParams {
  epkConfig: EPKConfig;
  currentUser: User;
}

/**
 * Paso de miembros de la banda.
 * @param params Estado y callbacks del contenedor ({@link MembersStepParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useMembersStep({ epkConfig, currentUser }: MembersStepParams) {
  // --- Step 3: Miembros ---
  const [members, setMembers] = useState<WizardMemberItem[]>(() => {
    if (epkConfig?.miembros && epkConfig.miembros.length > 0) {
      return epkConfig.miembros.map((m, idx) => ({
        id: m.id || `m_${idx}_${Date.now()}`,
        name: m.nombre,
        role: m.rol || "Músico",
        email: "",
        instagram: m.instagram || "",
        isLeader: idx === 0,
      }));
    }
    return [
      {
        id: "leader",
        name: currentUser?.name || "Tú (Líder)",
        role: "Voz / Guitarra",
        email: currentUser?.email || "",
        instagram: "",
        isLeader: true,
      },
    ];
  });

  const [newMemberName, setNewMemberName] = useState("");

  const [newMemberRole, setNewMemberRole] = useState("");

  const [newMemberEmail, setNewMemberEmail] = useState("");

  const [newMemberInstagram, setNewMemberInstagram] = useState("");

  // Members Add/Remove
  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    const newMember: WizardMemberItem = {
      id: `m_${Date.now()}`,
      name: newMemberName.trim(),
      role: newMemberRole.trim() || "Músico",
      email: newMemberEmail.trim(),
      instagram: newMemberInstagram.trim(),
    };
    setMembers((prev) => [...prev, newMember]);
    setNewMemberName("");
    setNewMemberRole("");
    setNewMemberEmail("");
    setNewMemberInstagram("");
  };

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return { members, setMembers, setNewMemberName, setNewMemberRole, setNewMemberEmail, setNewMemberInstagram, newMemberName, newMemberRole, newMemberEmail, newMemberInstagram, handleAddMember, handleRemoveMember };
}
