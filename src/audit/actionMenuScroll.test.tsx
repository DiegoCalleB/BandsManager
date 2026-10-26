// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { ActionMenu } from '../components/ui/ActionMenu';

afterEach(cleanup);

const abrir = () => {
  render(<ActionMenu label="Más acciones" items={[{ label: 'Editar', onSelect: () => {} }]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Más acciones' }));
  expect(screen.getByRole('menu')).toBeTruthy();
};

describe('ActionMenu: sigue abierto mientras el Atril autoscrollea', () => {
  it('scroll y resize no lo cierran', () => {
    abrir();
    fireEvent.scroll(document.body);
    fireEvent(window, new Event('resize'));
    expect(screen.queryByRole('menu')).not.toBeNull();
  });
  it('Escape sigue cerrándolo', () => {
    abrir();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
