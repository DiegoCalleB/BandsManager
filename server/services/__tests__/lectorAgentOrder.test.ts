import { describe, it, expect, vi, beforeEach } from 'vitest';

// Bug real de producción que este test fija: comprobarBorradoresGmailEnviados solo necesita el
// scope gmail.compose (el que ya tenía cualquier banda conectada antes de añadir gmail.modify),
// mientras que leerRespuestasGmailApi necesita el scope nuevo. Si una banda todavía no ha
// reconectado Gmail, leerRespuestasGmailApi falla con 403 - y si esa llamada va ANTES en el
// código, la excepción corta la función entera antes de llegar a comprobar los borradores
// enviados, dejando esa detección completamente sin ejecutarse. Deben ser independientes.

const tieneGmailOAuthConectadoMock = vi.fn();
const leerRespuestasGmailApiMock = vi.fn();
const marcarComoLeidoGmailApiMock = vi.fn();
vi.mock('../gmailApiClient.js', () => ({
  tieneGmailOAuthConectado: (...args: any[]) => tieneGmailOAuthConectadoMock(...args),
  leerRespuestasGmailApi: (...args: any[]) => leerRespuestasGmailApiMock(...args),
  marcarComoLeidoGmailApi: (...args: any[]) => marcarComoLeidoGmailApiMock(...args)
}));

const comprobarBorradoresGmailEnviadosMock = vi.fn();
vi.mock('../agentEngine.js', () => ({
  comprobarBorradoresGmailEnviados: (...args: any[]) => comprobarBorradoresGmailEnviadosMock(...args)
}));

vi.mock('../emailAgentClient.js', () => ({
  leerRespuestasEntrantes: vi.fn(),
  marcarComoLeido: vi.fn()
}));

const dbGetLeadsMock = vi.fn();
const dbUpsertLeadMock = vi.fn();
const dbLeadMessageExistsMock = vi.fn();
const dbCreateLeadMessageMock = vi.fn();
const dbGetLeadMessagesMock = vi.fn();
const dbGetAutonomyConfigMock = vi.fn().mockResolvedValue(null);
const getSupabaseMock = vi.fn();
vi.mock('../../db.js', () => ({
  dbGetLeads: (...args: any[]) => dbGetLeadsMock(...args),
  dbUpsertLead: (...args: any[]) => dbUpsertLeadMock(...args),
  dbLeadMessageExists: (...args: any[]) => dbLeadMessageExistsMock(...args),
  dbCreateLeadMessage: (...args: any[]) => dbCreateLeadMessageMock(...args),
  dbGetLeadMessages: (...args: any[]) => dbGetLeadMessagesMock(...args),
  dbGetAutonomyConfig: (...args: any[]) => dbGetAutonomyConfigMock(...args),
  getSupabase: (...args: any[]) => getSupabaseMock(...args)
}));

const generarBorradorRespuestaMock = vi.fn();
vi.mock('../replyDrafting.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../replyDrafting.js')>();
  return {
    ...actual,
    generarBorradorRespuesta: (...args: any[]) => generarBorradorRespuestaMock(...args)
  };
});

vi.mock('../sentimentAnalysis.js', () => ({
  analyzeIncomingMessageSentiment: vi.fn().mockResolvedValue({
    sentimiento: 'positivo',
    sentimiento_score: 0.8,
    sentimiento_label: 'Interesado',
    intencion: 'proponer_fechas',
    intencion_etiqueta: 'Pide fechas disponibles',
    temperatura: 'caliente',
    fechas_mencionadas: [],
    resumen_ejecutivo: 'Interesado en propuesta'
  })
}));

import { runLectorAgent, puedeGenerarBorradorIA } from '../lectorAgent';

