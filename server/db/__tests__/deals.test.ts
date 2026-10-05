import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crearFakeDealsSupabase } from './helpers/fakeDealsSupabase';

const fake = crearFakeDealsSupabase();
const upsertConcert = vi.fn(async (c: any) => c);
const upsertLead = vi.fn(async (l: any) => l);

vi.mock('../core.js', () => ({
  getSupabase: () => fake.client,
  cleanBandId: (b?: string) => (b || '').trim()
}));
vi.mock('../bands.js', () => ({ ensureRegisteredBandExists: async (b: string) => b }));
vi.mock('../concerts.js', () => ({ dbUpsertConcert: (...a: any[]) => (upsertConcert as any)(...a) }));
vi.mock('../leads.js', () => ({
  dbUpsertLead: (...a: any[]) => (upsertLead as any)(...a),
  dbGetLeadById: async (id: string) => ({ id, estado: 'negociando', notas: '' })
}));
vi.mock('../sync.js', () => ({ invalidateBandStateCache: () => {} }));
vi.mock('../../state.js', () => ({ loadState: () => ({ concerts: [] }), saveState: () => {} }));

import {
  dbUpsertDeal,
  dbGetDealByToken,
  dbGetDeals,
  dbSignDeal,
  computeDealSha256,
  calcularComision,
  COMISION_PORCENTAJE_DEFAULT,
  DealError
} from '../deals.js';

const banda = 'band-test-deal-123';
const firma = (nombre = 'Javier González') => ({
  nombre_firmante: nombre,
  cargo_firmante: 'Director de Programación',
  firma_imagen: 'data:image/svg+xml;base64,AAAA',
  firma_ip: '83.45.12.90',
  firma_user_agent: 'Mozilla/5.0 iPhone',
  rider_validado_por_sala: true
});

