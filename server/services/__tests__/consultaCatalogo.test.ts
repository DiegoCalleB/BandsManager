import { describe, it, expect, vi } from 'vitest';
import { crearConsultaCatalogo, type PuertoConsulta } from '../consultaCatalogo.js';
import type { SalaGuardada } from '../catalogoSalas.js';

const sala = (id: string, nombre: string, extra: Partial<SalaGuardada> = {}): SalaGuardada => ({
  id,
  clave: `nc:${nombre.toLowerCase()}|madrid`,
  place_id: null,
  nombre,
  ciudad: 'Madrid',
  region: 'Comunidad de Madrid',
  direccion: null,
  tipo: 'sala',
  aforo: 200,
  genero: 'Rock',
  website: null,
  instagram: null,
  email_contacto: 'booking@ejemplo.es',
  telefono: null,
  nivel: 'probable',
  puntuacion: 50,
  verificada_en: null,
  bandas_con_respuesta: 1,
  bandas_con_entrega: 1,
  rebotes: 0,
  no_contactar: false,
  ...extra,
});

function montar(salas: SalaGuardada[]) {
  const puerto = { leerSalas: vi.fn(async () => salas), enlazarLeads: vi.fn(async () => undefined) } satisfies PuertoConsulta;
  return { puerto, svc: crearConsultaCatalogo(puerto, () => reloj.t) };
}
const reloj = { t: 0 };

describe('crearConsultaCatalogo', () => {
  it('lee el catálogo una vez y lo reutiliza hasta que caduca la caché', async () => {
    reloj.t = 0;
    const { puerto, svc } = montar([sala('s1', 'Alfa')]);
    await svc.consultar({}, []);
    await svc.consultar({ texto: 'alfa' }, []);
    expect(puerto.leerSalas).toHaveBeenCalledTimes(1);
    reloj.t = 61_000;
    await svc.consultar({}, []);
    expect(puerto.leerSalas).toHaveBeenCalledTimes(2);
  });

  describe('anadir', () => {
    const guardarLead = () => vi.fn(async (lead: Record<string, unknown>) => ({ id: String(lead.id) }));

    it('añade la sala con su contacto, enlaza el lead y no toca otros', async () => {
      reloj.t = 0;
      const { puerto, svc } = montar([sala('s1', 'Alfa')]);
      const guardar = guardarLead();
      const r = await svc.anadir({ salaId: 's1', bandId: 'banda-1', leadsDeLaBanda: [], nuevoId: () => 'lead-1', guardarLead: guardar });
      expect(r).toEqual({ resultado: 'anadida', leadId: 'lead-1' });
      expect(guardar).toHaveBeenCalledWith(expect.objectContaining({ band_id: 'banda-1', email_contacto: 'booking@ejemplo.es', estado: 'nuevo' }));
      expect(puerto.enlazarLeads).toHaveBeenCalledWith([{ leadId: 'lead-1', salaId: 's1' }]);
    });

    it('no la añade dos veces: ni por enlace ni por nombre y ciudad', async () => {
      reloj.t = 0;
      const { svc } = montar([sala('s1', 'Alfa')]);
      const guardar = guardarLead();
      const porEnlace = await svc.anadir({ salaId: 's1', bandId: 'b', leadsDeLaBanda: [{ id: 'l9', sala_id: 's1' }], nuevoId: () => 'x', guardarLead: guardar });
      expect(porEnlace).toEqual({ resultado: 'ya_en_agenda', leadId: 'l9' });
      const porNombre = await svc.anadir({ salaId: 's1', bandId: 'b', leadsDeLaBanda: [{ id: 'l8', nombre_sala: 'ALFA', ciudad: 'Madrid' }], nuevoId: () => 'x', guardarLead: guardar });
      expect(porNombre.resultado).toBe('ya_en_agenda');
      expect(guardar).not.toHaveBeenCalled();
    });

    it('rechaza una sala que no existe o está marcada «no contactar»', async () => {
      reloj.t = 0;
      const { svc } = montar([sala('s1', 'Alfa', { no_contactar: true })]);
      const guardar = guardarLead();
      expect((await svc.anadir({ salaId: 's1', bandId: 'b', leadsDeLaBanda: [], nuevoId: () => 'x', guardarLead: guardar })).resultado).toBe('no_disponible');
      expect((await svc.anadir({ salaId: 'nope', bandId: 'b', leadsDeLaBanda: [], nuevoId: () => 'x', guardarLead: guardar })).resultado).toBe('no_disponible');
      expect(guardar).not.toHaveBeenCalled();
    });

    it('si falla el enlace, el lead ya guardado cuenta como añadido', async () => {
      reloj.t = 0;
      const { puerto, svc } = montar([sala('s1', 'Alfa')]);
      puerto.enlazarLeads.mockRejectedValueOnce(new Error('caída'));
      const aviso = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const r = await svc.anadir({ salaId: 's1', bandId: 'b', leadsDeLaBanda: [], nuevoId: () => 'lead-2', guardarLead: guardarLead() });
      expect(r).toEqual({ resultado: 'anadida', leadId: 'lead-2' });
      aviso.mockRestore();
    });

    it('si falla el guardado del lead, el error sube y no se enlaza nada', async () => {
      reloj.t = 0;
      const { puerto, svc } = montar([sala('s1', 'Alfa')]);
      await expect(
        svc.anadir({ salaId: 's1', bandId: 'b', leadsDeLaBanda: [], nuevoId: () => 'x', guardarLead: async () => { throw new Error('db'); } }),
      ).rejects.toThrow('db');
      expect(puerto.enlazarLeads).not.toHaveBeenCalled();
    });
  });
});

