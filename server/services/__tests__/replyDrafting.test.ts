import { describe, it, expect } from 'vitest';
import { detectResponseType, type ResponseType } from '../replyDrafting';

describe('detectResponseType', () => {
  it('detecta negociación de precio correctamente', () => {
    expect(detectResponseType('¿Cuánto cobráis por la actuación?')).toBe('price_negotiation');
    expect(detectResponseType('Nos interesa, pero ¿cuál es vuestro presupuesto?')).toBe('price_negotiation');
    expect(detectResponseType('¿Cuál es la tarifa para una sala de 300 personas?')).toBe('price_negotiation');
    expect(detectResponseType('Hablemos de condiciones económicas')).toBe('price_negotiation');
  });

  it('detecta confirmación correctamente', () => {
    expect(detectResponseType('Perfecto, adelante con la propuesta')).toBe('confirmation');
    expect(detectResponseType('Sí, confirmamos la fecha del 15 de noviembre')).toBe('confirmation');
    expect(detectResponseType('Os parece bien el 4 de diciembre')).toBe('confirmation');
    expect(detectResponseType('¡Genial, nos encanta la propuesta!')).toBe('confirmation');
  });

  it('detecta rechazo correctamente', () => {
    expect(detectResponseType('Lo siento, no nos interesa en este momento')).toBe('rejection');
    expect(detectResponseType('Desafortunadamente no encaja con nuestra programación')).toBe('rejection');
    expect(detectResponseType('No tenemos disponibilidad para esa fecha')).toBe('rejection');
    expect(detectResponseType('Lamentablemente no podemos colaborar ahora')).toBe('rejection');
  });

  it('detecta seguimiento/preguntas correctamente', () => {
    expect(detectResponseType('¿Cuándo podríais venir?')).toBe('follow_up');
    expect(detectResponseType('¿Tenéis disponibilidad para diciembre?')).toBe('follow_up');
    expect(detectResponseType('¿Cómo es vuestro show en directo?')).toBe('follow_up');
    expect(detectResponseType('Necesitamos más información sobre vuestro rider técnico')).toBe('follow_up');
  });

  it('retorna neutral para mensajes sin palabras clave', () => {
    expect(detectResponseType('Gracias por vuestro mensaje')).toBe('neutral');
    expect(detectResponseType('Hemos recibido vuestro correo')).toBe('neutral');
    expect(detectResponseType('Os contactaremos pronto')).toBe('neutral');
  });

  it('es insensible a mayúsculas', () => {
    expect(detectResponseType('¿CUÁNTO COBRÁIS?')).toBe('price_negotiation');
    expect(detectResponseType('PERFECTO, ADELANTE')).toBe('confirmation');
  });
});
