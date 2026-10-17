/** `/transpose-audio` no devuelve el stderr de ffmpeg/Python a quien no es admin. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const servicio = vi.hoisted(() => ({ processAudioTransposition: vi.fn() }));
vi.mock('../../services/audioTransposeService.js', () => servicio);

import router from '../transposeRoute.js';
import { manejador } from './helpers/rutas.js';

const STDERR = 'ffmpeg: /srv/app/tmp/secreto.wav: No such file or directory';

async function transponer(role: string) {
  const res: { code: number; body?: Record<string, unknown>; status: (c: number) => typeof res; json: (b: Record<string, unknown>) => typeof res } = {
    code: 200,
    status: (c) => ((res.code = c), res),
    json: (b) => ((res.body = b), res),
  };
  await manejador(router, '/transpose-audio', 'post')(
    { body: { audioUrl: 'https://cdn.example.com/a.mp3', semitones: 2 }, headers: {}, query: {}, user: { id: 'u1', role, band_id: 'b1', allowedBandIds: ['b1'] } },
    res,
  );
  return res;
}

describe('POST /transpose-audio — fallo', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    servicio.processAudioTransposition.mockResolvedValue({ success: false, error: STDERR });
  });

  it('no enseña el stderr a un usuario normal', async () => {
    const res = await transponer('leader');
    expect(res.code).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secreto.wav');
  });

  it('un admin sí lo ve', async () => {
    const res = await transponer('admin');
    expect(res.body?.details).toBe(STDERR);
  });
});
