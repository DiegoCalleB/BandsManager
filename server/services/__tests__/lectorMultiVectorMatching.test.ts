import { describe, it, expect, vi } from 'vitest';
import { findMatchingLeadForIncomingMessage, patronIlikeMessageId } from '../lectorAgent.js';

// Mock Supabase to avoid real network calls during unit testing
vi.mock('../../db.js', () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null })
          }),
          ilike: () => ({
            limit: () => ({
              maybeSingle: async () => ({ data: null })
            })
          })
        })
      })
    })
  })
}));

describe('findMatchingLeadForIncomingMessage (Multi-Vector Matching Engine)', () => {
  const mockLeads = [
    {
      id: 'lead-baobao-123',
      nombre_sala: 'BaoBao',
      ciudad: 'Madrid',
      email_contacto: 'diego.delacalleb@gmail.com',
      email_secundario: null,
      website: 'https://baobaomadrid.com',
      estado: 'contactado',
      gmail_message_id: 'msg-original-baobao-999',
      gmail_thread_id: 'thread-baobao-888'
    },
    {
      id: 'lead-siroco-456',
      nombre_sala: 'Sala Siroco',
      ciudad: 'Madrid',
      email_contacto: 'programacion@siroco.es',
      email_secundario: null,
      website: 'https://siroco.es',
      estado: 'contactado',
      gmail_message_id: 'msg-siroco-111',
      gmail_thread_id: 'thread-siroco-222'
    }
  ];

  it('Vector 1: empareja por Gmail Thread ID', async () => {
    const msg = {
      uid: 'gmail-123',
      messageId: 'msg-reply-1',
      from: 'otro_email@empresa.com',
      subject: 'Re: Concierto',
      text: '¡Hola! Nos encaja la fecha.',
      date: new Date(),
      threadId: 'thread-baobao-888'
    };

    const res = await findMatchingLeadForIncomingMessage(msg, mockLeads, 'band-test');
    expect(res).not.toBeNull();
    expect(res?.lead.id).toBe('lead-baobao-123');
    expect(res?.matchReason).toContain('Gmail Thread ID');
  });

  it('Vector 2: empareja por RFC In-Reply-To y References', async () => {
    const msg = {
      uid: 'gmail-124',
      messageId: 'msg-reply-2',
      from: 'programador.personal@gmail.com',
      subject: 'Re: Gira',
      text: 'Hola, pasadnos rider.',
      date: new Date(),
      inReplyTo: '<msg-original-baobao-999>',
      references: ['<msg-original-baobao-999>']
    };

    const res = await findMatchingLeadForIncomingMessage(msg, mockLeads, 'band-test');
    expect(res).not.toBeNull();
    expect(res?.lead.id).toBe('lead-baobao-123');
    expect(res?.matchReason).toContain('RFC');
  });

  it('Vector 3: empareja por Email exacto (diego.delacalleb@gmail.com)', async () => {
    const msg = {
      uid: 'gmail-125',
      messageId: 'msg-reply-3',
      from: 'Diego <diego.delacalleb@gmail.com>',
      subject: 'Propuesta de bolo en BaoBao',
      text: '¡Buenas! Nos interesa vuestra propuesta de directo.',
      date: new Date()
    };

    const res = await findMatchingLeadForIncomingMessage(msg, mockLeads, 'band-test');
    expect(res).not.toBeNull();
    expect(res?.lead.id).toBe('lead-baobao-123');
    expect(res?.matchReason).toContain('Email Address Match');
  });

  it('Vector 4: empareja por Dominio corporativo de la sala', async () => {
    const msg = {
      uid: 'gmail-126',
      messageId: 'msg-reply-4',
      from: 'direccion.artistica@siroco.es',
      subject: 'Re: Conciertos otoño',
      text: 'Contad con nosotros.',
      date: new Date()
    };

    const res = await findMatchingLeadForIncomingMessage(msg, mockLeads, 'band-test');
    expect(res).not.toBeNull();
    expect(res?.lead.id).toBe('lead-siroco-456');
    expect(res?.matchReason).toContain('Domain Match');
    // El emparejamiento por dominio es débil: NO enriquece el email del lead (un compañero o un
    // auto-reply acababan como destinatario de los siguientes envíos).
    expect(res?.shouldAutoEnrichEmail).toBeUndefined();
  });

  it('Vector 5: empareja por Asunto con nombre de sala (BaoBao)', async () => {
    const msg = {
      uid: 'gmail-127',
      messageId: 'msg-reply-5',
      from: 'desconocido@produccionesmadrid.es',
      subject: 'Re: Concierto en BaoBao - fechas disponibles',
      text: '¿Qué condiciones pedís?',
      date: new Date()
    };

    const res = await findMatchingLeadForIncomingMessage(msg, mockLeads, 'band-test');
    expect(res).not.toBeNull();
    expect(res?.lead.id).toBe('lead-baobao-123');
    expect(res?.matchReason).toContain('Subject');
  });
});

