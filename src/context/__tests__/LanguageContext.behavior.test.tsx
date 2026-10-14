// @vitest-environment happy-dom
import React, { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { LanguageProvider } from '../LanguageContext';
import { useLanguage } from '../idioma';

type Ctx = ReturnType<typeof useLanguage>;
let ctx: Ctx;
function Sonda() {
  const actual = useLanguage();
  useEffect(() => {
    ctx = actual;
  });
  return null;
}
const montar = () =>
  render(
    <LanguageProvider>
      <Sonda />
    </LanguageProvider>
  );

describe('LanguageProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.getElementById('google-translate-script')?.remove();
    document.getElementById('google_translate_element')?.remove();
    document.documentElement.classList.remove('translating-in-background');
    vi.useFakeTimers();
    // happy-dom no carga scripts remotos: se da por bueno, aquí solo interesa que se inserte.
    (window as unknown as { happyDOM: { settings: { handleDisabledFileLoadingAsSuccess: boolean } } }).happyDOM.settings.handleDisabledFileLoadingAsSuccess = true;
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('usa el idioma guardado y traduce con t() con respaldo al español y al texto por defecto', () => {
    localStorage.setItem('bandmanager_language', 'en');
    montar();
    expect(ctx.language).toBe('en');
    expect(ctx.t('nav.finanzas')).toBe('Finances');
    expect(ctx.t('clave.inexistente', 'Por defecto')).toBe('Por defecto');
    expect(ctx.t('clave.inexistente')).toBe('clave.inexistente');
  });

  it('en la URL /en manda el inglés sobre el idioma guardado, sin sobrescribirlo', () => {
    localStorage.setItem('bandmanager_language', 'es');
    window.history.pushState({}, '', '/en');
    try {
      montar();
      expect(ctx.language).toBe('en');
      expect(localStorage.getItem('bandmanager_language')).toBe('es');
    } finally {
      window.history.pushState({}, '', '/');
    }
  });

  it('con idioma guardado distinto de es arranca traduciendo y marca el documento', () => {
    localStorage.setItem('bandmanager_language', 'ca');
    montar();
    expect(ctx.isTranslating).toBe(true);
    expect(document.documentElement.classList.contains('translating-in-background')).toBe(true);
    expect(document.cookie).toContain('googtrans=/es/ca');
  });

  it('el idioma por defecto del navegador también activa la traducción desde el montaje', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-GB');
    montar();
    expect(ctx.language).toBe('en');
    expect(ctx.isTranslating).toBe(true);
  });

  it('en español no traduce ni queda marca en el documento', () => {
    localStorage.setItem('bandmanager_language', 'es');
    montar();
    expect(ctx.isTranslating).toBe(false);
    expect(document.documentElement.classList.contains('translating-in-background')).toBe(false);
  });

  it('monta el widget de Google Translate una sola vez', () => {
    localStorage.setItem('bandmanager_language', 'es');
    const a = montar();
    expect(document.querySelectorAll('#google-translate-script')).toHaveLength(1);
    expect(document.getElementById('google_translate_element')).not.toBeNull();
    a.unmount();
    montar();
    expect(document.querySelectorAll('#google-translate-script')).toHaveLength(1);
  });

  it('setLanguage persiste, cambia el idioma y termina la traducción por el temporizador de seguridad', () => {
    localStorage.setItem('bandmanager_language', 'es');
    montar();
    act(() => ctx.setLanguage('gl'));
    expect(ctx.language).toBe('gl');
    expect(localStorage.getItem('bandmanager_language')).toBe('gl');
    expect(ctx.isTranslating).toBe(true);
    act(() => {
      vi.advanceTimersByTime(450 + 60 + 10);
    });
    expect(ctx.isTranslating).toBe(false);
    expect(document.documentElement.classList.contains('translating-in-background')).toBe(false);
  });

  it('volver a es limpia la cookie y termina al instante', () => {
    localStorage.setItem('bandmanager_language', 'eu');
    montar();
    act(() => ctx.setLanguage('es'));
    expect(ctx.isTranslating).toBe(false);
    expect(document.cookie).not.toContain('googtrans=/es/eu');
  });

  it('refreshTranslation solo actúa fuera del español', () => {
    localStorage.setItem('bandmanager_language', 'es');
    montar();
    act(() => ctx.refreshTranslation());
    expect(ctx.isTranslating).toBe(false);
    act(() => ctx.setLanguage('en'));
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(ctx.isTranslating).toBe(false);
    act(() => ctx.refreshTranslation());
    expect(ctx.isTranslating).toBe(true);
  });

  it('useLanguage fuera del proveedor lanza', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Sonda />)).toThrow(/LanguageProvider/);
  });
});
