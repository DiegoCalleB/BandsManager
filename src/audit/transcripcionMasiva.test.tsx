import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resumirTranscripcion } from '../utils/transcripcionMasiva';
import type { Song } from '../types';

const vista = readFileSync(new URL('../components/repertorio/DiscografiaView.tsx', import.meta.url), 'utf8');

const cancion = (id: string, extra: Partial<Song> = {}) => ({ id, titulo: id, ...extra }) as Song;

describe('transcripción masiva de la discografía', () => {
  it('solo selecciona canciones con audio y sin cifrado; cuenta el resto', () => {
    const r = resumirTranscripcion([
      cancion('a', { audioPrincipalUrl: 'x.mp3' }),
      cancion('b'), // sin audio
      cancion('c', { audioPrincipalUrl: 'x.mp3', cifradoTexto: '[Am] hola' }), // ya tiene cifrado
      cancion('d', { audioPrincipalUrl: 'x.mp3', cifradoTexto: '   ' }), // cifrado vacío = pendiente
      cancion('e', { audioPrincipalUrl: 'x.mp3', tipo: 'interludio' }), // ni se cuenta
    ]);
    expect(r.pendientes.map((s) => s.id)).toEqual(['a', 'd']);
    expect(r).toMatchObject({ total: 4, sinAudio: 1, conCifrado: 1 });
  });

  it('la discografía pide confirmación con el coste esperado antes de lanzar nada', () => {
    expect(vista).toContain('resumirTranscripcion(safeSongs)');
    expect(vista).toContain('Se transcribirán');
    expect(vista).toContain('Transcribir automáticamente lo nuevo');
  });

  it('la cola vive en el servidor: el cliente solo la pide y la consulta', () => {
    const hook = readFileSync(new URL('../hooks/useColaLetras.ts', import.meta.url), 'utf8');
    expect(hook).toContain('/api/letras/cola');
    expect(hook).toContain('/api/letras/auto');
    expect(vista).toContain('useColaLetras(');
    expect(vista).not.toContain('/letra-sincronizada');
  });
});
