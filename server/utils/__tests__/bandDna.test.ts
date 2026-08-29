import { describe, it, expect } from 'vitest';
import { getBandDnaProfile, buildEnhancedPitchSystemPrompt } from '../bandDna';

function stateConBanda(dnaExpresion: any) {
  return {
    registeredBands: [
      {
        band_id: 'banda-test',
        nombre_banda: 'Banda Test',
        estilo_musical: 'Rock',
        dna_expresion: dnaExpresion,
      },
    ],
  };
}

describe('getBandDnaProfile - ADN de voz entrenado por el mánager', () => {
  it('extrae los campos de tono/vocabulario/recomendación editados en BandToneModal', () => {
    const state = stateConBanda({
      tono_comunicacion: 'Cercano y directo, sin formalismos',
      tratamiento_habitual: 'Tuteo siempre',
      nivel_energia: 'Alto, festivo',
      vocabulario_clave: ['bolo', 'currárnoslo', 'directo'],
      frases_emblematicas_extraidas: ['¡Vamos a darlo todo!'],
      emojis_frecuentes: ['🔥', '🎸'],
      puntos_fuertes_para_conectar: 'Conexión inmediata con el público local',
      recomendacion_pitch: 'Abrir siempre mencionando la fecha concreta',
    });

    const dna = getBandDnaProfile(state, 'banda-test');

    expect(dna.tonoComunicacion).toBe('Cercano y directo, sin formalismos');
    expect(dna.tratamientoHabitual).toBe('Tuteo siempre');
    expect(dna.nivelEnergia).toBe('Alto, festivo');
    expect(dna.vocabularioClave).toEqual(['bolo', 'currárnoslo', 'directo']);
    expect(dna.frasesEmblematicas).toEqual(['¡Vamos a darlo todo!']);
    expect(dna.emojisFrecuentes).toEqual(['🔥', '🎸']);
    expect(dna.puntosFuertesConectar).toBe('Conexión inmediata con el público local');
    expect(dna.recomendacionPitch).toBe('Abrir siempre mencionando la fecha concreta');
  });

  it('deja los campos undefined cuando la banda no tiene dna_expresion', () => {
    const dna = getBandDnaProfile({ registeredBands: [] }, 'banda-sin-adn');
    expect(dna.tonoComunicacion).toBeUndefined();
    expect(dna.vocabularioClave).toBeUndefined();
    expect(dna.recomendacionPitch).toBeUndefined();
  });

  it('ignora campos con tipo inesperado en vez de romper', () => {
    const state = stateConBanda({
      tono_comunicacion: 123,
      vocabulario_clave: 'no es un array',
    });
    const dna = getBandDnaProfile(state, 'banda-test');
    expect(dna.tonoComunicacion).toBeUndefined();
    expect(dna.vocabularioClave).toBeUndefined();
  });
});

describe('getBandDnaProfile - pautas de la plantilla de categoría del lead', () => {
  it('extrae las pautas de la categoría correspondiente al tipo del lead', () => {
    const state = {
      registeredBands: [{ band_id: 'banda-test', nombre_banda: 'Banda Test' }],
      categoryTemplates: {
        salas: { title: 'Salas y Teatros', guidelines: 'Tono festivo y bailable para salas.', customInstruction: '' },
        medios: { title: 'Medios de Comunicación', guidelines: 'Nunca pedir bolo a un medio.', customInstruction: 'Ir siempre al grano' },
      },
    };

    const dnaSala = getBandDnaProfile(state, 'banda-test', { tipo: 'sala' });
    expect(dnaSala.categoryTemplateGuidelines).toBe('Tono festivo y bailable para salas.');

    const dnaMedio = getBandDnaProfile(state, 'banda-test', { tipo: 'medio' });
    expect(dnaMedio.categoryTemplateGuidelines).toBe('Nunca pedir bolo a un medio.');
    expect(dnaMedio.categoryTemplateCustomInstruction).toBe('Ir siempre al grano');
  });

  it('no revienta si el estado no tiene categoryTemplates', () => {
    const dna = getBandDnaProfile({ registeredBands: [] }, 'banda-sin-templates', { tipo: 'festival' });
    expect(dna.categoryTemplateGuidelines).toBeUndefined();
  });
});

describe('buildEnhancedPitchSystemPrompt - inyección del ADN de voz entrenado', () => {
  const lead = { nombre_sala: 'Sala Test', ciudad: 'Madrid', tipo: 'sala' };

  it('incluye el bloque de ADN de voz cuando hay datos entrenados', () => {
    const state = stateConBanda({
      tono_comunicacion: 'Cercano y directo',
      vocabulario_clave: ['bolo', 'currárnoslo'],
      recomendacion_pitch: 'Abrir mencionando la fecha concreta',
    });
    const dna = getBandDnaProfile(state, 'banda-test');
    const prompt = buildEnhancedPitchSystemPrompt(dna, '', lead);

    expect(prompt).toContain('ADN DE VOZ Y CARÁCTER ENTRENADO POR EL MÁNAGER');
    expect(prompt).toContain('Cercano y directo');
    expect(prompt).toContain('bolo, currárnoslo');
    expect(prompt).toContain('Abrir mencionando la fecha concreta');
  });

  it('omite el bloque de ADN de voz si no hay ningún campo entrenado', () => {
    const dna = getBandDnaProfile({ registeredBands: [] }, 'banda-sin-adn');
    const prompt = buildEnhancedPitchSystemPrompt(dna, '', lead);
    expect(prompt).not.toContain('ADN DE VOZ Y CARÁCTER ENTRENADO POR EL MÁNAGER');
  });

  it('incluye las pautas de la plantilla de categoría cuando existen', () => {
    const state = {
      registeredBands: [{ band_id: 'banda-test' }],
      categoryTemplates: {
        salas: { title: 'Salas y Teatros', guidelines: 'Destaca siempre el montaje rápido.', customInstruction: 'Evitar mencionar cachés altos' },
      },
    };
    const dna = getBandDnaProfile(state, 'banda-test', lead);
    const prompt = buildEnhancedPitchSystemPrompt(dna, '', lead);

    expect(prompt).toContain('PAUTAS ESPECÍFICAS PARA "Salas y Teatros"');
    expect(prompt).toContain('Destaca siempre el montaje rápido.');
    expect(prompt).toContain('Evitar mencionar cachés altos');
  });

  it('sigue incluyendo el bloque de campaña activa junto con el ADN de voz', () => {
    const state = stateConBanda({ recomendacion_pitch: 'Ir directo al grano' });
    const dna = getBandDnaProfile(state, 'banda-test');
    const activeCampaign = {
      isActive: true,
      name: 'Gira Primavera',
      targetDatesText: '4 y 5 de diciembre',
      minCapacity: 100,
      maxCapacity: 300,
    };
    const prompt = buildEnhancedPitchSystemPrompt(dna, '', lead, activeCampaign);

    expect(prompt).toContain('CAMPAÑA DE BOOKING ACTIVA: "Gira Primavera"');
    expect(prompt).toContain('4 y 5 de diciembre');
    expect(prompt).toContain('Ir directo al grano');
  });
});
