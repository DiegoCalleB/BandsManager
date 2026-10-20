import { describe, it, expect } from 'vitest';
import { SALAS_BANDFLOW } from '../bandflowSalas.js';
import { claveSala, emailDeRol, telefonoFijoEs } from '../../utils/salaCatalogo.js';

/** La semilla se guarda en el repositorio: estas comprobaciones impiden que alguien la regenere o edite metiendo datos de personas. */
describe('semilla de Bandflow', () => {
  it('no está vacía y cada sala se puede identificar', () => {
    expect(SALAS_BANDFLOW.length).toBeGreaterThan(200);
    for (const s of SALAS_BANDFLOW) {
      expect(s.nombre.length).toBeGreaterThan(0);
      expect(s.ciudad).toBeTruthy();
      expect(s.clave).toBe(claveSala({ nombre: s.nombre, ciudad: s.ciudad }));
    }
  });

  it('no repite salas', () => {
    expect(new Set(SALAS_BANDFLOW.map((s) => s.clave)).size).toBe(SALAS_BANDFLOW.length);
  });

  it('solo lleva contacto de la sala: email de rol y teléfono fijo', () => {
    for (const s of SALAS_BANDFLOW) {
      if (s.email_contacto) expect(emailDeRol(s.email_contacto), s.email_contacto).toBe(s.email_contacto);
      if (s.telefono) expect(telefonoFijoEs(s.telefono), s.telefono).toBe(s.telefono);
    }
  });

  it('no lleva fotos, reseñas ni descripciones: solo campos del catálogo', () => {
    const permitidos = new Set(['clave', 'place_id', 'nombre', 'ciudad', 'region', 'direccion', 'tipo', 'aforo', 'genero', 'website', 'instagram', 'email_contacto', 'telefono']);
    for (const s of SALAS_BANDFLOW) for (const k of Object.keys(s)) expect(permitidos.has(k), k).toBe(true);
  });
});
