import { describe, it, expect } from 'vitest';
import { detectarEstadoTrasRespuesta } from '../lectorAgent';

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
});
