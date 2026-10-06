// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import path from 'path';
import { rutaFuenteSegura, urlDeVideoValida } from '../concert_to_album';

const raizPublica = path.resolve(process.cwd(), 'public');

describe('rutaFuenteSegura', () => {
  it('acepta rutas relativas dentro de public/', () => {
    expect(rutaFuenteSegura('uploads/temp/master.mp3')).toBe(
      path.join(raizPublica, 'uploads', 'temp', 'master.mp3')
    );
  });

  it('acepta la ruta absoluta que devuelven las propias rutas del servidor', () => {
    const absoluta = path.join(raizPublica, 'uploads', 'temp', 'demo.mp3');
    expect(rutaFuenteSegura(absoluta)).toBe(absoluta);
  });

  it('RECHAZA salirse de public/ con ..', () => {
    // El agujero: /preview-snippet y /transcribe-speech devuelven el trozo de audio o su
    // transcripción, así que una ruta libre servía para leer ficheros del servidor.
    expect(rutaFuenteSegura('../../etc/passwd')).toBeNull();
    expect(rutaFuenteSegura('uploads/../../.env')).toBeNull();
  });

  it('RECHAZA rutas absolutas fuera de public/', () => {
    expect(rutaFuenteSegura('/etc/passwd')).toBeNull();
    expect(rutaFuenteSegura('/root/.ssh/id_rsa')).toBeNull();
  });

  it('rechaza lo que no sea una ruta', () => {
    expect(rutaFuenteSegura(undefined)).toBeNull();
    expect(rutaFuenteSegura('')).toBeNull();
    expect(rutaFuenteSegura('   ')).toBeNull();
    expect(rutaFuenteSegura({ toString: () => '/etc/passwd' })).toBeNull();
  });

  it('no confunde un hermano que empieza igual con estar dentro', () => {
    // public-viejo/ NO es public/, aunque comparta prefijo de texto.
    expect(rutaFuenteSegura(`${raizPublica}-viejo/secreto.mp3`)).toBeNull();
  });
});

describe('urlDeVideoValida', () => {
  it('acepta http y https', () => {
    expect(urlDeVideoValida('https://www.youtube.com/watch?v=abc')).toBe('https://www.youtube.com/watch?v=abc');
    expect(urlDeVideoValida('  http://ejemplo.com/v.mp4  ')).toBe('http://ejemplo.com/v.mp4');
  });

  it('RECHAZA esquemas que harían leer del disco del servidor', () => {
    expect(urlDeVideoValida('file:///etc/passwd')).toBeNull();
    expect(urlDeVideoValida('data:text/plain,hola')).toBeNull();
  });

  it('RECHAZA lo que no es una URL, incluido lo que empieza por guión', () => {
    // Ahora que los argumentos van sueltos a yt-dlp, un valor con guión delante se colaría
    // como una bandera más en lugar de como la URL.
    expect(urlDeVideoValida('--exec=rm -rf /')).toBeNull();
    expect(urlDeVideoValida('')).toBeNull();
    expect(urlDeVideoValida(42)).toBeNull();
  });
});
