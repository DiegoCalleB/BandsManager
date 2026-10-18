// @vitest-environment happy-dom
/**
 * Comportamiento de useLeadsBatchDateScan: escaneo en lote de fechas libres de las salas.
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Lead } from '../../../../../types';

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock('../../../../../utils/api', () => ({ apiFetch }));
vi.mock('../../../../../hooks/useEmailValidation', () => ({ useEmailValidation: () => ({ emailValidities: {} }) }));

import { useLeadsBatchDateScan } from '../useLeadsBatchDateScan';

const lead = (id: string) => ({ id, nombre_sala: `Sala ${id}` }) as Lead;

beforeEach(() => vi.clearAllMocks());

describe('useLeadsBatchDateScan', () => {
  it('escanea solo las salas seleccionadas si las hay', async () => {
    apiFetch.mockResolvedValue({ success: true, updatedLeads: [], processedCount: 1, totalFreeDates: 0 });
    const { result } = renderHook(() =>
      useLeadsBatchDateScan({ selectedLeadIds: ['b'], filteredLeads: [lead('a'), lead('b')], onUpdateLead: vi.fn() }),
    );
    await act(() => result.current.handleBatchScanDates());
    expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({ leadIds: ['b'] });
  });

  it('sin selección escanea todas las filtradas y aplica cada sala actualizada', async () => {
    const onUpdateLead = vi.fn();
    const actualizada = { ...lead('a'), fechas_libres: ['2026-11-01'] } as Lead;
    apiFetch.mockResolvedValue({ success: true, updatedLeads: [actualizada], processedCount: 2, totalFreeDates: 1 });
    const { result } = renderHook(() =>
      useLeadsBatchDateScan({ selectedLeadIds: [], filteredLeads: [lead('a'), lead('b')], onUpdateLead }),
    );
    await act(() => result.current.handleBatchScanDates());
    expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({ leadIds: ['a', 'b'] });
    expect(onUpdateLead).toHaveBeenCalledWith('a', actualizada);
    expect(result.current.batchScanResult).toMatch(/2 recintos.*1 fechas libres/);
    expect(result.current.isScanningBatchDates).toBe(false);
  });

  it('un rechazo del servidor se muestra como aviso y no toca ninguna sala', async () => {
    const onUpdateLead = vi.fn();
    apiFetch.mockResolvedValue({ success: false, error: 'Cuota de búsqueda agotada' });
    const { result } = renderHook(() => useLeadsBatchDateScan({ selectedLeadIds: [], filteredLeads: [lead('a')], onUpdateLead }));
    await act(() => result.current.handleBatchScanDates());
    expect(result.current.batchScanResult).toBe('⚠️ Cuota de búsqueda agotada');
    expect(onUpdateLead).not.toHaveBeenCalled();
  });

  it('un fallo de red se muestra como error y libera el botón', async () => {
    apiFetch.mockRejectedValue(new Error('Sin conexión'));
    const { result } = renderHook(() => useLeadsBatchDateScan({ selectedLeadIds: [], filteredLeads: [lead('a')], onUpdateLead: vi.fn() }));
    await act(() => result.current.handleBatchScanDates());
    expect(result.current.batchScanResult).toBe('❌ Error: Sin conexión');
    expect(result.current.isScanningBatchDates).toBe(false);
  });
});
