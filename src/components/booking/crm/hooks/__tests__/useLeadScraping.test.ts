// @vitest-environment happy-dom
/**
 * Regresión: `apiFetch` devuelve el JSON ya parseado (no una `Response`). El rastreo del modal
 * leía `res.ok` / `res.json()` y por eso SIEMPRE acababa en el mensaje de error.
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock('../../../../../utils/api', () => ({ apiFetch }));

import { useLeadScraping, type LeadScrapingParams } from '../useLeadScraping';

const newLeadData = { nombre_sala: 'Sala Sol', ciudad: 'Madrid', region: '', notas: '', email_contacto: '', telefono: '', telefono_movil: '', telefono_fijo: '', website: '', aforo: 0, genero: '', imagen_url: '', icono: '' };

function montar() {
  const setters = {
    setIsModalScraping: vi.fn(),
    setModalScrapeStatus: vi.fn(),
    setModalScrapeError: vi.fn(),
    setModalScrapeSuccessMsg: vi.fn(),
    setNewLeadData: vi.fn(),
  };
  const params = { newLeadData, ...setters, onUpdateLead: vi.fn(), setSelectedLead: vi.fn(), sectionTab: 'salas', effectiveBandName: 'Banda', onAddLead: vi.fn(), setIsAddingLeadModalOpen: vi.fn() } as unknown as LeadScrapingParams;
  const { result } = renderHook(() => useLeadScraping(params));
  return { result, setters };
}

beforeEach(() => vi.clearAllMocks());

describe('useLeadScraping.handleModalScrape', () => {
  it('aplica los datos rastreados cuando el servidor responde con éxito', async () => {
    apiFetch.mockResolvedValue({
      success: true,
      data: { email_contacto: { valor: 'sol@sala.es' }, telefono: { valor: '612345678' }, website: 'https://sala.es' },
    });
    const { result, setters } = montar();
    await act(() => result.current.handleModalScrape());
    expect(setters.setModalScrapeError).toHaveBeenLastCalledWith('');
    expect(setters.setModalScrapeSuccessMsg).toHaveBeenCalledWith(expect.stringContaining('sol@sala.es'));
    expect(setters.setNewLeadData).toHaveBeenCalledTimes(1);
  });

  it('muestra el error del servidor cuando no hay datos', async () => {
    apiFetch.mockResolvedValue({ success: false, error: 'Sin resultados' });
    const { result, setters } = montar();
    await act(() => result.current.handleModalScrape());
    expect(setters.setModalScrapeError).toHaveBeenLastCalledWith('Sin resultados');
  });

  it('muestra el mensaje de la excepción si apiFetch falla', async () => {
    apiFetch.mockRejectedValue(new Error('Error 502: caído'));
    const { result, setters } = montar();
    await act(() => result.current.handleModalScrape());
    expect(setters.setModalScrapeError).toHaveBeenLastCalledWith('Error 502: caído');
  });
});
