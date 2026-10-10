/**
 * Tarjeta de subida: título, selector de origen, entrada del vídeo, opciones y análisis.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Video } from "lucide-react";
import { AnalysisOptions } from "./AnalysisOptions";
import { AnalysisProgress } from "./AnalysisProgress";
import { AnalysisStatusNotices } from "./AnalysisStatusNotices";
import { AnalyzeButton } from "./AnalyzeButton";
import { RecoveredAnalysisNotice } from "./RecoveredAnalysisNotice";
import { useReelsCenter } from "./ReelsCenterContext";
import { VideoInputArea } from "./VideoInputArea";
import { VideoSourceSelector } from "./VideoSourceSelector";

/**
 * Tarjeta de subida: título, selector de origen, entrada del vídeo, opciones y análisis.
 * @returns Sección de interfaz.
 */
export function VideoUploadCard() {
  const { colors, textSub } = useReelsCenter();
  return (
    <>
      <div className={`${colors.card} p-5 space-y-4`}>
      <div className={` pb-3 `}>
        <h3
          className={`text-sm font-bold font-display flex items-center gap-1.5 text-[var(--acc)]`}
        >
          <Video className={`w-4 h-4 text-[var(--acc)]`} />{" "}
          Extraer highlights de vídeos de ensayos / directos
        </h3>
        <p className={`text-micro font-sans mt-1 ${textSub}`}>
          Sube tu metraje bruto en formato vídeo o pega un enlace de
          YouTube. Nuestro modelo buscará ganchos acústicos,
          transiciones y saltos rítmicos para recortar los mejores
          15-60s.
        </p>
      </div>

      <VideoSourceSelector />

      <VideoInputArea />

      <AnalysisOptions />

      <RecoveredAnalysisNotice />

      <AnalyzeButton />

      <AnalysisProgress />

      <AnalysisStatusNotices />
      </div>
    </>
  );
}
