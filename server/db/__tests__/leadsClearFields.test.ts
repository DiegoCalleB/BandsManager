import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crearFakeDealsSupabase } from './helpers/fakeDealsSupabase';

const fake = crearFakeDealsSupabase();
vi.mock('../core.js', () => ({
  getSupabase: () => fake.client,
  cleanBandId: (b?: string) => (b || '').trim()
}));
vi.mock('../bands.js', () => ({ ensureRegisteredBandExists: async (b: string) => b }));

import { dbUpsertLead } from '../leads.js';

const banda = 'band-leads-test';
const sala = () => ({
  id: 'lead-1',
  band_id: banda,
  nombre_sala: 'Sala Prueba',
  ciudad: 'Madrid',
  email_contacto: 'principal@sala.es',
  email_secundario: 'eventos@sala.es',
  telefono: '600111222',
  telefono_movil: '600111222',
  notas: 'Nota antigua',
  website: 'https://sala.es',
  instagram: '@sala'
});

describe('dbUpsertLead: editar y vaciar campos de una sala', () => {
  beforeEach(() => {
    fake.tablas.leads.length = 0;
    fake.tablas.leads.push(sala());
  });

  it('por defecto (agentes, Scout, importaciones) un campo vacío CONSERVA el valor anterior', async () => {
    await dbUpsertLead({ id: 'lead-1', nombre_sala: 'Sala Prueba', email_secundario: '', notas: '' }, banda);
    const fila = fake.tablas.leads[0];
    expect(fila.email_secundario).toBe('eventos@sala.es');
    expect(fila.notas).toBe('Nota antigua');
  });

  it('con permitirVaciar, borrar el email secundario y las notas SE GUARDA', async () => {
    await dbUpsertLead({ ...sala(), email_secundario: '', notas: '' }, banda, { permitirVaciar: true });
    const fila = fake.tablas.leads[0];
    expect(fila.email_secundario).toBe('');
    expect(fila.notas).toBe('');
    // lo que no se tocó, intacto
    expect(fila.email_contacto).toBe('principal@sala.es');
    expect(fila.ciudad).toBe('Madrid');
  });

  it('con permitirVaciar, un campo que NO llega (undefined) conserva el valor existente', async () => {
    await dbUpsertLead({ id: 'lead-1', nombre_sala: 'Sala Prueba' }, banda, { permitirVaciar: true });
    const fila = fake.tablas.leads[0];
    expect(fila.email_secundario).toBe('eventos@sala.es');
    expect(fila.telefono).toBe('600111222');
    expect(fila.notas).toBe('Nota antigua');
  });

  it('cambiar un valor por otro funciona en ambos modos', async () => {
    await dbUpsertLead({ ...sala(), email_contacto: 'nuevo@sala.es' }, banda);
    expect(fake.tablas.leads[0].email_contacto).toBe('nuevo@sala.es');
    await dbUpsertLead({ ...sala(), email_contacto: 'otro@sala.es' }, banda, { permitirVaciar: true });
    expect(fake.tablas.leads[0].email_contacto).toBe('otro@sala.es');
  });

  it('con permitirVaciar se puede borrar el teléfono sin que lo repongan los móviles/fijos antiguos', async () => {
    await dbUpsertLead({ ...sala(), telefono: '', telefono_movil: '', telefono_fijo: '' }, banda, { permitirVaciar: true });
    const fila = fake.tablas.leads[0];
    expect(fila.telefono).toBe('');
    expect(fila.telefono_movil).toBe('');
  });

  it('no puede tocar una sala de otra banda aunque se mande su id', async () => {
    fake.tablas.leads.push({ ...sala(), id: 'lead-ajeno', band_id: 'band-ajena', email_secundario: 'privado@ajena.es' });
    await dbUpsertLead({ id: 'lead-ajeno', nombre_sala: 'Otra', email_secundario: '' }, banda, { permitirVaciar: true });
    expect(fake.tablas.leads.find((l) => l.id === 'lead-ajeno')?.email_secundario).toBe('privado@ajena.es');
  });
});
