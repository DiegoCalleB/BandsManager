// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import type { Lead } from '../../../types';

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock('../../../utils/api', () => ({ apiFetch }));
vi.mock('../../common/ModalPortal', () => ({ ModalPortal: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

import { VenueProfileColumn } from '../venue_modal/VenueProfileColumn';
import { VenuePitchWorkspace } from '../venue_modal/VenuePitchWorkspace';
import { AgentQueueMonitorModal } from '../AgentQueueMonitorModal';

const lead = (over: Partial<Lead> = {}) => ({ id: 'l1', nombre_sala: 'Sala Uno', estado: 'nuevo', pitch_generado: 'Hola uno', ...over }) as unknown as Lead;

afterEach(cleanup);

describe('VenueProfileColumn', () => {
  it('al cambiar de lead sale del modo edición y recarga el formulario', () => {
    const props = { onUpdateLead: vi.fn(), onOpenWhatsAppModal: vi.fn() };
    const { rerender } = render(<VenueProfileColumn lead={lead()} {...props} />);
    fireEvent.click(screen.getByText('Editar datos'));
    const nombre = screen.getByDisplayValue('Sala Uno') as HTMLInputElement;
    fireEvent.change(nombre, { target: { value: 'Cambiada' } });
    // mismo lead que se re-renderiza: no se pierde la edición
    rerender(<VenueProfileColumn lead={lead()} {...props} />);
    expect(screen.getByDisplayValue('Cambiada')).toBeTruthy();
    rerender(<VenueProfileColumn lead={lead({ id: 'l2', nombre_sala: 'Sala Dos' })} {...props} />);
    expect(screen.queryByText('Ver ficha')).toBeNull();
    fireEvent.click(screen.getByText('Editar datos'));
    expect(screen.getByDisplayValue('Sala Dos')).toBeTruthy();
  });
});

describe('VenuePitchWorkspace', () => {
  const props = { onUpdateLead: vi.fn(), onOpenWhatsAppModal: vi.fn() };
  it('al cambiar el pitch guardado descarta el borrador y sale de edición', () => {
    const { rerender } = render(<VenuePitchWorkspace lead={lead()} {...props} />);
    fireEvent.click(screen.getByText('Editar'));
    const area = screen.getByPlaceholderText(/Escribe o retoca/) as HTMLTextAreaElement;
    expect(area.value).toBe('Hola uno');
    fireEvent.change(area, { target: { value: 'borrador' } });
    rerender(<VenuePitchWorkspace lead={lead()} {...props} />);
    expect((screen.getByPlaceholderText(/Escribe o retoca/) as HTMLTextAreaElement).value).toBe('borrador');
    rerender(<VenuePitchWorkspace lead={lead({ pitch_generado: 'Hola nuevo' })} {...props} />);
    expect(screen.queryByPlaceholderText(/Escribe o retoca/)).toBeNull();
    fireEvent.click(screen.getByText('Editar'));
    expect((screen.getByPlaceholderText(/Escribe o retoca/) as HTMLTextAreaElement).value).toBe('Hola nuevo');
  });
});

describe('AgentQueueMonitorModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    apiFetch.mockReset();
    apiFetch.mockResolvedValue({ success: true, stats: { pending: 3, processing: 0, completed: 0, failed: 0, total: 3 }, recentJobs: [] });
  });
  afterEach(() => vi.useRealTimers());

  it('cerrado no consulta; abierto consulta al abrir y cada 4 s; al cerrar deja de sondear', async () => {
    const { rerender } = render(<AgentQueueMonitorModal isOpen={false} onClose={vi.fn()} />);
    expect(apiFetch).not.toHaveBeenCalled();
    rerender(<AgentQueueMonitorModal isOpen onClose={vi.fn()} />);
    expect(apiFetch).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    expect(apiFetch).toHaveBeenCalledTimes(2);
    rerender(<AgentQueueMonitorModal isOpen={false} onClose={vi.fn()} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(8000); });
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });
});
