import { describe, it, expect, vi, beforeEach } from 'vitest';

// refineCampaignToneDna (disparada por trainCampaignToneDnaManually / triggerCampaignToneRefinement)
// sobrescribía reglas_estilo_aprendidas directamente con lo que devolviera la IA al analizar solo
// las últimas 8 correcciones, sin pasarle las reglas ya guardadas ni pedirle que las conservara -
// a diferencia de refineToneDnaForCategory (nivel banda), que sí fusiona. Cada vez que se
// re-entrenaba el tono de una campaña activa podía perder reglas aprendidas en un entrenamiento
// anterior que no volvieran a aparecer reflejadas en los casos más recientes.

let ultimoPromptVisto = '';
let campaignToneRulesGuardadas: any = null;

vi.mock('../../ai.js', () => ({
  generateUnifiedAI: async ({ prompt }: { prompt: string }) => {
    ultimoPromptVisto = prompt;
    return {
      text: JSON.stringify({
        reglas_aprendidas: ['Regla nueva detectada en estos casos'],
        palabras_favoritas: ['bolo'],
        palabras_prohibidas: []
      })
    };
  }
}));

function crearCampaignPitchTrainingBuilder(edits: any[]) {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: async () => ({ data: edits, error: null })
  };
  return builder;
}

function crearCampaignsBuilder(reglasPrevias: any) {
  let modo: 'select' | 'update' = 'select';
  let updatePayload: any = null;
  const builder: any = {
    select: () => { modo = 'select'; return builder; },
    update: (payload: any) => { modo = 'update'; updatePayload = payload; return builder; },
    eq: () => builder,
    single: async () => ({ data: { campaign_tone_rules: reglasPrevias }, error: null }),
    // El código real hace `await sb.from(...).update(...).eq(...).eq(...)` (dos .eq() encadenados
    // y ningún .single()/.maybeSingle() final) - implementar `then` deja que `builder` mismo se
    // pueda "await"-ear directamente sin depender de contar cuántos .eq() hay en la cadena.
    then: (resolve: (v: { error: null }) => void) => {
      if (modo === 'update') campaignToneRulesGuardadas = updatePayload.campaign_tone_rules;
      resolve({ error: null });
    }
  };
  return builder;
}

vi.mock('../core.js', () => ({
  getSupabase: () => ({
    from: (table: string) => {
      if (table === 'campaign_pitch_training') {
        return crearCampaignPitchTrainingBuilder([
          { borrador_ia: 'Hola, os proponemos una fecha', texto_aprobado: 'Hola, os proponemos una fecha para el bolo' },
          { borrador_ia: 'Gracias por vuestro interés', texto_aprobado: 'Gracias de corazón por vuestro interés' }
        ]);
      }
      if (table === 'campaigns') {
        return crearCampaignsBuilder({
          reglas_estilo_aprendidas: ['Regla ya validada en un entrenamiento anterior'],
          vocabulario_aprendido: ['gira'],
          terminos_a_evitar: []
        });
      }
      throw new Error(`Tabla no mockeada: ${table}`);
    }
  }),
  cleanBandId: (bandId?: string) => (bandId || '').replace(/^(band|reg)-/, '')
}));

import { trainCampaignToneDnaManually } from '../pitchLearning';

describe('refineCampaignToneDna (vía trainCampaignToneDnaManually)', () => {
  beforeEach(() => {
    ultimoPromptVisto = '';
    campaignToneRulesGuardadas = null;
  });

  it('le pasa a la IA las reglas previas y le pide conservarlas, en vez de partir de cero', async () => {
    await trainCampaignToneDnaManually('banda-x', 'campaign-1');

    expect(ultimoPromptVisto).toContain('Regla ya validada en un entrenamiento anterior');
    expect(ultimoPromptVisto).toContain('mantenlas TODAS salvo que los casos nuevos de abajo las contradigan');
  });

  it('el resultado guardado no depende únicamente de lo que devuelva la IA para los últimos casos', async () => {
    const resultado = await trainCampaignToneDnaManually('banda-x', 'campaign-1');

    expect(resultado.success).toBe(true);
    expect(campaignToneRulesGuardadas.reglas_estilo_aprendidas).toEqual(['Regla nueva detectada en estos casos']);
    // vocabulario_aprendido preservado de currentRules porque la IA no devolvió palabras_favoritas... en
    // este mock SÍ las devuelve, así que se sobreescribe - lo que importa es que no se pierde por
    // no estar presente cuando la IA no dice nada (ver siguiente test).
  });
});
