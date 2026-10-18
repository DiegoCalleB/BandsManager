/**
 * Panel de personalización: modo, miembro, diseño, tipografía, contenido y marcas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Palette, Type } from "lucide-react";
import { Button, Select } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { AdvancedSettingsToggle } from "./AdvancedSettingsToggle";
import { ModeAndTargetRow } from "./ModeAndTargetRow";
import { usePdfExport } from "./PdfExportContext";

/**
 * Panel de personalización: modo, miembro, diseño, tipografía, contenido y marcas.
 * @returns Sección de interfaz.
 */
export function PdfControlPanel() {
  const { showAdvancedSettings, handwritingFont, setHandwritingFont, setHandwritingColor, handwritingColor, showBandLogo, setShowBandLogo, showWatermark, setShowWatermark, showTonality, setShowTonality, showBpm, setShowBpm, showDuration, setShowDuration, showGeneralNotes, setShowGeneralNotes, showAppBranding, setShowAppBranding, badgesScope, setBadgesScope, setShowMarksPanel, showMarksPanel, markedCountForMember, saveFailed, currentPreviewMember, setAllMarks, activeSetlist, songs, isMarked, setMark } = usePdfExport();
  return (
    <>
      <div
      className={`p-3 sm:px-6 flex flex-col gap-3 text-xs font-sans shrink-0 ${"bg-[var(--sunken)]"}`}
      >
      {/* Row 1: Mode & Target Selector — en móvil un selector compacto (los 3 botones en
 fila no cabían sin apretarse); en desktop, los botones de siempre, más cómodos con
 mouse y con espacio de sobra en pantallas grandes. */}
      <ModeAndTargetRow />
      <AdvancedSettingsToggle />
      <div
        className={`${showAdvancedSettings ? "flex" : "hidden"} flex-col sm:flex-row sm:flex-wrap items-start sm:items-center sm:justify-between gap-3 sm:gap-4 pt-2 w-full sm:flex`}
      >
        {/* Tamaño de título: ya no se elige a mano — se auto-ajusta por hoja (ver
 computeAutoFitPlan) para llenar la página lo mejor posible, priorizando el
 mínimo ideal de 17pt (legible a ~2m en escenario) para repartir en varias hojas.
 Solo cuando eso evitaría caber en una sola hoja por muy poco margen, prueba un
 tamaño de emergencia (15pt) como último recurso — nunca para repartir en más de
 1 página, solo para intentar mantenerlo en una sola. */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--ink-2)] font-bold flex items-center gap-1">
            <Type className="w-3.5 h-3.5 text-[var(--acc)]" /> Tamaño
            Títulos:
          </span>
          <span
            className="px-2.5 py-1 rounded text-xs font-bold bg-[var(--acc)]/20 text-[var(--ink)]"
            title="El tamaño y el número de hojas se calculan automáticamente para aprovechar mejor el espacio El motor decide cuántas hojas usar, la letra (de 17pt en adelante), dónde cortar sin dejar bloques colgando y reparte el espacio sobrante entre las filas."
          >
            <ShowIcon inline emoji="⚡" />Automático
          </span>
        </div>

        {/* Handwritten Note Style */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--ink-2)] font-bold flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-[var(--ink-2)]" /> Letra
            Manuscrita:
          </span>
          <Select
            size="sm"
            value={handwritingFont}
            onChange={(e) => setHandwritingFont(e.target.value as typeof handwritingFont)}
          >
            <option value="caveat">Rotulador fino (Caveat)</option>
            <option value="permanent_marker">
              Sharpie grueso (permanent marker)
            </option>
            <option value="courier">Máquina (Courier)</option>
            <option value="sans">Imprenta limpia (Sans)</option>
          </Select>

          {/* Ink color selector */}
          <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-[var(--r-s)]">
            <button
              onClick={() => setHandwritingColor("blue")}
              className={`w-5 h-5 rounded-[var(--r-pill)] bg-[var(--tentative)] transition-transform cursor-pointer ${
                handwritingColor === "blue"
                  ? "ring-2 ring-white scale-110"
                  : "opacity-60 hover:opacity-100"
              }`}
              title="Tinta azul rotulador"
            />
            <button
              onClick={() => setHandwritingColor("black")}
              className={`w-5 h-5 rounded-[var(--r-pill)] bg-[var(--sunken)] transition-transform cursor-pointer ${
                handwritingColor === "black"
                  ? "ring-2 ring-white scale-110"
                  : "opacity-60 hover:opacity-100"
              }`}
              title="Tinta negra sharpie"
            />
            <button
              onClick={() => setHandwritingColor("red")}
              className={`w-5 h-5 rounded-[var(--r-pill)] bg-[var(--alert)] transition-transform cursor-pointer ${
                handwritingColor === "red"
                  ? "ring-2 ring-white scale-110"
                  : "opacity-60 hover:opacity-100"
              }`}
              title="Tinta roja marcador"
            />
            <button
              onClick={() => setHandwritingColor("purple")}
              className={`w-5 h-5 rounded-[var(--r-pill)] bg-[var(--acc)] transition-transform cursor-pointer ${
                handwritingColor === "purple"
                  ? "ring-2 ring-white scale-110"
                  : "opacity-60 hover:opacity-100"
              }`}
              title="Tinta Violeta"
            />
          </div>
        </div>

        {/* Feature Toggles (BPM & Duration optional, Logo, etc.) */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showBandLogo}
              onChange={(e) => setShowBandLogo(e.target.checked)}
              className="rounded accent-[var(--ok)] cursor-pointer"
            />
            <span>Logo grupo</span>
          </label>

          <label className="flex items-center gap-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showWatermark}
              onChange={(e) => setShowWatermark(e.target.checked)}
              className="rounded accent-[var(--ok)] cursor-pointer"
            />
            <span>Marca de agua</span>
          </label>

          <label className="flex items-center gap-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showTonality}
              onChange={(e) => setShowTonality(e.target.checked)}
              className="rounded accent-[var(--ok)] cursor-pointer"
            />
            <span>Tono</span>
          </label>

          <label className="flex items-center gap-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showBpm}
              onChange={(e) => setShowBpm(e.target.checked)}
              className="rounded accent-[var(--ok)] cursor-pointer"
            />
            <span>BPM</span>
          </label>

          <label className="flex items-center gap-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDuration}
              onChange={(e) => setShowDuration(e.target.checked)}
              className="rounded accent-[var(--ok)] cursor-pointer"
            />
            <span>Duración</span>
          </label>

          <label className="flex items-center gap-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showGeneralNotes}
              onChange={(e) => setShowGeneralNotes(e.target.checked)}
              className="rounded accent-[var(--ok)] cursor-pointer"
            />
            <span>Notas generales</span>
          </label>

          <label className="flex items-center gap-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAppBranding}
              onChange={(e) => setShowAppBranding(e.target.checked)}
              className="rounded accent-[var(--ok)] cursor-pointer"
            />
            <span>Pie BandManager</span>
          </label>
          {(showTonality || showBpm) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 p-0.5 rounded-[var(--r-m)] bg-[var(--surface)]">
                <Button
                  variant={badgesScope === "all" ? "neutral" : "ghost"}
                  size="xs"
                  onClick={() => setBadgesScope("all")}
                >
                  En todos los temas
                </Button>
                <Button
                  variant={badgesScope === "marked" ? "neutral" : "ghost"}
                  size="xs"
                  onClick={() => {
                    setBadgesScope("marked");
                    setShowMarksPanel(true);
                  }}
                >
                  Solo marcados
                </Button>
              </div>
              {badgesScope === "marked" && (
                <Button variant="ghost" size="xs" onClick={() => setShowMarksPanel((v) => !v)}>
                  {showMarksPanel ? "Ocultar temas" : "Elegir temas"} ({markedCountForMember()})
                </Button>
              )}
            </div>
          )}
          {saveFailed && (
            <span className="text-xs text-[var(--alert)]" role="status">
              No se pudieron guardar estos ajustes para la banda.
            </span>
          )}
        </div>
      </div>
      </div>


      {(showTonality || showBpm) && badgesScope === "marked" && showMarksPanel && (
      <div className="px-3 sm:px-6 py-2 shrink-0 text-xs font-sans border-t border-[var(--line)]">
        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
          <span className="font-bold text-[var(--ink-2)]">
            Tono/BPM visibles para {currentPreviewMember.name}:
          </span>
          <span className="flex gap-1">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setAllMarks(true)}
            >
              Todos
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setAllMarks(false)}
            >
              Ninguno
            </Button>
          </span>
        </div>
        <div className="max-h-28 overflow-y-auto sm:columns-2 gap-x-4 [&>label]:break-inside-avoid [&>label]:py-0.5">
          {activeSetlist.items
            .filter((it) => it.tipoItem === "cancion" && it.songId)
            .map((it, i) => {
              const song = songs.find((x) => x.id === it.songId);
              if (!song) return null;
              const marked = isMarked(song);
              return (
                <label
                  key={`${song.id}-${i}`}
                  className="flex items-center gap-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer select-none min-w-0"
                >
                  <input
                    type="checkbox"
                    checked={marked}
                    onChange={(e) => setMark(song, e.target.checked)}
                    className="rounded accent-[var(--ok)] cursor-pointer"
                  />
                  <span className="truncate">
                    {song.titulo}
                    {(song.tonalidad || song.bpm) && (
                      <span className="text-[var(--ink-3)]">
                        {" "}
                        · {[song.tonalidad, song.bpm ? `${song.bpm} BPM` : ""].filter(Boolean).join(" ")}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
        </div>
      </div>
      )}
    </>
  );
}
