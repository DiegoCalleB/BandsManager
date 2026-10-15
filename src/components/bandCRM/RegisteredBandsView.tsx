/**
 * Listado de bandas registradas en la plataforma.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Building2, FileSpreadsheet, RefreshCw } from "lucide-react";
import { useBandCrm } from "./BandCrmContext";

/**
 * Listado de bandas registradas en la plataforma.
 * @returns Sección de interfaz.
 */
export function RegisteredBandsView() {
  const { colors, fetchRegisteredBands, isLoadingRegBands, registeredBands } = useBandCrm();
    return (

  <div className={`p-5 rounded-[var(--r-l)] ${colors.card} space-y-4 `}>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h3 className="text-xl font-bold font-display text-[var(--ink)] flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[var(--ok)]" />
          <span>
            Registro de nuevas bandas clientes (registro_bandas)
          </span>
        </h3>
        <p className="text-xs text-[var(--ink-2)] font-sans mt-0.5">
          Tabla oficial de Supabase{" "}
          <span className="text-[var(--ok)] font-bold">
            registro_bandas
          </span>{" "}
          con la columna{" "}
          <span className="text-[var(--acc)]/70 font-bold">band_id</span>{" "}
          situándose en la extrema derecha.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={fetchRegisteredBands}
          className="p-2.5 rounded-[var(--r-pill)] bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] text-xs font-sans flex items-center gap-1.5 transition-ui cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoadingRegBands ? "animate-spin" : ""}`}
          />
          <span>Actualizar</span>
        </button>
        <a
          href="/api/export-excel"
          download="band_data.xlsx"
          className="p-2.5 rounded-[var(--r-m)] bg-[var(--ok)]/20 hover:bg-[var(--ok)]/30 text-[var(--ink)] text-xs font-sans flex items-center gap-1.5 transition-ui cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Excel (.xlsx)</span>
        </a>
      </div>
    </div>

    <div className="overflow-x-auto shrink-0 rounded-[var(--r-m)]">
      <table className="w-full text-left text-xs font-sans">
        <thead>
          <tr className="bg-[var(--surface)] text-[var(--ink-2)] text-micro">
            <th className="p-3">ID Reg.</th>
            <th className="p-3">Nombre banda</th>
            <th className="p-3">Email contacto</th>
            <th className="p-3">Plan</th>
            <th className="p-3">Fecha registro</th>
            <th className="p-3">Estado cuenta</th>
            <th className="p-3">Notas</th>
            <th className="p-3 font-bold text-[var(--ink)] bg-[var(--acc)]/10">
              user_id
            </th>
            <th className="p-3 text-right text-[var(--ink)] bg-[var(--acc)]/10 /20 font-bold">
              band_id
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--hair)]/60 bg-[var(--surface)]/40 text-[var(--ink-2)]">
          {registeredBands.length === 0 ? (
            <tr>
              <td
                colSpan={9}
                className="p-8 text-center text-[var(--ink-2)] italic"
              >
                {isLoadingRegBands
                  ? "Cargando bandas registradas..."
                  : "No hay registros en registro_bandas aún."}
              </td>
            </tr>
          ) : (
            registeredBands.map((band, idx) => (
              <tr
                key={band.id || `reg-${idx}`}
                className="hover:bg-[var(--surface)]/80 transition-colors"
              >
                <td className="p-3 font-sans text-[var(--ink-2)]">
                  {band.id || `reg-${idx + 1}`}
                </td>
                <td className="p-3 font-bold text-[var(--ink)] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--ok)]"></span>
                  <span>
                    {band.nombre_banda ||
                      band.nombreBanda ||
                      band.contacto_nombre}
                  </span>
                </td>
                <td className="p-3 text-[var(--ink-2)]">
                  {band.email || "—"}
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold bg-[var(--tentative)]/15 text-[var(--tentative)]">
                    {band.plan || "emergente"}
                  </span>
                </td>
                <td className="p-3 text-[var(--ink-2)]">
                  {band.fecha_registro
                    ? new Date(band.fecha_registro).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-bold bg-[var(--ok)]/15 text-[var(--ink)]">
                    {band.estado_cuenta || "activo"}
                  </span>
                </td>
                <td className="p-3 text-[var(--ink-2)] max-w-xs truncate">
                  {band.notas || "—"}
                </td>
                <td className="p-3 text-left font-bold text-[var(--ink)] bg-[var(--acc)]/5 font-sans">
                  {band.user_id || "—"}
                </td>
                <td className="p-3 text-right font-bold text-[var(--ink)] bg-[var(--acc)]/5 /20 font-sans">
                  {band.band_id || band.bandId || "band-1"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
    );

}
