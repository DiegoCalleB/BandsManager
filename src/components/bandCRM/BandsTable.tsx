/**
 * Vista de tabla de las bandas con selección y acciones.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CheckSquare, Edit3, MapPin, MinusSquare, Play, Repeat, Sparkles, Square, Trash2 } from "lucide-react";
import { Button, IconButton } from "../ui";
import { useBandCrm } from "./BandCrmContext";
import { BandStatusBadge } from "./BandStatusBadge";

/**
 * Vista de tabla de las bandas con selección y acciones.
 * @returns Sección de interfaz.
 */
export function BandsTable() {
  const { colors, selectedBandIds, filteredBands, handleDeselectAllBands, handleSelectAllFilteredBands, handleToggleSelectBand, disponibles, escuchar, handleAnalyzeTone, setCustomPitchText, setSelectedPitchBand, setIsPitchModalOpen, handleOpenEditModal, handleDeleteBand } = useBandCrm();
    return (

  /* TABLE LIST VIEW */
  <div
    className={`rounded-[var(--r-l)] overflow-hidden ${colors.card} overflow-x-auto shrink-0`}
  >
    <table className="w-full text-left text-micro font-sans min-w-[850px]">
      <thead className="bg-[var(--surface)]/90 text-[var(--ink-2)] text-micro">
        <tr>
          <th className="py-2.5 px-3 w-10 text-center whitespace-nowrap">
            <button
              type="button"
              onClick={
                selectedBandIds.length === filteredBands.length &&
                filteredBands.length > 0
                  ? handleDeselectAllBands
                  : handleSelectAllFilteredBands
              }
              className="text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors cursor-pointer"
              title={
                selectedBandIds.length === filteredBands.length
                  ? "Deseleccionar todas"
                  : "Seleccionar todas"
              }
            >
              {filteredBands.length > 0 &&
              selectedBandIds.length === filteredBands.length ? (
                <CheckSquare className="w-4 h-4 text-[var(--acc)]" />
              ) : selectedBandIds.length > 0 ? (
                <MinusSquare className="w-4 h-4 text-[var(--acc)]" />
              ) : (
                <Square className="w-4 h-4 text-[var(--ink-2)]" />
              )}
            </button>
          </th>
          <th className="py-2.5 px-1 w-8" aria-label="Escuchar" />
          <th className="py-2.5 px-3 whitespace-nowrap min-w-[170px]">
            Banda / artista
          </th>
          <th className="py-2.5 px-3 whitespace-nowrap min-w-[150px]">
            Estilo musical
          </th>
          <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">
            Localización
          </th>
          <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">
            Estado Relación
          </th>
          <th className="py-2.5 px-3 whitespace-nowrap min-w-[150px]">
            Contacto
          </th>
          <th className="py-2.5 px-3 whitespace-nowrap min-w-[90px]">
            Aforo habitual
          </th>
          <th className="py-2.5 px-3 whitespace-nowrap min-w-[100px]">
            Último contacto
          </th>
          <th className="py-2.5 px-3 whitespace-nowrap min-w-[130px] text-right">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--hair)]/60 text-[var(--ink-2)]">
        {filteredBands.map((band) => {
          const isRowSelected = selectedBandIds.includes(band.id);
          return (
            <tr
              key={band.id}
              className={`transition-colors ${isRowSelected ? "bg-[var(--acc)]/10 hover:bg-[var(--acc)]/15" : "hover:bg-[var(--surface)]/50"}`}
            >
              <td
                className="py-2 px-3 w-10 text-center align-middle whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => handleToggleSelectBand(band.id, e)}
                  className="text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors cursor-pointer"
                  title={
                    isRowSelected
                      ? "Deseleccionar banda"
                      : "Seleccionar banda"
                  }
                >
                  {isRowSelected ? (
                    <CheckSquare className="w-4 h-4 text-[var(--acc)]" />
                  ) : (
                    <Square className="w-4 h-4 text-[var(--ink-2)] hover:text-[var(--ink-2)]" />
                  )}
                </button>
              </td>

              <td
                className="py-2 px-1 w-8 text-center align-middle"
                onClick={(e) => e.stopPropagation()}
              >
                {disponibles[band.id] && (
                  <IconButton
                    label={`Escuchar a ${band.nombre_banda}`}
                    size="icon-xs"
                    onClick={() => escuchar(band.id)}
                  >
                    <Play className="w-3.5 h-3.5 text-[var(--acc-ink)]" />
                  </IconButton>
                )}
              </td>
              <td className="py-2 px-3 font-bold text-[var(--ink)] align-middle whitespace-nowrap">
                <div className="flex items-center gap-2 min-w-0">
                  {band.imagen_url ? (
                    <img
                      src={band.imagen_url}
                      alt={band.nombre_banda}
                      className="w-5 h-5 rounded-[var(--r-pill)] object-cover/50 shrink-0"
                    />
                  ) : (
                    <span className="text-xs shrink-0">
                      {band.icono || "🎸"}
                    </span>
                  )}
                  <span
                    className="truncate max-w-[150px] sm:max-w-[200px]"
                    title={band.nombre_banda}
                  >
                    {band.nombre_banda}
                  </span>
                </div>
              </td>
              <td className="py-2 px-3 text-[var(--acc)] align-middle whitespace-nowrap">
                <span
                  className="truncate max-w-[150px] sm:max-w-[200px] block"
                  title={band.estilo_musical}
                >
                  {band.estilo_musical}
                </span>
              </td>
              <td className="py-2 px-3 align-middle whitespace-nowrap">
                <span
                  className="inline-flex items-center gap-1 text-[var(--ink-2)] max-w-[140px] sm:max-w-[190px]"
                  title={band.localizacion}
                >
                  <MapPin className="w-3 h-3 text-[var(--alert)] shrink-0" />
                  <span className="truncate">
                    {band.localizacion}
                  </span>
                </span>
              </td>
              <td className="py-2 px-3 align-middle whitespace-nowrap">
                <BandStatusBadge status={band.estado_relacion} />
              </td>
              <td className="py-2 px-3 align-middle whitespace-nowrap">
                <div className="space-y-0.5 max-w-[160px]">
                  <div
                    className="text-[var(--acc)] font-bold truncate"
                    title={band.contacto_nombre}
                  >
                    {band.contacto_nombre || "-"}
                  </div>
                  <div
                    className="text-micro text-[var(--ink-2)] truncate"
                    title={band.email || band.telefono}
                  >
                    {band.email || band.telefono || "-"}
                  </div>
                </div>
              </td>
              <td className="py-2 px-3 font-sans align-middle whitespace-nowrap text-[var(--ink-2)]">
                {band.aforo_promedio
                  ? `${band.aforo_promedio} pers.`
                  : "-"}
              </td>
              <td className="py-2 px-3 text-[var(--ink-2)] align-middle whitespace-nowrap">
                {band.ultimo_contacto || "-"}
              </td>
              <td className="py-2 px-3 text-right align-middle whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    variant="neutral"
                    size="xs"
                    onClick={() => handleAnalyzeTone(band)}
                    className="items-center gap-1"
                    title="Analizar forma de expresarse"
                  >
                    <Sparkles className="w-3 h-3 text-[var(--acc)]" />
                    <span>Tono</span>
                  </Button>

                  <Button
                    variant="neutral"
                    size="xs"
                    onClick={() => {
                      setCustomPitchText("");
                      setSelectedPitchBand(band);
                      setIsPitchModalOpen(true);
                    }}
                    className="items-center gap-1"
                  >
                    <Repeat className="w-3 h-3 text-[var(--ink-2)]" />
                    <span>Pitch</span>
                  </Button>

                  <IconButton
                    label="Editar"
                    onClick={() => handleOpenEditModal(band)}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </IconButton>

                  <IconButton
                    label="Eliminar"
                    variant="danger"
                    onClick={() =>
                      handleDeleteBand(band.id, band.nombre_banda)
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </IconButton>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
    );

}
