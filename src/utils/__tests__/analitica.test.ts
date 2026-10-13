// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { iniciarAnalitica, registrarEvento } from '../analitica';

describe('analitica', () => {
  beforeEach(() => {
    document.getElementById('plausible-script')?.remove();
    delete (window as { plausible?: unknown }).plausible;
  });
  afterEach(() => vi.unstubAllEnvs());

  it('sin VITE_PLAUSIBLE_DOMAIN no carga nada y los eventos no hacen nada', () => {
    vi.stubEnv('VITE_PLAUSIBLE_DOMAIN', '');
    iniciarAnalitica();
    expect(document.getElementById('plausible-script')).toBeNull();
    expect(() => registrarEvento('Registro')).not.toThrow();
  });

  it('con dominio inserta el script una sola vez y encola eventos tempranos', () => {
    vi.stubEnv('VITE_PLAUSIBLE_DOMAIN', 'bandmanager.io');
    iniciarAnalitica();
    iniciarAnalitica();
    const scripts = document.querySelectorAll('#plausible-script');
    expect(scripts).toHaveLength(1);
    expect((scripts[0] as HTMLScriptElement).dataset.domain).toBe('bandmanager.io');
    expect((scripts[0] as HTMLScriptElement).src).toBe('https://plausible.io/js/script.js');
    registrarEvento('Idioma Cambiado', { idioma: 'en' });
    expect((window as { plausible?: { q?: unknown[] } }).plausible?.q).toHaveLength(1);
  });

  it('manda el evento a plausible cuando ya está cargado y nunca lanza', () => {
    const plausible = vi.fn();
    (window as { plausible?: unknown }).plausible = plausible;
    registrarEvento('CTA Landing');
    registrarEvento('Idioma Cambiado', { idioma: 'en' });
    expect(plausible).toHaveBeenNthCalledWith(1, 'CTA Landing', undefined);
    expect(plausible).toHaveBeenNthCalledWith(2, 'Idioma Cambiado', { props: { idioma: 'en' } });
    plausible.mockImplementation(() => { throw new Error('boom'); });
    expect(() => registrarEvento('Registro')).not.toThrow();
  });
});
