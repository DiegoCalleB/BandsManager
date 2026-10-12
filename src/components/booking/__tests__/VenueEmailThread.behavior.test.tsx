// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import type { Lead } from '../../../types';

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock('../../../utils/api', () => ({ apiFetch }));

import { VenueEmailThread } from '../venue_modal/VenueEmailThread';

const lead = (id: string) => ({ id, nombre_sala: 'Sala', estado: 'enviado', historial_contacto: [] }) as unknown as Lead;
const msg = (id: string, cuerpo: string, fecha: string) => ({ id, remitente: 'sala', cuerpo, contenido: cuerpo, fecha });
const props = { onUpdateLead: vi.fn(), onSelectPitchTab: vi.fn() };

describe('VenueEmailThread', () => {
  beforeEach(() => apiFetch.mockReset());
  afterEach(cleanup);

  it('carga los mensajes del lead y los cuenta en la cabecera', async () => {
    apiFetch.mockResolvedValue({ success: true, messages: [msg('m1', 'uno', '2026-01-01'), msg('m2', 'dos', '2026-01-02')] });
    render(<VenueEmailThread lead={lead('l1')} {...props} />);
    expect(apiFetch.mock.calls[0][0]).toBe('/api/leads/l1/messages');
    await waitFor(() => expect(screen.getByText('Hilo de mensajes (2)')).toBeTruthy());
  });

  it('al cambiar de lead no arrastra los mensajes del anterior y vuelve a cargar', async () => {
    apiFetch.mockResolvedValueOnce({ success: true, messages: [msg('m1', 'uno', '2026-01-01')] });
    const { rerender } = render(<VenueEmailThread lead={lead('l1')} {...props} />);
    await waitFor(() => expect(screen.getByText('Hilo de mensajes (1)')).toBeTruthy());
    apiFetch.mockResolvedValueOnce({ success: true, messages: [msg('n1', 'a', '2026-02-01'), msg('n2', 'b', '2026-02-02')] });
    rerender(<VenueEmailThread lead={lead('l2')} {...props} />);
    expect(screen.getByText('Hilo de mensajes (0)')).toBeTruthy();
    expect(apiFetch.mock.calls[1][0]).toBe('/api/leads/l2/messages');
    await waitFor(() => expect(screen.getByText('Hilo de mensajes (2)')).toBeTruthy());
  });
});
