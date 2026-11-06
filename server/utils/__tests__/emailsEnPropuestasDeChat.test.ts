import { describe, it, expect } from 'vitest';
import { quitarEmailsNoEscritosPorElUsuario, textoEscritoPorElUsuario } from '../emailsEnPropuestasDeChat';

const actualizar = (email: string) => ({ type: 'propose_update_lead', leadId: 'l1', leadName: 'Sala Uno', description: 'Añadir su email', updatedFields: { email_contacto: email, notas: 'ok' } });
const nueva = (email: string) => ({ type: 'propose_new_lead', leadName: 'Sala Dos', lead: { nombre_sala: 'Sala Dos', ciudad: 'Madrid', tipo: 'sala', email_contacto: email, telefono: '600000000' } });

describe('quitarEmailsNoEscritosPorElUsuario', () => {
  it('conserva el email que el usuario ha escrito en la conversación', () => {
    const r = quitarEmailsNoEscritosPorElUsuario([actualizar('Booking@Sala-Uno.es')], 'apunta que su email es booking@sala-uno.es');
    expect(r.quitados).toBe(0);
    expect(r.acciones[0]).toMatchObject({ updatedFields: { email_contacto: 'Booking@Sala-Uno.es' } });
  });

  it('quita el email que la IA se ha inventado, en una modificación y en una sala nueva', () => {
    const r = quitarEmailsNoEscritosPorElUsuario([actualizar('info@sala-uno.es'), nueva('info@sala-dos.es')], 'añade la sala Dos y actualiza la Uno');
    expect(r.quitados).toBe(2);
    expect((r.acciones[0] as { updatedFields: object }).updatedFields).toEqual({ notas: 'ok' });
    expect((r.acciones[1] as { lead: object }).lead).toEqual({ nombre_sala: 'Sala Dos', ciudad: 'Madrid', tipo: 'sala', telefono: '600000000' });
  });

  it('no toca el resto de la propuesta ni modifica la original', () => {
    const original = [actualizar('info@sala-uno.es')];
    const r = quitarEmailsNoEscritosPorElUsuario(original, '');
    expect(r.acciones[0]).toMatchObject({ type: 'propose_update_lead', leadId: 'l1', description: 'Añadir su email' });
    expect(original[0].updatedFields.email_contacto).toBe('info@sala-uno.es');
  });

  it('no deja pasar un email que solo se parece a uno escrito por el usuario', () => {
    const r = quitarEmailsNoEscritosPorElUsuario([actualizar('info@sala-uno.es')], 'escribió a noinfo@sala-uno.es');
    expect(r.quitados).toBe(1);
  });

  it('las acciones sin emails pasan intactas', () => {
    const accion = { type: 'propose_agent_trigger', agentName: 'Scout', params: { ciudad: 'Sevilla' } };
    expect(quitarEmailsNoEscritosPorElUsuario([accion], '')).toEqual({ acciones: [accion], quitados: 0 });
  });
});

describe('textoEscritoPorElUsuario', () => {
  it('junta el mensaje y los turnos del usuario, y no los de la IA', () => {
    const historial = [
      { role: 'user', parts: [{ text: 'su email es a@sala-uno.es' }] },
      { role: 'model', parts: [{ text: 'quizá sea b@sala-uno.es' }] },
      { role: 'user', text: 'y también c@sala-uno.es' },
    ];
    const texto = textoEscritoPorElUsuario('apunta d@sala-uno.es', historial);
    expect(texto).toContain('a@sala-uno.es');
    expect(texto).toContain('c@sala-uno.es');
    expect(texto).toContain('d@sala-uno.es');
    expect(texto).not.toContain('b@sala-uno.es');
  });

  it('aguanta un historial ausente o con formas raras', () => {
    expect(textoEscritoPorElUsuario('hola', undefined)).toBe('hola');
    expect(textoEscritoPorElUsuario('hola', [null, 3, 'x'])).toContain('hola');
  });
});
