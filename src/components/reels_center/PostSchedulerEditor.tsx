import { AutoPublishPanel } from "./AutoPublishPanel";
import { ClipReanalysisPanel } from "./ClipReanalysisPanel";
import { ClipSummaryHeader } from "./ClipSummaryHeader";
import { CopyEditor } from "./CopyEditor";
import { EditorActions } from "./EditorActions";
import { PlatformSelector } from "./PlatformSelector";
import { RevisionFinalDialog } from "./RevisionFinalDialog";
import { prepararRevisionFinal, type EntradaRevision } from "./revisionFinal";
import { RecommendationTips } from "./RecommendationTips";
import { SchedulerInputs } from "./SchedulerInputs";
import { ViralGrowthStudioPanel } from "./ViralGrowthStudioPanel";
/**
 * Editor del clip seleccionado: copy por red, estilo, programación y publicación.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Calendar } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Editor del clip seleccionado: copy por red, estilo, programación y publicación.
 * @returns Sección de interfaz.
 */
export function PostSchedulerEditor() {
  const { highlights, colors, textSub, handleSchedulePost, editedCopy, scheduledDate, scheduledTime, selectedPlatform, renderedClipUrl, youtubeUrl, renderedQuality, derechosDeclarados, autoPublishEnabled, socialAccounts, isScheduling } = useReelsCenter();
  const [revisando, setRevisando] = useState(false);

  const entrada: EntradaRevision = {
    copy: editedCopy,
    fecha: scheduledDate,
    hora: scheduledTime,
    plataforma: selectedPlatform,
    videoUrl: renderedClipUrl || youtubeUrl,
    calidad: renderedQuality,
    derechosDeclarados,
    autoPublish: autoPublishEnabled,
    cuentaConectada: socialAccounts.some((a) => a.plataforma?.toLowerCase() === selectedPlatform.toLowerCase() && a.status === "conectado"),
    avisosCadencia: []
  };

  // Programar no guarda a la primera: abre la última revisión y solo el botón de aprobar lo guarda.
  const abrirRevision = (e: FormEvent) => { e.preventDefault(); setRevisando(true); };
  const aprobar = async () => {
    await handleSchedulePost({ preventDefault: () => {} } as FormEvent);
    setRevisando(false);
  };

  return (
    <>
      {revisando && <RevisionFinalDialog entrada={entrada} revision={prepararRevisionFinal(entrada)} guardando={isScheduling} onAprobar={aprobar} onVolver={() => setRevisando(false)} />}
      {highlights.length > 0 && (
      <div className={`${colors.card} p-5 space-y-4`}>
        <div className={` pb-2 `}>
          <h3
            className={`text-sm font-bold font-display flex items-center gap-2 text-[var(--acc)]`}
          >
            <Calendar className="w-4 h-4" /> Personalizar Publicación
            y Programar en Calendario
          </h3>
          <p className={`text-micro font-sans mt-1 ${textSub}`}>
            Edita el pie de foto (copy) propuesto por la IA y confirma
            la fecha recomendada de publicación para el feed de la
            banda.
          </p>
        </div>

        <form onSubmit={abrirRevision} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Block: Configs & copy */}
            <div className="lg:col-span-8 space-y-4">
              <ClipSummaryHeader />

              <ClipReanalysisPanel />

              <ViralGrowthStudioPanel />

              <CopyEditor />

              <RecommendationTips />
            </div>

            {/* Right Block: Platform, Date/Time & Submit */}
            <div className="lg:col-span-4 space-y-4">
              <PlatformSelector />

              <SchedulerInputs />

              <AutoPublishPanel />

              <EditorActions />
            </div>
          </div>
        </form>
      </div>
      )}
    </>
  );
}
