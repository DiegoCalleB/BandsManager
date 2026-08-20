import { useState, useEffect, useMemo, FormEvent, MouseEvent } from 'react';
import { Lead, EPKConfig } from '../types';
import { normalizeType } from '../utils/bookingUtils';

export function useCityChips(
  leads: Lead[],
  sectionTab: 'salas' | 'medios' | 'grupos',
  epkConfig: Partial<EPKConfig> | undefined,
  onUpdateEpkConfig: ((newConfig: Partial<EPKConfig>) => void) | undefined,
  selectedCityFilter: string,
  setSelectedCityFilter: (city: string) => void
) {
  const [customCityChips, setCustomCityChips] = useState<string[]>(() => {
    if (epkConfig?.ciudadesConfig && Array.isArray(epkConfig.ciudadesConfig) && epkConfig.ciudadesConfig.length > 0) {
      return epkConfig.ciudadesConfig;
    }
    try {
      const saved = localStorage.getItem('bakandeya_custom_cities');
      return saved ? JSON.parse(saved) : ['Madrid', 'Sevilla', 'Barcelona', 'Málaga', 'Valencia', 'Granada', 'Cádiz'];
    } catch {
      return ['Madrid', 'Sevilla', 'Barcelona', 'Málaga', 'Valencia', 'Granada', 'Cádiz'];
    }
  });

  useEffect(() => {
    if (epkConfig?.ciudadesConfig && Array.isArray(epkConfig.ciudadesConfig) && epkConfig.ciudadesConfig.length > 0) {
      setCustomCityChips(epkConfig.ciudadesConfig);
    }
  }, [epkConfig?.ciudadesConfig]);

  const [isAddingCityChip, setIsAddingCityChip] = useState(false);
  const [newCityInput, setNewCityInput] = useState('');

  // Dynamically extract top cities present in active leads
  const activeLeadsForSection = useMemo(() => {
    return leads.filter(l => sectionTab === 'medios' ? normalizeType(l.tipo) === 'medio' : normalizeType(l.tipo) !== 'medio');
  }, [leads, sectionTab]);

  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeLeadsForSection.forEach(l => {
      const cityRaw = (l.ciudad || '').trim();
      if (cityRaw) {
        const mainCity = cityRaw.split(/[\(\-\/]/)[0].trim();
        if (mainCity) {
          counts[mainCity] = (counts[mainCity] || 0) + 1;
        }
      }
    });
    return counts;
  }, [activeLeadsForSection]);

  const topDynamicCities = useMemo(() => {
    return Object.entries(cityCounts)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 7)
      .map(([cityName]) => cityName);
  }, [cityCounts]);

  const displayCityChips = useMemo(() => {
    const list = [...new Set([...customCityChips, ...topDynamicCities])];
    return list;
  }, [topDynamicCities, customCityChips]);

  const handleAddCustomCity = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!newCityInput.trim()) return;
    const formatted = newCityInput.trim();
    if (!customCityChips.includes(formatted)) {
      const updated = [...customCityChips, formatted];
      setCustomCityChips(updated);
      try { localStorage.setItem('bakandeya_custom_cities', JSON.stringify(updated)); } catch {}
      if (onUpdateEpkConfig) {
        onUpdateEpkConfig({ ciudadesConfig: updated });
      }
    }
    setSelectedCityFilter(formatted);
    setNewCityInput('');
    setIsAddingCityChip(false);
  };

  const handleRemoveCustomCity = (cityToRemove: string, e: MouseEvent) => {
    e.stopPropagation();
    const updated = customCityChips.filter(c => c !== cityToRemove);
    setCustomCityChips(updated);
    try { localStorage.setItem('bakandeya_custom_cities', JSON.stringify(updated)); } catch {}
    if (selectedCityFilter === cityToRemove) {
      setSelectedCityFilter('');
    }
    if (onUpdateEpkConfig) {
      onUpdateEpkConfig({ ciudadesConfig: updated });
    }
  };

  return {
    customCityChips,
    isAddingCityChip, setIsAddingCityChip,
    newCityInput, setNewCityInput,
    activeLeadsForSection,
    cityCounts,
    displayCityChips,
    handleAddCustomCity,
    handleRemoveCustomCity,
  };
}
