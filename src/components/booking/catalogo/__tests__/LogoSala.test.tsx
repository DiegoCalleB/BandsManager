// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { LogoSala } from '../LogoSala';

afterEach(cleanup);

describe('LogoSala', () => {
  it('pinta el icono de la web de la sala', () => {
    const { container } = render(<LogoSala nombre="Sala Moby Dick" website="https://salamoby.es/" />);
    expect(container.querySelector('img')?.getAttribute('src')).toContain('domain=salamoby.es');
  });

  it('sin web, un círculo con la inicial', () => {
    const { container } = render(<LogoSala nombre="ñandú club" website={null} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('Ñ');
  });

  it('si el icono no carga, cae a la inicial', () => {
    const { container } = render(<LogoSala nombre="Sala Moby Dick" website="https://salamoby.es/" />);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('S');
  });
});
