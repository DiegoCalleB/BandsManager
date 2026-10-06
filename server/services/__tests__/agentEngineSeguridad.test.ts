// Regresiones de la auditoría B sobre el Agente Enviador (envío real activado a nivel global).
// Mismo patrón que agentEngineDirectSend.test.ts: AGENT_EMAIL_MODE se lee al cargar el módulo.
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

const dbGetAutonomyConfigMock = vi.fn();
vi.mock('../../db.js', () => ({
  getSupabase: vi.fn(),
  dbGetAutonomyConfig: (...args: any[]) => dbGetAutonomyConfigMock(...args)
}));
vi.mock('../../state.js', () => ({ BAKANDEYA_BAND_ID: 'band-bakandeya' }));

const enviarEmailMock = vi.fn();
const crearBorradorMock = vi.fn();
class EmailAgentErrorFalso extends Error {
  deliveryFailureReason?: string;
  constructor(message: string, public code: string) {
    super(message);
  }
}
vi.mock('../emailAgentClient.js', () => ({
  enviarEmail: (...a: any[]) => enviarEmailMock(...a),
  crearBorrador: (...a: any[]) => crearBorradorMock(...a),
  EmailAgentError: EmailAgentErrorFalso
}));
vi.mock('../gmailApiClient.js', () => ({
  crearBorradorGmailApi: vi.fn(),
  tieneGmailOAuthConectado: async () => false,
  enviarEmailGmailApi: vi.fn(),
  comprobarBorradorEnviado: vi.fn(),
  comprobarBorradorEnviadoConDetalle: vi.fn(),
  buscarMensajeEnviadoA: vi.fn(),
  obtenerEmailDeLaCuentaConectada: vi.fn()
}));

let runEnviadorAgent: typeof import('../agentEngine').runEnviadorAgent;
let getSupabase: typeof import('../../db.js').getSupabase;

beforeAll(async () => {
  process.env.AGENT_EMAIL_MODE = 'send';
  ({ runEnviadorAgent } = await import('../agentEngine'));
  ({ getSupabase } = await import('../../db.js'));
}, 20_000);

const leadBase = {
  id: 'lead-1',
  band_id: 'band-test',
  nombre_sala: 'Sala Prueba',
  email_contacto: 'sala@example.com',
  estado: 'aprobado_propuesta',
  pitch_generado: 'Hola, os proponemos un concierto.',
  notas: ''
};

function montarSupabase(opciones: { leads?: any[]; enviadosHoy?: number; errorAlActualizar?: boolean } = {}) {
  const leads = opciones.leads ?? [leadBase];
  const filtros: Array<[string, any]> = [];
  const updates: Array<{ id?: string; fila: any }> = [];
  vi.mocked(getSupabase).mockReturnValue({
    from: (tabla: string) => ({
      select: (_cols?: string, op?: any) => {
        const cadena: any = {
          in: (c: string, v: any) => (filtros.push([`in:${c}`, v]), cadena),
          eq: (c: string, v: any) => (filtros.push([`eq:${c}`, v]), cadena),
          gte: () => cadena,
          not: () => cadena,
          maybeSingle: () => Promise.resolve({ data: { nombre_banda: 'Banda Test' } }),
          then: (resolve: any) =>
            Promise.resolve(
              op?.head
                ? { count: opciones.enviadosHoy ?? 0, error: null }
                : { data: tabla === 'leads' ? leads : [], error: null }
            ).then(resolve)
        };
        return cadena;
      },
      update: (fila: any) => {
        const cadena: any = {
          eq: (c: string, v: any) => {
            if (c === 'id') updates.push({ id: v, fila });
            return cadena;
          },
          then: (resolve: any) =>
            Promise.resolve({ error: opciones.errorAlActualizar ? { message: 'boom' } : null }).then(resolve)
        };
        return cadena;
      },
      insert: () => Promise.resolve({ error: null })
    })
  } as any);
  return { filtros, updates };
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.AGENT_DAILY_SEND_CAP;
  dbGetAutonomyConfigMock.mockResolvedValue({ dispatchMode: 'direct_send', dispatchLevel: 'first_contact_autonomous' });
  enviarEmailMock.mockResolvedValue({ messageId: 'msg-1' });
  crearBorradorMock.mockResolvedValue({ draftPath: '[Gmail]/Borradores' });
});

describe('Enviador: alcance de la consulta', () => {
  it('con leadId sigue acotado a la banda y a los estados de envío (no despacha leads ajenos)', async () => {
    const { filtros } = montarSupabase();
    await runEnviadorAgent({ bandId: 'band-test', triggerType: 'test', leadId: 'lead-de-otra-banda' });
    const claves = filtros.map(([k, v]) => `${k}=${JSON.stringify(v)}`);
    expect(claves).toContain('eq:band_id="band-test"');
    expect(claves).toContain('eq:id="lead-de-otra-banda"');
    expect(claves.some((c) => c.startsWith('in:estado='))).toBe(true);
  });
});

