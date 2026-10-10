/**
 * Opciones del análisis: encuadre, subtítulos quemados y karaoke.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Input, Select } from "../ui";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Opciones del análisis: encuadre, subtítulos quemados y karaoke.
 * @returns Sección de interfaz.
 */
export function AnalysisOptions() {
  const { contentType, detectedContentType, setContentType, videoTopic, setVideoTopic, videoDuration, setVideoDuration } = useReelsCenter();
  return (
    <>
      {/* Configurations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-1">
        <label className="block text-micro font-sans text-[var(--ink-2)]">
          Tipo de material
          {contentType === "auto" && detectedContentType && (
            <span className="normal-case font-sans text-[var(--ink-2)]">
              {" "}
              (detectado: {detectedContentType})
            </span>
          )}
        </label>
        <Select
          size="sm"
          id="video-content-type-select"
          value={contentType}
          onChange={(e) =>
            setContentType(e.target.value as typeof contentType)
          }
          title="Un concierto, un videoclip y un ensayo se buscan y se titulan de forma distinta: cambia qué momentos prioriza la IA."
          wrapperClassName="w-full"
        >
          <option value="auto">Detectar automáticamente</option>
          <option value="concierto">Concierto / directo</option>
          <option value="videoclip">Videoclip</option>
          <option value="ensayo">Ensayo / local</option>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="block text-micro font-sans text-[var(--ink-2)]">
          Contexto / Anécdota de apoyo (IA)
        </label>
        <Input
          size="sm"
          id="video-topic-input"
          type="text"
          value={videoTopic}
          onChange={(e) => setVideoTopic(e.target.value)}
          placeholder="Ej: Solo de violín rápido o improvisación de loops con percusión…"
          className="w-full"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-micro font-sans text-[var(--ink-2)]">
          Límite de duración deseado
        </label>
        <Select
          size="sm"
          id="video-duration-select"
          value={videoDuration}
          onChange={(e) => setVideoDuration(Number(e.target.value))}
          wrapperClassName="w-full"
        >
          <option value={15}>
            15 segundos (Ideal para Reels cortos / Stories)
          </option>
          <option value={30}>
            30 segundos (Súper dinámico / Recomendado)
          </option>
          <option value={60}>
            60 segundos (Explicativo completo de bases)
          </option>
        </Select>
      </div>
      </div>
    </>
  );
}
