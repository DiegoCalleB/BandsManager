import { describe, it, expect } from 'vitest';
import { getBandDnaProfile, buildEnhancedPitchSystemPrompt, buildReplySystemPrompt, formatReplyFewShotForPrompt, buildIndexableSubjectLine, buildAdvancingSystemPrompt } from '../bandDna';

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

describe('getBandDnaProfile - reglas de estilo auto-aprendidas separadas por categoría', () => {
  it('usa las reglas de la categoría del lead cuando existen', () => {
    const state = stateConBanda({
      reglas_por_categoria: {
        medios: { reglas_estilo_aprendidas: ['Sé breve y directo con medios'], vocabulario_aprendido: ['nota de prensa'], terminos_a_evitar: ['bolo'] },
        salas: { reglas_estilo_aprendidas: ['Destaca el montaje rápido'], vocabulario_aprendido: ['barra'], terminos_a_evitar: [] },
      },
    });

    const dnaMedio = getBandDnaProfile(state, 'banda-test', { tipo: 'medio' });
    expect(dnaMedio.reglasEstiloAprendidas).toEqual(['Sé breve y directo con medios']);
    expect(dnaMedio.vocabularioAprendido).toEqual(['nota de prensa']);

    const dnaSala = getBandDnaProfile(state, 'banda-test', { tipo: 'sala' });
    expect(dnaSala.reglasEstiloAprendidas).toEqual(['Destaca el montaje rápido']);
    expect(dnaSala.vocabularioAprendido).toEqual(['barra']);
  });

  it('cae a los campos planos antiguos si la categoría del lead no tiene reglas propias todavía', () => {
    const state = stateConBanda({
      reglas_estilo_aprendidas: ['Regla general antigua'],
      vocabulario_aprendido: ['palabra general'],
      reglas_por_categoria: {
        medios: { reglas_estilo_aprendidas: ['Solo para medios'] },
      },
    });

    // Lead de tipo "festival" no tiene bucket propio en reglas_por_categoria: cae al plano.
    const dna = getBandDnaProfile(state, 'banda-test', { tipo: 'festival' });
    expect(dna.reglasEstiloAprendidas).toEqual(['Regla general antigua']);
    expect(dna.vocabularioAprendido).toEqual(['palabra general']);
  });

  it('no revienta si no hay ni reglas por categoría ni reglas planas', () => {
    const dna = getBandDnaProfile({ registeredBands: [] }, 'banda-sin-reglas', { tipo: 'sala' });
    expect(dna.reglasEstiloAprendidas).toBeUndefined();
    expect(dna.vocabularioAprendido).toBeUndefined();
    expect(dna.terminosAEvitar).toBeUndefined();
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

    expect(prompt).toContain('CONTEXTO DE IDENTIDAD Y PERSONALIDAD DE LA BANDA');
    expect(prompt).toContain('Cercano y directo');
    expect(prompt).toContain('bolo, currárnoslo');
    expect(prompt).toContain('Abrir mencionando la fecha concreta');
  });

  it('omite el bloque de ADN de voz si no hay ningún campo entrenado', () => {
    const dna = getBandDnaProfile({ registeredBands: [] }, 'banda-sin-adn');
    const prompt = buildEnhancedPitchSystemPrompt(dna, '', lead);
    expect(prompt).not.toContain('CONTEXTO DE IDENTIDAD Y PERSONALIDAD DE LA BANDA');
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

    expect(prompt).toContain('PAUTAS Y PLANTILLA DE REFERENCIA PARA "Salas y Teatros"');
    expect(prompt).toContain('Destaca siempre el montaje rápido.');
    expect(prompt).toContain('Evitar mencionar cachés altos');
  });

  it('incluye el cuerpo de la plantilla de categoría como modelo de referencia, no solo las guidelines', () => {
    const state = {
      registeredBands: [{ band_id: 'banda-test' }],
      categoryTemplates: {
        salas: {
          title: 'Salas y Teatros',
          guidelines: 'Tono festivo.',
          body: 'Hola equipo de {{nombre_sala}}, somos {{nombre_banda}} y montamos rápido.',
        },
      },
    };
    const dna = getBandDnaProfile(state, 'banda-test', lead);
    expect(dna.categoryTemplateBody).toContain('montamos rápido');

    const prompt = buildEnhancedPitchSystemPrompt(dna, '', lead);
    expect(prompt).toContain('Plantilla de referencia guardada a mano por el mánager');
    expect(prompt).toContain('montamos rápido');
    expect(prompt).toContain('NUNCA la copies literal');
  });

  it('incluye el asunto de la plantilla de categoría como patrón para el email', () => {
    const state = {
      registeredBands: [{ band_id: 'banda-test' }],
      categoryTemplates: {
        salas: {
          title: 'Salas y Teatros',
          guidelines: 'Tono festivo y bailable.',
          subject: 'Somos {{nombre_banda}}: directo para {{nombre_sala}}',
          body: 'Hola equipo de {{nombre_sala}}, somos {{nombre_banda}}.',
        },
      },
    };
    const dna = getBandDnaProfile(state, 'banda-test', lead);
    expect(dna.categoryTemplateSubject).toBe('Somos {{nombre_banda}}: directo para {{nombre_sala}}');

    const prompt = buildEnhancedPitchSystemPrompt(dna, '', lead);
    expect(prompt).toContain('Estructura recomendada para el Asunto del email');
    expect(prompt).toContain('Somos {{nombre_banda}}: directo para {{nombre_sala}}');
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

  it('incluye las reglas manuales del pitch marcadas como fijas, aunque no haya reglas auto-aprendidas', () => {
    const state = stateConBanda({
      reglas_por_categoria: { salas: { reglas_manuales: ['Firma siempre como "el equipo de Booking"'] } },
    });
    const dna = getBandDnaProfile(state, 'banda-test', lead);
    const prompt = buildEnhancedPitchSystemPrompt(dna, '', lead);

    expect(prompt).toContain('REGLAS FIJAS ESCRITAS A MANO POR EL MÁNAGER');
    expect(prompt).toContain('🔒 Firma siempre como "el equipo de Booking"');
  });

  // El mánager pidió explícitamente que los hilos reales de email (y las reglas aprendidas de
  // corrección real, misma clase de señal) pesen al MÁXIMO para el tono, y que el ADN de voz de
  // redes sociales sea solo enriquecimiento - antes era al revés (el ADN de voz decía "MANDA
  // SOBRE EL TONO GENÉRICO" y los ejemplos reales quedaban al final del prompt sin ninguna
  // prioridad declarada).
  it('el estilo aprendido de correcciones reales manda explícitamente sobre el ADN de voz de redes, y aparece antes en el prompt', () => {
    const state = stateConBanda({
      tono_comunicacion: 'Gamberro y directo, como en Instagram',
      vocabulario_clave: ['pogo', 'familia'],
      reglas_por_categoria: { salas: { reglas_estilo_aprendidas: ['Usar registro formal con ayuntamientos'] } },
    });
    const dna = getBandDnaProfile(state, 'banda-test', lead);
    const prompt = buildEnhancedPitchSystemPrompt(dna, '', lead);

    expect(prompt).toContain('CÓMO ESCRIBE ESTA BANDA DE VERDAD');
    expect(prompt).toContain('MÁXIMA PRIORIDAD DE ESTILO Y TONO');
    expect(prompt).toContain('gana SIEMPRE el punto 6');

    const idxEstiloReal = prompt.indexOf('CÓMO ESCRIBE ESTA BANDA DE VERDAD');
    const idxAdnRedes = prompt.indexOf('CONTEXTO DE IDENTIDAD Y PERSONALIDAD DE LA BANDA');
    expect(idxEstiloReal).toBeGreaterThan(-1);
    expect(idxAdnRedes).toBeGreaterThan(-1);
    expect(idxEstiloReal).toBeLessThan(idxAdnRedes);
  });

  it('los hilos de ejemplo reales (fewShotSection) se inyectan junto a las reglas aprendidas, con prioridad máxima declarada', () => {
    const dna = getBandDnaProfile({ registeredBands: [] }, 'banda-sin-adn', lead);
    dna.fewShotSection = '\nEJEMPLO REAL: "Hola equipo de Sala X, os proponemos fecha..."\n';
    const prompt = buildEnhancedPitchSystemPrompt(dna, '', lead);

    expect(prompt).toContain('CÓMO ESCRIBE ESTA BANDA DE VERDAD');
    expect(prompt).toContain('Hola equipo de Sala X, os proponemos fecha');
    const idxFewShot = prompt.indexOf('Hola equipo de Sala X');
    const idxDirectrices = prompt.indexOf('DIRECTRICES DE REDACCIÓN DE ALTA CONVERSIÓN');
    expect(idxFewShot).toBeLessThan(idxDirectrices);
  });
});

describe('buildReplySystemPrompt - Contestador', () => {
  const lead = { nombre_sala: 'Sala Test', ciudad: 'Madrid', tipo: 'sala' };

  it('incluye el mensaje entrante, el hilo previo y el ADN de voz de la banda', () => {
    const state = stateConBanda({
      tono_comunicacion: 'Cercano y directo',
      vocabulario_clave: ['bolo', 'currárnoslo'],
    });
    const dna = getBandDnaProfile(state, 'banda-test', lead);
    const prompt = buildReplySystemPrompt(
      dna,
      lead,
      '¿Cuánto cobráis y tenéis fecha libre en abril?',
      [{ remitente: 'banda', mensaje: 'Os escribimos con nuestra propuesta...' }],
      ''
    );

    expect(prompt).toContain('¿Cuánto cobráis y tenéis fecha libre en abril?');
    expect(prompt).toContain('Os escribimos con nuestra propuesta...');
    expect(prompt).toContain('Cercano y directo');
    expect(prompt).toContain('bolo, currárnoslo');
    expect(prompt).toContain('CONTESTACIÓN');
  });

  it('avisa cuando no hay hilo previo registrado', () => {
    const dna = getBandDnaProfile({ registeredBands: [] }, 'banda-sin-adn', lead);
    const prompt = buildReplySystemPrompt(dna, lead, 'Nos interesa, contadnos más.', [], '');
    expect(prompt).toContain('Sin mensajes previos registrados');
  });

  it('usa la guía configurada a mano por el mánager cuando existe para el tipo detectado', () => {
    const dna = getBandDnaProfile({ registeredBands: [] }, 'banda-sin-adn', lead);
    const responseStrategy = { guidancePrompt: 'Nunca des cifras concretas por email.', tone: 'neutral', mentionLinks: false };
    const prompt = buildReplySystemPrompt(dna, lead, '¿Cuánto cobráis?', [], '', 'price_negotiation', responseStrategy);

    expect(prompt).toContain('GUÍA CONDICIONAL PARA ESTE TIPO DE RESPUESTA (configurada por el mánager)');
    expect(prompt).toContain('Nunca des cifras concretas por email.');
    expect(prompt).not.toContain('GUÍA AUTOMÁTICA PARA ESTE TIPO DE RESPUESTA');
  });

  it('cae a la guía automática de código si no hay estrategia configurada para el tipo detectado', () => {
    const dna = getBandDnaProfile({ registeredBands: [] }, 'banda-sin-adn', lead);
    const prompt = buildReplySystemPrompt(dna, lead, '¿Cuánto cobráis?', [], '', 'price_negotiation');

    expect(prompt).toContain('GUÍA AUTOMÁTICA PARA ESTE TIPO DE RESPUESTA');
    expect(prompt).not.toContain('configurada por el mánager');
  });

  it('inyecta los cachés mínimos reales y de inicio de negociación de forma confidencial', () => {
    const dna = getBandDnaProfile({ registeredBands: [] }, 'banda-test', lead);
    const prompt = buildReplySystemPrompt(
      dna,
      lead,
      '¿Cuánto cobráis para una fecha en abril?',
      [],
      '',
      'price_negotiation',
      undefined,
      undefined,
      { salas: 800 },
      { salas: 1200 }
    );

    expect(prompt).toContain('CONDICIONES ECONÓMICAS Y GUÍA DE NEGOCIACIÓN (CONFIDENCIAL — PARA RESPUESTAS DE PRECIO)');
    expect(prompt).toContain('1200€');
    expect(prompt).toContain('800€');
    expect(prompt).toContain('400€ para absorber costes o producción');
    expect(prompt).toContain('NUNCA menciones que tu mínimo real es 800€');
  });

  it('incluye las instrucciones puntuales de una regeneración con feedback', () => {
    const dna = getBandDnaProfile({ registeredBands: [] }, 'banda-sin-adn', lead);
    const prompt = buildReplySystemPrompt(
      dna, lead, 'Perfecto, adelante', [], '', 'confirmation', undefined,
      ['Puntuación de tono deseado: 5/5', 'Instrucciones específicas de esta respuesta: "Hazlo más corto"']
    );

    expect(prompt).toContain('INSTRUCCIONES DEL MÁNAGER PARA ESTA REGENERACIÓN CONCRETA');
    expect(prompt).toContain('Hazlo más corto');
  });

  it('incluye las reglas manuales marcadas como fijas, por encima de las auto-aprendidas', () => {
    const state = stateConBanda({
      reglas_por_categoria_respuesta: {
        salas: {
          reglas_manuales: ['Nunca prometas fecha exacta sin confirmar con el resto de la banda'],
          reglas_estilo_aprendidas: ['Sé breve'],
        },
      },
    });
    const dna = getBandDnaProfile(state, 'banda-test', lead, 'reply');
    const prompt = buildReplySystemPrompt(dna, lead, 'Nos interesa, contadnos más.', [], '');

    expect(prompt).toContain('REGLAS FIJAS ESCRITAS A MANO POR EL MÁNAGER');
    expect(prompt).toContain('🔒 Nunca prometas fecha exacta sin confirmar con el resto de la banda');
    expect(prompt).toContain('⭐ Sé breve');
  });

  it('los hilos reales de respuesta y las reglas aprendidas mandan sobre el ADN de voz de redes, y aparecen antes en el prompt', () => {
    const state = stateConBanda({
      tono_comunicacion: 'Gamberro, como en TikTok',
      reglas_por_categoria_respuesta: { salas: { reglas_estilo_aprendidas: ['Confirmar la fecha en la primera línea'] } },
    });
    const dna = getBandDnaProfile(state, 'banda-test', lead, 'reply');
    const replyFewShot = '\nEJEMPLO REAL: [Sala]: "¿Cuánto pedís?" [Banda]: "Nuestro caché es flexible..."\n';
    const prompt = buildReplySystemPrompt(dna, lead, 'Nos interesa, contadnos más.', [], replyFewShot);

    expect(prompt).toContain('CÓMO RESPONDE ESTA BANDA DE VERDAD');
    expect(prompt).toContain('MÁXIMA PRIORIDAD DE ESTILO Y TONO');
    expect(prompt).toContain('Nuestro caché es flexible');

    const idxEstiloReal = prompt.indexOf('CÓMO RESPONDE ESTA BANDA DE VERDAD');
    const idxAdnRedes = prompt.indexOf('CONTEXTO DE IDENTIDAD Y PERSONALIDAD DE LA BANDA');
    expect(idxEstiloReal).toBeGreaterThan(-1);
    expect(idxAdnRedes).toBeGreaterThan(-1);
    expect(idxEstiloReal).toBeLessThan(idxAdnRedes);
  });
});

describe('getBandDnaProfile - separación de reglas aprendidas entre pitch y respuesta', () => {
  it('en modo pitch (por defecto) lee reglas_por_categoria, no reglas_por_categoria_respuesta', () => {
    const state = stateConBanda({
      reglas_por_categoria: { salas: { reglas_estilo_aprendidas: ['Regla de pitch para salas'] } },
      reglas_por_categoria_respuesta: { salas: { reglas_estilo_aprendidas: ['Regla de respuesta para salas'] } },
    });
    const dna = getBandDnaProfile(state, 'banda-test', { tipo: 'sala' });
    expect(dna.reglasEstiloAprendidas).toEqual(['Regla de pitch para salas']);
  });

  it('en modo reply lee reglas_por_categoria_respuesta, no reglas_por_categoria', () => {
    const state = stateConBanda({
      reglas_por_categoria: { salas: { reglas_estilo_aprendidas: ['Regla de pitch para salas'] } },
      reglas_por_categoria_respuesta: { salas: { reglas_estilo_aprendidas: ['Regla de respuesta para salas'] } },
    });
    const dna = getBandDnaProfile(state, 'banda-test', { tipo: 'sala' }, 'reply');
    expect(dna.reglasEstiloAprendidas).toEqual(['Regla de respuesta para salas']);
  });

  it('en modo reply no cae a los campos planos antiguos de pitch (nunca fueron de respuesta)', () => {
    const state = stateConBanda({
      reglas_estilo_aprendidas: ['Regla plana antigua de pitch'],
    });
    const dna = getBandDnaProfile(state, 'banda-test', { tipo: 'sala' }, 'reply');
    expect(dna.reglasEstiloAprendidas).toBeUndefined();
  });

  it('en modo reply sin ninguna regla de respuesta aprendida no revienta', () => {
    const dna = getBandDnaProfile({ registeredBands: [] }, 'banda-sin-reglas', { tipo: 'sala' }, 'reply');
    expect(dna.reglasEstiloAprendidas).toBeUndefined();
  });

  it('lee reglas_manuales por separado de las auto-aprendidas, en ambos modos', () => {
    const state = stateConBanda({
      reglas_por_categoria: { salas: { reglas_estilo_aprendidas: ['Auto pitch'], reglas_manuales: ['Manual pitch'] } },
      reglas_por_categoria_respuesta: { salas: { reglas_estilo_aprendidas: ['Auto respuesta'], reglas_manuales: ['Manual respuesta'] } },
    });
    const dnaPitch = getBandDnaProfile(state, 'banda-test', { tipo: 'sala' });
    expect(dnaPitch.reglasManuales).toEqual(['Manual pitch']);
    expect(dnaPitch.reglasEstiloAprendidas).toEqual(['Auto pitch']);

    const dnaReply = getBandDnaProfile(state, 'banda-test', { tipo: 'sala' }, 'reply');
    expect(dnaReply.reglasManuales).toEqual(['Manual respuesta']);
    expect(dnaReply.reglasEstiloAprendidas).toEqual(['Auto respuesta']);
  });
});

describe('formatReplyFewShotForPrompt', () => {
  it('formatea hilos completos incluyendo la respuesta real de la sala', () => {
    const texto = formatReplyFewShotForPrompt([
      {
        titulo: 'Sala Ejemplo',
        resultado: 'positiva',
        mensajes: [
          { rol: 'banda', texto: 'Hola, os proponemos fecha', orden: 1 },
          { rol: 'sala', texto: 'Nos interesa, ¿cuánto pedís?', orden: 2 },
          { rol: 'banda', texto: 'Nuestro caché es flexible según aforo', orden: 3 },
        ],
      },
    ]);

    expect(texto).toContain('Sala Ejemplo');
    expect(texto).toContain('RESULTADO: POSITIVO');
    expect(texto).toContain('Nos interesa, ¿cuánto pedís?');
    expect(texto).toContain('Nuestro caché es flexible según aforo');
  });

  it('devuelve cadena vacía si no hay hilos', () => {
    expect(formatReplyFewShotForPrompt([])).toBe('');
  });
});

describe('buildIndexableSubjectLine - Formato de asunto B2B indexable', () => {
  it('genera formato estándar [FECHA/RANGO] - [CIUDAD] - [BANDA] ([GÉNERO / REF]) para cold outreach', () => {
    const dna = {
      bandName: 'Bakandeya',
      genero: 'Balkan Ska Fusion',
      artistasReferencia: 'Gogol Bordello, Emir Kusturica',
    } as any;

    const lead = {
      nombre_sala: 'Sala Sol',
      ciudad: 'Madrid',
    };

    const activeCampaign = {
      targetDatesText: '14/11 o 21/11',
    };

    const asunto = buildIndexableSubjectLine({ bandDna: dna, lead, activeCampaign });
    expect(asunto).toBe('[14/11 o 21/11] - Madrid - Bakandeya (Balkan Ska Fusion / ref: Gogol Bordello)');
  });

  it('genera formato de respuesta Re: cuando isRespuesta es true', () => {
    const dna = {
      bandName: 'Bakandeya',
    } as any;

    const lead = {
      nombre_sala: 'Sala Capitol',
      ciudad: 'Santiago',
    };

    const asunto = buildIndexableSubjectLine({ bandDna: dna, lead, isRespuesta: true });
    expect(asunto).toBe('Re: Concierto Bakandeya en Sala Capitol');
  });
});

describe('buildAdvancingSystemPrompt - Fase 4 Advancing y Producción', () => {
  it('genera prompt estructurado de logística y producción con horarios y rider', () => {
    const dna = {
      bandName: 'Bakandeya',
      numMusicos: 6,
      instrumentacion: 'Violín, bajo, sintes, batería, voz',
      montajeRapido: 'Montaje en 30 minutos',
      epkUrl: 'https://bandmanager.io/epk/bakandeya',
    } as any;

    const lead = {
      nombre_sala: 'Teatro Principal',
      ciudad: 'Burgos',
    };

    const concertDetails = {
      fechaConcierto: '12 de Diciembre 2026',
      horarioLoadIn: '17:00h',
      horarioSoundcheck: '18:00h',
      horarioPuertas: '20:30h',
      horarioShow: '21:30h',
      contactoProduccion: 'Carlos Ruiz (Road Mánager)',
      telefonoProduccion: '+34 600 000 000',
    };

    const prompt = buildAdvancingSystemPrompt({ bandDna: dna, lead, concertDetails });
    expect(prompt).toContain('Teatro Principal');
    expect(prompt).toContain('12 de Diciembre 2026');
    expect(prompt).toContain('17:00h');
    expect(prompt).toContain('Carlos Ruiz (Road Mánager)');
    expect(prompt).toContain('PROHIBICIÓN ESTRICTA DE GUIONES LARGOS');
  });
});

describe('buildEnhancedPitchSystemPrompt - Reglas Anti-Detección y Anti-AI Slop', () => {
  it('incluye prohibición de guiones largos, burstiness y lista negra expandida', () => {
    const dna = {
      bandName: 'Bakandeya',
      genero: 'Mestizaje Balkan',
      artistasReferencia: 'La Pegatina, Gogol Bordello',
    } as any;

    const lead = {
      nombre_sala: 'Sala Riviera',
      ciudad: 'Madrid',
      tipo: 'sala',
    };

    const prompt = buildEnhancedPitchSystemPrompt(dna, lead, '', 'es');
    expect(prompt).toContain('PROHIBICIÓN ESTRICTA DE GUIONES LARGOS');
    expect(prompt).toContain('BURSTINESS ORACIONAL OBLIGATORIA');
    expect(prompt).toContain('REGLA ANTI-TRUNCAMIENTO DE GMAIL');
    expect(prompt).toContain('MENTALIDAD DE SOCIO DE NEGOCIO');
    expect(prompt).toContain('FIVE THINGS TO KILL');
    expect(prompt).toContain('THE READ ALOUD TEST');
    expect(prompt).toContain('ZERO PERSONNEL BIO');
    expect(prompt).toContain('SLOT MIRRORING EN FESTIVALES');
    expect(prompt).toContain('ANCHOR METRICS ÚNICAS');
    expect(prompt).toContain('PROHIBICIÓN DE GERUNDIOS ENCADENADOS');
    expect(prompt).toContain('PROHIBICIÓN DEL PATRÓN DE TRES ELEMENTOS (RULE OF THREE)');
    expect(prompt).toContain('PROHIBICIÓN ABSOLUTA DE "THROAT-CLEARING"');
    expect(prompt).toContain('INSERCIÓN DEL "DATO IMPOSIBLE DE AUTOMATIZAR"');
    expect(prompt).toContain('PROPUESTA DE PROMOCIÓN GEOLOCALIZADA');
    expect(prompt).toContain('FORMATO SINGLE-LINK');
    expect(prompt).toContain('ANCLAJE DE VALOR EN SEGUIMIENTOS');
    expect(prompt).toContain('crucial');
    expect(prompt).toContain('paisaje');
    expect(prompt).toContain('fundamental');
    expect(prompt).toContain('explorar');
    expect(prompt).toContain('REGLAS DE SUSTITUCIÓN DIRECTA');
    expect(prompt).toContain('delve');
    expect(prompt).toContain('tapestry');
    expect(prompt).toContain('Artistas de referencia / Sonido afín: La Pegatina, Gogol Bordello');

    const replyPrompt = buildReplySystemPrompt(dna, lead, '¿Qué condiciones tenéis?', [], '', 'es');
    expect(replyPrompt).toContain('MODELOS FINANCIEROS Y CONDICIONES DE NEGOCIACIÓN');
    expect(replyPrompt).toContain('Garantía Mínima vs % de puerta');
    expect(replyPrompt).toContain('PROTECCIÓN DE MERCHANDISING');
    expect(replyPrompt).toContain('PROTOCOLO DE PAGO 50/50');
    expect(replyPrompt).toContain('Radius Clause');
  });
});

