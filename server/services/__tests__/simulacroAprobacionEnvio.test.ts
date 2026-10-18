/**
 * SIMULACRO del ciclo aprobar → enviar con la banda de ejemplo.
 *
 * Aprobación REAL (sello de quién/cuándo/huella) y Enviador REAL sobre una base de datos en memoria
 * compartida. Solo se simula la base de datos y la salida del correo: no se envía nada, ni se toca
 * ningún lead real.
 *
 * Ver el informe:  npx vitest run server/services/__tests__/simulacroAprobacionEnvio.test.ts --silent=false
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';

const BANDA = 'band-demo';

// --- Mini base de datos en memoria (lo justo para el Enviador y el sello de aprobación) ---
const tablas: Record<string, any[]> = { leads: [], lead_messages: [], registered_bands: [{ band_id: BANDA, nombre_banda: 'Banda Demo' }] };
function tabla(nombre: string) {
  const filtros: Array<(f: any) => boolean> = [];
  let cambios: any = null;
  let soloContar = false;
  const c: any = {
    select: (_c?: string, op?: any) => { soloContar = Boolean(op?.head); return c; },
    update: (f: any) => { cambios = f; return c; },
    insert: (f: any) => { tablas[nombre].push(f); return Promise.resolve({ error: null }); },
    eq: (k: string, v: any) => (filtros.push((f) => f[k] === v), c),
    in: (k: string, v: any[]) => (filtros.push((f) => v.includes(f[k])), c),
    gte: () => c, not: () => c,
    maybeSingle: () => Promise.resolve({ data: tablas[nombre].find((f) => filtros.every((p) => p(f))) ?? null }),
    then: (resolve: any) => {
      const filas = tablas[nombre].filter((f) => filtros.every((p) => p(f)));
      if (cambios) { filas.forEach((f) => Object.assign(f, cambios)); return Promise.resolve({ error: null, data: filas }).then(resolve); }
      return Promise.resolve(soloContar ? { count: filas.length, error: null } : { data: filas.map((f) => ({ ...f })), error: null }).then(resolve);
    },
  };
  return c;
}
const supabaseFalso = { from: (n: string) => tabla(n) };

vi.mock('../../db.js', () => ({ getSupabase: () => supabaseFalso, dbGetAutonomyConfig: async () => ({ dispatchMode: 'draft_gmail', dispatchLevel: 'draft_only' }) }));
vi.mock('../../db/core.js', async (orig) => ({ ...(await orig<any>()), getSupabase: () => supabaseFalso }));
vi.mock('../../state.js', () => ({ DEMO_BAND_ID: 'band-demo' }));

const borradoresCreados: Array<{ to: string; body: string }> = [];
vi.mock('../emailAgentClient.js', () => ({
  enviarEmail: async () => { throw new Error('NO debe enviarse nada real en el simulacro'); },
  crearBorrador: async (_b: string, p: any) => { borradoresCreados.push({ to: p.to, body: p.body }); return { draftPath: '[Gmail]/Borradores' }; },
  EmailAgentError: class extends Error { constructor(m: string, public code: string) { super(m); } },
}));
vi.mock('../gmailApiClient.js', () => ({
  crearBorradorGmailApi: vi.fn(), tieneGmailOAuthConectado: async () => false, enviarEmailGmailApi: vi.fn(),
  comprobarBorradorEnviado: vi.fn(), comprobarBorradorEnviadoConDetalle: vi.fn(), buscarMensajeEnviadoA: vi.fn(),
  obtenerEmailDeLaCuentaConectada: vi.fn(),
}));

import { runEnviadorAgent } from '../agentEngine';
import { aplicarAprobacionTrasGuardar } from '../../db/leadAprobacion';

const lead = (id: string, nombre: string, email: string, pitch: string, extra: any = {}) => ({
  id, band_id: BANDA, nombre_sala: nombre, email_contacto: email, estado: 'pendiente_aprobacion', pitch_generado: pitch, notas: '', ...extra,
});
const estado = (id: string) => tablas.leads.find((l) => l.id === id)!;

/** Lo que hace PUT /api/leads/:id al guardar: aplica los cambios y sella o degrada la aprobación. */
async function guardarComoLaApp(id: string, cambios: any) {
  const existente = { ...estado(id) };
  Object.assign(estado(id), cambios);
  estado(id).estado = (await aplicarAprobacionTrasGuardar(existente, cambios, estado(id), BANDA, 'diego@bandademo.es')) ?? estado(id).estado;
}

