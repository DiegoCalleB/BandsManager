import { describe, it, expect } from 'vitest';
import { contarIdeasDeUsuario, esIdeaDeUsuario } from '../ideasAudio';
import type { SongAudioIdea } from '../../types';

const base = { id: 'x', seccion: 'general' as const, audioUrl: 'https://x/a.mp3', fecha: '2026-11-01' };
// Formas reales sacadas de producción (songs.audio_ideas).
const sistema = (subidoPor: string, titulo: string): SongAudioIdea => ({ ...base, subidoPor, titulo });
const deUsuario = (subidoPor: string): SongAudioIdea => ({ ...base, subidoPor, titulo: 'Idea sobre Hoedown (Idea General / Demo)', votos: [], comentarios: [] });

describe('contarIdeasDeUsuario', () => {
  it('el audio que crea el sistema NO es una idea', () => {
    const ideas = [
      sistema('Sync', 'Audio Oficial'),
      sistema('Spotify Sync', 'Audio Preview Oficial (30s)'),
      sistema('Subida Disco', 'Audio Máster Completo (Estudio)'),
      sistema('Concierto en Directo', 'Audio Recortado Directo'),
      { ...sistema('Iris Cloud', 'Pistas Separadas (Iris Cloud)'), pistas: [] },
    ];
    expect(contarIdeasDeUsuario(ideas)).toBe(0);
  });

  it('las ideas creadas en Studio sí cuentan, aunque convivan con audio del sistema', () => {
    expect(contarIdeasDeUsuario([sistema('Sync', 'Audio Oficial'), deUsuario('Fer'), deUsuario('Diego')])).toBe(2);
  });

  it('un origen nuevo del sistema que no está en la lista tampoco cuenta (no lleva votos ni comentarios)', () => {
    expect(esIdeaDeUsuario(sistema('Algo Nuevo', 'Audio Auto'))).toBe(false);
  });

  it('sin ideas o sin lista, 0', () => {
    expect(contarIdeasDeUsuario(undefined)).toBe(0);
    expect(contarIdeasDeUsuario([])).toBe(0);
  });
});