describe('anadirVarias', () => {
  const guardar = () => vi.fn(async (lead: Record<string, unknown>) => ({ id: String(lead.id) }));
  let n = 0;
  const base = (salaIds: string[], plazas: number, extra: Record<string, unknown> = {}) => ({ salaIds, plazas, bandId: 'b', leadsDeLaBanda: [], nuevoId: () => `lead-${++n}`, guardarLead: guardar(), ...extra });

  it('añade las que puede, cuenta cada caso y no repite una sala duplicada en la lista', async () => {
    reloj.t = 0;
    const { svc } = montar([sala('s1', 'Alfa'), sala('s2', 'Beta'), sala('s3', 'Gamma', { no_contactar: true })]);
    const p = base(['s1', 's2', 's1', 's3', 'nope'], 10, { leadsDeLaBanda: [{ id: 'l9', sala_id: 's2' }] });
    expect(await svc.anadirVarias(p)).toEqual({ anadidas: 1, yaEnAgenda: 1, noDisponibles: 2, limiteAlcanzado: false });
    expect(p.guardarLead).toHaveBeenCalledTimes(1);
  });

  it('se detiene al agotar las plazas del plan y lo dice', async () => {
    reloj.t = 0;
    const { svc } = montar([sala('s1', 'Alfa'), sala('s2', 'Beta'), sala('s3', 'Gamma')]);
    const p = base(['s1', 's2', 's3'], 2);
    expect(await svc.anadirVarias(p)).toEqual({ anadidas: 2, yaEnAgenda: 0, noDisponibles: 0, limiteAlcanzado: true });
    expect(p.guardarLead).toHaveBeenCalledTimes(2);
  });

  it('con cero plazas no guarda nada', async () => {
    reloj.t = 0;
    const { svc } = montar([sala('s1', 'Alfa')]);
    const p = base(['s1'], 0);
    expect((await svc.anadirVarias(p)).limiteAlcanzado).toBe(true);
    expect(p.guardarLead).not.toHaveBeenCalled();
  });

  it('acota a 10 salas por petición', async () => {
    reloj.t = 0;
    const todas = Array.from({ length: 15 }, (_, i) => sala(`s${i}`, `Sala ${i}`));
    const { svc } = montar(todas);
    const p = base(todas.map((s) => s.id), 100);
    expect((await svc.anadirVarias(p)).anadidas).toBe(10);
  });
});

describe('sugerir', () => {
  it('sugiere por ciudad y género y descarta lo que la banda ya tiene', async () => {
    reloj.t = 0;
    const { svc } = montar([sala('s1', 'Alfa', { genero: 'Rock' }), sala('s2', 'Beta', { genero: 'Rock' })]);
    const r = await svc.sugerir({ ciudad: 'Madrid', genero: 'Rock' }, [{ id: 'l1', sala_id: 's1' }]);
    expect(r.map((s) => s.id)).toEqual(['s2']);
  });
});

describe('buscar', () => {
  it('encuentra la sala por nombre y ciudad aunque se escriba distinto', async () => {
    reloj.t = 0;
    const { svc } = montar([sala('s1', 'Sala Apolo')]);
    expect((await svc.buscar({ nombre: '  SALA apolo ', ciudad: 'Madrid, España' }))?.id).toBe('s1');
  });

  it('encuentra la sala por place_id y también cuando está registrada por place_id y el lead no lo trae', async () => {
    reloj.t = 0;
    const { svc } = montar([sala('s1', 'Sala Apolo', { clave: 'place:ChIJabc', place_id: 'ChIJabc' })]);
    expect((await svc.buscar({ placeId: 'ChIJabc', nombre: 'Otro nombre', ciudad: 'Otra' }))?.id).toBe('s1');
    expect((await svc.buscar({ nombre: 'Sala Apolo', ciudad: 'Madrid' }))?.id).toBe('s1');
  });

  it('sin identificación suficiente o sin coincidencia devuelve null', async () => {
    reloj.t = 0;
    const { svc } = montar([sala('s1', 'Sala Apolo')]);
    expect(await svc.buscar({ nombre: 'Sala Apolo' })).toBeNull();
    expect(await svc.buscar({})).toBeNull();
    expect(await svc.buscar({ nombre: 'Otra sala', ciudad: 'Madrid' })).toBeNull();
  });
});
