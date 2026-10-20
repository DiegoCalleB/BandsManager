import { describe, it, expect } from 'vitest';
import { sincronizarCatalogo, type AliasSala, type PuertoCatalogo, type SalaAGuardar, type SalaGuardada } from '../catalogoSalas.js';
import type { LeadParaCatalogo } from '../../utils/salaCatalogo.js';

const AHORA = new Date('2026-10-18T12:00:00Z');
const hace = (dias: number) => new Date(AHORA.getTime() - dias * 86_400_000).toISOString();

/** Puerto en memoria: guarda lo que le piden y deja inspeccionar qué se escribió. */
function puertoEnMemoria(leads: LeadParaCatalogo[], salas: SalaGuardada[] = [], alias: AliasSala[] = []) {
  const estado = { leads: leads.map((l) => ({ ...l })), salas: [...salas], escrituras: 0, lotesDeSalas: [] as number[], lotesDeEnlaces: [] as number[] };
  const puerto: PuertoCatalogo = {
    async leerLeads() {
      return estado.leads.map((l) => ({ ...l }));
    },
    async leerAlias() {
      return alias;
    },
    async leerSalas() {
      return estado.salas.map((s) => ({ ...s }));
    },
    async guardarSalas(nuevas: SalaAGuardar[]) {
      estado.escrituras++;
      estado.lotesDeSalas.push(nuevas.length);
      for (const n of nuevas) {
        const i = estado.salas.findIndex((s) => s.id === n.id);
        const previa = i >= 0 ? estado.salas[i] : undefined;
        const fila: SalaGuardada = { ...n, no_contactar: previa?.no_contactar ?? false };
        if (i >= 0) estado.salas[i] = fila;
        else estado.salas.push(fila);
      }
    },
    async enlazarLeads(enlaces) {
      estado.escrituras++;
      estado.lotesDeEnlaces.push(enlaces.length);
      for (const { leadId, salaId } of enlaces) {
        const l = estado.leads.find((x) => x.id === leadId);
        if (l) l.sala_id = salaId;
      }
    },
  };
  return { puerto, estado };
}

const lead = (c: Partial<LeadParaCatalogo> & { id: string }): LeadParaCatalogo => ({ band_id: 'b1', nombre_sala: 'Sala Apolo', ciudad: 'Barcelona', ...c });

