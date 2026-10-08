import { describe, expect, it } from 'vitest';
import { calcularRoi, clicsDeEntradas, mesesVentana, precioMensualPlan, type EntradaRoi } from '../roiBanda';
import { PLANS } from '../planPermissions';

const HOY = '2026-10-16';
const concierto = (fecha: string, cache: number, estado_pago: 'pendiente' | 'pagado' | 'anticipo' = 'pagado', aforo_vendido = 0) =>
  ({ fecha, cache, estado_pago, aforo_vendido, tipo: 'sala' as const });
const pago = (fecha: string, importe: number, categoria: any = 'merchandising', tipo: any = 'ingreso', estado: any = 'pagado') =>
  ({ fecha, importe, categoria, tipo, estado });
const entrada = (p: Partial<EntradaRoi>): EntradaRoi => ({ concerts: [], payments: [], plan: 'local', hoy: HOY, ...p });

describe('precio del plan', () => {
  it('sale de PLANS: 15, 29 y 79 €/mes y 0 en los gratuitos', () => {
    expect(precioMensualPlan('local')).toBe(15);
    expect(precioMensualPlan('de_gira')).toBe(29);
    expect(precioMensualPlan('cabeza_de_cartel')).toBe(79);
    for (const p of ['promo', 'promo_plus', 'ensayo', undefined, 'gratis', 'desconocido']) expect(precioMensualPlan(p)).toBe(0);
  });

  it('coincide con el texto de cada plan (si cambia un precio no se desincroniza en silencio)', () => {
    for (const plan of Object.values(PLANS)) {
      const m = plan.price.match(/^(\d+)€ \/ mes/);
      expect(precioMensualPlan(plan.id), plan.id).toBe(m ? Number(m[1]) : 0);
    }
  });

  it('entiende los alias heredados de plan', () => {
    expect(precioMensualPlan('profesional')).toBe(29);
    expect(precioMensualPlan('elite')).toBe(79);
  });
});

describe('mesesVentana', () => {
  it('devuelve los tres últimos meses naturales, el actual al final', () => {
    expect(mesesVentana('2026-10-16')).toEqual(['2026-08', '2026-09', '2026-10']);
  });
  it('cruza el cambio de año', () => {
    expect(mesesVentana('2026-01-05')).toEqual(['2025-11', '2025-12', '2026-01']);
    expect(mesesVentana('2026-02-28')).toEqual(['2025-12', '2026-01', '2026-02']);
  });
});

