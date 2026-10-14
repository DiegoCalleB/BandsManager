/**
 * CodeQL «Uncontrolled data used in path expression» (PR #235): la URL de audio llega del cliente
 * y no puede sacar la lectura de public/.
 */
import fs from 'fs';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../utils/ssrfGuard.js', () => ({ descargarBufferSeguro: vi.fn(), fetchUrlExternaSegura: vi.fn() }));
vi.mock('../../../utils/storage.js', () => ({ uploadBufferToSupabase: vi.fn(), rutaAlmacenamientoStem: vi.fn(() => 'x') }));
vi.mock('../cacheStems.js', () => ({ transcodeBufferToMp3: vi.fn() }));

import { ensurePublicAudioUrl } from '../audioPublico';

afterEach(() => vi.restoreAllMocks());

describe('ensurePublicAudioUrl: recorrido de directorios', () => {
  it.each([
    '../../../../etc/passwd',
    '/uploads/../../../../etc/passwd',
    '/../../etc/passwd',
    '/uploads/../../.env?x=1',
  ])('no lee fuera de public/ con %s', async (entrada) => {
    const lecturas: string[] = [];
    const existe = vi.spyOn(fs, 'existsSync').mockImplementation(() => true);
    vi.spyOn(fs, 'readFileSync').mockImplementation((p) => {
      lecturas.push(String(p));
      return Buffer.alloc(0);
    });
    await ensurePublicAudioUrl(entrada, 'band-a', 'hash').catch(() => undefined);
    const publicDir = path.join(process.cwd(), 'public') + path.sep;
    expect(existe).toHaveBeenCalled();
    for (const leida of lecturas) expect(leida.startsWith(publicDir)).toBe(true);
    for (const consultada of existe.mock.calls.map((c) => String(c[0]))) {
      if (consultada.includes('passwd') || consultada.endsWith('.env')) expect(consultada.startsWith(publicDir)).toBe(true);
    }
  });
});
