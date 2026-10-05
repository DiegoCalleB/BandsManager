import { describe, it, expect, vi } from 'vitest';
import { findMatchingLeadForIncomingMessage } from '../lectorAgent.js';

// Mock Supabase to avoid real network calls during unit testing
vi.mock('../../db.js', () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null })
          }),
          or: () => ({
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
    expect(res?.shouldAutoEnrichEmail).toBe('direccion.artistica@siroco.es');
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
