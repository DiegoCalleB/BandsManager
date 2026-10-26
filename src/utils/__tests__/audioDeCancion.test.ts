import { describe, expect, it } from 'vitest';
import { conAudioNuevo, esUrlSubida, idUnico, siguientePista, tieneAudioReal } from '../audioDeCancion';
import type { Song } from '../../types';

const cancion = (p: Partial<Song>): Song => ({ id: 's1', titulo: 'Tema', duracionSegundos: 100, ...p }) as Song;

describe('esUrlSubida', () => {
  it('rechaza las referencias locales que deja una subida fallida', () => {
    expect(esUrlSubida('indexeddb:track_file_1')).toBe(false);
    expect(esUrlSubida('blob:http://x/abc')).toBe(false);
    expect(esUrlSubida('')).toBe(false);
    expect(esUrlSubida(undefined)).toBe(false);
  });

  it('acepta URLs remotas y rutas del servidor', () => {
    expect(esUrlSubida('https://x.supabase.co/storage/v1/object/public/a.mp3')).toBe(true);
    expect(esUrlSubida('/uploads/a.mp3')).toBe(true);
  });
});

describe('tieneAudioReal', () => {
  it('una canción con audio subido lo tiene', () => {
    expect(tieneAudioReal(cancion({ audioPrincipalUrl: 'https://x.supabase.co/a.mp3' }))).toBe(true);
  });

  it('sin audio, con una muestra del repo o con una referencia local no lo tiene', () => {
    expect(tieneAudioReal(cancion({}))).toBe(false);
    expect(tieneAudioReal(cancion({ audioPrincipalUrl: '  ' }))).toBe(false);
    expect(tieneAudioReal(cancion({ audioPrincipalUrl: '/audio/samples/sample_01.mp3' }))).toBe(false);
    expect(tieneAudioReal(cancion({ audioPrincipalUrl: 'indexeddb:track_file_1' }))).toBe(false);
  });
});

describe('siguientePista', () => {
  it('va detrás de la última, aunque haya huecos o canciones sin número', () => {
    expect(siguientePista([])).toBe(1);
    expect(siguientePista([{ ordenAlbum: 1 }, { ordenAlbum: 5 }, {}])).toBe(6);
  });
});

describe('conAudioNuevo', () => {
  const previa = { id: 'i0', titulo: 'Preview oficial', seccion: 'general', audioUrl: '/audio/samples/a.mp3', subidoPor: 'Sync', fecha: '2026-01-01' };
  const otra = { id: 'i1', titulo: 'Idea de solo', seccion: 'solo', audioUrl: 'https://x/solo.mp3', subidoPor: 'u', fecha: '2026-01-02' };
  const original = cancion({ titulo: 'Mi tema', bpm: 138, tonalidad: 'D', portadaUrl: 'https://x/portada.jpg', audioIdeas: [previa, otra] as Song['audioIdeas'] });

  it('pone el audio nuevo como principal y primera idea, y retira la preview oficial', () => {
    const r = conAudioNuevo(original, 'https://x/nuevo.mp3', 188);
    expect(r.audioPrincipalUrl).toBe('https://x/nuevo.mp3');
    expect(r.audioIdeas?.map((a) => a.titulo)).toEqual(['Audio Máster Completo (Estudio)', 'Idea de solo']);
    expect(r.audioIdeas?.[0].audioUrl).toBe('https://x/nuevo.mp3');
  });

  it('actualiza la duración y no toca el resto de campos', () => {
    const r = conAudioNuevo(original, 'https://x/nuevo.mp3', 188);
    expect(r.duracion).toBe('3:08');
    expect(r.duracionSegundos).toBe(188);
    expect(r.duracionMinutos).toBe(3);
    expect([r.titulo, r.bpm, r.tonalidad, r.portadaUrl]).toEqual(['Mi tema', 138, 'D', 'https://x/portada.jpg']);
  });

  it('usa la portada nueva solo si la hay', () => {
    expect(conAudioNuevo(original, 'https://x/n.mp3', 60, 'https://x/otra.jpg').portadaUrl).toBe('https://x/otra.jpg');
  });
});

describe('idUnico', () => {
  it('lleva el prefijo y el índice, y no se repite', () => {
    expect(idUnico('song_bulk', 3)).toMatch(/^song_bulk_\d+_3_[a-z0-9]+$/);
    expect(idUnico('x')).not.toBe(idUnico('x'));
  });
});
