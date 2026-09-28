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
    <div className="p-3.5 rounded-2xl border bg-[#181716] border-[var(--acc)]/40 space-y-3.5 shadow-2xl animate-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--hair)]/10">
        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" />
          Filtros y Búsquedas Avanzadas
        </span>
        <button type="button" onClick={() => onClose()} className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 0. Filter drawer Category and View Mode Selectors */}
      <div className="space-y-3 pb-3 border-b border-[var(--hair)]/10">
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Categoría de Contactos</p>
          <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--sunken)] rounded-xl border borderbg-[var(--surface)]">
            <button
              type="button"
              onClick={() => handleSelectSectionTab('salas')}
              className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sectionTab === 'salas' ? 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-xs' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Escenarios</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectSectionTab('medios')}
              className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sectionTab === 'medios' ? 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-xs' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Medios</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectSectionTab('grupos')}
              className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sectionTab === 'grupos' ? 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-xs' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Management</span>
            </button>
          </div>
        </div>

        <div className="sm:hidden">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Modo de Vista</p>
          <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--sunken)] rounded-xl border borderbg-[var(--surface)]">
            <button
              type="button"
              onClick={() => {
                setViewMode('grid');
                onClose();
              }}
              className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-xs' : 'text-neutral-400 hover:text-white'
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
              className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-xs' : 'text-neutral-400 hover:text-white'
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
              className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'map' ? 'bg-sky-500 text-slate-950 font-bold shadow-xs' : 'bg-sky-500/15 text-sky-300 border border-[var(--acc)]/20'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 shrink-0 text-sky-400" />
              <span>Mapa</span>
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Tipo de Espacio</p>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-[var(--sunken)] text-white rounded-xl text-xs font-semibold font-sans border borderbg-[var(--surface)] focus:border-[#f2ca50] focus:ring-1 focus:ring-[#f2ca50]/30 cursor-pointer"
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
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Opciones rápidas</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setOnlyFavoritesFilter(!onlyFavoritesFilter)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              onlyFavoritesFilter
                ? 'bg-amber-500/20 text-amber-300 border-[var(--acc)]/50'
                : 'bg-[var(--sunken)] text-neutral-400 borderbg-[var(--surface)] hover:text-white'
            }`}
          >
            <span>⭐ Favoritos</span>
            {onlyFavoritesFilter && <X className="w-3 h-3 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => setOnlyVerifiedFilter(!onlyVerifiedFilter)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              onlyVerifiedFilter
                ? 'bg-sky-500/20 text-sky-300 border-[var(--acc)]/50'
                : 'bg-[var(--sunken)] text-neutral-400 borderbg-[var(--surface)] hover:text-white'
            }`}
          >
            <span>✔ Verificados</span>
            {onlyVerifiedFilter && <X className="w-3 h-3 ml-0.5" />}
          </button>

          <div className="flex items-center gap-1.5 bg-[var(--sunken)] px-2.5 py-1.5 rounded-lg border borderbg-[var(--surface)] text-xs">
            <span className="text-neutral-400">Aforo mín:</span>
            <input
              type="number"
              placeholder="Ej: 300"
              value={minCapacityFilter || ''}
              onChange={(e) => setMinCapacityFilter(Number(e.target.value) || 0)}
              className="w-16 bg-transparent text-[#eab308] font-bold focus:outline-none"
            />
            {minCapacityFilter > 0 && (
              <button type="button" onClick={() => setMinCapacityFilter(0)} className="text-neutral-500 hover:text-white cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Button to save current filter */}
          {!isSavingFilterOpen ? (
            <button
              type="button"
              onClick={() => setIsSavingFilterOpen(true)}
              className="px-2.5 py-1.5 bg-[#eab308]/15 hover:bg-[#eab308]/25 text-[#eab308] rounded-lg font-bold text-xs flex items-center gap-1 transition-all border border-[#eab308]/30 cursor-pointer"
              title="Guardar la combinación de filtros actual en 1 clic"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-[#eab308]" />
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
                className="px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-[#eab308]/50 text-white focus:outline-none w-48 sm:w-56"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setIsSavingFilterOpen(false)}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg cursor-pointer"
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
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Búsquedas guardadas</p>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {savedFilters.map((sf) => {
              const isActive = activeSavedFilterId === sf.id;
              return (
                <div
                  key={sf.id}
                  className={`group relative shrink-0 flex items-center rounded-full border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#eab308]/20 border-[#eab308] text-[#eab308] font-bold shadow-xs'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 border-[var(--hair)] text-neutral-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleApplySavedFilter(sf)}
                    className="px-3 py-1 text-xs font-sans flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📌 {sf.nombre}</span>
                    {sf.minCapacityFilter ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#eab308]/30 text-amber-200">&gt;{sf.minCapacityFilter}</span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSavedFilter(sf.id, e)}
                    className="pr-2 text-neutral-500 hover:text-rose-400 transition-colors p-0.5 rounded-full cursor-pointer"
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
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tipo de espacio / contacto</p>
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
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === t.key ? 'bg-[#f2ca50] text-[#3c2f00] font-bold shadow-sm' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
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
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ciudad / Localidad</p>
          {selectedCityFilter && (
            <button
              type="button"
              onClick={() => setSelectedCityFilter('')}
              className="text-[10px] text-amber-400 hover:underline cursor-pointer"
            >
              Ver todas
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setSelectedCityFilter('')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${
              selectedCityFilter === ''
                ? 'bg-[#22211F] text-[#eab308] font-bold border border-[var(--acc)]/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-[var(--hair)]'
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
                className={`px-2.5 py-1 rounded-full text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[#eab308]/20 text-[#eab308] font-bold border border-[#eab308]/50'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-[var(--hair)]'
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
          className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1 px-2 py-1 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Limpiar filtros</span>
        </button>

        <button
          type="button"
          onClick={() => onClose()}
          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#f2ca50] text-[#2c2200] cursor-pointer shadow-sm"
        >
          Ver {filteredCount} resultados
        </button>
      </div>
    </div>
  );
};
