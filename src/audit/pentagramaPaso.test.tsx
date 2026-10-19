// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { Pentagrama } from '../components/chords/Pentagrama';

describe('Pentagrama: nota de paso', () => {
  it('marca solo la nota resaltada para pintarla con el color del módulo', async () => {
    const { container } = render(<Pentagrama midi={[48, 52, 55, 51]} modo="escala" clave="bass" resaltar={3} etiqueta="Pentagrama: C" />);
    await waitFor(() => expect(container.querySelectorAll('.nota-paso')).toHaveLength(1));
  });
  it('sin resaltar no pinta ninguna', async () => {
    const { container } = render(<Pentagrama midi={[48, 52, 55]} modo="escala" clave="bass" etiqueta="Pentagrama: C" />);
    await waitFor(() => expect(container.querySelector('svg')).not.toBeNull());
    expect(container.querySelector('.nota-paso')).toBeNull();
  });
});
