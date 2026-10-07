import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resumirTranscripcion, transcribirEnCola } from '../utils/transcripcionMasiva';
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

  it('la cola clasifica 409/422/errores y no se para por un fallo', async () => {
    const songs = ['ok', 'ya', 'instr', 'rota'].map((id) => cancion(id));
    const vistas: string[] = [];
    const p = await transcribirEnCola(songs, {
      transcribir: async (s) => {
        if (s.id === 'ya') throw Object.assign(new Error('x'), { status: 409 });
        if (s.id === 'instr') throw Object.assign(new Error('x'), { status: 422 });
        if (s.id === 'rota') throw new Error('502');
        return { cifradoTexto: '[Am] letra' };
      },
      alTerminarCancion: (s, r) => vistas.push(`${s.id}:${r}`),
    });
    expect(vistas).toEqual(['ok:hecha', 'ya:omitida', 'instr:sin_letra', 'rota:fallida']);
    expect(p).toMatchObject({ hechas: 4, total: 4, fallidas: ['rota'], sinLetra: ['instr'] });
  });

  it('abortar detiene la cola entre canciones', async () => {
    const ctl = new AbortController();
    const hechas: string[] = [];
    await transcribirEnCola([cancion('1'), cancion('2'), cancion('3')], {
      signal: ctl.signal,
      transcribir: async (s) => {
        hechas.push(s.id);
        ctl.abort();
        return { cifradoTexto: 't' };
      },
    });
    expect(hechas).toEqual(['1']);
  });

  it('la discografía pide confirmación con el coste esperado antes de lanzar nada', () => {
    expect(vista).toContain('resumirTranscripcion(safeSongs)');
    expect(vista).toContain('/letra-sincronizada');
    expect(vista).toContain('sobrescribir: false');
    expect(vista).toContain('Se transcribirán');
  });
});
