import React from 'react';
import { Filter, X, Building2, Radio, Briefcase, LayoutGrid, List, Map as MapIcon, BookmarkCheck, RefreshCw } from 'lucide-react';
import { Lead } from '../../types';

export interface BookingFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTab: 'salas' | 'medios' | 'grupos';
  handleSelectSectionTab: (tab: 'salas' | 'medios' | 'grupos') => void;
  viewMode: 'grid' | 'table' | 'map';
  setViewMode: (mode: 'grid' | 'table' | 'map') => void;
  typeFilter: string;
  setTypeFilter: (val: any) => void;
  onlyFavoritesFilter: boolean;
  setOnlyFavoritesFilter: (val: boolean | ((prev: boolean) => boolean)) => void;
  onlyVerifiedFilter: boolean;
  setOnlyVerifiedFilter: (val: boolean | ((prev: boolean) => boolean)) => void;
  minCapacityFilter: number;
  setMinCapacityFilter: (val: number) => void;
  isSavingFilterOpen: boolean;
  setIsSavingFilterOpen: (val: boolean) => void;
  newFilterName: string;
  setNewFilterName: (val: string) => void;
  handleSaveCurrentFilter: (e: React.FormEvent) => void;
  savedFilters: any[];
  activeSavedFilterId: string | null;
  handleApplySavedFilter: (sf: any) => void;
  handleDeleteSavedFilter: (id: string, e: React.MouseEvent) => void;
  selectedCityFilter: string;
  setSelectedCityFilter: (city: string) => void;
  handleClearAllFilters: () => void;
  filteredCount: number;
  sectionLeads: Lead[];
  normalizeType: (tipo?: string) => string;
  activeLeadsForSection: Lead[];
  displayCityChips: string[];
  cityCounts: Record<string, number>;
}

