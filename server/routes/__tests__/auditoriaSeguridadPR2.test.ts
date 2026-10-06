/**
 * Regresiones de la auditoría B (PR 2): Storage, Fal.ai, SSRF del webhook y prototype pollution.
 */
import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const remove = vi.fn(async (lote: string[]) => ({ data: lote, error: null }));
const list = vi.fn(async (carpeta: string) => ({
  data: carpeta === '' ? [{ name: 'otra-banda-logo.png', id: '1', metadata: { size: 1024 } }] : [],
  error: null,
}));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ storage: { from: () => ({ list, remove }) } }),
}));

process.env.SUPABASE_URL = 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJtest';

import uploadRouter from '../upload.js';
import postsRouter from '../posts.js';
import epkFansRouter from '../epk_fans.js';
import aiMusicRouter from '../ai_music.js';
import { ACTIVE_FAL_KEY } from '../../services/audioSeparator/FalAiService.js';

function manejador(router: any, ruta: string, metodo: 'get' | 'post') {
  const capa: any = router.stack.find((s: any) => s.route && s.route.path === ruta && s.route.methods[metodo]);
  expect(capa, `${metodo} ${ruta}`).toBeDefined();
  const pila = capa.route.stack;
  return pila[pila.length - 1].handle;
}
const resFalso = () => {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  return r;
};
const usuario = { id: 'u1', role: 'leader', allowedBandIds: ['band-a'] };
const admin = { id: 'u0', role: 'admin', allowedBandIds: [] };

beforeEach(() => {
  remove.mockClear();
  list.mockClear();
});

describe('Storage: limpieza de multimedia', () => {
  it('un usuario normal NO puede ver las estadísticas ni borrar el Storage de las demás bandas', async () => {
    for (const [ruta, metodo] of [['/storage-stats', 'get'], ['/cleanup-unused-media', 'post']] as const) {
      const res = resFalso();
      await manejador(uploadRouter, ruta, metodo)({ user: usuario, body: { confirmar: true }, headers: {}, query: {} }, res);
      expect(res.code).toBe(403);
    }
    expect(remove).not.toHaveBeenCalled();
    expect(list).not.toHaveBeenCalled();
  });

  it('el admin sin confirmar solo recibe un simulacro: no se borra nada', async () => {
    const res = resFalso();
    await manejador(uploadRouter, '/cleanup-unused-media', 'post')({ user: admin, body: {}, headers: {}, query: {} }, res);
    expect(res.body.simulacro).toBe(true);
    expect(res.body.archivosAEliminar).toBe(1);
    expect(remove).not.toHaveBeenCalled();
  });

  it('el admin con confirmar:true sí borra', async () => {
    const res = resFalso();
    await manejador(uploadRouter, '/cleanup-unused-media', 'post')({ user: admin, body: { confirmar: true }, headers: {}, query: {} }, res);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(res.body.deletedFiles).toBe(1);
  });
});

describe('Fal.ai', () => {
  it('no queda ninguna clave por defecto en el código', () => {
    expect(ACTIVE_FAL_KEY).toBe('');
  });

  it('no hay claves de Fal (uuid:hex32) escritas en el código fuente', () => {
    const patron = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[0-9a-f]{32}/;
    const raiz = path.resolve(__dirname, '../../..');
    const hallazgos: string[] = [];
    const visitar = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', 'dist', '.git', 'supabase'].includes(e.name)) continue;
        const ruta = path.join(dir, e.name);
        if (e.isDirectory()) visitar(ruta);
        else if (/\.(ts|tsx|js|cjs|mjs|json|md)$/.test(e.name) && patron.test(fs.readFileSync(ruta, 'utf8'))) hallazgos.push(path.relative(raiz, ruta));
      }
    };
    ['server', 'src', 'scripts'].forEach((d) => fs.existsSync(path.join(raiz, d)) && visitar(path.join(raiz, d)));
    expect(hallazgos).toEqual([]);
  });

  it('el diagnóstico (que gasta saldo) ya no es público: solo admin', async () => {
    const res = resFalso();
    await manejador(aiMusicRouter, '/ai-stem-separation/fal-diagnostic', 'get')({ user: usuario, headers: {}, query: {} }, res);
    expect(res.code).toBe(403);
  });
});

describe('SSRF del webhook de publicación', () => {
  it('ignora la webhookUrl del cuerpo: solo se usa la configurada en el servidor', async () => {
    delete process.env.PUBLISH_WEBHOOK_URL;
    const fetchOriginal = globalThis.fetch;
    const fetchMock = vi.fn(async () => new Response('x', { status: 200 }));
    globalThis.fetch = fetchMock as any;
    try {
      const res = resFalso();
      await manejador(postsRouter, '/posts/trigger-webhook', 'post')(
        { user: usuario, body: { post: {}, webhookUrl: 'http://169.254.169.254/latest/meta-data' }, headers: {}, query: {} },
        res
      );
      expect(res.code).toBe(400); // sin PUBLISH_WEBHOOK_URL no se dispara nada
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = fetchOriginal;
    }
  });
});

describe('prototype pollution en /public/track-click', () => {
  it.each([
    [{ band_id: '__proto__', button_type: 'admin' }],
    [{ band_id: 'band-ok', button_type: '__proto__' }],
    [{ band_id: 'band-ok', button_type: 'spotify', concert_id: 'constructor' }],
    [{ band_id: 'band ok!', button_type: 'spotify' }],
  ])('rechaza %j y no toca Object.prototype', async (body) => {
    const res = resFalso();
    await manejador(epkFansRouter, '/public/track-click', 'post')({ body, query: {}, headers: {} }, res);
    expect(res.code).toBe(400);
    expect(({} as any).admin).toBeUndefined();
    expect(({} as any).spotify).toBeUndefined();
  });
});
