// Archivo separado de agentEngine.test.ts a propósito: el interruptor global
// (ENVIO_REAL_HABILITADO_GLOBALMENTE en agentEngine.ts) se calcula UNA vez, al cargar el módulo,
// a partir de process.env.AGENT_EMAIL_MODE. Los `import` estáticos se izan (hoisting) por encima
// de cualquier otra línea del archivo, así que fijar la variable de entorno antes de un import
// estático normal no sirve de nada - de ahí el import() dinámico dentro de beforeAll, que sí se
// ejecuta en el orden real del código, después de haber puesto AGENT_EMAIL_MODE=send.

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

const dbGetAutonomyConfigMock = vi.fn();
vi.mock('../../db.js', () => ({
  getSupabase: vi.fn(),
  dbGetAutonomyConfig: (...args: any[]) => dbGetAutonomyConfigMock(...args)
}));

vi.mock('../../state.js', () => ({
  BAKANDEYA_BAND_ID: 'band-bakandeya'
}));

const enviarEmailMock = vi.fn();
const crearBorradorMock = vi.fn();
vi.mock('../emailAgentClient.js', () => ({
  enviarEmail: (...args: any[]) => enviarEmailMock(...args),
  crearBorrador: (...args: any[]) => crearBorradorMock(...args),
  EmailAgentError: class extends Error {
    constructor(message: string, public code: string) {
      super(message);
    }
  }
}));

const crearBorradorGmailApiMock = vi.fn();
const tieneGmailOAuthConectadoMock = vi.fn();
const enviarEmailGmailApiMock = vi.fn();
vi.mock('../gmailApiClient.js', () => ({
  crearBorradorGmailApi: (...args: any[]) => crearBorradorGmailApiMock(...args),
  tieneGmailOAuthConectado: (...args: any[]) => tieneGmailOAuthConectadoMock(...args),
  enviarEmailGmailApi: (...args: any[]) => enviarEmailGmailApiMock(...args),
  comprobarBorradorEnviado: vi.fn()
}));

let runEnviadorAgent: typeof import('../agentEngine').runEnviadorAgent;
let getSupabase: typeof import('../../db.js').getSupabase;

beforeAll(async () => {
  process.env.AGENT_EMAIL_MODE = 'send';
  ({ runEnviadorAgent } = await import('../agentEngine'));
  ({ getSupabase } = await import('../../db.js'));
}, 20_000);

const lead = {
  id: 'lead-1',
  band_id: 'band-test',
  nombre_sala: 'Sala Prueba',
  email_contacto: 'sala@example.com',
  estado: 'aprobado_propuesta',
  pitch_generado: 'Hola, os proponemos un concierto.',
  notas: ''
};

function mockSupabase() {
  const updates: any[] = [];
  const inserts: Array<{ tabla: string; fila: any }> = [];

  vi.mocked(getSupabase).mockReturnValue({
    from: (tabla: string) => ({
      select: () => {
        const queryChain: any = {
          in: () => queryChain,
          eq: () => queryChain,
          not: () => queryChain,
          maybeSingle: () => Promise.resolve({ data: { nombre_banda: 'Banda Test' } }),
          then: (resolve: any) => Promise.resolve({ data: tabla === 'leads' ? [lead] : [], error: null }).then(resolve)
        };
        return queryChain;
      },
      update: (fila: any) => {
        const updateChain: any = {
          eq: () => {
            if (!updates.includes(fila)) updates.push(fila);
            return updateChain;
          },
          then: (resolve: any) => Promise.resolve({ error: null }).then(resolve)
        };
        return updateChain;
      },
      insert: (fila: any) => {
        inserts.push({ tabla, fila });
        return Promise.resolve({ error: null });
      }
    })
  } as any);

  return { updates, inserts };
}

describe('runEnviadorAgent con AGENT_EMAIL_MODE=send (interruptor global habilitado)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('con dispatch_mode por defecto (draft_gmail) sigue creando un borrador, no envía nada', async () => {
    const { updates } = mockSupabase();
    tieneGmailOAuthConectadoMock.mockResolvedValue(false);
    dbGetAutonomyConfigMock.mockResolvedValue({ dispatchMode: 'draft_gmail' });
    crearBorradorMock.mockResolvedValue({ draftPath: '[Gmail]/Borradores' });

    await runEnviadorAgent({ bandId: 'band-test', triggerType: 'test' });

    expect(enviarEmailMock).not.toHaveBeenCalled();
    expect(enviarEmailGmailApiMock).not.toHaveBeenCalled();
    expect(crearBorradorMock).toHaveBeenCalledTimes(1);

    const leadUpdate = updates.find((u) => u.estado);
    expect(leadUpdate.estado).toBe('borrador_creado');
  });

  it('con dispatch_mode=direct_send y sin Gmail OAuth, despacha de verdad por SMTP', async () => {
    const { updates, inserts } = mockSupabase();
    tieneGmailOAuthConectadoMock.mockResolvedValue(false);
    dbGetAutonomyConfigMock.mockResolvedValue({ dispatchMode: 'direct_send', dispatchLevel: 'first_contact_autonomous' });
    enviarEmailMock.mockResolvedValue({ messageId: 'smtp-1' });

    const result = await runEnviadorAgent({ bandId: 'band-test', triggerType: 'test' });

    expect(enviarEmailMock).toHaveBeenCalledTimes(1);
    expect(enviarEmailGmailApiMock).not.toHaveBeenCalled();
    expect(crearBorradorMock).not.toHaveBeenCalled();
    expect(crearBorradorGmailApiMock).not.toHaveBeenCalled();

    const leadUpdate = updates.find((u) => u.estado);
    expect(leadUpdate.estado).toBe('contactado');
    expect(leadUpdate.fecha_envio).toBeTruthy();
    expect(leadUpdate.gmail_draft_id).toBeNull();
    expect(inserts.filter((i) => i.tabla === 'lead_messages')).toHaveLength(1);
    expect(result.message).toContain('despachada');
  });

  it('con dispatch_mode=direct_send y Gmail OAuth conectado, despacha de verdad por la API de Gmail en vez de SMTP', async () => {
    const { updates } = mockSupabase();
    tieneGmailOAuthConectadoMock.mockResolvedValue(true);
    dbGetAutonomyConfigMock.mockResolvedValue({ dispatchMode: 'direct_send', dispatchLevel: 'first_contact_autonomous' });
    enviarEmailGmailApiMock.mockResolvedValue({ messageId: 'gmail-msg-1' });

    await runEnviadorAgent({ bandId: 'band-test', triggerType: 'test' });

    expect(enviarEmailGmailApiMock).toHaveBeenCalledTimes(1);
    expect(enviarEmailMock).not.toHaveBeenCalled();

    const leadUpdate = updates.find((u) => u.estado);
    expect(leadUpdate.estado).toBe('contactado');
  });
});
