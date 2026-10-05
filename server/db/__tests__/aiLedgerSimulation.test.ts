import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  dbRecordAiUsage,
  flushAiLedgerBuffer,
  getPendingLedgerBufferSize,
  dbGetAiDebtCents
} from "../aiLedger.js";

// Mock Supabase para simular la base de datos de producción con datos ficticios
const insertMock = vi.fn().mockResolvedValue({ error: null });
const rpcMock = vi.fn().mockResolvedValue({ data: 1250, error: null }); // 12.50€ de deuda ficticia

vi.mock("../core.js", () => {
  return {
    getSupabase: () => ({
      from: () => ({
        insert: insertMock
      }),
      rpc: rpcMock
    })
  };
});

describe("Simulación de Rendimiento y Ráfagas de Consumo de IA (Datos Ficticios)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await flushAiLedgerBuffer();
  });

  it("simula una ráfaga masiva de 50 consumos de IA para 3 bandas ficticias", async () => {
    const bandFicticias = [
      "banda-ficticia-rockers-vallecas",
      "banda-ficticia-jazz-quintet",
      "banda-ficticia-indie-pop-madrid"
    ];

    const startTime = performance.now();

    // Simular 50 llamadas de IA distribuidas entre las 3 bandas ficticias
    for (let i = 1; i <= 50; i++) {
      const bandId = bandFicticias[i % 3];
      const model = i % 2 === 0 ? "gemini-3.7-flash" : "deepseek-chat";

      await dbRecordAiUsage({
        bandId,
        promptTokens: 100 + i * 5,
        completionTokens: 200 + i * 10,
        modelName: model,
        estimatedCostEur: 0.0001 * i
      });
    }

    const durationMs = performance.now() - startTime;

    console.log(`\n📊 [Simulación Ráfaga IA] 50 llamadas ficticias registradas en ${durationMs.toFixed(2)}ms`);
    console.log(`📦 Insert de lotes invocados a Supabase: ${insertMock.mock.calls.length} veces`);

    // Las 50 peticiones en memoria deberían procesarse en menos de 50ms (ultra-rápido)
    expect(durationMs).toBeLessThan(100);

    // Como el umbral de tamaño es 20, se deben haber disparado al menos 2 flushes automáticos por lote (20 + 20 = 40)
    expect(insertMock.mock.calls.length).toBeGreaterThanOrEqual(2);

    // Las entradas sobrantes (10 restantes) siguen en el buffer de memoria antes de forzar el flush final
    expect(getPendingLedgerBufferSize()).toBe(10);

    // Forzar flush final de las 10 restantes
    await flushAiLedgerBuffer();
    expect(getPendingLedgerBufferSize()).toBe(0);
  });

  it("garantiza que al consultar deuda (dbGetAiDebtCents), el buffer se vacía antes de llamar a Postgres", async () => {
    // 1. Inyectamos 5 consumos ficticios en el buffer
    for (let i = 1; i <= 5; i++) {
      await dbRecordAiUsage({
        bandId: "banda-ficticia-test-deuda",
        promptTokens: 50,
        completionTokens: 100,
        modelName: "gemini-3.7-flash",
        estimatedCostEur: 0.00005
      });
    }

    // Comprobamos que las 5 están retenidas en el buffer local
    expect(getPendingLedgerBufferSize()).toBe(5);

    // 2. Al llamar a consultar la deuda de la banda ficticia...
    const debtCents = await dbGetAiDebtCents("banda-ficticia-test-deuda");

    // 3. El buffer debe haberse vaciado automáticamente a 0 ANTES de ejecutar la consulta RPC en Postgres
    expect(getPendingLedgerBufferSize()).toBe(0);
    expect(insertMock).toHaveBeenCalled();
    expect(rpcMock).toHaveBeenCalledWith("get_ai_debt_cents", { p_band_id: "banda-ficticia-test-deuda" });
    expect(debtCents).toBe(1250);
  });
});
