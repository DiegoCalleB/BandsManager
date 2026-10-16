import { describe, it, expect, vi, beforeEach } from 'vitest';

// El Lector no debe clasificar con IA ni cambiar el estado por autoresponders/newsletters, y debe
// clasificar solo el texto PROPIO de la sala (no el pitch nuestro que viaja citado en la respuesta).

const leerRespuestasGmailApiMock = vi.fn();
const avanzarCursorMock = vi.fn();
vi.mock('../gmailApiClient.js', () => ({
  tieneGmailOAuthConectado: async () => true,
  leerBandejaGmailIncremental: async (...a: any[]) => ({ mensajes: await leerRespuestasGmailApiMock(...a), modo: 'completa', avanzarCursor: avanzarCursorMock }),
  marcarComoLeidoGmailApi: vi.fn()
}));
vi.mock('../agentEngine.js', () => ({
  comprobarBorradoresGmailEnviados: async () => ({ revisados: 0, confirmadosEnviados: [], todaviaComoBorrador: [], errores: [], cuentaGmailReal: null })
}));
vi.mock('../emailAgentClient.js', () => ({ leerRespuestasEntrantes: vi.fn(), marcarComoLeido: vi.fn() }));

const dbUpsertLeadMock = vi.fn();
const dbCreateLeadMessageMock = vi.fn();
const lead = { id: 'lead-1', band_id: 'band-test', nombre_sala: 'Sala Caracol', email_contacto: 'booking@caracol.es', estado: 'contactado' };
vi.mock('../../db.js', () => ({
  dbGetLeads: async () => [lead],
  dbUpsertLead: (...a: any[]) => dbUpsertLeadMock(...a),
  dbLeadMessageExists: async () => false,
  dbCreateLeadMessage: (...a: any[]) => dbCreateLeadMessageMock(...a),
  dbGetLeadMessages: async () => [],
  dbGetAutonomyConfig: async () => null,
  getSupabase: () => ({
    from: () => {
      const c: any = { select: () => c, eq: () => c, ilike: () => c, limit: () => c, maybeSingle: async () => ({ data: null }), update: () => c, then: (r: any) => Promise.resolve({ error: null }).then(r) };
      return c;
    }
  })
}));

const generarBorradorRespuestaMock = vi.fn();
vi.mock('../replyDrafting.js', async (orig) => ({ ...(await orig<any>()), generarBorradorRespuesta: (...a: any[]) => generarBorradorRespuestaMock(...a) }));

const analizarMock = vi.fn();
vi.mock('../sentimentAnalysis.js', () => ({ analyzeIncomingMessageSentiment: (...a: any[]) => analizarMock(...a) }));

import { runLectorAgent } from '../lectorAgent';

const analisis = { sentimiento: 'positivo', sentimiento_score: 0.8, sentimiento_label: 'Interesado', intencion: 'proponer_fechas', intencion_etiqueta: 'x', temperatura: 'caliente', objeciones_detectadas: [], puntos_clave: [], fechas_propuestas: [], requisitos_tecnicos: [], resumen_ejecutivo: 'ok' };
const msg = (extra: any = {}) => ({ uid: 'm1', messageId: '<m1@caracol.es>', from: 'booking@caracol.es', subject: 'Re: Propuesta', text: 'Nos encaja.', date: new Date('2026-10-12T10:00:00Z'), ...extra });

beforeEach(() => {
  vi.clearAllMocks();
  analizarMock.mockResolvedValue(analisis);
  generarBorradorRespuestaMock.mockResolvedValue({ draftReply: 'borrador' });
});

