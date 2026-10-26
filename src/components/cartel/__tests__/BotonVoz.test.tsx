// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { BotonVoz } from '../BotonVoz';

interface Reconocimiento {
  onresult?: (e: unknown) => void;
  onstart?: () => void;
  onend?: () => void;
  start: () => void;
  stop: () => void;
}
const hecho: { ultimo?: Reconocimiento } = {};

describe('BotonVoz', () => {
  beforeEach(() => {
    // Un constructor que devuelve un objeto: `new` se queda con ese objeto.
    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = function Falso() {
      const r: Reconocimiento = { start: () => r.onstart?.(), stop: () => r.onend?.() };
      hecho.ultimo = r;
      return r;
    };
  });
  afterEach(() => {
    cleanup();
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
  });

  const dicho = (t: string) => ({ results: [[{ transcript: t }]] });

  it('añade lo dictado al final de lo que ya había', () => {
    const onTexto = vi.fn();
    render(<BotonVoz valor="Un toro" maximo={200} etiqueta="Dictar la escena" onTexto={onTexto} />);
    fireEvent.click(screen.getByLabelText('Dictar la escena'));
    hecho.ultimo?.onresult?.(dicho('sobre una carretera'));
    expect(onTexto).toHaveBeenCalledWith('Un toro sobre una carretera');
  });

  it('respeta el máximo del campo', () => {
    const onTexto = vi.fn();
    render(<BotonVoz valor="" maximo={5} etiqueta="Dictar" onTexto={onTexto} />);
    fireEvent.click(screen.getByLabelText('Dictar'));
    hecho.ultimo?.onresult?.(dicho('abcdefgh'));
    expect(onTexto).toHaveBeenCalledWith('abcde');
  });

  it('mientras escucha ofrece parar', () => {
    render(<BotonVoz valor="" maximo={50} etiqueta="Dictar" onTexto={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Dictar'));
    expect(screen.getByLabelText('Parar el dictado').getAttribute('aria-pressed')).toBe('true');
  });

  it('sin reconocimiento de voz en el navegador no pinta nada', () => {
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
    const { container } = render(<BotonVoz valor="" maximo={50} etiqueta="Dictar" onTexto={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
