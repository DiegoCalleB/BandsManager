import { describe, it, expect } from 'vitest';
import { detectarEstadoTrasRespuesta, decidirEstadoTrasRespuesta } from '../lectorAgent';

describe('detectarEstadoTrasRespuesta', () => {
  it('clasifica preguntas de precio o fechas como negociando', () => {
    expect(detectarEstadoTrasRespuesta('contactado', '¿Cuál es vuestro caché o propuesta económica para el 12 de Noviembre?')).toBe('negociando');
    expect(detectarEstadoTrasRespuesta('esperando_respuesta', 'What are your rates and financial conditions?')).toBe('negociando');
  });

  it('una confirmación de la sala NUNCA cierra el bolo sola: queda en negociando para que lo confirme una persona', () => {
    expect(detectarEstadoTrasRespuesta('negociando', 'Fecha confirmada para el 20 de Octubre. Enviadnos contrato y rider.')).toBe('negociando');
    expect(detectarEstadoTrasRespuesta('contactado', 'Perfecto, nos encanta la propuesta. De acuerdo con la fecha.')).toBe('negociando');
  });

  it('una disculpa por sí sola no es un rechazo', () => {
    expect(detectarEstadoTrasRespuesta('contactado', 'Disculpa la tardanza, ¡nos encantaría programaros!')).not.toBe('no_interesado');
    expect(detectarEstadoTrasRespuesta('contactado', 'Lo siento, estuvimos de viaje. Nos interesa, ¿qué fechas tenéis?')).not.toBe('no_interesado');
    expect(detectarEstadoTrasRespuesta('contactado', "We're sorry for the delay, we'd love to have you.")).not.toBe('no_interesado');
  });

  it('clasifica rechazos claros como no_interesado', () => {
    expect(detectarEstadoTrasRespuesta('contactado', 'Lo sentimos, no tenemos disponibilidad para esta temporada.')).toBe('no_interesado');
    expect(detectarEstadoTrasRespuesta('esperando_respuesta', 'Unfortunately this does not fit our programming.').toLowerCase()).toContain('no_interesado');
  });

  it('clasifica consultas generales como respondido', () => {
    expect(detectarEstadoTrasRespuesta('contactado', 'Hola, ¿podríais enviarnos más información sobre la formación?')).toBe('respondido');
  });
});

describe('decidirEstadoTrasRespuesta (palabras clave + análisis con IA)', () => {
  const llm = (intencion: string, sentimiento = 'rechazo', confianza = 0.9, motor = 'gemini_flash') => ({ intencion, sentimiento, confianza, motor }) as any;
  const rechazo = 'Lo sentimos, no tenemos disponibilidad para esta temporada.';

  it('rechazo: exige las dos señales (palabras clave y la IA con confianza)', () => {
    expect(decidirEstadoTrasRespuesta('contactado', rechazo, 'es', llm('rechazo_estilo'))).toBe('no_interesado');
  });

  it('rechazo por programación llena pasa a aplazado, no a descartado', () => {
    expect(decidirEstadoTrasRespuesta('contactado', rechazo, 'es', llm('rechazo_programacion_llena'))).toBe('aplazado');
  });

  it('solo palabras clave (la IA no coincide): no descarta, queda en respondido para que decida una persona', () => {
    expect(decidirEstadoTrasRespuesta('contactado', rechazo, 'es', llm('consulta_general', 'neutral'))).toBe('respondido');
  });

  it('IA caída (clasificador heurístico) o con poca confianza: no descarta', () => {
    expect(decidirEstadoTrasRespuesta('contactado', rechazo, 'es', llm('rechazo_estilo', 'rechazo', 0.9, 'heuristica'))).toBe('respondido');
    expect(decidirEstadoTrasRespuesta('contactado', rechazo, 'es', llm('rechazo_estilo', 'rechazo', 0.4))).toBe('respondido');
  });

  it('un falso rechazo no hace retroceder a un lead que ya negocia', () => {
    expect(decidirEstadoTrasRespuesta('negociando', rechazo, 'es', llm('consulta_general', 'neutral'))).toBe('negociando');
  });

  it('confirmar fecha según la IA tampoco cierra: negociando', () => {
    expect(decidirEstadoTrasRespuesta('contactado', 'Nos viene bien.', 'es', llm('confirmar_fecha', 'muy_positivo'))).toBe('negociando');
  });

  it('un lead descartado o confirmado no se mueve', () => {
    expect(decidirEstadoTrasRespuesta('confirmado', rechazo, 'es', llm('rechazo_estilo'))).toBe('confirmado');
    expect(decidirEstadoTrasRespuesta('descartado', 'Nos encaja', 'es', llm('confirmar_fecha'))).toBe('descartado');
  });
});
