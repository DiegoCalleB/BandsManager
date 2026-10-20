// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FormularioInteres } from '../FormularioInteres';

const fetchMock = vi.fn();

describe('FormularioInteres', () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const rellenar = (email = 'ana@x.com') => fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });

  it('el botón siempre se puede pulsar: sin casilla no envía y dice qué falta', async () => {
    render(<FormularioInteres es />);
    rellenar();
    const boton = screen.getByRole('button', { name: /Avísame/ });
    expect((boton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(boton);
    expect((await screen.findByRole('alert')).textContent).toMatch(/casilla/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('con la casilla marcada envía el email y el consentimiento y enseña el aviso de confirmar', async () => {
    render(<FormularioInteres es />);
    rellenar();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Avísame/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/public/interesados');
    expect(JSON.parse(init.body)).toMatchObject({ email: 'ana@x.com', consentimiento: true, idioma: 'es', web: '' });
    expect((await screen.findByRole('status')).textContent).toMatch(/Revisa tu correo/);
  });

  it('si el servidor falla, enseña el error y deja reintentar', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'Servicio caído.' }) });
    render(<FormularioInteres es />);
    rellenar();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Avísame/ }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/Servicio caído/);
    expect((screen.getByRole('button', { name: /Avísame/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('manda de qué landing viene el alta', async () => {
    render(<FormularioInteres es origen="tfm" />);
    rellenar();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Avísame/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).origen).toBe('tfm');
  });
});
