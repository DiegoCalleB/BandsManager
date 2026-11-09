import { describe, it, expect } from 'vitest';
import { formularioDeContacto, viaDeContacto, MARCA_FORMULARIO } from '../contactoPorFormulario';

describe('formularioDeContacto', () => {
  it('lee la url del formulario que la nota guarda tras «Formulario de contacto:»', () => {
    expect(formularioDeContacto({ notas: `${MARCA_FORMULARIO} https://piratafestival.com/es/contacto/formulario` })).toBe('https://piratafestival.com/es/contacto/formulario');
  });
  it('encuentra el formulario entre otras notas separadas por «|»', () => {
    const notas = 'Orienta a rock | Formulario de contacto: https://a.es/contacto/ | Instagram: x';
    expect(formularioDeContacto({ notas })).toBe('https://a.es/contacto/');
  });
  it('quita puntuación final pegada a la url', () => {
    expect(formularioDeContacto({ notas: 'Formulario de contacto: https://a.es/form.' })).toBe('https://a.es/form');
  });
  it('sin formulario, null', () => {
    expect(formularioDeContacto({ notas: 'Sin nada' })).toBeNull();
    expect(formularioDeContacto({ notas: null })).toBeNull();
    expect(formularioDeContacto({})).toBeNull();
  });
  it('solo http(s): nada de javascript: ni otros esquemas', () => {
    expect(formularioDeContacto({ notas: 'Formulario de contacto: javascript:alert(1)' })).toBeNull();
  });
  it('no confunde el formulario de prensa con el de contacto', () => {
    expect(formularioDeContacto({ notas: 'Formulario de prensa: https://a.es/prensa' })).toBeNull();
  });
});

describe('viaDeContacto', () => {
  it('email antes que nada', () => expect(viaDeContacto({ email_contacto: 'a@b.es', notas: 'Formulario de contacto: https://a.es/f' })).toBe('email'));
  it('sin email: formulario, luego Instagram, luego teléfono', () => {
    expect(viaDeContacto({ email_contacto: '', notas: 'Formulario de contacto: https://a.es/f', instagram: '@x' })).toBe('formulario');
    expect(viaDeContacto({ email_contacto: '', instagram: '@x' })).toBe('instagram');
    expect(viaDeContacto({ email_contacto: '', telefono: '600000000' })).toBe('telefono');
    expect(viaDeContacto({ email_contacto: '' })).toBe('ninguna');
  });
});
