import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizePlan } from '../../db/core.js';

// Nadie prueba billing.ts todavía a pesar de ser el único archivo que mueve dinero real
// (checkout, webhook de Stripe, cambios de plan). Se testean aquí las funciones exportadas que
// hacen el trabajo real de mutar plan/créditos/estado de suscripción, más los helpers de
// seguridad (anti-open-redirect, idempotencia de webhooks, resolución de banda) que ya estaban
// ahí pero no exportados.

let fakeState: any;

vi.mock('../../state.js', () => ({
  loadState: () => fakeState,
  saveState: (s: any) => { fakeState = s; },
  requireAuth: (_req: any, _res: any, next: any) => next()
}));

vi.mock('../../db.js', () => ({
  normalizePlan,
  getSupabase: vi.fn(() => ({
    from: () => ({
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
        or: () => Promise.resolve({ error: null }),
        ilike: () => Promise.resolve({ error: null })
      })
    })
  })),
  dbUpsertRegisteredBand: vi.fn().mockResolvedValue(undefined),
  dbIsWebhookEventProcessed: vi.fn().mockResolvedValue(false),
  dbRecordWebhookEvent: vi.fn().mockResolvedValue(undefined)
}));

import {
  applyPlanUpgrade,
  schedulePlanDowngrade,
  applyPlanCancellation,
  handlePaymentFailed,
  handleInvoicePaid,
  resolveValidEmail,
  findBandInState,
  getOriginHost,
  urlDeVueltaSegura,
  isEventProcessed
} from '../billing';
import { dbIsWebhookEventProcessed } from '../../db.js';

function baseState() {
  return {
    registeredBands: [
      {
        id: 'reg-lostigres',
        band_id: 'band-lostigres',
        nombre_banda: 'Los Tigres',
        email: 'contacto@lostigres.com',
        plan: 'ensayo',
        creditos_periodo: 100,
        creditos_usados: 40,
        estado_suscripcion: 'activo'
      }
    ],
    users: [
      { id: 'u1', email: 'contacto@lostigres.com', band_id: 'band-lostigres', plan: 'ensayo' },
      { id: 'u2', email: 'otraBanda@ejemplo.com', band_id: 'band-otra', plan: 'ensayo' }
    ]
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  fakeState = baseState();
});

describe('applyPlanUpgrade', () => {
  it('sube el plan de la banda encontrada, resetea créditos y limpia cambios pendientes', async () => {
    fakeState.registeredBands[0].plan_pendiente = 'ensayo';
    fakeState.registeredBands[0].fecha_cambio_plan = '2026-01-01';

    const result = await applyPlanUpgrade('band-lostigres', 'de_gira', 'contacto@lostigres.com');

    expect(result.success).toBe(true);
    const band = fakeState.registeredBands[0];
    expect(band.plan).toBe('de_gira');
    expect(band.plan_pendiente).toBeNull();
    expect(band.fecha_cambio_plan).toBeNull();
    expect(band.estado_suscripcion).toBe('activo');
    expect(band.creditos_periodo).toBe(800);
    expect(band.creditos_usados).toBe(0);
  });

  it('crea la banda en registeredBands si no existía todavía (alta nueva vía Stripe)', async () => {
    await applyPlanUpgrade('band-nueva', 'local', 'nueva@banda.com');

    const creada = fakeState.registeredBands.find((b: any) => b.band_id === 'band-nueva');
    expect(creada).toBeDefined();
    expect(creada.plan).toBe('local');
    expect(creada.email).toBe('nueva@banda.com');
  });

  it('actualiza el plan de los usuarios de esa banda, y NO toca usuarios de otras bandas', async () => {
    await applyPlanUpgrade('band-lostigres', 'cabeza_de_cartel', 'contacto@lostigres.com');

    const propio = fakeState.users.find((u: any) => u.id === 'u1');
    const ajeno = fakeState.users.find((u: any) => u.id === 'u2');
    expect(propio.plan).toBe('cabeza_de_cartel');
    expect(ajeno.plan).toBe('ensayo');
  });
});

describe('schedulePlanDowngrade', () => {
  it('programa un cambio de plan (no cancelación) con estado cambio_programado', async () => {
    await schedulePlanDowngrade('band-lostigres', 'local', '2026-03-01', 'contacto@lostigres.com');
    const band = fakeState.registeredBands[0];
    expect(band.plan_pendiente).toBe('local');
    expect(band.fecha_cambio_plan).toBe('2026-03-01');
    expect(band.estado_suscripcion).toBe('cambio_programado');
    // El plan activo no cambia hasta que se cumpla el ciclo
    expect(band.plan).toBe('ensayo');
  });

  it('marca cancelacion_programada cuando el plan de destino es ensayo (gratuito)', async () => {
    await schedulePlanDowngrade('band-lostigres', 'ensayo', '2026-03-01', 'contacto@lostigres.com');
    expect(fakeState.registeredBands[0].estado_suscripcion).toBe('cancelacion_programada');
  });
});

describe('applyPlanCancellation', () => {
  it('transiciona la banda a ensayo sin borrar sus datos, y limpia cualquier plan pendiente', async () => {
    fakeState.registeredBands[0].plan = 'de_gira';
    fakeState.registeredBands[0].plan_pendiente = 'cabeza_de_cartel';

    await applyPlanCancellation('band-lostigres', 'contacto@lostigres.com');

    const band = fakeState.registeredBands[0];
    expect(band.plan).toBe('ensayo');
    expect(band.plan_pendiente).toBeNull();
    expect(band.estado_suscripcion).toBe('cancelado');
    expect(band.creditos_periodo).toBe(100);
  });
});

