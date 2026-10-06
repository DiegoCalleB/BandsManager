// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

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

  it('prioriza la pregunta de precio sobre una afirmación positiva previa', () => {
    // Caso real y frecuente: el mensaje abre con una palabra de confirmación pero la
    // pregunta de fondo es sobre precio - la guía de "no menciones cifras" no debe ganar
    // sobre la pregunta explícita de cuánto cuesta.
    expect(detectResponseType('Sí, nos encaja la fecha, ¿cuál sería el caché?')).toBe('price_negotiation');
    expect(detectResponseType('Perfecto, nos interesa. ¿Cuánto cobráis?')).toBe('price_negotiation');
    expect(detectResponseType('Genial, ¿qué presupuesto manejáis?')).toBe('price_negotiation');
  });

  it('no confunde "sí" ni "ok" con palabras que las contienen como substring', () => {
    // "así" contiene "sí" y "booking" contiene "ok" - con un simple .includes() ambos mensajes
    // se clasificaban como "confirmation" sin que nadie hubiera confirmado nada.
    expect(detectResponseType('Así que os contestamos en unos días con más detalles del rider.')).toBe('follow_up');
    expect(detectResponseType('Nuestro departamento de booking revisará la propuesta.')).toBe('neutral');
  });

  it('sigue detectando "sí" y "ok" cuando aparecen como palabra suelta', () => {
    expect(detectResponseType('Sí, adelante.')).toBe('confirmation');
    expect(detectResponseType('OK, genial.')).toBe('confirmation');
    expect(detectResponseType('Nos parece bien, ok.')).toBe('confirmation');
  });
});

describe('detectResponseType con leads en otros idiomas', () => {
  it('detecta negociación de precio en inglés, italiano, francés y alemán', () => {
    expect(detectResponseType('What is your fee for this show?', 'en')).toBe('price_negotiation');
    expect(detectResponseType('Qual è il vostro cachet?', 'it')).toBe('price_negotiation');
    expect(detectResponseType('Quel est votre cachet pour la date?', 'fr')).toBe('price_negotiation');
    expect(detectResponseType('Wie viel ist eure Gage?', 'de')).toBe('price_negotiation');
  });

  it('detecta confirmación en varios idiomas sin depender del español', () => {
    expect(detectResponseType('Perfect, sounds great, we confirm the date.', 'en')).toBe('confirmation');
    expect(detectResponseType('Perfetto, confermiamo la data.', 'it')).toBe('confirmation');
    expect(detectResponseType('Parfait, nous confirmons la date.', 'fr')).toBe('confirmation');
  });

  it('detecta rechazo en varios idiomas sin depender del español', () => {
    expect(detectResponseType('Unfortunately this is not possible for us.', 'en')).toBe('rejection');
    expect(detectResponseType('Purtroppo non è possibile in questo momento.', 'it')).toBe('rejection');
    expect(detectResponseType('Malheureusement ce n\'est pas possible.', 'fr')).toBe('rejection');
  });

  it('cae a español si el idioma no está soportado o no se indica', () => {
    expect(detectResponseType('¿Cuánto cobráis?')).toBe('price_negotiation');
    expect(detectResponseType('¿Cuánto cobráis?', 'xx')).toBe('price_negotiation');
  });

  it('no confunde palabras cortas de otros idiomas con substrings ("ja" en "januari")', () => {
    // "januari" (enero, en neerlandés) contiene "ja" ("sí") como substring - no debe disparar
    // "confirmation" solo por mencionar un mes.
    expect(detectResponseType('We hebben pas plek in januari.', 'nl')).toBe('neutral');
    expect(detectResponseType('Ja, dat past ons goed.', 'nl')).toBe('confirmation');
  });
});
