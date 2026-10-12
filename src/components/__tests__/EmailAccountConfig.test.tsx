// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  api: new Proxy(
    {},
    { get: () => vi.fn().mockResolvedValue({ connected: false, configured: false }) },
  ),
}));

import { EmailAccountConfig } from '../EmailAccountConfig';

describe('EmailAccountConfig: retorno del consentimiento de Gmail', () => {
  beforeEach(() => {
    cleanup();
    window.history.replaceState({}, '', '/');
  });

  it('muestra el aviso de éxito y limpia la query al volver con ?gmail_oauth=conectado', async () => {
    window.history.replaceState({}, '', '/?gmail_oauth=conectado&otro=1');
    render(<EmailAccountConfig bandId="band-1" />);
    expect(await screen.findByText(/Gmail conectado/)).toBeTruthy();
    expect(window.location.search).toBe('?otro=1');
  });

  it('muestra el motivo del error al volver con ?gmail_oauth=error', async () => {
    window.history.replaceState({}, '', '/?gmail_oauth=error&motivo=acceso_denegado');
    render(<EmailAccountConfig bandId="band-1" />);
    expect(await screen.findByText(/acceso_denegado/)).toBeTruthy();
    expect(window.location.search).toBe('');
  });

  it('no muestra aviso si no hay parámetro', () => {
    render(<EmailAccountConfig bandId="band-1" />);
    expect(screen.queryByText(/Gmail conectado/)).toBeNull();
  });
});

describe('EmailAccountConfig sin banda', () => {
  it('no se queda comprobando para siempre si falta el bandId', () => {
    cleanup();
    render(<EmailAccountConfig bandId="" />);
    expect(screen.queryByText(/Comprobando cuenta de email/)).toBeNull();
    expect(screen.getByText(/No se pudo identificar la banda activa/)).toBeTruthy();
  });
});