describe('handlePaymentFailed', () => {
  it('marca la banda y su usuario como pago_pendiente sin tocar el plan', async () => {
    await handlePaymentFailed('band-lostigres', 'contacto@lostigres.com');
    expect(fakeState.registeredBands[0].estado_suscripcion).toBe('pago_pendiente');
    expect(fakeState.registeredBands[0].plan).toBe('ensayo');
    expect(fakeState.users.find((u: any) => u.id === 'u1').estado_suscripcion).toBe('pago_pendiente');
  });
});

describe('handleInvoicePaid', () => {
  it('al renovar el ciclo, promociona el plan_pendiente a plan activo', async () => {
    fakeState.registeredBands[0].plan = 'local';
    fakeState.registeredBands[0].plan_pendiente = 'de_gira';

    await handleInvoicePaid('band-lostigres', 'contacto@lostigres.com');

    const band = fakeState.registeredBands[0];
    expect(band.plan).toBe('de_gira');
    expect(band.plan_pendiente).toBeNull();
  });

  it('sin plan pendiente, simplemente reafirma el plan actual (renovación normal)', async () => {
    fakeState.registeredBands[0].plan = 'local';

    await handleInvoicePaid('band-lostigres', 'contacto@lostigres.com');

    expect(fakeState.registeredBands[0].plan).toBe('local');
  });
});

describe('findBandInState (resolución de banda para operaciones de facturación)', () => {
  it('encuentra la banda por band_id aunque venga con o sin prefijo', () => {
    const { band } = findBandInState(fakeState, 'band-lostigres');
    expect(band?.nombre_banda).toBe('Los Tigres');
  });

  it('cae a buscar por email cuando el bandId es "default" (sesiones antiguas)', () => {
    const { band } = findBandInState(fakeState, 'default', 'contacto@lostigres.com');
    expect(band?.band_id).toBe('band-lostigres');
  });

  it('no encuentra ninguna banda cuando ni el bandId ni el email coinciden con nada', () => {
    const { band } = findBandInState(fakeState, 'band-inexistente', 'nadie@ejemplo.com');
    expect(band).toBeUndefined();
  });
});

describe('resolveValidEmail', () => {
  it('devuelve el email dado directamente si ya es válido', () => {
    expect(resolveValidEmail('foo@bar.com')).toBe('foo@bar.com');
  });

  it('resuelve por id/username de usuario en el estado si el email pasado no es un email', () => {
    expect(resolveValidEmail('u1')).toBe('contacto@lostigres.com');
  });

  it('devuelve undefined si no hay ningún email válido que resolver', () => {
    expect(resolveValidEmail(undefined, 'band-inexistente')).toBeUndefined();
  });
});

describe('urlDeVueltaSegura (bloqueo de open redirect en el retorno del portal de Stripe)', () => {
  const reqConOrigen = (origin: string) => ({ headers: { origin }, body: {} } as any);

  it('acepta returnUrl cuando coincide con el origen que sirve la app', () => {
    const req = reqConOrigen('https://bandmanager.ai');
    expect(urlDeVueltaSegura(req, 'https://bandmanager.ai/dashboard')).toBe('https://bandmanager.ai/dashboard');
  });

  it('ignora un returnUrl a un dominio ajeno y vuelve al origen conocido', () => {
    const req = reqConOrigen('https://bandmanager.ai');
    expect(urlDeVueltaSegura(req, 'https://sitio-malicioso.com/phish')).toBe('https://bandmanager.ai');
  });

  it('ignora un returnUrl que no es una URL válida', () => {
    const req = reqConOrigen('https://bandmanager.ai');
    expect(urlDeVueltaSegura(req, 'no-es-una-url')).toBe('https://bandmanager.ai');
  });

  it('vuelve al origen cuando no se pasa returnUrl', () => {
    const req = reqConOrigen('https://bandmanager.ai');
    expect(urlDeVueltaSegura(req, undefined)).toBe('https://bandmanager.ai');
  });
});

describe('getOriginHost', () => {
  it('usa el header Origin cuando está presente', () => {
    const req = { headers: { origin: 'https://bandmanager.ai' }, body: {} } as any;
    expect(getOriginHost(req)).toBe('https://bandmanager.ai');
  });

  it('cae al Referer cuando no hay Origin', () => {
    const req = { headers: { referer: 'https://bandmanager.ai/pricing?x=1' }, body: {} } as any;
    expect(getOriginHost(req)).toBe('https://bandmanager.ai');
  });

  it('cae a x-forwarded-proto/host cuando no hay Origin ni Referer', () => {
    const req = { headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'app.railway.internal' }, body: {} } as any;
    expect(getOriginHost(req)).toBe('https://app.railway.internal');
  });
});

describe('isEventProcessed (idempotencia del webhook de Stripe)', () => {
  it('la primera vez que se ve un evento consulta la persistencia y devuelve lo que diga', async () => {
    vi.mocked(dbIsWebhookEventProcessed).mockResolvedValueOnce(false);
    await expect(isEventProcessed('evt_1')).resolves.toBe(false);
  });

  it('una vez visto en este proceso, la segunda vez no vuelve a consultar la base de datos', async () => {
    vi.mocked(dbIsWebhookEventProcessed).mockResolvedValueOnce(false);
    await isEventProcessed('evt_2');
    vi.mocked(dbIsWebhookEventProcessed).mockClear();

    const segunda = await isEventProcessed('evt_2');
    expect(segunda).toBe(true);
    expect(dbIsWebhookEventProcessed).not.toHaveBeenCalled();
  });
});
