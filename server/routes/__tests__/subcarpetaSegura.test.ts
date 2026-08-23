import { describe, it, expect } from 'vitest';
import { subcarpetaSegura } from '../upload';

describe('subcarpetaSegura', () => {
  it('deja pasar las carpetas que usa el cliente', () => {
    expect(subcarpetaSegura('conciertos_fuente')).toBe('conciertos_fuente');
    expect(subcarpetaSegura('discografia/Directo_2026')).toBe('discografia/directo_2026');
  });

  it('no deja subir de nivel', () => {
    // Con upsert activado, salirse de la carpeta de la banda era escribir encima de los
    // ficheros de cualquier otra.
    expect(subcarpetaSegura('../../bandas/la-vanda/portadas')).toBe('bandas/la-vanda/portadas');
    expect(subcarpetaSegura('..')).toBe('');
    expect(subcarpetaSegura('/../..//')).toBe('');
  });

  it('limpia los caracteres raros y las barras sobrantes', () => {
    expect(subcarpetaSegura('/portadas//Álbum Nuevo/')).toBe('portadas/-lbum-nuevo');
  });

  it('corta la profundidad', () => {
    expect(subcarpetaSegura('a/b/c/d/e/f')).toBe('a/b/c/d');
  });

  it('lo que no es texto no es carpeta', () => {
    expect(subcarpetaSegura(undefined)).toBe('');
    expect(subcarpetaSegura(42)).toBe('');
    expect(subcarpetaSegura('')).toBe('');
  });
});
