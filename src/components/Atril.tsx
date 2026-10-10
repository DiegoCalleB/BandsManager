/**
 * Atril: cifrado, audio, estructura y herramientas de estudio de un tema.
 * Contenedor: controlador + proveedor + vista (Strangler Fig, AGENTS.md §5.6).
 */
import type { Song } from "../types";
import type { ModoAtril } from "../utils/modosAtril";
import { AtrilProvider } from "./atril/AtrilProvider";
import { AtrilView } from "./atril/AtrilView";
import { useAtrilController } from "./atril/hooks/useAtrilController";

export { renderFormattedChordSheet } from "./atril/chordSheetRender";

export interface AtrilProps {
  cancion: Song;
  /** Estudiar / Ensayar / Tocar: decide qué se ve y qué suena al abrir. */
  modo?: ModoAtril;
  onClose: () => void;
  onUpdateSong: (updated: Song) => void;
}

/** Props con los valores por defecto ya aplicados. */
export type ResolvedAtrilProps = Omit<AtrilProps, "cancion" | "modo"> & { song: Song; modo: ModoAtril };

/**
 * Atril de un tema.
 * @param props Tema, modo (Estudiar, Ensayar o Tocar) y callbacks de cierre y actualización.
 * @returns El Atril con su contexto.
 */
export function Atril({ cancion, modo = "Estudiar", ...props }: AtrilProps) {
  const resolved: ResolvedAtrilProps = { ...props, song: cancion, modo };
  const controller = useAtrilController(resolved);
  return (
    <AtrilProvider value={{ ...controller, ...resolved }}>
      <AtrilView />
    </AtrilProvider>
  );
}