const informe: string[] = [];
const T1 = 'hola, somos Banda Demo. Nos encantaría tocar en vuestra sala. ¿Os cuadra a primeros de abril?';

beforeAll(() => {
  tablas.leads.push(
    lead('a', 'Sala Caracol', 'booking@caracol.es', T1),
    lead('b', 'Teatro Real', 'programacion@teatroreal.es', T1),
    lead('c', 'Sala Siroco', 'programacion@siroco.es', T1),
    lead('d', 'Festival Cruce', 'info@festivalcruce.com', T1, { estado: 'aprobado_propuesta' }), // llegó a la cola SIN pasar por la aprobación de la app
    lead('e', 'Club Nocturno', 'booking@clubnocturno.es', '   ', {}),
    lead('f', 'Bar Corto', 'no-es-un-email', T1),
  );
});

describe('Simulacro: del «Aprobar» al correo de Banda Demo', () => {
  it('el ciclo completo, caso por caso', async () => {
    // a) Lo aprueba una persona y sale el borrador.
    await guardarComoLaApp('a', { estado: 'aprobado_propuesta' });
    informe.push(`a) Sala Caracol — aprobado por ${estado('a').aprobado_por} → sello ${String(estado('a').pitch_aprobado_hash).slice(0, 10)}…`);

    // b) Lo aprueba, pero luego alguien edita el texto SIN volver a aprobar.
    await guardarComoLaApp('b', { estado: 'aprobado_propuesta' });
    await guardarComoLaApp('b', { pitch_generado: T1 + ' Por cierto, pedimos 3.000 euros de caché.' });
    informe.push(`b) Teatro Real — aprobado y luego editado el texto → vuelve a «${estado('b').estado}», sello ${estado('b').pitch_aprobado_hash ?? 'borrado'}`);

    // c) Lo aprueba y reenvían el lead entero (como hace la app al editar una nota): el texto no cambia.
    await guardarComoLaApp('c', { estado: 'aprobado_propuesta' });
    const selloC = estado('c').pitch_aprobado_hash;
    await guardarComoLaApp('c', { estado: 'aprobado_propuesta', pitch_generado: T1, notas: 'llamar el martes' });
    informe.push(`c) Sala Siroco — aprobado y luego solo cambia una nota → sello ${estado('c').pitch_aprobado_hash === selloC ? 'intacto' : 'ALTERADO'}`);

    const r = await runEnviadorAgent({ bandId: BANDA, triggerType: 'simulacro' });
    const por = (id: string) => r.results.find((x) => x.id === id);
    informe.push('');
    informe.push('Resultado del Enviador:');
    for (const x of r.results) informe.push(`   ${x.nombre_sala}: ${x.status}${x.error ? ' — ' + x.error : ''}`);
    informe.push(`   (leads en cola de envío: ${r.results.length}; borradores creados: ${borradoresCreados.length}; correos reales enviados: 0)`);
    console.log(`\n══ SIMULACRO APROBAR → ENVIAR (Banda Demo) ══\n${informe.join('\n')}\n`);

    expect(por('a')!.status).toBe('borrador');
    expect(por('c')!.status).toBe('borrador');
    expect(por('d')!.status).toBe('error'); // en cola sin constancia de aprobación
    expect(por('d')!.error).toMatch(/No consta quién aprobó/);
    expect(por('e')).toBeUndefined(); // no estaba en cola
  });

  it('un texto editado tras aprobar NO sale y vuelve a revisión', () => {
    expect(estado('b').estado).toBe('pendiente_aprobacion');
    expect(estado('b').pitch_aprobado_hash).toBeNull();
    expect(borradoresCreados.map((x) => x.to)).not.toContain('programacion@teatroreal.es');
  });

  it('un lead que llegó a la cola sin pasar por la aprobación vuelve a revisión y no sale', () => {
    expect(estado('d').estado).toBe('pendiente_aprobacion');
    expect(borradoresCreados.map((x) => x.to)).not.toContain('info@festivalcruce.com');
  });

  it('solo salen los dos aprobados de verdad, con el texto exacto aprobado', () => {
    expect(borradoresCreados.map((x) => x.to).sort()).toEqual(['booking@caracol.es', 'programacion@siroco.es']);
    for (const b of borradoresCreados) expect(b.body).toContain('Nos encantaría tocar en vuestra sala');
    for (const b of borradoresCreados) expect(b.body).not.toContain('3.000');
  });

  it('los leads aprobados y enviados como borrador pasan a «borrador_creado»', () => {
    expect(estado('a').estado).toBe('borrador_creado');
    expect(estado('c').estado).toBe('borrador_creado');
  });
});
