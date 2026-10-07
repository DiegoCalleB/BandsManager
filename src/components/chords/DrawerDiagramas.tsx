import React from "react";
import { X } from "lucide-react";
import { IconButton } from "../ui";
import { ShowIcon } from "../ui/ShowIcon";
import { ordenarPorTonica, type ContextoAcorde, type VistaAcorde } from "../../utils/vistaAcordes";
import { gradoVisible, type EstiloArmonia } from "../../utils/estiloArmonia";
import { CajaAcorde, SelectorVistaAcorde } from "./AcordeEnInstrumento";

interface Props {
  acordes: string[];
  contexto: Map<string, ContextoAcorde>;
  vista: VistaAcorde;
  onVista: (v: VistaAcorde) => void;
  onCerrar: () => void;
  /** Acorde que suena ahora mismo (se ilumina). */
  sonando?: string | null;
  /** Si se pasa, cada caja muestra su grado romano según el estilo elegido. */
  estiloArmonia?: EstiloArmonia;
  /** lateral = columna junto a la letra · tira = franja horizontal sobre la hoja. */
  disposicion?: "lateral" | "tira";
}

/** Cajón de diagramas de acordes: lo comparten el visor y el ensayo en vivo. */
export const DrawerDiagramas: React.FC<Props> = ({ acordes, contexto, vista, onVista, onCerrar, sonando, estiloArmonia, disposicion = "lateral" }) => {
  const lateral = disposicion === "lateral";
  const gradoDe = (chord: string) => {
    const info = contexto.get(chord)?.info;
    if (!estiloArmonia || estiloArmonia.mostrar === "nombre" || !info) return undefined;
    return gradoVisible(info.grado, estiloArmonia);
  };
  return (
    <div
      translate="no"
      className={lateral
        ? "notranslate w-full md:w-64 bg-[var(--sunken)] p-4 overflow-y-auto shrink-0 space-y-4"
        : "notranslate p-3.5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-2 animate-fade-in shrink-0"}
    >
      <div className="flex items-center justify-between gap-2 text-xs font-sans font-bold text-[var(--acc)]">
        <span className="flex items-center gap-1.5">
          <ShowIcon inline emoji="🎸" />{lateral ? "Acordes" : "Diagramas de Acordes de este Tema"} ({acordes.length})
        </span>
        {!lateral && <SelectorVistaAcorde vista={vista} onCambio={onVista} />}
        <IconButton label="Cerrar" onClick={onCerrar}><X className="w-3.5 h-3.5" /></IconButton>
      </div>
      {lateral && <SelectorVistaAcorde vista={vista} onCambio={onVista} />}
      {acordes.length === 0 ? (
        <p className="text-xs text-[var(--ink-2)] font-sans italic">No se detectaron acordes en el texto.</p>
      ) : (
        <div className={lateral ? "grid grid-cols-2 md:grid-cols-1 gap-3" : "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2"}>
          {ordenarPorTonica(acordes, contexto).map((chord) => (
            <CajaAcorde key={chord} chord={chord} vista={vista} contexto={contexto.get(chord)} sonando={chord === sonando} grado={gradoDe(chord)} />
          ))}
        </div>
      )}
    </div>
  );
};