describe('calcularRoi', () => {
  it('suma el caché de los bolos COBRADOS en la ventana y calcula el múltiplo sobre el coste del plan', () => {
    const r = calcularRoi(entrada({ plan: 'local', concerts: [concierto('2026-10-02', 600), concierto('2026-09-12', 450)] }));
    expect(r.ingresosBolos).toBe(1050);
    expect(r.bolosCobrados).toBe(2);
    expect(r.costePlan).toBe(45); // 15 €/mes × 3
    expect(r.multiplo).toBe(23.3);
    expect(r.porMes).toEqual([0, 450, 600]);
    expect(r.estado).toBe('con_datos');
  });

  it('no cuenta lo que no está cobrado: pendiente, anticipo ni bolos futuros', () => {
    const r = calcularRoi(
      entrada({ concerts: [concierto('2026-10-02', 600, 'pendiente'), concierto('2026-10-03', 600, 'anticipo'), concierto('2026-11-20', 900, 'pagado')] })
    );
    expect(r.ingresos).toBe(0);
    expect(r.bolosCobrados).toBe(0);
  });

  it('no cuenta bolos fuera de la ventana de tres meses (ni el día 1 del mes anterior a la ventana)', () => {
    const r = calcularRoi(entrada({ concerts: [concierto('2026-07-31', 500), concierto('2026-08-01', 300)] }));
    expect(r.ingresosBolos).toBe(300);
  });

  it('NO cuenta dos veces un bolo: los pagos de categoría «concierto» se ignoran', () => {
    const r = calcularRoi(entrada({ concerts: [concierto('2026-10-02', 600)], payments: [pago('2026-10-02', 600, 'concierto')] }));
    expect(r.ingresos).toBe(600);
    expect(r.otrosIngresos).toBe(0);
  });

  it('suma otros ingresos cobrados (merch, subvención) pero no gastos ni pendientes', () => {
    const r = calcularRoi(
      entrada({
        payments: [
          pago('2026-10-05', 120, 'merchandising'),
          pago('2026-09-05', 300, 'subvencion'),
          pago('2026-10-06', 80, 'merchandising', 'ingreso', 'pendiente'),
          pago('2026-10-07', 500, 'transporte', 'gasto'),
        ],
      })
    );
    expect(r.otrosIngresos).toBe(420);
    expect(r.ingresos).toBe(420);
    expect(r.porMes).toEqual([0, 300, 120]);
  });

  it('plan gratuito: hay ingresos pero NO hay múltiplo (no se divide por cero ni se inventa)', () => {
    const r = calcularRoi(entrada({ plan: 'ensayo', concerts: [concierto('2026-10-02', 600)] }));
    expect(r.ingresos).toBe(600);
    expect(r.costePlan).toBe(0);
    expect(r.multiplo).toBeNull();
    expect(Number.isFinite(r.ingresos)).toBe(true);
  });

  it('sin ingresos no hay múltiplo de 0 «veces», hay null', () => {
    const r = calcularRoi(entrada({ plan: 'de_gira' }));
    expect(r.multiplo).toBeNull();
    expect(r.estado).toBe('sin_datos');
    expect(r.porMes).toEqual([0, 0, 0]);
  });

  it('cuenta las entradas vendidas de los bolos ya pasados de la ventana', () => {
    const r = calcularRoi(entrada({ concerts: [concierto('2026-10-02', 0, 'pendiente', 120), concierto('2026-09-02', 0, 'pendiente', 80), concierto('2026-12-02', 0, 'pendiente', 500)] }));
    expect(r.entradasVendidas).toBe(200);
    expect(r.estado).toBe('con_datos');
  });

  it('aguanta datos sucios sin NaN: importes como texto, negativos, fechas ISO completas o vacías', () => {
    const r = calcularRoi(
      entrada({
        concerts: [{ fecha: '2026-10-02T21:00:00Z', cache: '600' as any, estado_pago: 'pagado', aforo_vendido: undefined as any, tipo: 'sala' }, concierto('', 500), concierto('2026-10-03', NaN)],
        payments: [pago('2026-10-05', -50, 'otros'), pago('2026-10-05T10:00:00Z', '75' as any, 'otros'), pago(undefined as any, 10, 'otros')],
      })
    );
    expect(r.ingresosBolos).toBe(600);
    expect(r.otrosIngresos).toBe(75);
    for (const v of [r.ingresos, r.entradasVendidas, r.costePlan, ...r.porMes]) expect(Number.isFinite(v)).toBe(true);
  });

  it('los clics a entradas cuentan como dato aunque no haya dinero cobrado', () => {
    const r = calcularRoi(entrada({ clicsEntradas: 37 }));
    expect(r.clicsEntradas).toBe(37);
    expect(r.estado).toBe('con_datos');
    expect(calcularRoi(entrada({ clicsEntradas: -5 })).clicsEntradas).toBe(0);
  });

  it('redondea el múltiplo a un decimal', () => {
    expect(calcularRoi(entrada({ plan: 'de_gira', concerts: [concierto('2026-10-02', 1000)] })).multiplo).toBe(11.5);
  });
});

describe('clicsDeEntradas', () => {
  it('solo suma los enlaces cuyo destino es «entradas»', () => {
    expect(
      clicsDeEntradas([
        { destino: 'entradas', clics: 10 },
        { destino: 'entradas', clics: 5 },
        { destino: 'epk', clics: 99 },
        { destino: 'entradas' },
      ])
    ).toBe(15);
    expect(clicsDeEntradas([])).toBe(0);
  });
});
