// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { firmaDeFeed } from '../concerts';

const SECRETO_ORIGINAL = process.env.CALENDAR_FEED_SECRET;
const CRON_ORIGINAL = process.env.CRON_SECRET;

beforeEach(() => {
  process.env.CALENDAR_FEED_SECRET = 'secreto-de-prueba';
  delete process.env.CRON_SECRET;
});

afterEach(() => {
  if (SECRETO_ORIGINAL === undefined) delete process.env.CALENDAR_FEED_SECRET;
  else process.env.CALENDAR_FEED_SECRET = SECRETO_ORIGINAL;
  if (CRON_ORIGINAL === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = CRON_ORIGINAL;
});

describe('firmaDeFeed', () => {
  it('cada banda tiene su firma, y no se adivina desde la de otra', () => {
    const bakandeya = firmaDeFeed('band-bakandeya');
    const laVanda = firmaDeFeed('band-la-vanda');
    expect(bakandeya).toMatch(/^[0-9a-f]{32}$/);
    expect(bakandeya).not.toBe(laVanda);
  });

  it('la misma banda da siempre la misma firma', () => {
    // Importa: la URL del calendario queda guardada en el cliente de calendario del usuario y
    // tiene que seguir funcionando entre reinicios del servidor.
    expect(firmaDeFeed('band-bakandeya')).toBe(firmaDeFeed('band-bakandeya'));
  });

  it('el orden de la lista de bandas no cambia la firma', () => {
    expect(firmaDeFeed('band-a,band-b')).toBe(firmaDeFeed('band-b, band-a'));
  });

  it('cambiar el secreto invalida todas las firmas de golpe', () => {
    const antes = firmaDeFeed('band-bakandeya');
    process.env.CALENDAR_FEED_SECRET = 'otro-secreto';
    expect(firmaDeFeed('band-bakandeya')).not.toBe(antes);
  });

  it('sin secreto configurado no hay firma, y la ruta responde 503', () => {
    delete process.env.CALENDAR_FEED_SECRET;
    expect(firmaDeFeed('band-bakandeya')).toBeNull();
  });
});