describe('runLectorAgent: comprobarBorradoresGmailEnviados no depende de que leerRespuestasGmailApi funcione', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('comprueba los borradores enviados aunque leer la bandeja falle por falta de scope (403)', async () => {
    tieneGmailOAuthConectadoMock.mockResolvedValue(true);
    comprobarBorradoresGmailEnviadosMock.mockResolvedValue({ revisados: 1, confirmadosEnviados: ['lead-1'] });
    leerRespuestasGmailApiMock.mockRejectedValue(new Error('Request had insufficient authentication scopes.'));

    await expect(runLectorAgent('band-test')).rejects.toThrow('insufficient authentication scopes');

    // Lo importante: se llamó y completó ANTES del fallo, no que el resultado final lo recoja
    // (la función entera propaga el error de lectura, como antes).
    expect(comprobarBorradoresGmailEnviadosMock).toHaveBeenCalledTimes(1);
    expect(comprobarBorradoresGmailEnviadosMock).toHaveBeenCalledWith('band-test');
  });

  it('con Gmail OAuth conectado y ambas llamadas OK, procesa borradores enviados y mensajes en el mismo run', async () => {
    tieneGmailOAuthConectadoMock.mockResolvedValue(true);
    comprobarBorradoresGmailEnviadosMock.mockResolvedValue({ revisados: 1, confirmadosEnviados: ['lead-1'] });
    leerRespuestasGmailApiMock.mockResolvedValue([]);

    const result = await runLectorAgent('band-test');

    expect(result.borradoresEnviadosDetectados).toBe(1);
    expect(result.leadsActualizados).toContain('lead-1');
  });
});

// Antes de este cambio, el Contestador automático era invisible para un mánager: un fallo de la
// IA solo dejaba un console.warn, y el tope de puedeGenerarBorradorIA ni eso - runLectorAgent
// devuelve ahora borradorIaGenerados/borradorIaFallidos/borradorIaBloqueadosPorLimite, que
// agentScheduler.ts vuelca en agent_execution_logs (Auditoría & Trazabilidad).
describe('runLectorAgent: visibilidad de la actividad del Contestador automático', () => {
  const leadBase = {
    id: 'lead-1',
    email_contacto: 'sala@example.com',
    estado: 'contactado',
    nombre_sala: 'Sala Test',
    tipo: 'sala'
  };
  const mensajeEntrante = {
    from: 'sala@example.com',
    subject: 'Re: propuesta',
    text: 'Gracias por vuestro mensaje, lo revisamos.',
    date: new Date(),
    messageId: 'msg-1',
    uid: 1
  };

  beforeEach(() => {
    vi.clearAllMocks();
    tieneGmailOAuthConectadoMock.mockResolvedValue(true);
    comprobarBorradoresGmailEnviadosMock.mockResolvedValue({ revisados: 0, confirmadosEnviados: [] });
    dbGetLeadsMock.mockResolvedValue([leadBase]);
    dbLeadMessageExistsMock.mockResolvedValue(false);
    dbCreateLeadMessageMock.mockResolvedValue(undefined);
    dbGetLeadMessagesMock.mockResolvedValue([]);
    dbUpsertLeadMock.mockResolvedValue(undefined);
    marcarComoLeidoGmailApiMock.mockResolvedValue(undefined);
    getSupabaseMock.mockReturnValue({
      from: () => ({ update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) })
    });
  });

  it('cuenta un borrador generado con éxito', async () => {
    leerRespuestasGmailApiMock.mockResolvedValue([mensajeEntrante]);
    generarBorradorRespuestaMock.mockResolvedValue({ draftReply: 'Hola, gracias por escribir.', isSimulated: false });

    const result = await runLectorAgent(`band-generado-${Date.now()}`);

    expect(result.borradorIaGenerados).toBe(1);
    expect(result.borradorIaFallidos).toBe(0);
    expect(result.borradorIaBloqueadosPorLimite).toBe(0);
  });

  it('cuenta un fallo cuando generarBorradorRespuesta lanza una excepción', async () => {
    leerRespuestasGmailApiMock.mockResolvedValue([mensajeEntrante]);
    generarBorradorRespuestaMock.mockRejectedValue(new Error('IA no disponible'));

    const result = await runLectorAgent(`band-fallo-${Date.now()}`);

    expect(result.borradorIaGenerados).toBe(0);
    expect(result.borradorIaFallidos).toBe(1);
    expect(result.borradorIaBloqueadosPorLimite).toBe(0);
  });

  it('cuenta un bloqueo cuando se alcanza el tope de puedeGenerarBorradorIA', async () => {
    leerRespuestasGmailApiMock.mockResolvedValue([mensajeEntrante]);
    generarBorradorRespuestaMock.mockResolvedValue({ draftReply: 'no debería llamarse', isSimulated: false });

    const bandId = `band-tope-${Date.now()}`;
    for (let i = 0; i < 20; i++) puedeGenerarBorradorIA(bandId); // agota el cupo de esta banda

    const result = await runLectorAgent(bandId);

    expect(result.borradorIaGenerados).toBe(0);
    expect(result.borradorIaFallidos).toBe(0);
    expect(result.borradorIaBloqueadosPorLimite).toBe(1);
    expect(generarBorradorRespuestaMock).not.toHaveBeenCalled();
  });
});
