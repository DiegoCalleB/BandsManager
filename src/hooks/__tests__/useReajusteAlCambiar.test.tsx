// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useState } from 'react';
import { useReajusteAlCambiar } from '../useReajusteAlCambiar';

function Sonda({ origen, alReajustar }: { origen: string; alReajustar: () => void }) {
  const [copia, setCopia] = useState('');
  useReajusteAlCambiar([origen] as const, ([o]) => {
    alReajustar();
    setCopia(o.toUpperCase());
  });
  const [extra, setExtra] = useState(0);
  return (
    <button onClick={() => setExtra((n) => n + 1)}>
      {copia}|{extra}
    </button>
  );
}

describe('useReajusteAlCambiar', () => {
  it('reajusta en el primer render y solo cuando cambian las dependencias', () => {
    const alReajustar = vi.fn();
    const { rerender } = render(<Sonda origen="a" alReajustar={alReajustar} />);
    expect(screen.getByRole('button').textContent).toBe('A|0');
    const llamadasIniciales = alReajustar.mock.calls.length;

    act(() => screen.getByRole('button').click());
    expect(screen.getByRole('button').textContent).toBe('A|1');
    expect(alReajustar.mock.calls.length).toBe(llamadasIniciales);

    rerender(<Sonda origen="b" alReajustar={alReajustar} />);
    expect(screen.getByRole('button').textContent).toBe('B|1');
    expect(alReajustar.mock.calls.length).toBe(llamadasIniciales + 1);
  });
});
