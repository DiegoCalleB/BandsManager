/**
 * Lista de resultados con acciones por lote y tarjeta de cada lugar.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Ban,Building2,Check,Globe,Loader2,MapPin,Music2,Phone,PlusCircle,Sparkles,Star,Users } from "lucide-react";
import { LeadType } from "../../../types";
import { Button,IconButton,Select } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useGooglePlacesExplorer } from "./GooglePlacesExplorerContext";
import { CATEGORIES } from "./placesModel";

/**
 * Lista de resultados con acciones por lote y tarjeta de cada lugar.
 * @returns Sección de interfaz.
 */
export function PlacesResultsList() {
  const { places, toggleSelectAll, selectedCount, handleExtractBatchEmails, isExtractingBatch, handleImportToCRM, isImporting, toggleSelectPlace, handleDiscardPlace, handlePlaceCategoryChange, handleExtractSingleEmail, isSearching } = useGooglePlacesExplorer();
  return (
    <>
      {places.length > 0 ? (
        <div className="space-y-3">
          {/* Batch Actions Bar */}
          <div className="p-3 bg-[var(--bg)]/90 rounded-[var(--r-m)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <input
                  type="checkbox"
                  checked={
                    places.length > 0 && places.every((p) => p.selected)
                  }
                  onChange={toggleSelectAll}
                  className="rounded accent-[var(--acc)] cursor-pointer"
                />
                <span>
                  Seleccionar todos ({selectedCount}/{places.length})
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="xs"
                onClick={handleExtractBatchEmails}
                disabled={isExtractingBatch || selectedCount === 0}
                className="items-center gap-1.5"
                title="Agente Enriquecedor: Investiga las páginas oficiales y fuentes públicas sin inventar emails"
              >
                {isExtractingBatch ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]/70" />
                )}
                <span><ShowIcon inline emoji="⚡" />Agente Enriquecedor ({selectedCount})</span>
              </Button>

              <Button
                variant="primary"
                size="xs"
                onClick={handleImportToCRM}
                disabled={isImporting || selectedCount === 0}
                className="items-center gap-1.5"
              >
                {isImporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlusCircle className="w-3.5 h-3.5" />
                )}
                <span><ShowIcon inline emoji="📥" />Incluir en mis Leads ({selectedCount})</span>
              </Button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {places.map((place) => (
              <div
                key={place.place_id}
                className={`p-3.5 rounded-[var(--r-m)] transition-ui flex flex-col justify-between space-y-2.5 ${
                  place.selected
                    ? "bg-[var(--bg)]/50"
                    : "bg-[var(--bg)]/60 opacity-70"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={place.selected || false}
                        onChange={() => toggleSelectPlace(place.place_id)}
                        className="mt-1 rounded accent-[var(--acc)] cursor-pointer"
                      />
                      {place.imagen_url ? (
                        <img
                          src={place.imagen_url}
                          alt={place.nombre_sala}
                          className="w-10 h-10 rounded-[var(--r-s)] object-cover700 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-[var(--r-s)] bg-[var(--sunken)] flex items-center justify-center text-lg shrink-0">
                          {place.icono || "🏛️"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-[var(--ink)] truncate">
                            {place.nombre_sala}
                          </h4>
                          {place.alreadyInCrm && (
                            <span
                              className="text-micro px-1.5 py-0.2 bg-[var(--acc)]/20 text-[var(--ink)] rounded font-bold shrink-0"
                              title="Este contacto ya existe en tu CRM de Leads"
                            >
                              En CRM ({place.crmStatus || "Registrado"})
                            </span>
                          )}
                          {place.capacityMatch === false && (
                            <span
                              className="text-micro px-1.5 py-0.2 bg-[var(--alert)]/20 text-[var(--ink)] rounded font-medium shrink-0"
                              title="El aforo estimado difiere de los filtros de la campaña"
                            >
                              <ShowIcon inline emoji="⚠️" />Aforo fuera de rango
                            </span>
                          )}
                        </div>
                        <p className="text-micro text-[var(--ink-2)] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[var(--acc)] shrink-0" />
                          <span className="truncate">
                            {place.ciudad} ({place.region})
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {place.rating && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[var(--acc)]/10 text-[var(--ink)] rounded-[var(--r-s)] text-micro font-bold">
                          <Star className="w-3 h-3 fill-[var(--acc)]" />
                          <span>{place.rating}</span>
                          {place.user_ratings_total && (
                            <span className="text-micro text-[var(--ink-2)]">
                              ({place.user_ratings_total})
                            </span>
                          )}
                        </div>
                      )}

                      <IconButton
                        label="Marcar como no deseada (descartar para futuras búsquedas)"
                        variant="danger"
                        size="icon-xs"
                        type="button"
                        onClick={() => handleDiscardPlace(place)}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </IconButton>
                    </div>
                  </div>

                  {/* Category & Tags Row */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5 text-micro">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--ink-2)] font-sans">
                        Categoría:
                      </span>
                      <Select
                        size="sm"
                        value={String(place.tipo || "sala").toLowerCase()}
                        onChange={(e) =>
                          handlePlaceCategoryChange(
                            place.place_id,
                            e.target.value as LeadType,
                          )
                        }
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            <ShowIcon inline emoji={c.icon} /> {c.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {place.genero && (
                        <span className="inline-flex items-center gap-1 text-micro px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--acc)]/10 text-[var(--ink)] font-medium">
                          <Music2 className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate max-w-[130px]">
                            {place.genero}
                          </span>
                        </span>
                      )}
                      {place.aforo ? (
                        <span className="inline-flex items-center gap-1 text-micro px-1.5 py-0.5 rounded-[var(--r-s)] bg-[var(--sunken)] text-[var(--ink-2)] font-sans shrink-0">
                          <Users className="w-2.5 h-2.5 text-[var(--ink-2)]" />
                          <span>~{place.aforo}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Informative Description of the Proposal */}
                  {place.descripcion && (
                    <div className="p-2 rounded-[var(--r-s)] bg-[var(--bg)]/80 text-xs text-[var(--ink-2)] leading-relaxed font-sans">
                      <div className="flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[var(--acc)] shrink-0 mt-0.5" />
                        <p className="line-clamp-2">
                          {place.descripcion}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Address & Phone */}
                  <div className="text-micro text-[var(--ink-2)] space-y-1 bg-[var(--bg)] p-2 rounded-[var(--r-s)] font-sans">
                    {place.direccion && (
                      <p className="truncate text-[var(--ink-2)]">
                        {place.direccion}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[var(--ink-2)]">
                      {place.telefono && (
                        <a
                          href={`tel:${place.telefono}`}
                          className="flex items-center gap-1 hover:text-[var(--ink)]"
                        >
                          <Phone className="w-3 h-3 text-[var(--ok)]" />
                          <span>{place.telefono}</span>
                        </a>
                      )}
                      {place.website && (
                        <a
                          href={place.website}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[var(--ink-2)] hover:underline truncate max-w-[200px]"
                        >
                          <Globe className="w-3 h-3" />
                          <span className="truncate">
                            {place.website.replace(/^https?:\/\//, "")}
                          </span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Email Status & Extractor */}
                  <div className="pt-1">
                    {place.email_contacto ? (
                      <div className="p-2 rounded-[var(--r-s)] bg-[var(--ok)]/10 text-[var(--ink-2)] text-xs flex items-center justify-between font-sans">
                        <div className="flex items-center gap-1.5 truncate">
                          <Check className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
                          <span className="font-bold truncate">
                            {place.email_contacto}
                          </span>
                        </div>
                        <span className="text-micro px-1.5 py-0.5 bg-[var(--ok)]/20 text-[var(--ink)] rounded font-bold shrink-0">
                          Verificado
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-[var(--r-s)] bg-[var(--bg)] text-micro flex items-center justify-between gap-2">
                        <span className="text-[var(--ink-2)] italic">
                          Sin correo extraído aún
                        </span>
                        <button
                          onClick={() =>
                            handleExtractSingleEmail(place.place_id)
                          }
                          disabled={place.extractingEmail}
                          className="px-2.5 py-1 bg-[var(--tentative)]/20 hover:bg-[var(--tentative)]/30 text-[var(--tentative)] rounded-[var(--r-pill)] font-bold text-micro flex items-center gap-1 transition-ui cursor-pointer disabled:opacity-50 shrink-0"
                          title="Agente Enriquecedor: Buscar email oficial verificado en la web de esta propuesta"
                        >
                          {place.extractingEmail ? (
                            <Loader2 className="w-3 h-3 animate-spin text-[var(--tentative)]" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-[var(--acc)]" />
                          )}
                          <span>
                            {place.extractingEmail
                              ? "Buscando..."
                              : "Enriquecer"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !isSearching ? (
        <div className="p-10 text-center space-y-3 bg-[var(--bg)]/40 rounded-[var(--r-l)]">
          <Building2 className="w-12 h-12 text-[var(--ink-2)] mx-auto" />
          <h3 className="text-sm font-bold text-[var(--ink-2)]">
            Descubre nuevas oportunidades de booking
          </h3>
          <p className="text-xs text-[var(--ink-2)] max-w-md mx-auto">
            Selecciona la categoría deseada (Salas, Ayuntamientos,
            Festivales, Grupos, Agencias, Sellos o Medios), la ciudad y la
            cantidad a buscar (1 a 10). Revisa los resultados y añádelos a
            tu base de datos de leads con un solo clic.
          </p>
        </div>
      ) : null}
    </>
  );
}
