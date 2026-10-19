/**
 * Fase 2B: las publicaciones sociales viven solo en Supabase. Ninguna ruta lee ni escribe
 * state.posts (datos de todas las bandas); la semilla solo se sirve en el arranque local sin Supabase.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const estado: any = { posts: [] };
const loadState = vi.fn(() => estado);
const saveState = vi.fn();
const dbGetSocialPosts = vi.fn();
const dbUpsertSocialPost = vi.fn();
const dbDeleteSocialPost = vi.fn();

vi.mock('../../state.js', async (orig) => ({
  ...(await orig<any>()),
  loadState: () => loadState(),
  saveState: (...a: any[]) => saveState(...a),
  requireAuth: (_q: any, _s: any, n: any) => n(),
}));
vi.mock('../../db.js', async (orig) => ({
  ...(await orig<any>()),
  dbGetSocialPosts: (...a: any[]) => dbGetSocialPosts(...a),
  dbUpsertSocialPost: (...a: any[]) => dbUpsertSocialPost(...a),
  dbDeleteSocialPost: (...a: any[]) => dbDeleteSocialPost(...a),
}));

import postsRouter from '../posts.js';
import { manejador } from './helpers/rutas.js';

const resFalso = () => {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  return r;
};
const usuario = { id: 'u1', role: 'leader', band_id: 'band-a', allowedBandIds: ['band-a'] };
const llamar = async (ruta: string, metodo: any, req: any = {}) => {
  const res = resFalso();
  await manejador(postsRouter, ruta, metodo)({ headers: {}, query: {}, body: {}, params: {}, user: usuario, ...req }, res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
  estado.posts = [
    { id: 'p-a', band_id: 'band-a', contenido: 'Post A (semilla)' },
    { id: 'p-b', band_id: 'band-b', contenido: 'Post B (semilla)' },
  ];
});

describe('rutas de posts: solo Supabase', () => {
  it('GET /posts devuelve lo de Supabase y no toca el estado', async () => {
    dbGetSocialPosts.mockResolvedValue([{ id: 'p-a', band_id: 'band-a', contenido: 'Post A' }]);
    const r = await llamar('/posts', 'get');
    expect(r.body).toEqual([{ id: 'p-a', band_id: 'band-a', contenido: 'Post A' }]);
    expect(loadState).not.toHaveBeenCalled();
  });

  it('GET /posts con Supabase configurado que falla responde 500, no la semilla desactualizada', async () => {
    dbGetSocialPosts.mockRejectedValue(new Error('Supabase Error (social_posts): timeout'));
    const r = await llamar('/posts', 'get');
    expect(r.code).toBe(500);
  });

  it('GET /posts sin Supabase (arranque local) cae a la semilla, solo de la banda activa', async () => {
    dbGetSocialPosts.mockRejectedValue(new Error('Supabase URL or Key is missing in environment variables.'));
    const r = await llamar('/posts', 'get');
    expect(r.body).toEqual([{ id: 'p-a', band_id: 'band-a', contenido: 'Post A (semilla)' }]);
  });

  it('POST /posts guarda en Supabase con la banda de la sesión y no toca el estado', async () => {
    dbUpsertSocialPost.mockResolvedValue({ id: 'nuevo', band_id: 'band-a' });
    const r = await llamar('/posts', 'post', { body: { contenido: 'x', band_id: 'band-b' } });
    expect(dbUpsertSocialPost).toHaveBeenCalledWith(expect.anything(), 'band-a');
    expect(r.body).toEqual({ success: true, post: { id: 'nuevo', band_id: 'band-a' } });
    expect(saveState).not.toHaveBeenCalled();
    expect(estado.posts.map((p: any) => p.id)).toEqual(['p-a', 'p-b']);
  });

  it('PUT /posts/:id con el id de un post de otra banda no sustituye el de la otra banda en memoria', async () => {
    dbUpsertSocialPost.mockResolvedValue({ id: 'post-nuevo', band_id: 'band-a', contenido: 'Intruso' });
    await llamar('/posts/:id', 'put', { params: { id: 'p-b' }, body: { contenido: 'Intruso' } });
    expect(estado.posts.find((p: any) => p.id === 'p-b')?.contenido).toBe('Post B (semilla)');
    expect(saveState).not.toHaveBeenCalled();
  });

  it('PUT /posts/:id guarda con el id de la URL y la banda de la sesión', async () => {
    dbUpsertSocialPost.mockImplementation(async (p: any) => p);
    const r = await llamar('/posts/:id', 'put', { params: { id: 'p-a' }, body: { contenido: 'Nuevo', id: 'otro' } });
    expect(dbUpsertSocialPost).toHaveBeenCalledWith(expect.objectContaining({ id: 'p-a', contenido: 'Nuevo' }), 'band-a');
    expect(r.body.success).toBe(true);
  });

  it('DELETE /posts/:id borra en Supabase acotado a la banda y no toca el estado', async () => {
    dbDeleteSocialPost.mockResolvedValue(true);
    const r = await llamar('/posts/:id', 'delete', { params: { id: 'p-b' } });
    expect(dbDeleteSocialPost).toHaveBeenCalledWith('p-b', 'band-a');
    expect(r.body).toEqual({ success: true });
    expect(estado.posts.map((p: any) => p.id)).toEqual(['p-a', 'p-b']);
    expect(saveState).not.toHaveBeenCalled();
  });

  it('DELETE /posts/:id con Supabase caído responde error', async () => {
    dbDeleteSocialPost.mockRejectedValue(new Error('Supabase Error (delete social_posts): x'));
    const r = await llamar('/posts/:id', 'delete', { params: { id: 'p-a' } });
    expect(r.code).toBeGreaterThanOrEqual(500);
  });

  it('POST /posts/sync devuelve los posts de Supabase sin tocar el estado (el Centro de Reels lo usa)', async () => {
    dbGetSocialPosts.mockResolvedValue([{ id: 'p-a', band_id: 'band-a' }]);
    const r = await llamar('/posts/sync', 'post');
    expect(r.body.success).toBe(true);
    expect(r.body.posts).toEqual([{ id: 'p-a', band_id: 'band-a' }]);
    expect(saveState).not.toHaveBeenCalled();
    expect(estado.posts.map((p: any) => p.id)).toEqual(['p-a', 'p-b']);
  });
});
