import { describe, expect, it, vi } from 'vitest';
import { accionesDeDisco } from '../accionesDisco';
import type { Song } from '../../../types';

const cancion = (id: string, audioPrincipalUrl?: string): Song => ({ id, titulo: id, audioPrincipalUrl }) as Song;
const REAL = 'https://x.supabase.co/a.mp3';

const construir = (p: Partial<Parameters<typeof accionesDeDisco>[0]> = {}) =>
  accionesDeDisco({ album: 'Mi disco', canciones: [cancion('a', REAL)], onExportar: vi.fn(), onAnadirCancion: vi.fn(), onEmparejarAudios: vi.fn(), ...p });

const visibles = (items: ReturnType<typeof construir>) => items.filter((i) => !i.hidden).map((i) => i.label);

describe('accionesDeDisco', () => {
  it('«Añadir canción» abre el menú y va la primera', () => {
    expect(visibles(construir())[0]).toBe('Añadir canción');
  });

  it('no ofrece emparejar si todas las canciones ya tienen audio', () => {
    expect(visibles(construir()).some((l) => l.startsWith('Emparejar'))).toBe(false);
  });

  it('ofrece emparejar con las canciones sin audio, muestras y referencias locales incluidas, y solo con esas', () => {
    const onEmparejarAudios = vi.fn();
    const canciones = [cancion('con', REAL), cancion('sin'), cancion('muestra', '/audio/samples/s.mp3'), cancion('local', 'indexeddb:t1')];
    const items = construir({ canciones, onEmparejarAudios });
    const emparejar = items.find((i) => i.label.startsWith('Emparejar'));
    expect(emparejar?.label).toBe('Emparejar audios (3 sin audio)');
    expect(emparejar?.hidden).toBe(false);
    emparejar?.onSelect();
    expect(onEmparejarAudios.mock.calls[0][0].map((s: Song) => s.id)).toEqual(['sin', 'muestra', 'local']);
  });

  it('«Singles / Sin Disco» no admite añadir ni eliminar', () => {
    const l = visibles(construir({ album: 'Singles / Sin Disco', onEliminar: vi.fn() }));
    expect(l).not.toContain('Añadir canción');
    expect(l).not.toContain('Eliminar álbum');
  });

  it('editar y eliminar solo aparecen si hay manejador; exportar, si hay canciones', () => {
    expect(visibles(construir())).toEqual(['Añadir canción', 'Exportar disco']);
    expect(visibles(construir({ onEditar: vi.fn(), onEliminar: vi.fn() }))).toEqual(['Añadir canción', 'Editar disco y portada', 'Exportar disco', 'Eliminar álbum']);
    expect(visibles(construir({ canciones: [] }))).toEqual(['Añadir canción']);
  });
});
