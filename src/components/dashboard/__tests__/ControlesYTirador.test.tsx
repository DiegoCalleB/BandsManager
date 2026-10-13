// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ControlesTamano } from '../ControlesTamano';
import { TiradorWidget } from '../TiradorWidget';

afterEach(cleanup);

describe('ControlesTamano', () => {
  it('marca el tamaño actual y avisa del que se elige', () => {
    const onAncho = vi.fn();
    const onAlto = vi.fn();
    render(<ControlesTamano wSpan={6} hSpan="tall" onAncho={onAncho} onAlto={onAlto} />);
    expect(screen.getByLabelText('Ancho: Mitad').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByLabelText('Ancho: Completo').getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByLabelText('Alto: Alto').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByLabelText('Ancho: Estrecho'));
    fireEvent.click(screen.getByLabelText('Alto: Bajo'));
    expect(onAncho).toHaveBeenCalledWith(4);
    expect(onAlto).toHaveBeenCalledWith('compact');
  });
});

describe('TiradorWidget', () => {
  it('con el teclado: izquierda/derecha cambian el ancho y arriba/abajo el alto', () => {
    const onPaso = vi.fn();
    render(<TiradorWidget titulo="Agenda" onPointerDown={() => {}} onPaso={onPaso} />);
    const tirador = screen.getByRole('button', { name: /Cambiar el tamaño de Agenda/ });
    fireEvent.keyDown(tirador, { key: 'ArrowRight' });
    fireEvent.keyDown(tirador, { key: 'ArrowLeft' });
    fireEvent.keyDown(tirador, { key: 'ArrowDown' });
    fireEvent.keyDown(tirador, { key: 'ArrowUp' });
    fireEvent.keyDown(tirador, { key: 'a' });
    expect(onPaso.mock.calls).toEqual([['ancho', 1], ['ancho', -1], ['alto', 1], ['alto', -1]]);
  });

  it('avisa al empezar a arrastrar', () => {
    const onPointerDown = vi.fn();
    render(<TiradorWidget titulo="Agenda" onPointerDown={onPointerDown} onPaso={() => {}} />);
    fireEvent.pointerDown(screen.getByRole('button'));
    expect(onPointerDown).toHaveBeenCalledTimes(1);
  });
});
