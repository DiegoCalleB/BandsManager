/**
 * Pestaña del analizador de vídeo: subida, mesa de luz, editor/programador y calendario.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { HighlightsLighttable } from "./HighlightsLighttable";
import { PostSchedulerEditor } from "./PostSchedulerEditor";
import { PublicationsCalendar } from "./PublicationsCalendar";
import { VideoUploadCard } from "./VideoUploadCard";

/**
 * Pestaña del analizador de vídeo: subida, mesa de luz, editor/programador y calendario.
 * @returns Sección de interfaz.
 */
export function AnalyzerTab() {
  return (
    <>
      <div className="space-y-6">
      {/* 1. Drag & Drop & Upload Area */}
      <VideoUploadCard />

      {/* 2. Lighttable (Mesa de Luz con los Clips Detectados) */}
      <HighlightsLighttable />

      {/* 3. Editor & Scheduler Form for Selected Highlight */}
      <PostSchedulerEditor />

      {/* 4. Calendario de Publicaciones de la Banda List */}
      <PublicationsCalendar />
      </div>
    </>
  );
}