describe('deals: capa de datos', () => {
  beforeEach(() => {
    fake.filas.length = 0;
    fake.estado.fallo = null;
    fake.estado.rechazarColumna = null;
    upsertConcert.mockClear();
    upsertLead.mockClear();
  });

  describe('sello SHA-256 (v2)', () => {
    const base = {
      band_id: banda,
      nombre_evento: 'Concierto en Sala El Sol',
      lugar_sala: 'Sala El Sol',
      fecha_evento: '2026-11-15',
      total_acordado: 600,
      comision_porcentaje: 5,
      forma_pago: 'efectivo' as const,
      rider_incluido: true
    };

    it('es reproducible y de 64 caracteres', () => {
      expect(computeDealSha256(base)).toBe(computeDealSha256({ ...base }));
      expect(computeDealSha256(base)).toHaveLength(64);
    });

    it('es verificable más tarde: el formato de fecha que devuelve Postgres no altera el sello', () => {
      const firmado = { ...base, nombre_firmante: 'Sala', firma_imagen: 'F', firma_timestamp: '2026-10-05T19:17:00.123Z' };
      expect(computeDealSha256({ ...firmado, firma_timestamp: '2026-10-05T19:17:00.123+00:00' })).toBe(computeDealSha256(firmado));
    });

    it('cambia si se altera CUALQUIER término: importe, comisión, rider, hospitalidad o firmante', () => {
      const h = computeDealSha256(base);
      expect(computeDealSha256({ ...base, total_acordado: 700 })).not.toBe(h);
      expect(computeDealSha256({ ...base, comision_porcentaje: 0 })).not.toBe(h);
      expect(computeDealSha256({ ...base, rider_texto: 'Backline completo' })).not.toBe(h);
      expect(computeDealSha256({ ...base, hospitalidad_notas: 'Cena para 5' })).not.toBe(h);
      expect(computeDealSha256({ ...base, nombre_firmante: 'Otro' })).not.toBe(h);
    });
  });

  describe('comisión: la fija el servidor (de momento 0, aportación voluntaria)', () => {
    it('por defecto no cobra comisión', () => {
      expect(COMISION_PORCENTAJE_DEFAULT).toBe(0);
      expect(calcularComision(600)).toEqual({ comision_porcentaje: 0, comision_importe: 0, neto_banda: 600 });
    });

    it('sigue calculando bien un porcentaje explícito (para cuando se active con Stripe Connect)', () => {
      expect(calcularComision(600, 5)).toEqual({ comision_porcentaje: 5, comision_importe: 30, neto_banda: 570 });
      expect(calcularComision(333.33, 5).comision_importe).toBe(16.67);
    });

    it('ignora cualquier comisión que intente mandar el cliente', async () => {
      const d = await dbUpsertDeal(
        {
          band_id: banda,
          lugar_sala: 'Sala X',
          fecha_evento: '2026-12-01',
          total_acordado: 1000,
          comision_porcentaje: 50,
          comision_importe: 500,
          neto_banda: 500
        },
        banda
      );
      expect(d.comision_porcentaje).toBe(0);
      expect(d.comision_importe).toBe(0);
      expect(d.neto_banda).toBe(1000);
    });
  });

  describe('crear, leer y aislar por banda', () => {
    it('crea con token URL-safe, lo recupera y no lo expone a otra banda', async () => {
      const d = await dbUpsertDeal(
        { band_id: banda, lugar_sala: 'Sala Bikini', ciudad: 'Barcelona', fecha_evento: '2026-12-05', cache_base: 800 },
        banda
      );
      expect(d.token).toMatch(/^dl_/);
      expect(d.estado).toBe('pendiente');
      expect((await dbGetDealByToken(d.token!))?.band_id).toBe(banda);
      expect((await dbGetDeals(banda)).some((x) => x.token === d.token)).toBe(true);
      expect((await dbGetDeals('band-otra-999')).some((x) => x.token === d.token)).toBe(false);
    });

    it('editar un acuerdo pendiente conserva token y fecha de creación', async () => {
      const a = await dbUpsertDeal({ band_id: banda, lugar_sala: 'Sala A', fecha_evento: '2026-12-01', cache_base: 500 }, banda);
      const b = await dbUpsertDeal({ id: a.id, band_id: banda, lugar_sala: 'Sala A', fecha_evento: '2026-12-01', cache_base: 650 }, banda);
      expect(b.id).toBe(a.id);
      expect(b.token).toBe(a.token);
      expect(b.created_at).toBe(a.created_at);
      expect(b.total_acordado).toBe(650);
      expect(fake.filas).toHaveLength(1);
    });

    it('un id que pertenece a OTRA banda se ignora: no se toca el acuerdo ajeno', async () => {
      const ajeno = await dbUpsertDeal({ band_id: 'band-ajena', lugar_sala: 'Sala Z', fecha_evento: '2026-12-01', cache_base: 100 }, 'band-ajena');
      const mio = await dbUpsertDeal({ id: ajeno.id, band_id: banda, lugar_sala: 'Sala Mía', fecha_evento: '2026-12-02', cache_base: 999 }, banda);
      expect(mio.id).not.toBe(ajeno.id);
      expect(mio.token).not.toBe(ajeno.token);
      expect(fake.filas.find((f) => f.id === ajeno.id)?.cache_base).toBe(100);
    });
  });

  describe('apoyo voluntario elegido por la banda', () => {
    const base = { band_id: banda, lugar_sala: 'Sala A', fecha_evento: '2026-12-01', cache_base: 600 };

    it('se guarda normalizado y NO entra en el sello del contrato', async () => {
      const a = await dbUpsertDeal({ ...base, apoyo_porcentaje: 5 }, banda);
      expect(a.apoyo_porcentaje).toBe(5);
      const hashCon = computeDealSha256({ ...base, nombre_evento: 'x', apoyo_porcentaje: 5 } as any);
      const hashSin = computeDealSha256({ ...base, nombre_evento: 'x', apoyo_porcentaje: 0 } as any);
      expect(hashCon).toBe(hashSin);
    });

    it('valores raros: 999 se acota a 20, basura = no eligió (null), 0 se respeta', async () => {
      expect((await dbUpsertDeal({ ...base, lugar_sala: 'A1', apoyo_porcentaje: 999 as any }, banda)).apoyo_porcentaje).toBe(20);
      expect((await dbUpsertDeal({ ...base, lugar_sala: 'A2', apoyo_porcentaje: 'hola' as any }, banda)).apoyo_porcentaje).toBeNull();
      expect((await dbUpsertDeal({ ...base, lugar_sala: 'A3', apoyo_porcentaje: 0 }, banda)).apoyo_porcentaje).toBe(0);
      expect((await dbUpsertDeal({ ...base, lugar_sala: 'A4' }, banda)).apoyo_porcentaje).toBeNull();
    });

    it('al editar sin mandar el porcentaje se conserva el que ya había elegido', async () => {
      const a = await dbUpsertDeal({ ...base, apoyo_porcentaje: 5 }, banda);
      const b = await dbUpsertDeal({ ...base, id: a.id, cache_base: 700 }, banda);
      expect(b.apoyo_porcentaje).toBe(5);
      const c = await dbUpsertDeal({ ...base, id: a.id, apoyo_porcentaje: 0 }, banda);
      expect(c.apoyo_porcentaje).toBe(0);
    });

    it('si la migración 20261007 aún no está aplicada, el acuerdo se guarda igualmente (sin la preferencia)', async () => {
      fake.estado.rechazarColumna = 'apoyo_porcentaje';
      try {
        const d = await dbUpsertDeal({ ...base, apoyo_porcentaje: 5 }, banda);
        expect(d.token).toMatch(/^dl_/);
        expect(fake.filas).toHaveLength(1);
        expect('apoyo_porcentaje' in fake.filas[0]).toBe(false);
      } finally {
        fake.estado.rechazarColumna = null;
      }
    });
  });

  describe('firma', () => {
    it('firma, sella (SHA-256 de 64 caracteres), crea el bolo y confirma el lead', async () => {
      const d = await dbUpsertDeal({ band_id: banda, lead_id: 'lead-1', lugar_sala: 'Teatro Eslava', ciudad: 'Madrid', fecha_evento: '2026-11-20', cache_base: 1200 }, banda);
      const { deal } = await dbSignDeal(d.token!, firma());
      expect(deal.estado).toBe('confirmado');
      expect(deal.nombre_firmante).toBe('Javier González');
      expect(deal.contrato_sha256).toHaveLength(64);
      expect(deal.firma_timestamp).toBeTruthy();
      expect(upsertConcert).toHaveBeenCalledTimes(1);
      expect(upsertLead.mock.calls[0][0].estado).toBe('confirmado');
    });

    it('una segunda firma se rechaza con 409 y NO sobrescribe la firma original', async () => {
      const d = await dbUpsertDeal({ band_id: banda, lugar_sala: 'Sala A', fecha_evento: '2026-12-01', cache_base: 500 }, banda);
      await dbSignDeal(d.token!, firma('Programador Real'));
      await expect(dbSignDeal(d.token!, firma('Impostor'))).rejects.toMatchObject({ name: 'DealError', status: 409 });
      const guardado = await dbGetDealByToken(d.token!);
      expect(guardado?.nombre_firmante).toBe('Programador Real');
      expect(upsertConcert).toHaveBeenCalledTimes(1);
    });

    it('dos firmas simultáneas: solo una gana', async () => {
      const d = await dbUpsertDeal({ band_id: banda, lugar_sala: 'Sala A', fecha_evento: '2026-12-01', cache_base: 500 }, banda);
      const r = await Promise.allSettled([dbSignDeal(d.token!, firma('A')), dbSignDeal(d.token!, firma('B'))]);
      expect(r.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
      expect(r.filter((x) => x.status === 'rejected')).toHaveLength(1);
    });

    it('no se puede firmar un acuerdo cancelado (410) ni uno inexistente (404)', async () => {
      const d = await dbUpsertDeal({ band_id: banda, lugar_sala: 'Sala A', fecha_evento: '2026-12-01', cache_base: 500 }, banda);
      fake.filas.find((f) => f.id === d.id)!.estado = 'cancelado';
      await expect(dbSignDeal(d.token!, firma())).rejects.toMatchObject({ status: 410 });
      await expect(dbSignDeal('dl_no_existe', firma())).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('un acuerdo firmado no se puede editar', () => {
    it('POST con su id devuelve 409 y deja intactos términos, firma y token', async () => {
      const d = await dbUpsertDeal({ band_id: banda, lugar_sala: 'Sala B', fecha_evento: '2026-12-02', cache_base: 500 }, banda);
      await dbSignDeal(d.token!, firma());
      await expect(
        dbUpsertDeal({ id: d.id, band_id: banda, lugar_sala: 'Sala B', fecha_evento: '2026-12-02', cache_base: 50 }, banda)
      ).rejects.toMatchObject({ name: 'DealError', status: 409 });
      const fila = fake.filas.find((f) => f.id === d.id)!;
      expect(fila.estado).toBe('confirmado');
      expect(fila.cache_base).toBe(500);
      expect(fila.nombre_firmante).toBe('Javier González');
      expect(fila.token).toBe(d.token);
    });
  });

  describe('los errores de la BD no se tragan', () => {
    it('si Supabase falla al guardar, lanza error en vez de devolver un "éxito" que no se guardó', async () => {
      fake.estado.fallo = { message: 'conexión rechazada' };
      await expect(dbUpsertDeal({ band_id: banda, lugar_sala: 'Sala', fecha_evento: '2026-12-01' }, banda)).rejects.toBeInstanceOf(DealError);
    });

    it('tabla inexistente → 503 con instrucciones de migración', async () => {
      fake.estado.fallo = { code: '42P01', message: 'relation "concert_deals" does not exist' };
      await expect(dbGetDeals(banda)).rejects.toMatchObject({ status: 503 });
      await expect(dbGetDeals(banda)).rejects.toThrow(/migración/);
    });
  });
});
