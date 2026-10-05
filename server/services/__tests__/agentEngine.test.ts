import { describe, it, expect, vi, beforeEach } from 'vitest';

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
const comprobarBorradorEnviadoConDetalleMock = vi.fn();
vi.mock('../gmailApiClient.js', () => ({
  crearBorradorGmailApi: (...args: any[]) => crearBorradorGmailApiMock(...args),
  tieneGmailOAuthConectado: (...args: any[]) => tieneGmailOAuthConectadoMock(...args),
  enviarEmailGmailApi: (...args: any[]) => enviarEmailGmailApiMock(...args),
  comprobarBorradorEnviadoConDetalle: (...args: any[]) => comprobarBorradorEnviadoConDetalleMock(...args),
  obtenerEmailDeLaCuentaConectada: vi.fn().mockResolvedValue(null)
}));

import { getSupabase } from '../../db.js';
import { runEnviadorAgent, comprobarBorradoresGmailEnviados } from '../agentEngine';

const lead = {
  id: 'lead-1',
  band_id: 'band-test',
  nombre_sala: 'Sala Prueba',
  email_contacto: 'sala@example.com',
  estado: 'aprobado_propuesta',
  pitch_generado: 'Hola, os proponemos un concierto.',
  notas: ''
};

// Registra cada operación contra Supabase para poder afirmar qué se escribió y qué NO.
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

describe('runEnviadorAgent en modo borrador (AGENT_EMAIL_MODE por defecto)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crea un borrador por IMAP cuando la banda no tiene Gmail OAuth conectado, no envía, y no marca el lead como contactado', async () => {
    const { updates, inserts } = mockSupabase();
    tieneGmailOAuthConectadoMock.mockResolvedValue(false);
    crearBorradorMock.mockResolvedValue({ draftPath: '[Gmail]/Borradores' });

    const result = await runEnviadorAgent({ bandId: 'band-test', triggerType: 'test' });

    // No ha salido ningún email.
    expect(enviarEmailMock).not.toHaveBeenCalled();
    expect(crearBorradorMock).toHaveBeenCalledTimes(1);
    expect(crearBorradorGmailApiMock).not.toHaveBeenCalled();

    // El lead cambia de estado (si no, el scheduler duplicaría el borrador cada pasada)
    // pero NUNCA a 'contactado': nadie ha contactado con nadie todavía.
    const leadUpdate = updates.find((u) => u.estado);
    expect(leadUpdate.estado).toBe('borrador_creado');
    expect(leadUpdate.estado).not.toBe('contactado');

    // fecha_envio no se toca porque no se ha enviado nada.
    expect(leadUpdate.fecha_envio).toBeUndefined();

    // No se apunta un mensaje en el hilo: no existe tal mensaje enviado.
    expect(inserts.filter((i) => i.tabla === 'lead_messages')).toHaveLength(0);

    // El resumen no debe afirmar que se despachó nada.
    expect(result.message).toContain('borrador');
    expect(result.message).toContain('No se ha enviado ningún email');
  });

  it('crea el borrador por la API de Gmail (OAuth) en vez de IMAP cuando la banda la tiene conectada, y guarda el gmail_draft_id', async () => {
    const { updates } = mockSupabase();
    tieneGmailOAuthConectadoMock.mockResolvedValue(true);
    crearBorradorGmailApiMock.mockResolvedValue({ draftPath: 'Gmail API draft draft-1', draftId: 'draft-1' });

    await runEnviadorAgent({ bandId: 'band-test', triggerType: 'test' });

    expect(enviarEmailMock).not.toHaveBeenCalled();
    expect(crearBorradorGmailApiMock).toHaveBeenCalledTimes(1);
    expect(crearBorradorMock).not.toHaveBeenCalled();

    const leadUpdate = updates.find((u) => u.estado);
    expect(leadUpdate.estado).toBe('borrador_creado');
    expect(leadUpdate.gmail_draft_id).toBe('draft-1');
  });

  it('incluye tanto email_contacto como email_secundario al crear el borrador o enviar propuesta', async () => {
    const leadConEmailSecundario = {
      ...lead,
      email_contacto: 'info@salanazcaconciertos.com',
      email_secundario: 'info@magnetikproducciones.com'
    };
    const { updates } = mockSupabase();
    vi.mocked(getSupabase).mockReturnValue({
      from: (tabla: string) => ({
        select: () => ({
          in: () => ({
            eq: () => Promise.resolve({ data: tabla === 'leads' ? [leadConEmailSecundario] : [], error: null })
          }),
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: { nombre_banda: 'Banda Test' } })
          })
        }),
        update: (fila: any) => ({
          eq: () => {
            updates.push(fila);
            return Promise.resolve({ error: null });
          }
        }),
        insert: () => Promise.resolve({ error: null })
      })
    } as any);

    tieneGmailOAuthConectadoMock.mockResolvedValue(false);
    crearBorradorMock.mockResolvedValue({ draftPath: '[Gmail]/Borradores' });

    await runEnviadorAgent({ bandId: 'band-test', triggerType: 'test' });

    expect(crearBorradorMock).toHaveBeenCalledTimes(1);
    const paramsEnviados = crearBorradorMock.mock.calls[0][1];
    expect(paramsEnviados.to).toBe('info@salanazcaconciertos.com, info@magnetikproducciones.com');
  });
});

describe('comprobarBorradoresGmailEnviados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marca como contactado un lead cuyo borrador de Gmail ya no existe, y deja intactos los que siguen como borrador', async () => {
    const leadConBorradorEnviado = { id: 'lead-1', nombre_sala: 'Sala Uno', notas: '', gmail_draft_id: 'draft-1' };
    const leadTodaviaEnBorrador = { id: 'lead-2', nombre_sala: 'Sala Dos', notas: '', gmail_draft_id: 'draft-2' };
    const updates: any[] = [];
    const inserts: any[] = [];

    vi.mocked(getSupabase).mockReturnValue({
      from: (tabla: string) => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              not: () => Promise.resolve({ data: tabla === 'leads' ? [leadConBorradorEnviado, leadTodaviaEnBorrador] : [], error: null })
            })
          })
        }),
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
          inserts.push(fila);
          return Promise.resolve({ error: null });
        }
      })
    } as any);

    comprobarBorradorEnviadoConDetalleMock.mockImplementation((_bandId: string, draftId: string) =>
      Promise.resolve(draftId === 'draft-1' ? { existe: false, status: 404 } : { existe: true, status: 200 })
    );

    const resultado = await comprobarBorradoresGmailEnviados('band-test');

    expect(resultado.revisados).toBe(2);
    expect(resultado.confirmadosEnviados).toEqual(['lead-1']);
    expect(updates).toHaveLength(1);
    expect(updates[0].estado).toBe('contactado');
    expect(updates[0].gmail_draft_id).toBeNull();
    expect(inserts).toHaveLength(1);
  });
});
