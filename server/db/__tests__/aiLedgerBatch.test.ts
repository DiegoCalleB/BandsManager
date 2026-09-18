import { describe, it, expect, vi, beforeEach } from "vitest";
import { dbRecordAiUsage, flushAiLedgerBuffer, getPendingLedgerBufferSize } from "../aiLedger.js";

// Mock Supabase client
vi.mock("../core.js", () => {
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  return {
    getSupabase: () => ({
      from: () => ({
        insert: mockInsert
      }),
      rpc: vi.fn().mockResolvedValue({ data: 0, error: null })
    })
  };
});

describe("AI Token Ledger Buffer & Batching", () => {
  beforeEach(async () => {
    // Vaciar el buffer antes de cada test
    await flushAiLedgerBuffer();
  });

  it("acumula los consumos de IA en memoria sin bloquear la llamada", async () => {
    expect(getPendingLedgerBufferSize()).toBe(0);

    await dbRecordAiUsage({
      bandId: "band-test-1",
      promptTokens: 150,
      completionTokens: 300,
      modelName: "gemini-3.7-flash",
      estimatedCostEur: 0.00012
    });

    expect(getPendingLedgerBufferSize()).toBe(1);

    await dbRecordAiUsage({
      bandId: "band-test-1",
      promptTokens: 200,
      completionTokens: 400,
      modelName: "gemini-3.7-flash",
      estimatedCostEur: 0.00018
    });

    expect(getPendingLedgerBufferSize()).toBe(2);
  });

  it("vuelca el buffer a Supabase cuando se invoca flushAiLedgerBuffer", async () => {
    await dbRecordAiUsage({
      bandId: "band-test-2",
      promptTokens: 100,
      completionTokens: 100,
      modelName: "deepseek-chat",
      estimatedCostEur: 0.00005
    });

    expect(getPendingLedgerBufferSize()).toBe(1);

    await flushAiLedgerBuffer();

    expect(getPendingLedgerBufferSize()).toBe(0);
  });
});
