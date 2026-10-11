// @vitest-environment happy-dom
/**
 * Regresión: el modal llamaba a `POST /api/leads/:id/enrich`, ruta que no existe en el servidor
 * (404 silenciado), así que nunca enriquecía nada. El endpoint real es `/api/leads/enrich-lead`.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Lead } from '../../../types';

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock('../../../utils/api', () => ({ apiFetch }));

import { CRMContactEnricherModal } from '../CRMContactEnricherModal';

const lead = { id: 'l1', nombre_sala: 'Sala Sol', ciudad: 'Madrid' } as Lead;

beforeEach(() => vi.clearAllMocks());

describe('CRMContactEnricherModal', () => {
  it('enriquece con /api/leads/enrich-lead y aplica email, teléfono móvil y web', async () => {
    apiFetch.mockResolvedValue({ success: true, data: { email: 'sol@sala.es', phone: '612345678', website: 'https://sala.es' } });
    const onUpdateLead = vi.fn();
    render(<CRMContactEnricherModal isOpen onClose={vi.fn()} leads={[lead]} onUpdateLead={onUpdateLead} />);
    await act(async () => {
      fireEvent.click(screen.getByText('Iniciar Enriquecimiento'));
    });
    expect(apiFetch).toHaveBeenCalledWith('/api/leads/enrich-lead', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toMatchObject({ leadId: 'l1' });
    expect(onUpdateLead).toHaveBeenCalledWith('l1', expect.objectContaining({
      email_contacto: 'sol@sala.es',
      telefono: '612345678',
      telefono_movil: '612345678',
      website: 'https://sala.es',
    }));
  });
});
