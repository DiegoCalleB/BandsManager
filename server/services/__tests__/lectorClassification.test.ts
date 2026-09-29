import { describe, it, expect } from 'vitest';
import { detectarEstadoTrasRespuesta } from '../lectorAgent';

describe('detectarEstadoTrasRespuesta', () => {
  it('clasifica preguntas de precio o fechas como negociando', () => {
    expect(detectarEstadoTrasRespuesta('contactado', '¿Cuál es vuestro caché o propuesta económica para el 12 de Noviembre?')).toBe('negociando');
    expect(detectarEstadoTrasRespuesta('esperando_respuesta', 'What are your rates and financial conditions?')).toBe('negociando');
  });

  it('clasifica confirmaciones directas como confirmado', () => {
    expect(detectarEstadoTrasRespuesta('negociando', 'Fecha confirmada para el 20 de Octubre. Enviadnos contrato y rider.')).toBe('confirmado');
    expect(detectarEstadoTrasRespuesta('contactado', 'Perfecto, nos encanta la propuesta. De acuerdo con la fecha.')).toBe('confirmado');
  });

  it('clasifica rechazos claros como no_interesado', () => {
    expect(detectarEstadoTrasRespuesta('contactado', 'Lo sentimos, no tenemos disponibilidad para esta temporada.')).toBe('no_interesado');
    expect(detectarEstadoTrasRespuesta('esperando_respuesta', 'Unfortunately this does not fit our programming.').toLowerCase()).toContain('no_interesado');
  });

  it('clasifica consultas generales como respondido', () => {
    expect(detectarEstadoTrasRespuesta('contactado', 'Hola, ¿podríais enviarnos más información sobre la formación?')).toBe('respondido');
  });
});
