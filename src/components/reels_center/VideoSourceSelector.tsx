/**
 * Selector entre vídeo local y enlace de YouTube.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Button } from "../ui";
import { ShowIcon } from "../ui/ShowIcon";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Selector entre vídeo local y enlace de YouTube.
 * @returns Sección de interfaz.
 */
export function VideoSourceSelector() {
  const { inputType, setInputType, setAnalysisError } = useReelsCenter();
  return (
    <>
      {/* Selector de Origen de Vídeo */}
      <div
      className="flex gap-1.5 p-1 rounded-[var(--r-m)] w-fit"
      style={{ borderColor: "#e2e8f0" }}
      >
      <Button
        variant={inputType === "file" ? "selected" : "ghost"}
        size="xs"
        type="button"
        onClick={() => {
          setInputType("file");
          setAnalysisError(null);
        }}
      >
        <ShowIcon inline emoji="📂" />Archivo de vídeo
      </Button>
      <Button
        variant={inputType === "youtube" ? "selected" : "ghost"}
        size="xs"
        type="button"
        onClick={() => {
          setInputType("youtube");
          setAnalysisError(null);
        }}
      >
        <ShowIcon inline emoji="📺" />Enlace de YouTube
      </Button>
      </div>
    </>
  );
}
