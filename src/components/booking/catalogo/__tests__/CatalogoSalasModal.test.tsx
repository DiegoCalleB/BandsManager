// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import type { SalaDelCatalogo } from '../../../../services/apiCatalogo';

const api = vi.hoisted(() => ({ buscarSalasDelCatalogo: vi.fn(), anadirSalaDelCatalogo: vi.fn() }));
vi.mock('../../../../services/apiCatalogo', () => api);
vi.mock('../../../common/ModalPortal', () => ({ ModalPortal: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

import { CatalogoSalasModal } from '../CatalogoSalasModal';

const sala = (o: Partial<SalaDelCatalogo> & { id: string; nombre: string }): SalaDelCatalogo => ({
  ciudad: 'Madrid', region: 'Comunidad de Madrid', tipo: 'sala', aforo: 300, genero: 'Rock', website: null, instagram: null,
  nivel: 'probable', bandas_con_respuesta: 0, tiene_email: true, tiene_telefono: false, posiblemente_cerrada: false, ya_en_agenda: false, ...o,
});

const pasar = async (ms = 400) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));

beforeEach(() => {
  vi.useFakeTimers();
  api.buscarSalasDelCatalogo.mockReset();
  api.anadirSalaDelCatalogo.mockReset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('CatalogoSalasModal', () => {
  it('lista las salas del catálogo y marca las que ya están en la agenda', async () => {
    api.buscarSalasDelCatalogo.mockResolvedValue({ total: 2, mostradas: 2, salas: [sala({ id: 'a', nombre: 'Sala Alfa' }), sala({ id: 'b', nombre: 'Sala Beta', ya_en_agenda: true })] });
    render(<CatalogoSalasModal isOpen onClose={() => {}} />);
    await pasar();
    expect(screen.getByText('Sala Alfa')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Añadir Sala Alfa a mi agenda' })).toBeTruthy();
    expect(screen.getByText('En tu agenda')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Añadir Sala Beta a mi agenda' })).toBeNull();
  });

  it('al añadir una sala, la marca como «en tu agenda» y avisa para recargar la agenda', async () => {
    api.buscarSalasDelCatalogo.mockResolvedValue({ total: 1, mostradas: 1, salas: [sala({ id: 'a', nombre: 'Sala Alfa' })] });
    api.anadirSalaDelCatalogo.mockResolvedValue({ ok: true, leadId: 'lead-1' });
    const aviso = vi.fn();
    window.addEventListener('app-data-updated', aviso);
    render(<CatalogoSalasModal isOpen onClose={() => {}} />);
    await pasar();
    await act(async () => void fireEvent.click(screen.getByRole('button', { name: 'Añadir Sala Alfa a mi agenda' })));
    expect(api.anadirSalaDelCatalogo).toHaveBeenCalledWith('a');
    expect(screen.getByText('En tu agenda')).toBeTruthy();
    expect(aviso).toHaveBeenCalledTimes(1);
    window.removeEventListener('app-data-updated', aviso);
  });

  it('si el plan no admite más, enseña el motivo y deja el botón', async () => {
    api.buscarSalasDelCatalogo.mockResolvedValue({ total: 1, mostradas: 1, salas: [sala({ id: 'a', nombre: 'Sala Alfa' })] });
    api.anadirSalaDelCatalogo.mockResolvedValue({ ok: false, error: 'Has llegado al límite de tu plan.' });
    render(<CatalogoSalasModal isOpen onClose={() => {}} />);
    await pasar();
    await act(async () => void fireEvent.click(screen.getByRole('button', { name: 'Añadir Sala Alfa a mi agenda' })));
    expect(screen.getByRole('alert').textContent).toContain('límite de tu plan');
    expect(screen.getByRole('button', { name: 'Añadir Sala Alfa a mi agenda' })).toBeTruthy();
  });

  it('busca al escribir, con un respiro, y manda los filtros', async () => {
    api.buscarSalasDelCatalogo.mockResolvedValue({ total: 0, mostradas: 0, salas: [] });
    render(<CatalogoSalasModal isOpen onClose={() => {}} />);
    await pasar();
    fireEvent.change(screen.getByLabelText('Ciudad o región'), { target: { value: 'Lugo' } });
    await pasar(100);
    expect(api.buscarSalasDelCatalogo).toHaveBeenCalledTimes(1);
    await pasar(300);
    expect(api.buscarSalasDelCatalogo).toHaveBeenCalledTimes(2);
    expect(api.buscarSalasDelCatalogo.mock.calls[1][0]).toMatchObject({ lugar: 'Lugo' });
  });

  it('sin resultados habla con voz propia y sugiere el chat', async () => {
    api.buscarSalasDelCatalogo.mockResolvedValue({ total: 0, mostradas: 0, salas: [] });
    render(<CatalogoSalasModal isOpen onClose={() => {}} />);
    await pasar();
    expect(screen.getByText('Ninguna sala encaja con eso.')).toBeTruthy();
  });

  it('cerrado no consulta nada', async () => {
    render(<CatalogoSalasModal isOpen={false} onClose={() => {}} />);
    await pasar();
    expect(api.buscarSalasDelCatalogo).not.toHaveBeenCalled();
  });
});
