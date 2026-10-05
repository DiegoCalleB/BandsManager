import { describe, it, expect } from 'vitest';
import { mapLeadTipoToTemplateCategory, DEFAULT_CATEGORY_TEMPLATES } from '../promptsManager';

describe('mapLeadTipoToTemplateCategory', () => {
  it('mapea tipos de medios a "medios"', () => {
    expect(mapLeadTipoToTemplateCategory('medio')).toBe('medios');
    expect(mapLeadTipoToTemplateCategory('prensa')).toBe('medios');
    expect(mapLeadTipoToTemplateCategory('Radio')).toBe('medios');
    expect(mapLeadTipoToTemplateCategory('podcast')).toBe('medios');
  });

  it('mapea festivales, discotecas y grupos', () => {
    expect(mapLeadTipoToTemplateCategory('festival')).toBe('festivales');
    expect(mapLeadTipoToTemplateCategory('discoteca')).toBe('discotecas');
    expect(mapLeadTipoToTemplateCategory('club')).toBe('discotecas');
    expect(mapLeadTipoToTemplateCategory('grupo')).toBe('grupos');
    expect(mapLeadTipoToTemplateCategory('artista')).toBe('grupos');
  });

  it('mapea agencias/management/sellos a "managements"', () => {
    expect(mapLeadTipoToTemplateCategory('agencia')).toBe('managements');
    expect(mapLeadTipoToTemplateCategory('manager')).toBe('managements');
    expect(mapLeadTipoToTemplateCategory('sello')).toBe('managements');
  });

  it('mapea ayuntamientos, municipios y fiestas patronales a "ayuntamientos"', () => {
    expect(mapLeadTipoToTemplateCategory('ayuntamiento')).toBe('ayuntamientos');
    expect(mapLeadTipoToTemplateCategory('municipio')).toBe('ayuntamientos');
    expect(mapLeadTipoToTemplateCategory('fiestas patronales')).toBe('ayuntamientos');
  });

  it('cae en "salas" para tipos sin categoría propia (sala, vacío)', () => {
    expect(mapLeadTipoToTemplateCategory('sala')).toBe('salas');
    expect(mapLeadTipoToTemplateCategory(undefined)).toBe('salas');
    expect(mapLeadTipoToTemplateCategory('')).toBe('salas');
  });

  it('el resultado siempre existe como clave en DEFAULT_CATEGORY_TEMPLATES', () => {
    const tipos = ['medio', 'festival', 'discoteca', 'grupo', 'agencia', 'ayuntamiento', 'sala', undefined];
    for (const tipo of tipos) {
      const categoria = mapLeadTipoToTemplateCategory(tipo);
      expect(DEFAULT_CATEGORY_TEMPLATES[categoria]).toBeDefined();
    }
  });
});