describe('Enviador: nivel de autonomía', () => {
  it('direct_send con dispatchLevel draft_only NO envía: crea borrador', async () => {
    montarSupabase();
    dbGetAutonomyConfigMock.mockResolvedValue({ dispatchMode: 'direct_send', dispatchLevel: 'draft_only' });
    const r = await runEnviadorAgent({ bandId: 'band-test', triggerType: 'test' });
    expect(enviarEmailMock).not.toHaveBeenCalled();
    expect(crearBorradorMock).toHaveBeenCalledTimes(1);
    expect(r.results[0].status).toBe('borrador');
  });
});

describe('Enviador: destinatarios', () => {
  it('envía al contacto principal y al secundario, sin duplicar', async () => {
    montarSupabase({ leads: [{ ...leadBase, email_secundario: 'booking@example.com, SALA@example.com' }] });
    await runEnviadorAgent({ bandId: 'band-test', triggerType: 'test' });
    expect(enviarEmailMock.mock.calls[0][1].to).toBe('sala@example.com, booking@example.com');
  });
});

describe('Enviador: sin envíos duplicados ni descontrolados', () => {
  it('dos ejecuciones a la vez sobre el mismo lead envían UN solo correo', async () => {
    montarSupabase();
    enviarEmailMock.mockImplementation(() => new Promise((r) => setTimeout(() => r({ messageId: 'm' }), 30)));
    const [a, b] = await Promise.all([
      runEnviadorAgent({ bandId: 'band-test', triggerType: 'planificador' }),
      runEnviadorAgent({ bandId: 'band-test', triggerType: 'manual' })
    ]);
    expect(enviarEmailMock).toHaveBeenCalledTimes(1);
    const estados = [...a.results, ...b.results].map((r) => r.status).sort();
    expect(estados).toEqual(['enviado', 'omitido']);
  });

  it('respeta el tope diario de envíos reales', async () => {
    process.env.AGENT_DAILY_SEND_CAP = '2';
    montarSupabase({ enviadosHoy: 2 });
    const r = await runEnviadorAgent({ bandId: 'band-test', triggerType: 'test' });
    expect(enviarEmailMock).not.toHaveBeenCalled();
    expect(r.results[0].status).toBe('omitido');
    expect(r.results[0].error).toMatch(/tope diario/);
  });

  it('no reintenta un email que ya rebotó', async () => {
    montarSupabase({ leads: [{ ...leadBase, notas: '[Email Rechazado] Usuario no existe en sala@example.com - no reintentar\n' }] });
    const r = await runEnviadorAgent({ bandId: 'band-test', triggerType: 'test' });
    expect(enviarEmailMock).not.toHaveBeenCalled();
    expect(r.results[0].status).toBe('omitido');
  });
});

describe('Enviador: fallos al guardar', () => {
  it('si el correo salió pero no se pudo guardar el estado, lo dice claramente (no queda como éxito)', async () => {
    montarSupabase({ errorAlActualizar: true });
    const r = await runEnviadorAgent({ bandId: 'band-test', triggerType: 'test' });
    expect(enviarEmailMock).toHaveBeenCalledTimes(1);
    expect(r.results[0].status).toBe('error');
    expect(r.results[0].error).toMatch(/SÍ se envió/);
  });

  it('en modo borrador, si no se puede guardar el estado avisa de que el borrador ya existe', async () => {
    dbGetAutonomyConfigMock.mockResolvedValue({ dispatchMode: 'draft_gmail', dispatchLevel: 'draft_only' });
    montarSupabase({ errorAlActualizar: true });
    const r = await runEnviadorAgent({ bandId: 'band-test', triggerType: 'test' });
    expect(r.results[0].status).toBe('error');
    expect(r.results[0].error).toMatch(/Borrador creado/);
  });

  it('un rebote antepone la nota (no borra las anteriores) y saca al lead de la cola', async () => {
    const { updates } = montarSupabase({ leads: [{ ...leadBase, notas: 'Nota importante previa' }] });
    const fallo: any = new EmailAgentErrorFalso('rechazado', 'smtp');
    fallo.deliveryFailureReason = 'invalid_recipient';
    enviarEmailMock.mockRejectedValue(fallo);
    await runEnviadorAgent({ bandId: 'band-test', triggerType: 'test' });
    const u = updates.find((x) => x.fila.notas?.includes('[Email Rechazado]'));
    expect(u).toBeDefined();
    expect(u!.fila.notas).toContain('Nota importante previa');
    expect(u!.fila.estado).toBe('nuevo');
  });
});