describe('sincronizarCatalogo', () => {
  it('crea una sala por cada sala distinta y fusiona las repetidas entre bandas', async () => {
    const { puerto, estado } = puertoEnMemoria([
      lead({ id: '1', band_id: 'a', nombre_sala: 'Sala Apolo' }),
      lead({ id: '2', band_id: 'b', nombre_sala: 'SALA  APOLO' }),
      lead({ id: '3', band_id: 'c', nombre_sala: 'Razzmatazz' }),
    ]);
    const r = await sincronizarCatalogo(puerto, { ahora: AHORA });
    expect(r).toMatchObject({ leadsLeidos: 3, salasResultantes: 2, salasNuevas: 2, duplicadosFusionados: 1, leadsEnlazados: 3, simulacion: false });
    expect(estado.salas).toHaveLength(2);
    expect(new Set(estado.leads.map((l) => l.sala_id)).size).toBe(2);
    expect(estado.leads[0].sala_id).toBe(estado.leads[1].sala_id);
  });

  it('modo simulación: informa de lo que haría y no escribe nada', async () => {
    const { puerto, estado } = puertoEnMemoria([lead({ id: '1' }), lead({ id: '2', band_id: 'b' })]);
    const r = await sincronizarCatalogo(puerto, { ahora: AHORA, simulacion: true });
    expect(r).toMatchObject({ simulacion: true, salasNuevas: 1, leadsEnlazados: 2 });
    expect(estado.escrituras).toBe(0);
    expect(estado.salas).toHaveLength(0);
    expect(estado.leads.every((l) => !l.sala_id)).toBe(true);
  });

  it('es idempotente: la segunda ejecución no escribe nada', async () => {
    const { puerto, estado } = puertoEnMemoria([
      lead({ id: '1', band_id: 'a', estado: 'negociando', email_contacto: 'info@apolo.com' }),
      lead({ id: '2', band_id: 'b', nombre_sala: 'Razzmatazz' }),
    ]);
    await sincronizarCatalogo(puerto, { ahora: AHORA });
    const escriturasTrasPrimera = estado.escrituras;
    const r2 = await sincronizarCatalogo(puerto, { ahora: AHORA });
    expect(r2).toMatchObject({ salasNuevas: 0, salasActualizadas: 0, salasSinCambios: 2, leadsEnlazados: 0 });
    expect(estado.escrituras).toBe(escriturasTrasPrimera);
  });

  it('medios, agencias, bandas amigas y leads de prueba no entran al catálogo y se cuentan por motivo', async () => {
    const { puerto, estado } = puertoEnMemoria([
      lead({ id: '1', nombre_sala: 'Radio Segovia', tipo: 'medio' }),
      lead({ id: '2', nombre_sala: 'Balkan Boom', tipo: 'grupo' }),
      lead({ id: '3', nombre_sala: 'Panda Management', tipo: 'agencia' }),
      lead({ id: '4', nombre_sala: 'Test 1786526138562' }),
      lead({ id: '5', nombre_sala: 'Sala Apolo', tipo: 'sala' }),
      lead({ id: '6', nombre_sala: 'Rototom', tipo: 'festival', ciudad: 'Benicàssim' }),
    ]);
    const r = await sincronizarCatalogo(puerto, { ahora: AHORA });
    expect(r).toMatchObject({ leadsLeidos: 6, leadsFueraDeCatalogo: { tipo: 3, prueba: 1 }, leadsSinClave: 0, salasResultantes: 2, duplicadosFusionados: 0 });
    expect(estado.salas.map((s) => s.nombre).sort()).toEqual(['Rototom', 'Sala Apolo']);
    expect(estado.leads.filter((l) => l.sala_id).map((l) => l.id).sort()).toEqual(['5', '6']);
  });

  it('la misma sala con la ciudad escrita de formas distintas se fusiona', async () => {
    const { puerto } = puertoEnMemoria([
      lead({ id: '1', band_id: 'a', ciudad: 'Barcelona' }),
      lead({ id: '2', band_id: 'b', ciudad: 'Barcelona, España' }),
      lead({ id: '3', band_id: 'c', ciudad: 'Barcelona (Cataluña)' }),
    ]);
    const r = await sincronizarCatalogo(puerto, { ahora: AHORA });
    expect(r).toMatchObject({ salasResultantes: 1, duplicadosFusionados: 2 });
  });

  it('los leads sin nombre o sin ciudad no entran y se cuentan', async () => {
    const { puerto, estado } = puertoEnMemoria([lead({ id: '1', ciudad: null }), lead({ id: '2', nombre_sala: '  ' }), lead({ id: '3' })]);
    const r = await sincronizarCatalogo(puerto, { ahora: AHORA });
    expect(r).toMatchObject({ leadsSinClave: 2, salasResultantes: 1 });
    expect(estado.leads.find((l) => l.id === '1')!.sala_id).toBeUndefined();
  });

  it('en el catálogo no queda nada privado de ninguna banda', async () => {
    const { puerto, estado } = puertoEnMemoria([
      { ...lead({ id: '1', band_id: 'banda-secreta', estado: 'negociando', email_contacto: 'maria.lopez@apolo.com', telefono: '600111222' }), ...({ pitch_generado: 'pitch privado', notas: 'cache 900' } as object) } as LeadParaCatalogo,
    ]);
    await sincronizarCatalogo(puerto, { ahora: AHORA });
    const fila = JSON.stringify(estado.salas);
    expect(fila).not.toMatch(/banda-secreta|pitch privado|cache 900|maria\.lopez|600111222|negociando/);
    expect(estado.salas[0]).not.toHaveProperty('band_id');
  });

  it('calcula la fiabilidad con lo que hay: una sala que respondió sale «probable»', async () => {
    const { puerto, estado } = puertoEnMemoria([lead({ id: '1', estado: 'negociando', email_contacto: 'info@apolo.com', website: 'apolo.com' })]);
    const r = await sincronizarCatalogo(puerto, { ahora: AHORA });
    expect(r.porNivel).toEqual({ sin_verificar: 0, probable: 1, verificada: 0 });
    expect(estado.salas[0]).toMatchObject({ nivel: 'probable', puntuacion: 60, bandas_con_respuesta: 1, bandas_con_entrega: 1, verificada_en: AHORA });
  });

  it('una sala nunca contactada queda «sin verificar» y sin fecha de verificación', async () => {
    const { puerto, estado } = puertoEnMemoria([lead({ id: '1', estado: 'nuevo', website: 'apolo.com' })]);
    await sincronizarCatalogo(puerto, { ahora: AHORA });
    expect(estado.salas[0]).toMatchObject({ nivel: 'sin_verificar', verificada_en: null });
  });

  it('un rebote baja la sala y se refleja en el contador', async () => {
    const { puerto, estado } = puertoEnMemoria([lead({ id: '1', estado: 'enviado', fecha_envio: hace(20), rebotado: true, email_contacto: 'info@apolo.com' })]);
    await sincronizarCatalogo(puerto, { ahora: AHORA });
    expect(estado.salas[0]).toMatchObject({ nivel: 'sin_verificar', rebotes: 1, bandas_con_entrega: 0 });
  });

  it('no toca el «no contactar» de una sala', async () => {
    const { puerto: p1, estado } = puertoEnMemoria([lead({ id: '1' })]);
    await sincronizarCatalogo(p1, { ahora: AHORA });
    estado.salas[0].no_contactar = true;
    estado.leads.push(lead({ id: '2', band_id: 'otra', website: 'apolo.com' }));
    await sincronizarCatalogo(p1, { ahora: AHORA });
    expect(estado.salas[0].no_contactar).toBe(true);
  });

  it('una sala verificada conserva sus datos aunque una banda escriba otros', async () => {
    const { puerto, estado } = puertoEnMemoria([lead({ id: '1', aforo: 400, estado: 'negociando', place_id: 'P1', email_contacto: 'info@apolo.com', website: 'apolo.com' })]);
    await sincronizarCatalogo(puerto, { ahora: AHORA });
    expect(estado.salas[0].nivel).toBe('verificada');
    estado.leads[0].aforo = 99_999;
    await sincronizarCatalogo(puerto, { ahora: AHORA });
    expect(estado.salas[0].aforo).toBe(400);
  });

  it('una sala catalogada por nombre que gana place_id conserva su fila y su id', async () => {
    const { puerto, estado } = puertoEnMemoria([lead({ id: '1' })]);
    await sincronizarCatalogo(puerto, { ahora: AHORA });
    const idInicial = estado.salas[0].id;
    estado.leads[0].place_id = 'PLACE-1';
    await sincronizarCatalogo(puerto, { ahora: AHORA });
    expect(estado.salas).toHaveLength(1);
    expect(estado.salas[0]).toMatchObject({ id: idInicial, clave: 'place:PLACE-1', place_id: 'PLACE-1' });
  });

  it('leads de la misma sala, unos con place_id y otros sin él, forman una sola sala', async () => {
    const { puerto, estado } = puertoEnMemoria([lead({ id: '1', band_id: 'a', place_id: 'PLACE-1' }), lead({ id: '2', band_id: 'b' })]);
    const r = await sincronizarCatalogo(puerto, { ahora: AHORA });
    expect(r.salasResultantes).toBe(1);
    expect(estado.salas).toHaveLength(1);
    expect(estado.leads[0].sala_id).toBe(estado.leads[1].sala_id);
  });

  it('con varias salas del mismo nombre y ciudad con distinto place_id no adivina a cuál unir', async () => {
    const { puerto } = puertoEnMemoria([lead({ id: '1', place_id: 'P1' }), lead({ id: '2', band_id: 'b', place_id: 'P2' }), lead({ id: '3', band_id: 'c' })]);
    const r = await sincronizarCatalogo(puerto, { ahora: AHORA });
    expect(r.salasResultantes).toBe(3);
  });

  it('escribe por lotes y sin perder ninguna sala', async () => {
    const muchos = Array.from({ length: 450 }, (_, i) => lead({ id: `l${i}`, nombre_sala: `Sala número ${i}` }));
    const { puerto, estado } = puertoEnMemoria(muchos);
    await sincronizarCatalogo(puerto, { ahora: AHORA });
    expect(estado.salas).toHaveLength(450);
    expect(estado.lotesDeSalas).toEqual([200, 200, 50]);
    expect(estado.leads.every((l) => !!l.sala_id)).toBe(true);
  });

  it('no escribe los enlaces si falla el guardado de las salas', async () => {
    const { puerto, estado } = puertoEnMemoria([lead({ id: '1' })]);
    const falla: PuertoCatalogo = { ...puerto, guardarSalas: async () => { throw new Error('boom'); } };
    await expect(sincronizarCatalogo(falla, { ahora: AHORA })).rejects.toThrow('boom');
    expect(estado.leads[0].sala_id).toBeUndefined();
  });

  it('sin leads, no hace nada', async () => {
    const { puerto, estado } = puertoEnMemoria([]);
    const r = await sincronizarCatalogo(puerto, { ahora: AHORA });
    expect(r).toMatchObject({ leadsLeidos: 0, salasResultantes: 0, duplicadosFusionados: 0 });
    expect(estado.escrituras).toBe(0);
  });

  it('un alias lleva los leads de las dos claves a una sola sala, con el nombre público fijado', async () => {
    const alias: AliasSala[] = [
      { aliasClave: 'nc:nazca|madrid', clave: 'nc:nazca club|madrid', nombre: 'Nazca Club' },
      { aliasClave: 'nc:sala nazca|madrid', clave: 'nc:nazca club|madrid', nombre: 'Nazca Club' },
    ];
    const { puerto, estado } = puertoEnMemoria([
      lead({ id: '1', nombre_sala: 'Nazca', ciudad: 'Madrid' }),
      lead({ id: '2', band_id: 'b', nombre_sala: 'Sala Nazca', ciudad: 'Madrid' }),
      lead({ id: '3', band_id: 'c', nombre_sala: 'Sala Nazca', ciudad: 'Madrid' }),
    ], [], alias);
    const r = await sincronizarCatalogo(puerto, { ahora: AHORA });
    expect(r.salasResultantes).toBe(1);
    expect(estado.salas).toHaveLength(1);
    expect(estado.salas[0]).toMatchObject({ clave: 'nc:nazca club|madrid', nombre: 'Nazca Club' });
    expect(new Set(estado.leads.map((l) => l.sala_id)).size).toBe(1);
  });

  it('con alias la segunda ejecución sigue sin escribir nada', async () => {
    const alias: AliasSala[] = [{ aliasClave: 'nc:sala clamores|madrid', clave: 'nc:clamores|madrid', nombre: 'Sala Clamores' }];
    const { puerto, estado } = puertoEnMemoria([lead({ id: '1', nombre_sala: 'Clamores', ciudad: 'Madrid' }), lead({ id: '2', band_id: 'b', nombre_sala: 'Sala Clamores', ciudad: 'Madrid' })], [], alias);
    await sincronizarCatalogo(puerto, { ahora: AHORA });
    const antes = estado.escrituras;
    expect(await sincronizarCatalogo(puerto, { ahora: AHORA })).toMatchObject({ salasNuevas: 0, salasActualizadas: 0, leadsEnlazados: 0 });
    expect(estado.escrituras).toBe(antes);
  });
});
