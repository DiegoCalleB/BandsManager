import { describe, it, expect, beforeEach, vi } from 'vitest';
import { instrumentoDesdeTexto, instrumentoDelUsuario } from '../instrumentoProfesor';

describe('instrumentoDesdeTexto', () => {
  it.each([
    ['Bajista', 'bajo'], ['Bajo eléctrico', 'bajo'], ['Batería', 'bateria'], ['Guitarra solista', 'guitarra'],
    ['Teclados', 'teclado'], ['Piano', 'teclado'], ['Voz y guitarra', 'voz'], ['Cantante', 'voz'],
  ])('%s → %s', (t, e) => expect(instrumentoDesdeTexto(t)).toBe(e));
  it('desconocido o vacío → null', () => {
    expect(instrumentoDesdeTexto('Trompeta')).toBeNull();
    expect(instrumentoDesdeTexto(undefined)).toBeNull();
  });
});

describe('instrumentoDelUsuario', () => {
  const almacen = new Map<string, string>();
  beforeEach(() => {
    almacen.clear();
    vi.stubGlobal('localStorage', { getItem: (k: string) => almacen.get(k) ?? null, setItem: (k: string, v: string) => void almacen.set(k, v) });
  });
  it('lee el perfil guardado y tolera basura', () => {
    expect(instrumentoDelUsuario()).toBeNull();
    localStorage.setItem('bandmanager_user', JSON.stringify({ instrument: 'Bajista' }));
    expect(instrumentoDelUsuario()).toBe('bajo');
    localStorage.setItem('bandmanager_user', '{no json');
    expect(instrumentoDelUsuario()).toBeNull();
  });
});
