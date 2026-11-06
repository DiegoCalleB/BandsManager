// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLeadFiltering } from '../useLeadFiltering';
import type { BookingCampaign, Lead } from '../../../../../types';

const lead = (id: string, genero: string): Lead => ({ id, nombre_sala: id, tipo: 'festival', genero, ciudad: 'X', estado: 'nuevo' }) as Lead;
const campana = { id: 'c', name: 'BF', alcance: 'festivales', targetCities: [], minCapacity: 0, maxCapacity: 0, targetDates: [], isActive: true } as BookingCampaign;
const base = { sectionTab: 'salas' as const, searchTerm: '', statusFilter: 'todos', typeFilter: 'todos', selectedCityFilter: '', minCapacityFilter: 0, routeAnchorCity: '' };
const leads = [lead('metal', 'Metal'), lead('ska', 'Ska'), lead('reggae', 'Reggae')];

describe('useLeadFiltering con campaña de festivales', () => {
  it('ordena por encaje con el género de la banda', () => {
    const { result } = renderHook(() => useLeadFiltering({ ...base, leads, filterByCampaign: true, activeCampaign: campana, generosBanda: ['Reggae', 'Ska'] } as never));
    expect(result.current.filteredLeads.map((l) => l.id)).toEqual(['ska', 'reggae', 'metal']);
  });
  it('sin campaña de festivales no reordena', () => {
    const { result } = renderHook(() => useLeadFiltering({ ...base, leads, filterByCampaign: false, activeCampaign: campana, generosBanda: ['Reggae'] } as never));
    expect(result.current.filteredLeads.map((l) => l.id)).toEqual(['metal', 'ska', 'reggae']);
  });
});
