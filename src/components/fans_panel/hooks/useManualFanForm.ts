/**
 * Alta manual de un fan.
 * Extraído de FansPanel.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ useState } from "react";
import { Fan } from "../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ManualFanFormParams {
  onAddFan: (fan: Fan) => void;
}

/**
 * Alta manual de un fan.
 * @param params Estado y callbacks del contenedor ({@link ManualFanFormParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useManualFanForm({ onAddFan }: ManualFanFormParams) {
  // Manual Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);

  const [newNombre, setNewNombre] = useState("");

  const [newEmail, setNewEmail] = useState("");

  const [newCiudad, setNewCiudad] = useState("");

  const [newOrigen, setNewOrigen] = useState("Manual");

  const [newCancionFavorita, setNewCancionFavorita] = useState("");

  const [newInstagram, setNewInstagram] = useState("");

  const [newMensaje, setNewMensaje] = useState("");

  const [newNivel, setNewNivel] = useState<
    "fiel" | "superfan" | "fundador" | "backstage"
  >("fiel");

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim() || !newEmail.trim()) return;

    const fan: Fan = {
      id: `fan-${Date.now()}`,
      nombre: newNombre.trim(),
      email: newEmail.trim(),
      ciudad: newCiudad.trim() || undefined,
      comoConocio: newOrigen,
      cancionFavorita: newCancionFavorita.trim() || undefined,
      instagram: newInstagram.trim().replace(/^@/, "") || undefined,
      mensaje: newMensaje.trim() || undefined,
      nivelFan: newNivel,
      reacciones: { likes: 1, fire: 0, applause: 0, guitars: 0 },
      fechaCaptura: new Date().toISOString().split("T")[0],
      consentimientoRGPD: true,
    };
    onAddFan(fan);
    setShowAddModal(false);
    setNewNombre("");
    setNewEmail("");
    setNewCiudad("");
    setNewOrigen("Manual");
    setNewCancionFavorita("");
    setNewInstagram("");
    setNewMensaje("");
    setNewNivel("fiel");
  };

  return { setShowAddModal, showAddModal, handleManualAddSubmit, newNombre, setNewNombre, newEmail, setNewEmail, newCiudad, setNewCiudad, newOrigen, setNewOrigen, newNivel, setNewNivel, newInstagram, setNewInstagram, newCancionFavorita, setNewCancionFavorita, newMensaje, setNewMensaje };
}
