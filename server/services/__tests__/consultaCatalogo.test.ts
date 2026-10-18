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
