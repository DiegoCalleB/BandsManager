// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PreciosTfm } from '../PreciosTfm';
import { PLANES_B2B, PLANES_B2C } from '../planesLanding';

afterEach(cleanup);

describe('PreciosTfm', () => {
  it('abre en bandas (B2C) con los cuatro planes reales y sus precios', () => {
    render(<PreciosTfm es />);
    for (const nombre of ['Ensayo', 'Local', 'De Gira', 'Cabeza de Cartel']) expect(screen.getAllByText(nombre).length).toBeGreaterThan(0);
    expect(screen.getByText('12 € / mes')).toBeTruthy();
    expect(screen.getByText('29 € / mes')).toBeTruthy();
    expect(screen.getByText('79 € / mes')).toBeTruthy();
    expect(screen.queryByText('Agencia')).toBeNull();
  });

  it('la pestaña Empresas enseña los planes B2B y el formulario de contacto', () => {
    render(<PreciosTfm es />);
    fireEvent.click(screen.getByRole('tab', { name: 'Empresas' }));
    for (const nombre of ['Agencia', 'Sello y Productora', 'Corporativo']) expect(screen.getByText(nombre)).toBeTruthy();
    expect(screen.getByRole('form', { name: 'Consulta para empresas' })).toBeTruthy();
    expect(screen.queryByText('Ensayo')).toBeNull();
  });

  it('los datos B2C coinciden con lo que cobra y limita el servidor', async () => {
    const precios = Object.fromEntries(PLANES_B2C.map((p) => [p.id, p.precio.es]));
    expect(precios).toEqual({ ensayo: '0 €', local: '12 € / mes', de_gira: '29 € / mes', cabeza_de_cartel: '79 € / mes' });
    const texto = (id: string) => PLANES_B2C.find((p) => p.id === id)!.items.map((i) => i.es).join(' | ');
    expect(texto('ensayo')).toContain('100 créditos');
    expect(texto('local')).toContain('300 créditos');
    expect(texto('de_gira')).toContain('800 créditos');
    expect(texto('cabeza_de_cartel')).toContain('2.500 créditos');
    expect(texto('cabeza_de_cartel')).toContain('5 bandas');
  });

  it('cada plan tiene texto en español y en inglés', () => {
    for (const p of [...PLANES_B2C, ...PLANES_B2B]) {
      expect(p.precio.en && p.sub.en && p.para.en).toBeTruthy();
      for (const i of p.items) expect(i.en.length).toBeGreaterThan(0);
    }
  });
});
