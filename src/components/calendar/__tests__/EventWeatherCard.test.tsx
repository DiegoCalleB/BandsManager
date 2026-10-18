// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';

const fetchEventWeather = vi.fn();
vi.mock('../../../services/weatherService', async (orig) => ({
  ...(await orig<typeof import('../../../services/weatherService')>()),
  fetchEventWeather: (...a: unknown[]) => fetchEventWeather(...a),
}));

import { EventWeatherCard } from '../EventWeatherCard';

const data = { alerts: [{ id: 'a1', severity: 'warning', title: 'Viento' }] };

beforeEach(() => {
  fetchEventWeather.mockReset();
  fetchEventWeather.mockResolvedValue(data);
});
afterEach(cleanup);

describe('EventWeatherCard', () => {
  it('consulta el tiempo al montar y notifica las alertas', async () => {
    const onAlerts = vi.fn();
    render(<EventWeatherCard city="Madrid" dateStr="2030-01-01" onAlertsDetected={onAlerts} />);
    await waitFor(() => expect(onAlerts).toHaveBeenCalledWith(data.alerts));
    expect(fetchEventWeather).toHaveBeenCalledWith({ city: 'Madrid', dateStr: '2030-01-01', timeStr: '21:00' });
  });

  it('vuelve a consultar al cambiar la ciudad y al pulsar actualizar', async () => {
    const { rerender } = render(<EventWeatherCard city="Madrid" dateStr="2030-01-01" />);
    await waitFor(() => expect(fetchEventWeather).toHaveBeenCalledTimes(1));
    rerender(<EventWeatherCard city="Sevilla" dateStr="2030-01-01" />);
    await waitFor(() => expect(fetchEventWeather).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByLabelText('Actualizar previsión'));
    await waitFor(() => expect(fetchEventWeather).toHaveBeenCalledTimes(3));
  });

  it('sin ciudad no consulta nada', () => {
    const { container } = render(<EventWeatherCard city="" dateStr="2030-01-01" />);
    expect(fetchEventWeather).not.toHaveBeenCalled();
    expect(container.innerHTML).toBe('');
  });
});