export const BookingFiltersPanel: React.FC<BookingFiltersPanelProps> = ({
  isOpen,
  onClose,
  sectionTab,
  handleSelectSectionTab,
  viewMode,
  setViewMode,
  typeFilter,
  setTypeFilter,
  onlyFavoritesFilter,
  setOnlyFavoritesFilter,
  onlyVerifiedFilter,
  setOnlyVerifiedFilter,
  minCapacityFilter,
  setMinCapacityFilter,
  isSavingFilterOpen,
  setIsSavingFilterOpen,
  newFilterName,
  setNewFilterName,
  handleSaveCurrentFilter,
  savedFilters,
  activeSavedFilterId,
  handleApplySavedFilter,
  handleDeleteSavedFilter,
  selectedCityFilter,
  setSelectedCityFilter,
  handleClearAllFilters,
  filteredCount,
  sectionLeads,
  normalizeType,
  activeLeadsForSection,
  displayCityChips,
  cityCounts,
}) => {
  if (!isOpen) return null;

  return (
    <div className="p-3.5 rounded-[var(--r-l)] border bg-[var(--surface)] border-[var(--acc)]/40 space-y-3.5 shadow-2xl animate-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--hair)]/10">
        <span className="text-xs font-bold text-[var(--acc)] flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" />
          Filtros y Búsquedas Avanzadas
        </span>
        <button type="button" onClick={() => onClose()} className="text-[var(--ink-2)] hover:text-[var(--ink)] p-1 rounded-[var(--r-m)] cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 0. Filter drawer Category and View Mode Selectors */}
      <div className="space-y-3 pb-3 border-b border-[var(--hair)]/10">
        <div>
          <p className="text-[10px] font-bold text-[var(--ink-2)] uppercase tracking-wider mb-1.5">Categoría de Contactos</p>
          <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--sunken)] rounded-[var(--r-m)] border borderbg-[var(--surface)]">
            <button
              type="button"
              onClick={() => handleSelectSectionTab('salas')}
              className={`py-1.5 rounded-[var(--r-m)] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sectionTab === 'salas' ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold shadow-xs' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Escenarios</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectSectionTab('medios')}
              className={`py-1.5 rounded-[var(--r-m)] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sectionTab === 'medios' ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold shadow-xs' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Medios</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectSectionTab('grupos')}
              className={`py-1.5 rounded-[var(--r-m)] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sectionTab === 'grupos' ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold shadow-xs' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Management</span>
            </button>
          </div>
        </div>

        <div className="sm:hidden">
          <p className="text-[10px] font-bold text-[var(--ink-2)] uppercase tracking-wider mb-1.5">Modo de Vista</p>
          <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--sunken)] rounded-[var(--r-m)] border borderbg-[var(--surface)]">
            <button
              type="button"
              onClick={() => {
                setViewMode('grid');
                onClose();
              }}
              className={`py-1.5 rounded-[var(--r-m)] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold shadow-xs' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tarjetas</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('table');
                onClose();
              }}
              className={`py-1.5 rounded-[var(--r-m)] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold shadow-xs' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Detalles</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('map');
                onClose();
              }}
              className={`py-1.5 rounded-[var(--r-m)] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'map' ? 'bg-[var(--acc)] text-[var(--ink)] font-bold shadow-xs' : 'bg-[var(--acc)]/15 text-[var(--acc)] border border-[var(--acc)]/20'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 shrink-0 text-[var(--acc)]" />
              <span>Mapa</span>
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-[var(--ink-2)] uppercase tracking-wider mb-1.5">Tipo de Espacio</p>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-[var(--sunken)] text-[var(--ink)] rounded-[var(--r-m)] text-xs font-semibold font-sans border borderbg-[var(--surface)] focus:border-[var(--acc)] focus:ring-1 focus:ring-[var(--acc)]/30 cursor-pointer"
          >
            {sectionTab === 'medios' ? (
              <>
                <option value="todos">🌟 Todos los medios ({sectionLeads.length})</option>
                <option value="radio">📻 Radios</option>
                <option value="tv">📺 TV</option>
                <option value="prensa">📰 Prensa</option>
                <option value="redes">📱 Redes</option>
                <option value="podcast">🎙️ Podcasts</option>
              </>
            ) : sectionTab === 'grupos' ? (
              <>
                <option value="todos">🌟 Todas las entidades ({sectionLeads.length})</option>
                <option value="grupo">🎸 Grupos</option>
                <option value="agencia">💼 Agencias</option>
                <option value="manager">👔 Mánagers</option>
                <option value="productora">🎬 Productoras</option>
                <option value="sello">💿 Sellos</option>
              </>
            ) : (
              <>
                <option value="todos">🌟 Tipo: Todos ({sectionLeads.length})</option>
                <option value="sala">🏛️ Salas ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'sala').length})</option>
                <option value="festival">🎪 Festivales ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'festival').length})</option>
                <option value="discoteca">
                  🪩 Discotecas ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'discoteca').length})
                </option>
                <option value="ayuntamiento">
                  🎆 Ayuntamientos ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'ayuntamiento').length})
                </option>
                <option value="agencia">
                  💼 Agencias (
                  {sectionLeads.filter((l) => normalizeType(l.tipo) === 'agencia' || normalizeType(l.tipo) === 'manager').length})
                </option>
                <option value="sello">💿 Sellos ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'sello').length})</option>
                <option value="productora">
                  🎛️ Productores (
                  {sectionLeads.filter((l) => normalizeType(l.tipo) === 'productora' || normalizeType(l.tipo) === 'productor').length})
                </option>
                <option value="grupo">🎸 Bandas Amigas ({sectionLeads.filter((l) => normalizeType(l.tipo) === 'grupo').length})</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* 1. Quick Toggles (Favoritos, Verificados, Aforo) */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-[var(--ink-2)] uppercase tracking-wider">Opciones rápidas</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setOnlyFavoritesFilter(!onlyFavoritesFilter)}
            className={`px-2.5 py-1.5 rounded-[var(--r-m)] border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              onlyFavoritesFilter
                ? 'bg-[var(--acc)]/20 text-[var(--acc)] border-[var(--acc)]/50'
                : 'bg-[var(--sunken)] text-[var(--ink-2)] borderbg-[var(--surface)] hover:text-[var(--ink)]'
            }`}
          >
            <span>⭐ Favoritos</span>
            {onlyFavoritesFilter && <X className="w-3 h-3 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => setOnlyVerifiedFilter(!onlyVerifiedFilter)}
            className={`px-2.5 py-1.5 rounded-[var(--r-m)] border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              onlyVerifiedFilter
                ? 'bg-[var(--acc)]/20 text-[var(--acc)] border-[var(--acc)]/50'
                : 'bg-[var(--sunken)] text-[var(--ink-2)] borderbg-[var(--surface)] hover:text-[var(--ink)]'
            }`}
          >
            <span>✔ Verificados</span>
            {onlyVerifiedFilter && <X className="w-3 h-3 ml-0.5" />}
          </button>

          <div className="flex items-center gap-1.5 bg-[var(--sunken)] px-2.5 py-1.5 rounded-[var(--r-m)] border borderbg-[var(--surface)] text-xs">
            <span className="text-[var(--ink-2)]">Aforo mín:</span>
            <input
              type="number"
              placeholder="Ej: 300"
              value={minCapacityFilter || ''}
              onChange={(e) => setMinCapacityFilter(Number(e.target.value) || 0)}
              className="w-16 bg-transparent text-[var(--acc)] font-bold focus:outline-none"
            />
            {minCapacityFilter > 0 && (
              <button type="button" onClick={() => setMinCapacityFilter(0)} className="text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Button to save current filter */}
          {!isSavingFilterOpen ? (
            <button
              type="button"
              onClick={() => setIsSavingFilterOpen(true)}
              className="px-2.5 py-1.5 bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc)] rounded-[var(--r-m)] font-bold text-xs flex items-center gap-1 transition-all border border-[var(--acc)]/30 cursor-pointer"
              title="Guardar la combinación de filtros actual en 1 clic"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span>💾 Guardar búsqueda</span>
            </button>
          ) : (
            <form onSubmit={handleSaveCurrentFilter} className="flex items-center gap-1.5 animate-fadeIn">
              <input
                type="text"
                autoFocus
                placeholder="Nombre del filtro (ej: Salas BCN > 300)..."
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-[var(--r-m)] bg-[var(--surface)] border border-[var(--acc)]/50 text-[var(--ink)] focus:outline-none w-48 sm:w-56"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-[var(--ok)] hover:bg-[var(--ok)] text-[var(--ink)] rounded-[var(--r-m)] text-xs font-bold cursor-pointer"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setIsSavingFilterOpen(false)}
                className="p-1.5 bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] rounded-[var(--r-m)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Saved Filters List */}
      {savedFilters.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-[var(--ink-2)] uppercase tracking-wider">Búsquedas guardadas</p>
          <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 pb-1 no-scrollbar text-xs">
            {savedFilters.map((sf) => {
              const isActive = activeSavedFilterId === sf.id;
              return (
                <div
                  key={sf.id}
                  className={`group relative shrink-0 flex items-center rounded-[var(--r-pill)] border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--acc)]/20 border-[var(--acc)] text-[var(--acc)] font-bold shadow-xs'
                      : 'bg-[var(--surface)]/80 hover:bg-[var(--surface)] border-[var(--hair)] text-[var(--ink-2)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleApplySavedFilter(sf)}
                    className="px-3 py-1 text-xs font-sans flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📌 {sf.nombre}</span>
                    {sf.minCapacityFilter ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--acc)]/30 text-[var(--acc)]">&gt;{sf.minCapacityFilter}</span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSavedFilter(sf.id, e)}
                    className="pr-2 text-[var(--ink-2)] hover:text-[var(--alert)] transition-colors p-0.5 rounded-[var(--r-pill)] cursor-pointer"
                    title="Eliminar filtro guardado"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Tipo Filter */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-[var(--ink-2)] uppercase tracking-wider">Tipo de espacio / contacto</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(sectionTab === 'medios'
            ? ([
                { key: 'todos', label: '🌟 Todos' },
                { key: 'radio', label: '📻 Radio' },
                { key: 'tv', label: '📺 TV' },
                { key: 'prensa', label: '📰 Prensa' },
                { key: 'redes', label: '📱 Redes' },
                { key: 'podcast', label: '🎙️ Podcasts' },
              ] as const)
            : sectionTab === 'grupos'
              ? ([
                  { key: 'todos', label: '🌟 Todos' },
                  { key: 'productora', label: '🎬 Productoras' },
                  { key: 'manager', label: '👔 Mánagers' },
                  { key: 'agencia', label: '💼 Agencias' },
                  { key: 'sello', label: '💿 Sellos' },
                  { key: 'grupo', label: '🎸 Grupos' },
                ] as const)
              : ([
                  { key: 'todos', label: '🌟 Todos' },
                  { key: 'sala', label: '🏛️ Salas' },
                  { key: 'festival', label: '🎪 Festivales' },
                  { key: 'discoteca', label: '🪩 Discotecas' },
                  { key: 'ayuntamiento', label: '🎆 Ayuntamientos' },
                ] as const)
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTypeFilter(t.key)}
              className={`px-3 py-1 rounded-[var(--r-m)] text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === t.key ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold shadow-sm' : 'bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--surface)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Ciudad Filter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-[var(--ink-2)] uppercase tracking-wider">Ciudad / Localidad</p>
          {selectedCityFilter && (
            <button
              type="button"
              onClick={() => setSelectedCityFilter('')}
              className="text-[10px] text-[var(--acc)] hover:underline cursor-pointer"
            >
              Ver todas
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 pb-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setSelectedCityFilter('')}
            className={`px-2.5 py-1 rounded-[var(--r-pill)] text-xs font-medium shrink-0 transition-all cursor-pointer ${
              selectedCityFilter === ''
                ? 'bg-[var(--surface)] text-[var(--acc)] font-bold border border-[var(--acc)]/40'
                : 'bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] border border-[var(--hair)]'
            }`}
          >
            Todas ({activeLeadsForSection.length})
          </button>
          {displayCityChips.map((cityName) => {
            const isSelected = selectedCityFilter.toLowerCase() === cityName.toLowerCase();
            const count = cityCounts[cityName] || 0;
            return (
              <button
                key={cityName}
                type="button"
                onClick={() => setSelectedCityFilter(isSelected ? '' : cityName)}
                className={`px-2.5 py-1 rounded-[var(--r-pill)] text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[var(--acc)]/20 text-[var(--acc)] font-bold border border-[var(--acc)]/50'
                    : 'bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)] border border-[var(--hair)]'
                }`}
              >
                <span>{cityName}</span>
                {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Action Buttons Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--hair)]/10">
        <button
          type="button"
          onClick={handleClearAllFilters}
          className="text-xs text-[var(--ink-2)] hover:text-[var(--alert)] flex items-center gap-1 px-2 py-1 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Limpiar filtros</span>
        </button>

        <button
          type="button"
          onClick={() => onClose()}
          className="px-4 py-1.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--acc)] text-[var(--on-acc)] cursor-pointer shadow-sm"
        >
          Ver {filteredCount} resultados
        </button>
      </div>
    </div>
  );
};
