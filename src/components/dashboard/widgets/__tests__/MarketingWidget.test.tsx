// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

const listar = vi.hoisted(() => vi.fn());
vi.mock('../../../../utils/promocionApi', () => ({ listarEnlaces: listar }));

import { MarketingWidget } from '../MarketingWidget';
import type { Fan, Lead } from '../../../../types';

const hace = (dias: number) => new Date(Date.now() - dias * 86_400_000).toISOString();
const fan = (d: number) => ({ id: `f${d}`, nombre: 'x', email: 'x@x.com', fechaCaptura: hace(d), consentimientoRGPD: true }) as Fan;

beforeEach(() => {
  listar.mockResolvedValue({ totales: { clics: 0, personas: 0, ultimos7: [0, 0, 0, 0, 0, 0, 0] } });
});
afterEach(cleanup);

describe('MarketingWidget', () => {
  it('sin ningún movimiento enseña un estado vacío con voz propia, no «sin datos»', async () => {
    render(<MarketingWidget fans={[]} leads={[]} />);
    expect(await screen.findByText('Todavía no ha sonado nada.')).toBeTruthy();
    expect(screen.queryByText(/sin datos/i)).toBeNull();
  });

  it('con datos muestra las cuatro cifras y los clics de la semana', async () => {
    listar.mockResolvedValue({ totales: { clics: 9, personas: 5, ultimos7: [0, 1, 2, 0, 3, 1, 2] } });
    const leads = [
      { id: 'a', fecha_envio: hace(3), fecha_ultima_respuesta: hace(1), estado: 'confirmado' },
      { id: 'b', fecha_envio: hace(4), estado: 'enviado' },
    ] as Lead[];
    render(<MarketingWidget fans={[fan(2), fan(5), fan(40)]} leads={leads} />);
    expect(screen.getByText('Fans nuevos')).toBeTruthy();
    expect(screen.getByText('1 más que los 30 días anteriores')).toBeTruthy();
    expect(screen.getByText('de 2 a las que has escrito')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('9')).toBeTruthy());
  });

  it('si los clics fallan, el resto del widget sigue funcionando', async () => {
    listar.mockRejectedValue(new Error('caído'));
    render(<MarketingWidget fans={[fan(2)]} leads={[]} />);
    expect(screen.getByText('Fans nuevos')).toBeTruthy();
    await waitFor(() => expect(listar).toHaveBeenCalled());
    expect(screen.queryByText('Todavía no ha sonado nada.')).toBeNull();
  });
});
