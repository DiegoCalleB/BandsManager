import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db.js', () => ({
  getSupabase: vi.fn()
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

import { getSupabase } from '../../db.js';
import { runEnviadorAgent } from '../agentEngine';

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
      select: () => ({
        in: () => ({
          eq: () => Promise.resolve({ data: tabla === 'leads' ? [lead] : [], error: null })
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

  it('crea un borrador, no envía, y no marca el lead como contactado', async () => {
    const { updates, inserts } = mockSupabase();
    crearBorradorMock.mockResolvedValue({ draftPath: '[Gmail]/Borradores' });

    const result = await runEnviadorAgent({ bandId: 'band-test', triggerType: 'test' });

    // No ha salido ningún email.
    expect(enviarEmailMock).not.toHaveBeenCalled();
    expect(crearBorradorMock).toHaveBeenCalledTimes(1);

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
});
