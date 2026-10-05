import { describe, it, expect } from 'vitest';
import { detectarEstadoTrasRespuesta, puedeGenerarBorradorIA } from '../lectorAgent';

describe('detectarEstadoTrasRespuesta', () => {
  it('pasa a "respondido" una respuesta neutra a un lead contactado/esperando', () => {
    expect(detectarEstadoTrasRespuesta('contactado', 'Gracias por vuestro mensaje, lo vemos con calma.')).toBe('respondido');
    expect(detectarEstadoTrasRespuesta('esperando_respuesta', 'Nos parece interesante, ya os contamos.')).toBe('respondido');
  });

  it('pasa a "negociando" si el texto menciona precio/fecha/condiciones', () => {
    expect(detectarEstadoTrasRespuesta('contactado', '¿Cuánto cobráis por la actuación?')).toBe('negociando');
    expect(detectarEstadoTrasRespuesta('esperando_respuesta', '¿Tenéis disponibilidad para el 4 de diciembre?')).toBe('negociando');
    expect(detectarEstadoTrasRespuesta('respondido', 'Nos interesa, mandadnos el presupuesto.')).toBe('negociando');
  });

  it('no toca estados que no son de espera de primera respuesta', () => {
    expect(detectarEstadoTrasRespuesta('confirmado', 'Perfecto, todo listo.')).toBe('confirmado');
    expect(detectarEstadoTrasRespuesta('descartado', 'No nos interesa.')).toBe('descartado');
  });

  it('es insensible a mayúsculas', () => {
    expect(detectarEstadoTrasRespuesta('contactado', '¿CUÁNTO CACHÉ PEDÍS?')).toBe('negociando');
  });

  it('detecta negociación en el idioma del lead, no solo en español', () => {
    expect(detectarEstadoTrasRespuesta('contactado', 'What is your fee for this show?', 'en')).toBe('negociando');
    expect(detectarEstadoTrasRespuesta('contactado', 'Quel est votre budget pour cette date?', 'fr')).toBe('negociando');
    expect(detectarEstadoTrasRespuesta('esperando_respuesta', 'Danke für eure Nachricht, wir melden uns.', 'de')).toBe('respondido');
  });
});

describe('puedeGenerarBorradorIA', () => {
  it('permite generar borradores hasta el tope por banda', () => {
    const bandId = `banda-test-${Date.now()}-1`;
    for (let i = 0; i < 20; i++) {
      expect(puedeGenerarBorradorIA(bandId)).toBe(true);
    }
    // La petición 21 dentro de la misma hora debe bloquearse.
    expect(puedeGenerarBorradorIA(bandId)).toBe(false);
  });

  it('lleva contadores independientes por banda', () => {
    const bandA = `banda-test-${Date.now()}-a`;
    const bandB = `banda-test-${Date.now()}-b`;
    for (let i = 0; i < 20; i++) puedeGenerarBorradorIA(bandA);
    expect(puedeGenerarBorradorIA(bandA)).toBe(false);
    // Agotar el cupo de una banda no debe afectar al de otra.
    expect(puedeGenerarBorradorIA(bandB)).toBe(true);
  });
});
