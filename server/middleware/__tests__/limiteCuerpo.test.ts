import { describe, expect, it } from 'vitest';
import express from 'express';
import http from 'http';
import { jsonSegunSesion } from '../limiteCuerpo';

async function enviar(conSesion: boolean, bytes: number): Promise<number> {
  const app = express();
  app.use(jsonSegunSesion(() => conSesion));
  app.post('/x', (_req, res) => res.json({ ok: true }));
  app.use((err: any, _req: any, res: any, _n: any) => res.status(err.status || 500).json({}));
  const srv = http.createServer(app);
  await new Promise<void>((r) => srv.listen(0, r));
  const port = (srv.address() as any).port;
  try {
    const r = await fetch(`http://127.0.0.1:${port}/x`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ a: 'x'.repeat(bytes) }),
    });
    return r.status;
  } finally {
    srv.close();
  }
}

describe('jsonSegunSesion', () => {
  it('anónimo: 2 MB se rechaza con 413', async () => {
    expect(await enviar(false, 2 * 1024 * 1024)).toBe(413);
  });
  it('anónimo: cuerpo pequeño pasa', async () => {
    expect(await enviar(false, 1000)).toBe(200);
  });
  it('con sesión: 2 MB pasa', async () => {
    expect(await enviar(true, 2 * 1024 * 1024)).toBe(200);
  });
});
