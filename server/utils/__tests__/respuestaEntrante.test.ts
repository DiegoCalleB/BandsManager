import { describe, it, expect } from 'vitest';
import { quitarTextoCitado, esRespuestaAutomatica, textoDesdeHtml } from '../respuestaEntrante';

describe('quitarTextoCitado', () => {
  it('quita la cita de Gmail en español ("El ... escribió:") y todo lo que sigue', () => {
    const t = 'Nos encaja el 5 de abril.\n\nEl lun, 12 oct 2026 a las 10:15, Banda <b@x.es> escribió:\n> hola, os proponemos un concierto\n> caché y taquilla';
    expect(quitarTextoCitado(t)).toBe('Nos encaja el 5 de abril.');
  });

  it('quita la cita en inglés, francés e italiano', () => {
    expect(quitarTextoCitado('Sounds good.\n\nOn Mon, Oct 12, 2026 at 10:15 AM Band <b@x.com> wrote:\n> hi')).toBe('Sounds good.');
    expect(quitarTextoCitado('Parfait.\n\nLe 12 oct. 2026 à 10:15, Band <b@x.fr> a écrit :\n> salut')).toBe('Parfait.');
    expect(quitarTextoCitado('Perfetto.\n\nIl giorno lun 12 ott 2026 alle ore 10:15 Band <b@x.it> ha scritto:\n> ciao')).toBe('Perfetto.');
  });

  it('quita el bloque de Outlook ("De: ... Enviado:") y "-----Original Message-----"', () => {
    expect(quitarTextoCitado('Vale.\n\nDe: Banda <b@x.es>\nEnviado: lunes, 12 de octubre de 2026 10:15\nPara: Sala\nAsunto: Propuesta\n\ntexto original')).toBe('Vale.');
    expect(quitarTextoCitado('OK.\n\n-----Original Message-----\nFrom: x')).toBe('OK.');
  });

  it('quita las líneas citadas con > aunque no haya cabecera de cita', () => {
    expect(quitarTextoCitado('Respuesta corta\n> citado 1\n> citado 2')).toBe('Respuesta corta');
  });

  it('respuesta entreverada: conserva las líneas propias entre las citadas', () => {
    expect(quitarTextoCitado('> ¿tenéis rider?\nSí, os lo mandamos.\n> ¿y caché?\nHablamos.')).toBe('Sí, os lo mandamos.\nHablamos.');
  });

  it('un mensaje sin cita queda igual', () => {
    expect(quitarTextoCitado('Hola, nos interesa. ¿Qué caché pedís?')).toBe('Hola, nos interesa. ¿Qué caché pedís?');
  });

  it('si TODO es cita no devuelve vacío: conserva el original para no perder el mensaje', () => {
    expect(quitarTextoCitado('> solo cita')).toBe('> solo cita');
  });
});

describe('esRespuestaAutomatica', () => {
  const base = { subject: 'Re: Propuesta', from: 'booking@sala.es', text: 'Nos encaja.' };

  it('un mensaje humano normal no es automático', () => {
    expect(esRespuestaAutomatica(base)).toBe(false);
  });

  it.each([
    ['Auto-Submitted', { autoSubmitted: 'auto-replied' }],
    ['Precedence bulk', { precedence: 'bulk' }],
    ['Precedence auto_reply', { precedence: 'auto_reply' }],
    ['X-Autoreply', { xAutoreply: 'yes' }],
    ['List-Unsubscribe (newsletter)', { listUnsubscribe: '<mailto:baja@sala.es>' }],
  ])('detecta por cabecera: %s', (_n, cab) => {
    expect(esRespuestaAutomatica({ ...base, ...cab })).toBe(true);
  });

  it('Auto-Submitted: no (valor explícito de mensaje humano) no cuenta como automático', () => {
    expect(esRespuestaAutomatica({ ...base, autoSubmitted: 'no' })).toBe(false);
  });

  it.each([
    'Respuesta automática: fuera de la oficina',
    'Automatic reply: Out of office',
    'Out of Office: vuelvo el 20',
    'Réponse automatique : absent',
    'Risposta automatica: fuori sede',
    'Abwesenheitsnotiz',
  ])('detecta por asunto: %s', (subject) => {
    expect(esRespuestaAutomatica({ ...base, subject })).toBe(true);
  });

  it('detecta remitentes de sistema (no-reply, mailer-daemon)', () => {
    expect(esRespuestaAutomatica({ ...base, from: 'no-reply@sala.es' })).toBe(true);
    expect(esRespuestaAutomatica({ ...base, from: 'noreply@sala.es' })).toBe(true);
    expect(esRespuestaAutomatica({ ...base, from: 'mailer-daemon@googlemail.com' })).toBe(true);
  });

  it('una respuesta humana que menciona "oficina" en el cuerpo no se confunde', () => {
    expect(esRespuestaAutomatica({ ...base, text: 'Pasaos por la oficina el martes y lo vemos.' })).toBe(false);
  });
});

describe('textoDesdeHtml', () => {
  it('quita las etiquetas y deja el texto, con los espacios colapsados', () => {
    expect(textoDesdeHtml('<div>Hola,<br>nos <b>encaja</b> el 5.</div>\n<p>Un saludo</p>')).toBe('Hola, nos encaja el 5. Un saludo');
  });

  it('no deja nunca un "<" ni un ">" suelto, aunque la etiqueta esté rota o anidada a propósito', () => {
    for (const hostil of ['<scr<script>ipt>alert(1)</scr</script>ipt>', '<<<<b>>>> texto', 'a > b <i', '<img src=x onerror=alert(1)']) {
      const t = textoDesdeHtml(hostil);
      expect(t).not.toMatch(/[<>]/);
      expect(t.toLowerCase()).not.toContain('<script');
    }
  });

  it('una entrada enorme de "<" sin cerrar se resuelve rápido (recorrido lineal)', () => {
    const t0 = Date.now();
    textoDesdeHtml('<'.repeat(200_000) + 'fin');
    expect(Date.now() - t0).toBeLessThan(500);
  });

  it('lo que no es texto devuelve cadena vacía', () => {
    expect(textoDesdeHtml(undefined)).toBe('');
    expect(textoDesdeHtml(null)).toBe('');
  });
});
