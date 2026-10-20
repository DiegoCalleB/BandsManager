/**
 * Pestañas del Atril. Viven en la cabecera, en la misma fila que el título, para no gastar una fila entera.
 */
import { Edit3,FileText,GraduationCap,UserCheck } from "lucide-react";
import { Button } from "../ui";
import { useAtril } from "./AtrilContext";

/**
 * Selector de pestañas: letra y acordes, armonía y la que esté abierta (edición o ficha de sustituto).
 * @returns Sección de interfaz.
 */
export function AtrilTabs() {
  const { activeTab, setActiveTab } = useAtril();
  return (
    <div className="flex items-center bg-[var(--surface)] p-1 rounded-[var(--r-m)]">
      <Button
        variant={activeTab === "chords" ? "selected" : "ghost"}
        size="xs"
        type="button"
        onClick={() => setActiveTab("chords")}
        className="items-center gap-1.5"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>Letra y acordes</span>
      </Button>

      <Button
        variant={activeTab === "armonia" ? "selected" : "ghost"}
        size="xs"
        type="button"
        onClick={() => setActiveTab("armonia")}
        className="items-center gap-1.5"
        title="Tonalidad, modo, grados y qué tocar sobre cada acorde"
      >
        <GraduationCap className="w-3.5 h-3.5" />
        <span>Armonía</span>
      </Button>

      {(activeTab === "substitute" || activeTab === "edit") && (
        <Button variant="selected" size="xs" type="button" className="items-center gap-1.5">
          {activeTab === "edit" ? <Edit3 className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
          <span>{activeTab === "edit" ? "Editar" : "Ficha sustituto urgente"}</span>
        </Button>
      )}
    </div>
  );
}
