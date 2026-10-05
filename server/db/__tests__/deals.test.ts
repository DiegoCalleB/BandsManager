import { describe, it, expect } from 'vitest';
import {
  dbUpsertDeal,
  dbGetDealByToken,
  dbGetDeals,
  dbSignDeal,
  computeDealSha256
} from '../deals.js';

describe('deals database layer & crypto signature', () => {
  const testBandId = 'band_test_deal_123';

  it('computes reproducible, tamper-evident SHA-256 hash for agreement terms', () => {
    const dealA = {
      band_id: testBandId,
      lugar_sala: 'Sala El Sol',
      fecha_evento: '2026-11-15',
      total_acordado: 600,
      forma_pago: 'efectivo' as const,
      hora_llegada: '18:30',
      hora_concierto: '21:30',
      rider_incluido: true
    };

    const hash1 = computeDealSha256(dealA);
    const hash2 = computeDealSha256(dealA);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);

    // If terms change (e.g. fee changed from 600 to 700), the hash MUST change
    const dealModified = { ...dealA, total_acordado: 700 };
    const hashModified = computeDealSha256(dealModified);
    expect(hashModified).not.toBe(hash1);
  });

  it('creates and retrieves a deal with URL-safe token strictly scoped by band_id', async () => {
    const created = await dbUpsertDeal(
      {
        band_id: testBandId,
        lugar_sala: 'Sala Bikini',
        ciudad: 'Barcelona',
        fecha_evento: '2026-12-05',
        cache_base: 800,
        forma_pago: 'transferencia'
      },
      testBandId
    );

    expect(created.token).toMatch(/^dl_/);
    expect(created.lugar_sala).toBe('Sala Bikini');
    expect(created.cache_base).toBe(800);

    const retrieved = await dbGetDealByToken(created.token!);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.token).toBe(created.token);
    expect(retrieved?.band_id).toBe(testBandId);

    const bandDeals = await dbGetDeals(testBandId);
    expect(bandDeals.some((d) => d.token === created.token)).toBe(true);

    // Another band cannot retrieve it in their deals list
    const otherBandDeals = await dbGetDeals('band_other_999');
    expect(otherBandDeals.some((d) => d.token === created.token)).toBe(false);
  });

  it('signs a deal, registers audit trail and generates SHA-256 seal', async () => {
    const created = await dbUpsertDeal(
      {
        band_id: testBandId,
        lugar_sala: 'Teatro Eslava',
        ciudad: 'Madrid',
        fecha_evento: '2026-11-20',
        cache_base: 1200
      },
      testBandId
    );

    const signResult = await dbSignDeal(created.token!, {
      nombre_firmante: 'Javier González',
      cargo_firmante: 'Director de Programación',
      firma_imagen: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0...',
      firma_ip: '83.45.12.90',
      firma_user_agent: 'Mozilla/5.0 iPhone Mobile',
      rider_validado_por_sala: true
    });

    expect(signResult.deal.estado).toBe('confirmado');
    expect(signResult.deal.nombre_firmante).toBe('Javier González');
    expect(signResult.deal.cargo_firmante).toBe('Director de Programación');
    expect(signResult.deal.contrato_sha256).toBeDefined();
    expect(signResult.deal.contrato_sha256).toHaveLength(64);
    expect(signResult.deal.firma_timestamp).toBeDefined();
  });
});
