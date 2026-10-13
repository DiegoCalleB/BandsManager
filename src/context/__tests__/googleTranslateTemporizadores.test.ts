// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { traducirConGoogle } from '../googleTranslate';

/**
 * La CI fallaba a veces con «ReferenceError: document is not defined» en selectCombo: el
 * intervalo que busca el desplegable de Google Translate seguía disparándose cuando el entorno
 * (los tests, o una pestaña que se cierra) ya no tenía `document`.
 */
describe('traducirConGoogle: temporizadores', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.documentElement.className = '';
  });

  it('avisa al terminar aunque el desplegable de Google no llegue a aparecer', () => {
    const alTerminar = vi.fn();
    traducirConGoogle('en', alTerminar);
    vi.advanceTimersByTime(5_000);
    expect(alTerminar).toHaveBeenCalledTimes(1);
  });

  it('deja de buscar el desplegable cuando el entorno ya no tiene document, sin lanzar', () => {
    traducirConGoogle('en', vi.fn());
    vi.advanceTimersByTime(100);
    vi.stubGlobal('document', undefined);
    expect(() => vi.advanceTimersByTime(5_000)).not.toThrow();
  });

  it('no deja temporizadores pendientes cuando termina de buscar', () => {
    traducirConGoogle('en', vi.fn());
    vi.advanceTimersByTime(10_000);
    expect(vi.getTimerCount()).toBe(0);
  });
});
