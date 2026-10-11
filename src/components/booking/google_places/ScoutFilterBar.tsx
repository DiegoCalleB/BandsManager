/**
 * Barra de filtros y búsqueda del explorador.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Ban,Building2,Disc3,Loader2,MapPin,Music2,Search,Sliders,X } from "lucide-react";
import { Button,IconButton,Input } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useGooglePlacesExplorer } from "./GooglePlacesExplorerContext";
import { CATEGORIES,QUICK_CITIES } from "./placesModel";

/**
 * Barra de filtros y búsqueda del explorador.
 * @returns Sección de interfaz.
 */
export function ScoutFilterBar() {
  const { discardedList, setShowDiscardedModal, selectedType, handleCategoryChange, selectedCity, setSelectedCity, handleSearch, searchQuery, setSearchQuery, searchLimit, setSearchLimit, setShowAdvancedFilters, showAdvancedFilters, handleSearchMultiSource, isSearching, handleSearchPublicCultural, aforoMin, setAforoMin, aforoMax, setAforoMax, handleQuickCityClick, similarBands, handleSearchSimilarBands } = useGooglePlacesExplorer();
  return (
    <>
      <div className="bg-[var(--bg)]/80 p-4 rounded-[var(--r-m)] space-y-3.5">
        {/* Category Selector Pills (8 Categorías) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-micro font-sans text-[var(--ink-2)] font-bold">
              Categoría a Descubrir:
            </label>
            {discardedList.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDiscardedModal(true)}
                className="sm:hidden text-micro text-[var(--alert)] underline font-sans flex items-center gap-1 cursor-pointer"
              >
                <Ban className="w-3 h-3" />
                {discardedList.length} no deseadas
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-1.5">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedType === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-2 py-1.5 rounded-[var(--r-pill)] text-xs font-bold flex items-center justify-center gap-1 transition-ui cursor-pointer ${
                    isSelected
                      ? "bg-[var(--ink)] text-[var(--bg)]"
                      : "bg-[var(--bg)]/60 text-[var(--ink-2)] hover:bg-[var(--surface)]"
                  }`}
                  title={cat.desc}
                >
                  <span><ShowIcon inline emoji={cat.icon} /></span>
                  <span className="truncate">
                    {cat.label.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inputs Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-1">
          {/* City Input */}
          <div className="relative md:col-span-4">
            <MapPin className="w-4 h-4 absolute left-3 top-3 text-[var(--acc)]" />
            <Input
              size="sm"
              type="text"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Ciudad (ej. Granada, Madrid…)"
              className="w-full pl-9 pr-7"
            />
            {selectedCity && (
              <IconButton
                label="Limpiar ciudad"
                onClick={() => setSelectedCity("")}
                className="absolute right-2.5 top-2.5"
              >
                <X className="w-3.5 h-3.5" />
              </IconButton>
            )}
          </div>

          {/* Free Text / Venue Query */}
          <div className="relative md:col-span-5">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--ink-2)]" />
            <Input
              size="sm"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={
                CATEGORIES.find((c) => c.id === selectedType)
                  ?.placeholder || "Búsqueda opcional..."
              }
              className="w-full pl-9 pr-3"
            />
          </div>

          {/* Number of Venues limit (1 a 10) */}
          <div className="md:col-span-3 flex items-center gap-1.5 bg-[var(--surface)] px-3 py-1 rounded-[var(--r-m)]">
            <span className="text-micro font-sans text-[var(--ink-2)] whitespace-nowrap">
              Cantidad:
            </span>
            <input
              type="range"
              min="1"
              max="10"
              value={searchLimit}
              onChange={(e) => setSearchLimit(Number(e.target.value))}
              className="w-full accent-[var(--acc)] cursor-pointer"
            />
            <span className="text-xs font-bold font-sans text-[var(--acc)] w-4 text-center">
              {searchLimit}
            </span>
          </div>
        </div>

        {/* Advanced Filters Toggle & Action Search Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1800/60">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-xs text-[var(--ink-2)] hover:text-[var(--acc)]/70 flex items-center gap-1 cursor-pointer font-sans"
          >
            <Sliders className="w-3.5 h-3.5 text-[var(--acc)]" />
            <span>
              {showAdvancedFilters
                ? "Ocultar Filtros de Aforo"
                : "Filtros de Aforo"}
            </span>
          </button>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={() => handleSearchMultiSource()}
              disabled={isSearching}
              className="items-center justify-center gap-1.5"
              title="Escanear salas y festivales vía Wegow, Songkick, Ticketmaster, Entradium y MusicBrainz"
            >
              <Disc3 className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span>Radar multi-Fuente (wegow/Songkick/TM)</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={() => handleSearchPublicCultural()}
              disabled={isSearching}
              className="items-center justify-center gap-1.5"
              title="Convocatorias públicas, teatros y auditorios municipales de Datos Abiertos"
            >
              <Building2 className="w-3.5 h-3.5 text-[var(--ok)]" />
              <span>Radar cultural público</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={() => handleSearch()}
              disabled={isSearching}
              className="items-center justify-center gap-2"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>
                {isSearching
                  ? "Buscando..."
                  : `Google Places (${searchLimit})`}
              </span>
            </Button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="p-3 bg-[var(--surface)] rounded-[var(--r-m)] grid grid-cols-2 sm:grid-cols-2 gap-3 animate-fadeIn text-xs">
            <div>
              <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                Aforo Mínimo (personas)
              </label>
              <Input
                size="sm"
                type="number"
                placeholder="Ej. 150"
                value={aforoMin}
                onChange={(e) => setAforoMin(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-micro font-sans text-[var(--ink-2)] mb-1">
                Aforo Máximo (personas)
              </label>
              <Input
                size="sm"
                type="number"
                placeholder="Ej. 800"
                value={aforoMax}
                onChange={(e) => setAforoMax(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Quick City Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-micro text-[var(--ink-2)] font-bold mr-1">
            Ciudades rápidas:
          </span>
          {QUICK_CITIES.map((city) => (
            <Button
              variant={selectedCity === city ? "inverse" : "neutral"}
              size="xs"
              key={city}
              onClick={() => handleQuickCityClick(city)}
            >
              {city}
            </Button>
          ))}
        </div>

        {/* Quick Similar Bands / FFO Mirror Chips from Dossier */}
        {similarBands && similarBands.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--hair)]/60">
            <span className="text-micro text-[var(--acc)] font-bold mr-1 flex items-center gap-1">
              <Music2 className="w-3 h-3 text-[var(--acc)]" />
              Efecto Espejo (Dossier):
            </span>
            {similarBands.map((band, idx) => (
              <Button
                variant="neutral"
                size="xs"
                key={idx}
                type="button"
                onClick={() => handleSearchSimilarBands(band)}
                disabled={isSearching}
                title={`Rastrear salas donde ha tocado ${band} en Bandsintown y Setlist.fm`}
              >
                <ShowIcon inline emoji="🔍" />{band}
              </Button>
            ))}
            <Button
              variant="neutral"
              size="xs"
              type="button"
              onClick={() => handleSearchSimilarBands()}
              disabled={isSearching}
              className="ml-auto"
            >
              <ShowIcon inline emoji="⚡" />Rastrear todas
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
