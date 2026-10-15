/**
 * Selector de modo de impresión, miembro y diseño.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AlignCenter, AlignLeft, Columns2, FileText, User, Users } from "lucide-react";
import { Button, Select } from "../../ui";
import { usePdfExport } from "./PdfExportContext";
import { MIN_TITLE_FONT_PT } from "./printLayout";

/**
 * Selector de modo de impresión, miembro y diseño.
 * @returns Sección de interfaz.
 */
export function ModeAndTargetRow() {
  const { printMode, setPrintMode, setPreviewPageIndex, resolvedMembers, selectedMemberId, setSelectedMemberId, columnsChoice, setColumnsChoice, textAlign, setTextAlign, pagesChoice, setPagesChoice, previewDoc } = usePdfExport();
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Select
          size="sm"
          value={printMode}
          onChange={(e) => {
            setPrintMode(
              e.target.value as
                | "all_members"
                | "single_member"
                | "master",
            );
            setPreviewPageIndex(0);
          }}
          wrapperClassName="flex-1 min-w-0"
        >
          <option value="all_members">
            Todos los Músicos ({resolvedMembers.length} hojas)
          </option>
          <option value="single_member">1 Músico específico</option>
          <option value="master">Master escenario / sonido</option>
        </Select>

        <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-[var(--r-m)] bg-[var(--surface)]">
          <Button
            variant={printMode === "all_members" ? "neutral" : "ghost"}
            size="xs"
            onClick={() => {
              setPrintMode("all_members");
              setPreviewPageIndex(0);
            }}
            className="items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" /> Todos los Músicos (
            {resolvedMembers.length} hojas individuales)
          </Button>
          <Button
            variant={printMode === "single_member" ? "neutral" : "ghost"}
            size="xs"
            onClick={() => {
              setPrintMode("single_member");
              setPreviewPageIndex(0);
            }}
            className="items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" /> 1 Músico específico
          </Button>
          <Button
            variant={printMode === "master" ? "neutral" : "ghost"}
            size="xs"
            onClick={() => {
              setPrintMode("master");
              setPreviewPageIndex(0);
            }}
            className="items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Master escenario / sonido
          </Button>
        </div>

        {/* Single member picker */}
        {printMode === "single_member" && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="hidden sm:inline text-[var(--ink-2)] font-bold">
              Músico:
            </span>
            <Select
              size="sm"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              wrapperClassName="flex-1 sm:flex-none min-w-0"
            >
              {resolvedMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.instrument})
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Columnas: automático (2 solo en sets largos si aportan), 1 o 2. */}
        <div className="flex items-center gap-1.5 p-1 rounded-[var(--r-m)] bg-[var(--surface)]">
          <Button
            variant={columnsChoice === "auto" ? "neutral" : "ghost"}
            size="xs"
            onClick={() => setColumnsChoice("auto")}
            className="items-center gap-1.5"
            title="El motor usa 2 columnas solo cuando el set es largo y así gana letra o ahorra hojas"
          >
            Columnas auto
          </Button>
          <Button
            variant={columnsChoice === 1 ? "neutral" : "ghost"}
            size="xs"
            onClick={() => setColumnsChoice(1)}
            className="items-center gap-1.5"
            title="Una columna de temas"
          >
            1
          </Button>
          <Button
            variant={columnsChoice === 2 ? "neutral" : "ghost"}
            size="xs"
            onClick={() => setColumnsChoice(2)}
            className="items-center gap-1.5"
            title="Dos columnas: cabe más repertorio por hoja con letra mayor (las notas pasan debajo del título)"
          >
            <Columns2 className="w-3.5 h-3.5" />2
          </Button>
        </div>

        {/* Alineación del texto en la hoja: izquierda (clásico) o centrado. */}
        <div className="flex items-center gap-1.5 p-1 rounded-[var(--r-m)] bg-[var(--surface)]">
          <Button
            variant={textAlign === "left" ? "neutral" : "ghost"}
            size="xs"
            onClick={() => setTextAlign("left")}
            className="items-center gap-1.5"
            title="Títulos alineados a la izquierda, notas a su lado"
          >
            <AlignLeft className="w-3.5 h-3.5" />Izquierda
          </Button>
          <Button
            variant={textAlign === "center" ? "neutral" : "ghost"}
            size="xs"
            onClick={() => setTextAlign("center")}
            className="items-center gap-1.5"
            title="Títulos, números y notas centrados en la hoja"
          >
            <AlignCenter className="w-3.5 h-3.5" />Centrado
          </Button>
        </div>

        {/* Hojas por músico: automático (con el nº que elige el motor) o impuestas. */}
        <div className="flex items-center gap-2">
          <Select
            size="sm"
            aria-label="Número de hojas"
            value={String(pagesChoice)}
            onChange={(e) =>
              setPagesChoice(
                e.target.value === "auto"
                  ? "auto"
                  : (Number(e.target.value) as 1 | 2 | 3),
              )
            }
          >
            <option value="auto">
              {previewDoc?.layout
                ? `Auto (${previewDoc.layout.autoPages} ${previewDoc.layout.autoPages === 1 ? "página" : "páginas"})`
                : "Auto"}
            </option>
            <option value="1">1 página</option>
            <option value="2">2 páginas</option>
            <option value="3">3 páginas</option>
          </Select>
          {previewDoc?.layout && (
            <span
              className={`text-xs font-semibold tabular-nums whitespace-nowrap ${
                previewDoc.layout.fontPt < MIN_TITLE_FONT_PT
                  ? "text-[var(--alert)]"
                  : "text-[var(--ink-2)]"
              }`}
              title="Letra del título resultante en la hoja impresa"
            >
              {previewDoc.layout.fontPt} pt
              {previewDoc.layout.fontPt < MIN_TITLE_FONT_PT && " · letra pequeña"}
            </span>
          )}
          {previewDoc?.layout?.alt &&
            previewDoc.layout.alt.fontPt >= previewDoc.layout.fontPt + 3 &&
            previewDoc.layout.alt.pages <= previewDoc.layout.pages && (
              <Button
                variant="soft"
                size="xs"
                onClick={() => setColumnsChoice(previewDoc.layout!.alt!.cols)}
                title="Cambia el número de columnas para que la letra salga más grande en las mismas hojas"
              >
                Con {previewDoc.layout.alt.cols} {previewDoc.layout.alt.cols === 1 ? "columna" : "columnas"}:{" "}
                {previewDoc.layout.alt.fontPt} pt
              </Button>
            )}
        </div>
      </div>

      {/* Botón"Ajustes" — solo en móvil (sm:hidden): colapsa tipografía/tinta/badges detrás
 de un toggle para no agobiar la pantalla pequeña con todo a la vez. En desktop esos
 ajustes están siempre visibles (ver"sm:flex" en el Row 2 de abajo, que los muestra
 sin importar showAdvancedSettings). */}
    </>
  );
}
