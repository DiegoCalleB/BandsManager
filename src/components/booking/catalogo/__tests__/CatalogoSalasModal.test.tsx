// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import type { SalaDelCatalogo } from '../../../../services/apiCatalogo';

const api = vi.hoisted(() => ({
  buscarSalasDelCatalogo: vi.fn(), anadirSalaDelCatalogo: vi.fn(), cargarMapaDelCatalogo: vi.fn(), cargarFichaDeSala: vi.fn(), buscarFestivalesDelDirectorio: vi.fn(), anadirFestivalDelDirectorio: vi.fn(),
}));
vi.mock('../../../../services/apiCatalogo', () => api);
vi.mock('../MapaCatalogo', () => ({ default: ({ puntos, onSeleccionar }: { puntos: Array<{ id: string; nombre: string }>; onSeleccionar?: (id: string) => void }) => <div>{puntos.map((p) => <button key={p.id} onClick={() => onSeleccionar?.(p.id)}>{`Punto ${p.nombre}`}</button>)}</div> }));
vi.mock('../../../common/ModalPortal', () => ({ ModalPortal: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

import { CatalogoSalasModal } from '../CatalogoSalasModal';

const sala = (o: Partial<SalaDelCatalogo> & { id: string; nombre: string }): SalaDelCatalogo => ({
  ciudad: 'Madrid', region: 'Comunidad de Madrid', tipo: 'sala', aforo: 300, genero: 'Rock', website: null, instagram: null,
  nivel: 'probable', bandas_con_respuesta: 0, tiene_email: true, tiene_telefono: false, posiblemente_cerrada: false, ya_en_agenda: false,
  direccion: null, lat: null, lon: null, coordenadas_aprox: false, completitud: 40, fuentes: [], ...o,
});

const pasar = async (ms = 400) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));

beforeEach(() => {
  vi.useFakeTimers();
  api.buscarSalasDelCatalogo.mockReset();
  for (const f of Object.values(api)) f.mockReset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('CatalogoSalasModal', () => {
  it('lista las salas del catálogo y marca las que ya están en la agenda', async () => {
    api.buscarSalasDelCatalogo.mockResolvedValue({ total: 2, mostradas: 2, salas: [sala({ id: 'a', nombre: 'Sala Alfa' }), sala({ id: 'b', nombre: 'Sala Beta', ya_en_agenda: true })] });
    render(<CatalogoSalasModal isOpen onClose={() => {}} />);
    await pasar();
    expect(screen.getByText('Sala Alfa')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Añadir Sala Alfa a mi agenda' })).toBeTruthy();
    expect(screen.getByText('En tu agenda')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Añadir Sala Beta a mi agenda' })).toBeNull();
  });

  it('al añadir una sala, la marca como «en tu agenda» y avisa para recargar la agenda', async () => {
    api.buscarSalasDelCatalogo.mockResolvedValue({ total: 1, mostradas: 1, salas: [sala({ id: 'a', nombre: 'Sala Alfa' })] });
    api.anadirSalaDelCatalogo.mockResolvedValue({ ok: true, leadId: 'lead-1' });
    const aviso = vi.fn();
    window.addEventListener('app-data-updated', aviso);
    render(<CatalogoSalasModal isOpen onClose={() => {}} />);
    await pasar();
    await act(async () => void fireEvent.click(screen.getByRole('button', { name: 'Añadir Sala Alfa a mi agenda' })));
    expect(api.anadirSalaDelCatalogo).toHaveBeenCalledWith('a');
    expect(screen.getByText('En tu agenda')).toBeTruthy();
    expect(aviso).toHaveBeenCalledTimes(1);
    window.removeEventListener('app-data-updated', aviso);
  });

  it('si el plan no admite más, enseña el motivo y deja el botón', async () => {
    api.buscarSalasDelCatalogo.mockResolvedValue({ total: 1, mostradas: 1, salas: [sala({ id: 'a', nombre: 'Sala Alfa' })] });
    api.anadirSalaDelCatalogo.mockResolvedValue({ ok: false, error: 'Has llegado al límite de tu plan.' });
    render(<CatalogoSalasModal isOpen onClose={() => {}} />);
    await pasar();
    await act(async () => void fireEvent.click(screen.getByRole('button', { name: 'Añadir Sala Alfa a mi agenda' })));
    expect(screen.getByRole('alert').textContent).toContain('límite de tu plan');
    expect(screen.getByRole('button', { name: 'Añadir Sala Alfa a mi agenda' })).toBeTruthy();
  });

  it('busca al escribir, con un respiro, y manda los filtros', async () => {
    api.buscarSalasDelCatalogo.mockResolvedValue({ total: 0, mostradas: 0, salas: [] });
    render(<CatalogoSalasModal isOpen onClose={() => {}} />);
    await pasar();
    fireEvent.change(screen.getByLabelText('Ciudad o región'), { target: { value: 'Lugo' } });
    await pasar(100);
    expect(api.buscarSalasDelCatalogo).toHaveBeenCalledTimes(1);
    await pasar(300);
    expect(api.buscarSalasDelCatalogo).toHaveBeenCalledTimes(2);
    expect(api.buscarSalasDelCatalogo.mock.calls[1][0]).toMatchObject({ lugar: 'Lugo' });
  });

  it('sin resultados habla con voz propia y sugiere el chat', async () => {
    api.buscarSalasDelCatalogo.mockResolvedValue({ total: 0, mostradas: 0, salas: [] });
    render(<CatalogoSalasModal isOpen onClose={() => {}} />);
    await pasar();
    expect(screen.getByText('Ninguna sala encaja con eso.')).toBeTruthy();
  });

  it('cerrado no consulta nada', async () => {
    render(<CatalogoSalasModal isOpen={false} onClose={() => {}} />);
    await pasar();
    expect(api.buscarSalasDelCatalogo).not.toHaveBeenCalled();
  });

  it('al pulsar una sala abre su ficha con fiabilidad, completitud y la fuente que hay que citar', async () => {
    api.buscarSalasDelCatalogo.mockResolvedValue({ total: 1, mostradas: 1, salas: [sala({ id: 'a', nombre: 'Sala Alfa', direccion: 'Calle Mayor 1', completitud: 70, fuentes: ['osm'], lat: 40.4, lon: -3.7 })] });
    render(<CatalogoSalasModal isOpen onClose={() => {}} />);
    await pasar();
    await act(async () => void fireEvent.click(screen.getByRole('button', { name: 'Ver ficha de Sala Alfa' })));
    expect(screen.getByRole('heading', { name: 'Sala Alfa' })).toBeTruthy();
    expect(screen.getByText('Calle Mayor 1')).toBeTruthy();
    expect(screen.getByText('70 %')).toBeTruthy();
    expect(screen.getByText(/licencia ODbL/)).toBeTruthy();
    await act(async () => void fireEvent.click(screen.getByRole('button', { name: /Volver al catálogo/ })));
    expect(screen.getByText('Sala Alfa')).toBeTruthy();
  });

  it('una sala con el punto de su ciudad avisa de que la ubicación es aproximada', async () => {
    api.buscarSalasDelCatalogo.mockResolvedValue({ total: 1, mostradas: 1, salas: [sala({ id: 'a', nombre: 'Sala Alfa', lat: 40.4, lon: -3.7, coordenadas_aprox: true })] });
    render(<CatalogoSalasModal isOpen onClose={() => {}} />);
    await pasar();
    await act(async () => void fireEvent.click(screen.getByRole('button', { name: 'Ver ficha de Sala Alfa' })));
    expect(screen.getByText(/Ubicación aproximada/)).toBeTruthy();
  });

  it('en el mapa cuenta las salas sin situar y abre la ficha al pulsar un punto', async () => {
    api.buscarSalasDelCatalogo.mockResolvedValue({ total: 0, mostradas: 0, salas: [] });
    api.cargarMapaDelCatalogo.mockResolvedValue({ total: 5, puntos: [{ id: 'a', nombre: 'Sala Alfa', ciudad: 'Madrid', tipo: 'sala', nivel: 'probable', lat: 40.4, lon: -3.7, coordenadas_aprox: false, ya_en_agenda: false }] });
    api.cargarFichaDeSala.mockResolvedValue(sala({ id: 'a', nombre: 'Sala Alfa' }));
    render(<CatalogoSalasModal isOpen onClose={() => {}} />);
    await pasar();
    await act(async () => void fireEvent.click(screen.getByRole('tab', { name: /Mapa/ })));
    await pasar();
    expect(screen.getByText(/1 sala situada en el mapa; otras 4 aún sin situar/)).toBeTruthy();
    await act(async () => void fireEvent.click(screen.getByRole('button', { name: 'Punto Sala Alfa' })));
    await pasar(10);
    expect(api.cargarFichaDeSala).toHaveBeenCalledWith('a');
    expect(screen.getByRole('heading', { name: 'Sala Alfa' })).toBeTruthy();
  });

  it('en la pestaña de festivales muestra las convocatorias y los añade a la agenda', async () => {
    const festival = { slug: 'fest', nombre: 'Festival Uno', ciudad: 'Lugo', provincia: 'Lugo', estilos: ['rock'], web: 'https://uno.es', descripcion: 'Un festival.', edicion: null, convocatoria: { url: 'https://uno.es/bases', cierre: '2026-12-01', resumen: 'Bases' }, ya_en_agenda: false };
    api.buscarSalasDelCatalogo.mockResolvedValue({ total: 0, mostradas: 0, salas: [] });
    api.buscarFestivalesDelDirectorio.mockResolvedValue({ total: 1, festivales: [festival] });
    api.anadirFestivalDelDirectorio.mockResolvedValue({ ok: true, leadId: 'l1' });
    render(<CatalogoSalasModal isOpen onClose={() => {}} />);
    await pasar();
    await act(async () => void fireEvent.click(screen.getByRole('tab', { name: 'Festivales' })));
    await pasar();
    expect(screen.getByText('Festival Uno')).toBeTruthy();
    expect(screen.getByText(/Convocatoria hasta el/)).toBeTruthy();
    await act(async () => void fireEvent.click(screen.getByRole('button', { name: 'Añadir Festival Uno a mi agenda' })));
    expect(api.anadirFestivalDelDirectorio).toHaveBeenCalledWith('fest');
    expect(screen.getByText('En tu agenda')).toBeTruthy();
  });
});
