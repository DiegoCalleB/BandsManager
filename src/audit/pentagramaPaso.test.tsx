// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { Pentagrama } from '../components/chords/Pentagrama';

describe('Pentagrama: nota de paso', () => {
  it('marca solo la nota resaltada para pintarla con el color del módulo', async () => {
    const { container } = render(<Pentagrama midi={[48, 52, 55, 51]} modo="escala" clave="bass" roles={[undefined, undefined, undefined, "paso"]} etiqueta="Pentagrama: C" />);
    await waitFor(() => expect(container.querySelectorAll('.nota-paso')).toHaveLength(1));
  });
  it('sin resaltar no pinta ninguna', async () => {
    const { container } = render(<Pentagrama midi={[48, 52, 55]} modo="escala" clave="bass" etiqueta="Pentagrama: C" />);
    await waitFor(() => expect(container.querySelector('svg')).not.toBeNull());
    expect(container.querySelector('.nota-paso')).toBeNull();
  });
});

describe('PentagramaFicha: colorines y escala', () => {
  it('bajo Normal con acorde siguiente: pinta la nota de paso y ofrece la escala completa', async () => {
    const { PentagramaFicha } = await import('../components/chords/PentagramaFicha');
    const { fireEvent } = await import('@testing-library/react');
    const { container, getByText } = render(<PentagramaFicha chord="C" vista="bajo" nivel="normal" siguiente="F" invSonido={0} />);
    await waitFor(() => expect(container.querySelectorAll('.nota-paso')).toHaveLength(1));
    expect(container.querySelectorAll('.nota-raiz').length).toBeGreaterThan(0);
    fireEvent.click(getByText('Ver escala completa'));
    await waitFor(() => expect(container.querySelectorAll('svg')).toHaveLength(2));
  });
});
