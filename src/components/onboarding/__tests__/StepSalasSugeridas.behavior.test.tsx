// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import type { SugerenciaSala } from '../../../services/apiCatalogo';

const api = vi.hoisted(() => ({ cargarSugerenciasDeSalas: vi.fn(), anadirVariasSalasDelCatalogo: vi.fn() }));
vi.mock('../../../services/apiCatalogo', () => api);

import { StepSalasSugeridas } from '../steps/StepSalasSugeridas';

const sala = (id: string, nombre: string, extra: Partial<SugerenciaSala> = {}): SugerenciaSala => ({
  id,
  nombre,
  website: null,
  ciudad: 'Madrid',
  region: 'Comunidad de Madrid',
  tipo: 'sala',
  aforo: 300,
  genero: 'Rock',
  nivel: 'sin_verificar',
  bandas_con_respuesta: 0,
  tiene_email: true,
  tiene_telefono: false,
  motivos: ['En tu ciudad'],
  ...extra,
});

const montar = () => render(<StepSalasSugeridas city="Madrid, España" genre="Rock" />);

beforeEach(() => {
  api.cargarSugerenciasDeSalas.mockReset();
  api.anadirVariasSalasDelCatalogo.mockReset();
});
afterEach(cleanup);

describe('StepSalasSugeridas', () => {
  it('pide las sugerencias con la ciudad y el género de la banda y las muestra con su porqué', async () => {
    api.cargarSugerenciasDeSalas.mockResolvedValue([sala('s1', 'Sala Alfa', { nivel: 'probable', motivos: ['En tu ciudad', 'Programa tu género'] })]);
    montar();
    expect(await screen.findByText('Sala Alfa')).toBeTruthy();
    expect(api.cargarSugerenciasDeSalas).toHaveBeenCalledWith('Madrid, España', 'Rock');
    expect(screen.getByText('Probable')).toBeTruthy();
    expect(screen.getByText('Programa tu género')).toBeTruthy();
    expect(screen.getByText('Sin elegir todavía')).toBeTruthy();
  });

  it('no añade nada hasta que la banda elige: el botón está desactivado sin selección', async () => {
    api.cargarSugerenciasDeSalas.mockResolvedValue([sala('s1', 'Sala Alfa')]);
    montar();
    await screen.findByText('Sala Alfa');
    expect((screen.getByRole('button', { name: 'Añadir a mi agenda' }) as HTMLButtonElement).disabled).toBe(true);
    expect(api.anadirVariasSalasDelCatalogo).not.toHaveBeenCalled();
  });

  it('añade solo las elegidas, avisa y recarga la lista', async () => {
    api.cargarSugerenciasDeSalas.mockResolvedValueOnce([sala('s1', 'Sala Alfa'), sala('s2', 'Sala Beta')]).mockResolvedValueOnce([sala('s2', 'Sala Beta')]);
    api.anadirVariasSalasDelCatalogo.mockResolvedValue({ anadidas: 1, yaEnAgenda: 0, noDisponibles: 0, limiteAlcanzado: false });
    montar();
    fireEvent.click(await screen.findByRole('checkbox', { name: /Sala Alfa/ }));
    expect(screen.getByText('1 elegida')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Añadir a mi agenda' }));

    await waitFor(() => expect(api.anadirVariasSalasDelCatalogo).toHaveBeenCalledWith(['s1']));
    expect(await screen.findByText(/1 sala en tu agenda/)).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Sala Alfa')).toBeNull());
    expect(screen.getByText('Sala Beta')).toBeTruthy();
  });

  it('si el plan no admite más, lo dice con claridad', async () => {
    api.cargarSugerenciasDeSalas.mockResolvedValue([sala('s1', 'Sala Alfa')]);
    api.anadirVariasSalasDelCatalogo.mockResolvedValue({ anadidas: 0, yaEnAgenda: 0, noDisponibles: 0, limiteAlcanzado: true });
    montar();
    fireEvent.click(await screen.findByRole('checkbox', { name: /Sala Alfa/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Añadir a mi agenda' }));
    expect(await screen.findByText(/Tu plan no admite más salas/)).toBeTruthy();
  });

  it('si falla el alta, muestra el error y conserva la selección', async () => {
    api.cargarSugerenciasDeSalas.mockResolvedValue([sala('s1', 'Sala Alfa')]);
    api.anadirVariasSalasDelCatalogo.mockRejectedValue(new Error('Sin conexión'));
    montar();
    fireEvent.click(await screen.findByRole('checkbox', { name: /Sala Alfa/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Añadir a mi agenda' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Sin conexión')).toBeTruthy();
    expect(screen.getByText('1 elegida')).toBeTruthy();
  });

  it('sin sugerencias muestra un estado vacío con voz propia', async () => {
    api.cargarSugerenciasDeSalas.mockResolvedValue([]);
    montar();
    expect(await screen.findByText('Aún no tenemos salas para tu zona.')).toBeTruthy();
  });

  it('si no carga, ofrece reintentar y deja seguir sin la lista', async () => {
    api.cargarSugerenciasDeSalas.mockRejectedValueOnce(new Error('caída')).mockResolvedValueOnce([sala('s1', 'Sala Alfa')]);
    montar();
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Sala Alfa')).toBeTruthy();
  });

  it('no deja elegir más de 10 a la vez', async () => {
    const muchas = Array.from({ length: 12 }, (_, i) => sala(`s${i}`, `Sala ${i}`));
    api.cargarSugerenciasDeSalas.mockResolvedValue(muchas);
    montar();
    for (const checkbox of await screen.findAllByRole('checkbox')) fireEvent.click(checkbox);
    expect(screen.getByText('10 elegidas')).toBeTruthy();
  });
});
