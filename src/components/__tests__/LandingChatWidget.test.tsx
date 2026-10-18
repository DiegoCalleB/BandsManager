// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LanguageProvider } from '../../context/LanguageContext';
import { LandingChatWidget } from '../LandingChatWidget';

const montar = () =>
  render(
    <LanguageProvider>
      <LandingChatWidget onEntrar={() => {}} />
    </LanguageProvider>,
  );

describe('LandingChatWidget', () => {
  beforeEach(() => {
    cleanup();
    try {
      localStorage.clear();
    } catch {
      /* sin almacenamiento */
    }
  });

  it('muestra el saludo al abrir el chat por primera vez', () => {
    montar();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getAllByText(/asistente de BandManager|BandManager assistant/i).length).toBeGreaterThan(0);
  });

  it('conserva el saludo al contestar una pregunta rápida', () => {
    montar();
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    const dialog = screen.getByRole('dialog');
    const preguntas = dialog.querySelectorAll('button span');
    const primera = Array.from(preguntas).find((s) => (s.textContent ?? '').length > 10) as HTMLElement;
    fireEvent.click(primera);
    // saludo + pregunta del usuario + respuesta del bot
    expect(dialog.querySelectorAll('p.rounded-2xl, p[class*="rounded"]').length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText(/asistente de BandManager|BandManager assistant/i).length).toBeGreaterThan(0);
  });
});
