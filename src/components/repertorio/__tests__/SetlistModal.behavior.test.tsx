// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SetlistModal } from '../SetlistModal';
import type { Setlist, ThemeColors } from '../../../types';

const colores = {} as ThemeColors;
const setlist = { id: 's1', nombre: 'Gira Norte', descripcion: 'Corto', tipoFormato: 'acustico' } as unknown as Setlist;

describe('SetlistModal', () => {
  afterEach(cleanup);
  it('sin setlist a editar muestra los valores por defecto', () => {
    render(<SetlistModal isOpen setlistToEdit={null} colors={colores} onClose={vi.fn()} onSave={vi.fn()} />);
    expect((screen.getByPlaceholderText(/Festival Rumba/) as HTMLInputElement).value).toBe('Festival Verano 2026');
  });

  it('al cambiar el setlist a editar, el formulario se reinicia con sus datos', () => {
    const { rerender } = render(
      <SetlistModal isOpen setlistToEdit={null} colors={colores} onClose={vi.fn()} onSave={vi.fn()} />,
    );
    rerender(<SetlistModal isOpen setlistToEdit={setlist} colors={colores} onClose={vi.fn()} onSave={vi.fn()} />);
    expect((screen.getByPlaceholderText(/Festival Rumba/) as HTMLInputElement).value).toBe('Gira Norte');
    expect((screen.getByLabelText('Formato de concierto') as HTMLSelectElement).value).toBe('acustico');
  });
});
