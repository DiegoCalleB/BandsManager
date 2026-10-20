// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FuncionesTfm } from '../FuncionesTfm';

describe('FuncionesTfm', () => {
  afterEach(cleanup);

  it('enseña seis funciones y cambia el contenido al elegir otra', () => {
    render(<FuncionesTfm es />);
    expect(screen.getAllByRole('tab')).toHaveLength(6);
    expect(screen.getByText(/Qué toca hoy/)).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Booking' }));
    expect(screen.getByText(/Del primer correo a la firma/)).toBeTruthy();
  });
});