describe('patronIlikeMessageId (cabeceras de un tercero en un filtro de Supabase)', () => {
  it('construye el patrón para un Message-ID normal', () => {
    expect(patronIlikeMessageId('cab123xyz@mail.gmail.com')).toBe('imap-%cab123xyz@mail.gmail.com%');
  });

  it('escapa los comodines de LIKE y el * de PostgREST', () => {
    expect(patronIlikeMessageId('a%b_c\\d*e@x.com')).toBe('imap-%a\\%b\\_c\\\\d_e@x.com%');
  });

  it('una referencia con comas o paréntesis no puede alterar el filtro (va como valor, no como sintaxis)', () => {
    const malicioso = 'x@y.com),id.neq.(nada';
    expect(patronIlikeMessageId(malicioso)).toBe(`imap-%${malicioso}%`);
  });

  it('descarta referencias vacías o demasiado cortas, que casarían con cualquier id', () => {
    expect(patronIlikeMessageId('')).toBeNull();
    expect(patronIlikeMessageId('abc')).toBeNull();
  });
});

describe('findMatchingLeadForIncomingMessage: sin falsos emparejamientos', () => {
  const lead = (extra: any) => ({ id: 'l', nombre_sala: 'Sala', email_contacto: '', email_secundario: null, website: '', estado: 'contactado', ...extra });
  const msg = (extra: any) => ({ uid: 'u', messageId: 'm', from: 'x@otro.com', subject: 'Hola', text: 'texto', date: new Date(), ...extra });

  it('el email se compara exacto, no por subcadena: aa@x.com NO es a@x.com', async () => {
    const leads = [lead({ id: 'corto', email_contacto: 'a@x.com' }), lead({ id: 'largo', nombre_sala: 'Otra', email_contacto: 'aa@x.com' })];
    const r = await findMatchingLeadForIncomingMessage(msg({ from: 'aa@x.com' }), leads as any, 'b');
    expect(r?.lead.id).toBe('largo');
    // booking.a@x.com contiene a@x.com como subcadena: ya no empareja por email (sí podría por dominio).
    const r2 = await findMatchingLeadForIncomingMessage(msg({ from: 'booking.a@x.com' }), [leads[0]] as any, 'b');
    expect(r2?.matchReason ?? '').not.toContain('Email Address');
  });

  it('una referencia que solo CONTIENE el id del lead no empareja: tiene que ser el mismo Message-ID', async () => {
    const leads = [lead({ id: 'a', gmail_message_id: 'abc123xyz' })];
    const r = await findMatchingLeadForIncomingMessage(msg({ inReplyTo: '<zzabc123xyzzz@mail.gmail.com>' }), leads as any, 'b');
    expect(r).toBeNull();
  });

  it('dominio compartido por dos salas: no es una pista fiable, no empareja por dominio', async () => {
    const leads = [
      lead({ id: 'a', nombre_sala: 'Sala Uno', email_contacto: 'uno@grupo.es' }),
      lead({ id: 'b', nombre_sala: 'Sala Dos', email_contacto: 'dos@grupo.es' }),
    ];
    const r = await findMatchingLeadForIncomingMessage(msg({ from: 'programacion@grupo.es', subject: 'Hola' }), leads as any, 'b');
    expect(r).toBeNull();
  });

  it('asunto: sin "Re:" (un correo nuevo que menciona a la sala) no empareja', async () => {
    const leads = [lead({ id: 'a', nombre_sala: 'Sala Siroco' })];
    const r = await findMatchingLeadForIncomingMessage(msg({ subject: 'Novedades de Sala Siroco este mes' }), leads as any, 'b');
    expect(r).toBeNull();
  });

  it('asunto: un lead que aún no se ha contactado no puede estar respondiendo', async () => {
    const leads = [lead({ id: 'a', nombre_sala: 'Sala Siroco', estado: 'nuevo' })];
    const r = await findMatchingLeadForIncomingMessage(msg({ subject: 'Re: Sala Siroco' }), leads as any, 'b');
    expect(r).toBeNull();
  });

  it('asunto: dos salas candidatas es ambiguo, no se elige una al azar', async () => {
    const leads = [lead({ id: 'a', nombre_sala: 'Sala Rock' }), lead({ id: 'b', nombre_sala: 'Rock Club' })];
    const r = await findMatchingLeadForIncomingMessage(msg({ subject: 'Re: concierto en Sala Rock y Rock Club' }), leads as any, 'b');
    expect(r).toBeNull();
  });

  it('asunto: un candidato único, con Re: y en conversación, sí empareja', async () => {
    const leads = [lead({ id: 'a', nombre_sala: 'Sala Siroco', estado: 'esperando_respuesta' })];
    const r = await findMatchingLeadForIncomingMessage(msg({ subject: 'RE: Propuesta Sala Siroco' }), leads as any, 'b');
    expect(r?.lead.id).toBe('a');
  });
});
