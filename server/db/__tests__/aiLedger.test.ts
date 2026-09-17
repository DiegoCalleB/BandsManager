import { describe, it, expect, vi, beforeEach } from 'vitest';

// aiLedger.ts es zona de excepción TDD obligatoria (AGENTS.md §5.3.1, "dinero" - Stripe/ledger
// de IA): esta suite estaba en 0% de cobertura antes de escribirse. Los tests aquí verifican
// invariantes de dinero, no la implementación de hoy - qué nunca puede pasar, no cómo se logra:
// nunca se registra/liquida una cantidad negativa, nunca se traga un error de Supabase
// convirtiéndolo en éxito silencioso, y la deuda nunca es NaN/undefined hacia quien la use
// después para decidir si una banda debe dinero.

const insertMock = vi.fn();
const fromMock = vi.fn();
const rpcMock = vi.fn();

vi.mock('../core.js', () => ({
  getSupabase: () => ({ from: fromMock, rpc: rpcMock })
}));

import { dbRecordAiUsage, dbGetAiDebtCents, dbSettleAiDonation } from '../aiLedger';

describe('dbRecordAiUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockResolvedValue({ error: null });
  });

  it('nunca registra tokens ni coste negativos, aunque se lo pidan', async () => {
    await dbRecordAiUsage({
      bandId: 'band-x',
      promptTokens: -500,
      completionTokens: -10,
      modelName: 'gemini-2.5',
      estimatedCostEur: -3.5
    });

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      prompt_tokens: 0,
      completion_tokens: 0,
      estimated_cost_eur: 0
    }));
  });

  it('trata NaN/valores no numéricos como 0, no los deja pasar como NaN', async () => {
    await dbRecordAiUsage({
      bandId: 'band-x',
      promptTokens: NaN,
      completionTokens: undefined as any,
      modelName: 'gemini-2.5',
      estimatedCostEur: NaN
    });

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      prompt_tokens: 0,
      completion_tokens: 0,
      estimated_cost_eur: 0
    }));
  });

  it('redondea tokens fraccionarios antes de guardarlos', async () => {
    await dbRecordAiUsage({
      bandId: 'band-x',
      promptTokens: 120.7,
      completionTokens: 45.2,
      modelName: 'gemini-2.5',
      estimatedCostEur: 0.0234
    });

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      prompt_tokens: 121,
      completion_tokens: 45
    }));
  });

  it('nunca traga en silencio un error de Supabase al registrar consumo', async () => {
    insertMock.mockResolvedValue({ error: { message: 'conexión perdida' } });

    await expect(dbRecordAiUsage({
      bandId: 'band-x',
      promptTokens: 100,
      completionTokens: 50,
      modelName: 'gemini-2.5',
      estimatedCostEur: 0.01
    })).rejects.toThrow(/conexión perdida/);
  });
});

describe('dbGetAiDebtCents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve el número que da la función SQL', async () => {
    rpcMock.mockResolvedValue({ data: 1250, error: null });
    await expect(dbGetAiDebtCents('band-x')).resolves.toBe(1250);
  });

  it('nunca devuelve NaN/undefined - si la RPC da algo no numérico, es 0', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    await expect(dbGetAiDebtCents('band-x')).resolves.toBe(0);

    rpcMock.mockResolvedValue({ data: undefined, error: null });
    await expect(dbGetAiDebtCents('band-x')).resolves.toBe(0);
  });

  it('nunca informa "deuda 0" en silencio cuando la RPC realmente falló', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'timeout' } });
    await expect(dbGetAiDebtCents('band-x')).rejects.toThrow(/timeout/);
  });
});

describe('dbSettleAiDonation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nunca envía a Postgres un importe pagado negativo', async () => {
    rpcMock.mockResolvedValue({
      data: { owed_cents: 500, paid_cents: 0, became_sponsor: false, settled_rows: 0 },
      error: null
    });

    await dbSettleAiDonation('band-x', -200, 'evt_123');

    expect(rpcMock).toHaveBeenCalledWith('settle_ai_donation', expect.objectContaining({
      p_amount_paid_cents: 0
    }));
  });

  it('redondea céntimos fraccionarios antes de liquidar', async () => {
    rpcMock.mockResolvedValue({
      data: { owed_cents: 0, paid_cents: 500, became_sponsor: true, settled_rows: 1 },
      error: null
    });

    await dbSettleAiDonation('band-x', 499.6, 'evt_123');

    expect(rpcMock).toHaveBeenCalledWith('settle_ai_donation', expect.objectContaining({
      p_amount_paid_cents: 500
    }));
  });

  it('pasa el stripeEventId intacto - es la clave de idempotencia contra webhooks duplicados', async () => {
    rpcMock.mockResolvedValue({
      data: { owed_cents: 0, paid_cents: 500, became_sponsor: false, settled_rows: 1 },
      error: null
    });

    await dbSettleAiDonation('band-x', 500, 'evt_unico_de_stripe_abc123');

    expect(rpcMock).toHaveBeenCalledWith('settle_ai_donation', expect.objectContaining({
      p_band_id: 'band-x',
      p_stripe_event_id: 'evt_unico_de_stripe_abc123'
    }));
  });

  it('nunca convierte un fallo de liquidación en un resultado de éxito fabricado', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'advisory lock timeout' } });

    await expect(dbSettleAiDonation('band-x', 500, 'evt_123')).rejects.toThrow(/advisory lock timeout/);
  });

  it('devuelve exactamente lo que liquida la función SQL, sin reinterpretarlo', async () => {
    const resultadoEsperado = { owed_cents: 0, paid_cents: 800, became_sponsor: true, settled_rows: 2 };
    rpcMock.mockResolvedValue({ data: resultadoEsperado, error: null });

    await expect(dbSettleAiDonation('band-x', 800, 'evt_123')).resolves.toEqual(resultadoEsperado);
  });
});
