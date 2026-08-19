import { useState, useEffect, FormEvent, MouseEvent } from 'react';
import { LeadStatus, LeadType, SavedFilter } from '../types';

const DEFAULT_PRESET_FILTERS: SavedFilter[] = [
  {
    id: 'preset-bcn-300',
    nombre: 'Salas Cataluña / BCN (Aforo > 300) pendientes',
    sectionTab: 'salas',
    selectedCityFilter: 'Barcelona',
    statusFilter: 'nuevo',
    minCapacityFilter: 300
  },
  {
    id: 'preset-festivales-pendientes',
    nombre: 'Festivales pendientes de respuesta',
    sectionTab: 'salas',
    typeFilter: 'festival',
    statusFilter: 'esperando_respuesta'
  },
  {
    id: 'preset-prensa-madrid',
    nombre: 'Medios y prensa en Madrid',
    sectionTab: 'medios',
    selectedCityFilter: 'Madrid',
    typeFilter: 'medio'
  },
  {
    id: 'preset-interesados-negociando',
    nombre: 'Salas interesadas / Negociando',
    sectionTab: 'salas',
    statusFilter: 'interesado'
  }
];

export function useSavedFilters(
  sectionTab: 'salas' | 'medios' | 'grupos',
  setSectionTab: (tab: 'salas' | 'medios' | 'grupos') => void,
  initialStatusFilter: LeadStatus | 'todos'
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'todos'>(initialStatusFilter);
  const [typeFilter, setTypeFilter] = useState<LeadType | 'todos'>('todos');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('');
  const [minCapacityFilter, setMinCapacityFilter] = useState<number>(0);
  const [onlyFavoritesFilter, setOnlyFavoritesFilter] = useState<boolean>(false);
  const [onlyVerifiedFilter, setOnlyVerifiedFilter] = useState<boolean>(false);

  useEffect(() => {
    if (initialStatusFilter !== undefined) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try {
      const saved = localStorage.getItem('bakandeya_saved_crm_filters');
      return saved ? JSON.parse(saved) : DEFAULT_PRESET_FILTERS;
    } catch {
      return DEFAULT_PRESET_FILTERS;
    }
  });

  const [isSavingFilterOpen, setIsSavingFilterOpen] = useState<boolean>(false);
  const [newFilterName, setNewFilterName] = useState<string>('');
  const [activeSavedFilterId, setActiveSavedFilterId] = useState<string | null>(null);

  const handleApplySavedFilter = (sf: SavedFilter) => {
    setActiveSavedFilterId(sf.id);
    if (sf.sectionTab) setSectionTab(sf.sectionTab);
    setSearchTerm(sf.searchTerm || '');
    setSelectedCityFilter(sf.selectedCityFilter || '');
    setStatusFilter(sf.statusFilter || 'todos');
    setTypeFilter(sf.typeFilter || 'todos');
    setMinCapacityFilter(sf.minCapacityFilter || 0);
  };

  const handleSaveCurrentFilter = (e: FormEvent) => {
    e.preventDefault();
    if (!newFilterName.trim()) return;

    const newSf: SavedFilter = {
      id: `filter-${Date.now()}`,
      nombre: newFilterName.trim(),
      sectionTab,
      searchTerm,
      selectedCityFilter,
      statusFilter,
      typeFilter,
      minCapacityFilter
    };

    const updated = [newSf, ...savedFilters];
    setSavedFilters(updated);
    try {
      localStorage.setItem('bakandeya_saved_crm_filters', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setActiveSavedFilterId(newSf.id);
    setNewFilterName('');
    setIsSavingFilterOpen(false);
  };

  const handleDeleteSavedFilter = (filterId: string, e: MouseEvent) => {
    e.stopPropagation();
    const updated = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updated);
    try {
      localStorage.setItem('bakandeya_saved_crm_filters', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    if (activeSavedFilterId === filterId) {
      setActiveSavedFilterId(null);
    }
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setSelectedCityFilter('');
    setStatusFilter('todos');
    setTypeFilter('todos');
    setMinCapacityFilter(0);
    setOnlyFavoritesFilter(false);
    setOnlyVerifiedFilter(false);
    setActiveSavedFilterId(null);
  };

  return {
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    selectedCityFilter, setSelectedCityFilter,
    minCapacityFilter, setMinCapacityFilter,
    onlyFavoritesFilter, setOnlyFavoritesFilter,
    onlyVerifiedFilter, setOnlyVerifiedFilter,
    savedFilters,
    isSavingFilterOpen, setIsSavingFilterOpen,
    newFilterName, setNewFilterName,
    activeSavedFilterId, setActiveSavedFilterId,
    handleApplySavedFilter,
    handleSaveCurrentFilter,
    handleDeleteSavedFilter,
    handleClearAllFilters,
  };
}
