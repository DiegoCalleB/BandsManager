/**
 * Pestaña del pipeline: tablero Kanban y escritor de copy con IA.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { KanbanBoard } from "./KanbanBoard";
import { SoulWriterCard } from "./SoulWriterCard";

/**
 * Pestaña del pipeline: tablero Kanban y escritor de copy con IA.
 * @returns Sección de interfaz.
 */
export function PipelineTab() {
  return (
    <>
      <div className="space-y-6">
      {/* 1. Pipeline Kanban */}
      <KanbanBoard />

      {/* 2. Structured Soul AI Writer */}
      <SoulWriterCard />
      </div>
    </>
  );
}
