/**
 * Cuerpo del estudio: barra de Iris, barra de ideas, formulario de nueva idea y feed
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { SongStudioAddIdeaForm } from "./SongStudioAddIdeaForm";
import { SongStudioIdeasBar } from "./SongStudioIdeasBar";
import { SongStudioIdeasFeed } from "./SongStudioIdeasFeed";
import { SongStudioIrisBar } from "./SongStudioIrisBar";

/**
 * Cuerpo del estudio: barra de Iris, barra de ideas, formulario de nueva idea y feed
 * @returns Sección de interfaz.
 */
export function SongStudioContentBody() {
  return (
    <>
          {/* Content Body */}
          <div className="p-2.5 sm:p-6 overflow-y-auto space-y-2.5 sm:space-y-6 flex-1">
            <SongStudioIrisBar />

            <SongStudioIdeasBar />

            <SongStudioAddIdeaForm />

            <SongStudioIdeasFeed />
          </div>
    </>
  );
}