describe('Lector: filtro previo', () => {
  it('un autoresponder no se clasifica, no se registra y no cambia el estado ni gasta IA', async () => {
    leerRespuestasGmailApiMock.mockResolvedValue([msg({ subject: 'Respuesta automática: fuera de la oficina', automatico: true })]);
    const r = await runLectorAgent('band-test');
    expect(analizarMock).not.toHaveBeenCalled();
    expect(generarBorradorRespuestaMock).not.toHaveBeenCalled();
    expect(dbCreateLeadMessageMock).not.toHaveBeenCalled();
    expect(dbUpsertLeadMock).not.toHaveBeenCalled();
    expect(r.automaticosIgnorados).toBe(1);
    expect(r.leadsActualizados).toEqual([]);
  });

  it('clasifica y redacta sobre el texto propio de la sala, sin el pitch citado', async () => {
    const cita = 'Nos encaja el 5 de abril.\n\nEl lun, 12 oct 2026 a las 10:15, Banda <b@x.es> escribió:\n> hola, os proponemos un concierto, caché y taquilla';
    leerRespuestasGmailApiMock.mockResolvedValue([msg({ text: cita })]);
    await runLectorAgent('band-test');
    expect(analizarMock.mock.calls[0][0]).toBe('Nos encaja el 5 de abril.');
    expect(generarBorradorRespuestaMock.mock.calls[0][2]).toBe('Nos encaja el 5 de abril.');
  });

  it('en lead_messages se guarda el mensaje completo, tal como llegó', async () => {
    const cita = 'Nos encaja.\n\nEl lun, 12 oct 2026 a las 10:15, Banda <b@x.es> escribió:\n> pitch original';
    leerRespuestasGmailApiMock.mockResolvedValue([msg({ text: cita })]);
    await runLectorAgent('band-test');
    expect(dbCreateLeadMessageMock.mock.calls[0][0].mensaje).toBe(cita);
  });
});

describe('Lector: un rechazo confirmado no se pisa con la cola de aprobación', () => {
  const rechazoIA = { ...analisis, sentimiento: 'rechazo', intencion: 'rechazo_estilo', confianza: 0.9, motor: 'gemini_flash' };

  it('rechazo (palabras clave + IA): estado no_interesado y NO se redacta réplica', async () => {
    analizarMock.mockResolvedValue(rechazoIA);
    leerRespuestasGmailApiMock.mockResolvedValue([msg({ text: 'Lo sentimos, no nos interesa vuestra propuesta.' })]);
    await runLectorAgent('band-test');
    expect(generarBorradorRespuestaMock).not.toHaveBeenCalled();
    expect(dbUpsertLeadMock.mock.calls[0][0].estado).toBe('no_interesado');
  });

  it('respuesta normal: sigue generando el borrador y pasa a pendiente_aprobacion', async () => {
    leerRespuestasGmailApiMock.mockResolvedValue([msg({ text: 'Nos encaja, ¿qué caché pedís?' })]);
    await runLectorAgent('band-test');
    expect(generarBorradorRespuestaMock).toHaveBeenCalledTimes(1);
    expect(dbUpsertLeadMock.mock.calls[0][0].estado).toBe('pendiente_aprobacion');
  });
});

describe('Lector: cursor de la bandeja', () => {
  it('avanza el cursor al terminar de procesar, también cuando no había nada nuevo', async () => {
    leerRespuestasGmailApiMock.mockResolvedValue([]);
    await runLectorAgent('band-test');
    expect(avanzarCursorMock).toHaveBeenCalledTimes(1);

    avanzarCursorMock.mockClear();
    leerRespuestasGmailApiMock.mockResolvedValue([msg({ text: 'Nos encaja.' })]);
    await runLectorAgent('band-test');
    expect(avanzarCursorMock).toHaveBeenCalledTimes(1);
  });

  it('si procesar falla a medias, el cursor NO avanza (la siguiente lectura repite, sin perder nada)', async () => {
    leerRespuestasGmailApiMock.mockResolvedValue([msg({ text: 'Nos encaja.' })]);
    dbUpsertLeadMock.mockRejectedValueOnce(new Error('Supabase caído'));
    await expect(runLectorAgent('band-test')).rejects.toThrow('Supabase caído');
    expect(avanzarCursorMock).not.toHaveBeenCalled();
  });
});
