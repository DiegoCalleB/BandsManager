import { Download, Edit3, FolderUp, Plus, Trash2 } from "lucide-react";
import type { Song } from "../../types";
import { tieneAudioReal } from "../../utils/audioDeCancion";
import type { ActionMenuItem } from "../ui/ActionMenu";

interface AccionesDeDisco {
  album: string;
  /** Canciones del disco, ya ordenadas. */
  canciones: Song[];
  onEditar?: () => void;
  onExportar: () => void;
  onAnadirCancion: () => void;
  /** Recibe solo las canciones que aún no tienen audio: ahí es donde se puede emparejar sin pisar nada. */
  onEmparejarAudios: (sinAudio: Song[]) => void;
  onEliminar?: () => void;
}

/**
 * Menú «⋯» de un disco. Añadir una canción (subiendo su audio) es la acción principal; poner audio a
 * una canción que ya existe se hace desde su propio menú, y el emparejado por lotes queda para los
 * temas que aún no tienen audio.
 */
export function accionesDeDisco({ album, canciones, onEditar, onExportar, onAnadirCancion, onEmparejarAudios, onEliminar }: AccionesDeDisco): ActionMenuItem[] {
  const sinAudio = canciones.filter((s) => !tieneAudioReal(s));
  const esSinDisco = album === "Singles / Sin Disco";
  return [
    { label: "Añadir canción", icon: Plus, hidden: esSinDisco, onSelect: onAnadirCancion },
    { label: `Emparejar audios (${sinAudio.length} sin audio)`, icon: FolderUp, hidden: sinAudio.length === 0, onSelect: () => onEmparejarAudios(sinAudio) },
    { label: "Editar disco y portada", icon: Edit3, hidden: !onEditar, onSelect: () => onEditar?.() },
    { label: "Exportar disco", icon: Download, hidden: canciones.length === 0, onSelect: onExportar },
    { label: "Eliminar álbum", icon: Trash2, tone: "danger", hidden: !onEliminar || esSinDisco, onSelect: () => onEliminar?.() },
  ];
}
