// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import { subcarpetaSegura, extensionPermitida } from '../upload';

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

describe('extensionPermitida', () => {
  it('acepta formatos de audio y vídeo de conciertos de gran tamaño', () => {
    expect(extensionPermitida('concierto_completo.mp3')).toBe(true);
    expect(extensionPermitida('master_live.wav')).toBe(true);
    expect(extensionPermitida('show.m4a')).toBe(true);
    expect(extensionPermitida('directo.flac')).toBe(true);
    expect(extensionPermitida('video_bolo.mp4')).toBe(true);
    expect(extensionPermitida('audio.aac')).toBe(true);
    expect(extensionPermitida('audio.ogg')).toBe(true);
  });

  it('rechaza archivos ejecutables o potencialmente peligrosos', () => {
    expect(extensionPermitida('script.js')).toBe(false);
    expect(extensionPermitida('vector.svg')).toBe(false);
    expect(extensionPermitida('index.html')).toBe(false);
    expect(extensionPermitida('run.exe')).toBe(false);
    expect(extensionPermitida('')).toBe(false);
  });
});
