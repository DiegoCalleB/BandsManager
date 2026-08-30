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

vi.mock('../../db.js', () => ({
  dbGetLeads: vi.fn(),
  dbUpsertLead: vi.fn(),
  dbLeadMessageExists: vi.fn(),
  dbCreateLeadMessage: vi.fn()
}));

import { runLectorAgent } from '../lectorAgent';

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
