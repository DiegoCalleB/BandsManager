// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { GmailOAuthEstado } from '../GmailOAuthEstado';

afterEach(cleanup);

const base = { cargando: false, conectando: false, desconectando: false, onConectar: vi.fn(), onDesconectar: vi.fn() };

describe('GmailOAuthEstado', () => {
  it('conectado y sano: muestra la cuenta y deja desconectar', () => {
    render(<GmailOAuthEstado {...base} estado={{ connected: true, gmail_email: 'banda@gmail.com' }} />);
    expect(screen.getByText('banda@gmail.com')).toBeTruthy();
    expect(screen.getByText('Desconectar')).toBeTruthy();
    expect(screen.queryByText('Reconectar con Google')).toBeNull();
  });

  it('Google revocó el acceso: avisa de que los agentes están en pausa y ofrece reconectar', () => {
    const onConectar = vi.fn();
    render(
      <GmailOAuthEstado {...base} onConectar={onConectar} estado={{ connected: true, gmail_email: 'banda@gmail.com', needs_reauth_at: '2026-10-11T06:00:00Z' }} />,
    );
    expect(screen.getByText(/Los agentes\s+están en pausa/)).toBeTruthy();
    expect(screen.queryByText('Desconectar')).toBeNull();
    fireEvent.click(screen.getByText('Reconectar con Google'));
    expect(onConectar).toHaveBeenCalledTimes(1);
  });

  it('sin conectar: ofrece Conectar con Google', () => {
    render(<GmailOAuthEstado {...base} estado={{ connected: false }} />);
    expect(screen.getByText('Conectar con Google')).toBeTruthy();
  });

  it('mientras comprueba muestra el estado de carga', () => {
    render(<GmailOAuthEstado {...base} cargando estado={{ connected: false }} />);
    expect(screen.getByText(/Comprobando conexión de Gmail/)).toBeTruthy();
  });
});
