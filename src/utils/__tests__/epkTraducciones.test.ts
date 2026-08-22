import { describe, it, expect } from 'vitest';
import {
  recopilarTextosTraducibles,
  hayAlgoQueTraducir,
  calcularHashFuente,
  traduccionDesactualizada,
  tieneTraduccion,
  resolverContenidoEpk,
} from '../epkTraducciones';
import { EPKConfig } from '../../types';

const base: EPKConfig = {
  biografia: 'Banda de mestizaje y percusión reciclada.',
  logoUrl: '',
  bandPhotos: [],
  riderTecnico: 'PA profesional, 4 monitores.',
  enlacesRedes: {},
  contactoBooking: { nombre: 'José Filgueira', email: 'a@b.com', telefono: '600' },
  temasDestacadosIds: [],
  firmaEmail: { textoPie: 'Electrobasureo en directo' },
  miembros: [
    { id: 'm2', nombre: 'Elyar Pashang', rol: 'Guitarra', bio: 'Años tocando en la calle.' },
    { id: 'm1', nombre: 'José Filgueira', rol: 'Voz y percusión', bio: 'Músico y actor.' },
  ],
  videos: [{ id: 'v1', titulo: 'Directo en la calle', url: 'https://youtu.be/aaaaaaaaaaa' }],
  datosContratacion: { numMusicos: 4, duracionDirecto: '75', ciudadBase: 'Madrid', formatos: 'Banda completa', necesidadesEscenario: 'Escenario 5x4m' },
};

describe('recopilarTextosTraducibles', () => {
  it('recoge solo prosa, nunca nombres propios ni datos duros', () => {
    const t = recopilarTextosTraducibles(base);
    expect(t.biografia).toBe(base.biografia);
    expect(t.textoPie).toBe('Electrobasureo en directo');
    // El nombre del contacto, el email, el teléfono, el número de músicos y la ciudad base
    // no son traducibles: no pueden aparecer en el paquete que se le manda al modelo.
    const serializado = JSON.stringify(t);
    expect(serializado).not.toContain('a@b.com');
    expect(serializado).not.toContain('Madrid');
    expect(serializado).not.toContain('"numMusicos"');
    // El nombre del miembro tampoco: solo viajan su rol y su bio.
    expect(t.miembros.every(m => !('nombre' in m))).toBe(true);
  });

  it('ordena miembros y vídeos por id para que el paquete sea estable', () => {
    expect(recopilarTextosTraducibles(base).miembros.map(m => m.id)).toEqual(['m1', 'm2']);
  });

  it('descarta miembros y vídeos sin nada que traducir', () => {
    const t = recopilarTextosTraducibles({
      ...base,
      miembros: [
        { id: 'm1', nombre: 'Sin rol ni bio', rol: '', bio: '' },
        { id: 'm2', nombre: 'Con rol', rol: 'Bajo', bio: '' },
      ],
    });
    expect(t.miembros.map(m => m.id)).toEqual(['m2']);
  });

  it('aguanta un EPK vacío sin reventar', () => {
    const t = recopilarTextosTraducibles(null);
    expect(t.biografia).toBe('');
    expect(t.miembros).toEqual([]);
    expect(hayAlgoQueTraducir(t)).toBe(false);
  });
});

describe('calcularHashFuente', () => {
  it('es estable entre llamadas', () => {
    expect(calcularHashFuente(base)).toBe(calcularHashFuente(base));
  });

  it('no cambia si se reordenan los miembros (mismo contenido)', () => {
    const reordenado = { ...base, miembros: [...base.miembros!].reverse() };
    expect(calcularHashFuente(reordenado)).toBe(calcularHashFuente(base));
  });

  it('cambia si cambia cualquier texto traducible', () => {
    expect(calcularHashFuente({ ...base, biografia: 'Otra cosa' })).not.toBe(calcularHashFuente(base));
    expect(calcularHashFuente({ ...base, firmaEmail: { textoPie: 'Otro lema' } })).not.toBe(calcularHashFuente(base));
    expect(calcularHashFuente({
      ...base,
      miembros: [{ ...base.miembros![0], bio: 'Bio distinta' }, base.miembros![1]],
    })).not.toBe(calcularHashFuente(base));
  });

  it('NO cambia si solo cambian datos que no se traducen', () => {
    // Cambiar el email o la ciudad base no debe marcar la traducción como desactualizada:
    // eso obligaría a gastar una llamada a la IA sin ninguna razón.
    expect(calcularHashFuente({ ...base, contactoBooking: { ...base.contactoBooking, email: 'z@z.com' } }))
      .toBe(calcularHashFuente(base));
    expect(calcularHashFuente({ ...base, datosContratacion: { ...base.datosContratacion, ciudadBase: 'Ávila' } }))
      .toBe(calcularHashFuente(base));
  });
});

describe('traduccionDesactualizada / tieneTraduccion', () => {
  const conTraduccion = (hash: string): EPKConfig => ({
    ...base,
    traducciones: { en: { biografia: 'A blend of mestizaje.', _fuenteHash: hash } },
  });

  it('no marca nada si no hay traducción', () => {
    expect(traduccionDesactualizada(base, 'en')).toBe(false);
    expect(tieneTraduccion(base, 'en')).toBe(false);
  });

  it('detecta que el original cambió después de traducir', () => {
    const cfg = conTraduccion(calcularHashFuente(base));
    expect(traduccionDesactualizada(cfg, 'en')).toBe(false);
    expect(traduccionDesactualizada({ ...cfg, biografia: 'Texto nuevo' }, 'en')).toBe(true);
  });

  it('una traducción con todos los campos vacíos no cuenta como traducción', () => {
    expect(tieneTraduccion({ ...base, traducciones: { en: { biografia: '   ' } } }, 'en')).toBe(false);
    expect(tieneTraduccion(conTraduccion('abc'), 'en')).toBe(true);
  });
});

describe('resolverContenidoEpk', () => {
  it('en español devuelve el original y no mira las traducciones', () => {
    const cfg: EPKConfig = { ...base, traducciones: { es: { biografia: 'NO USAR' } as any } };
    expect(resolverContenidoEpk(cfg, 'es').biografia).toBe(base.biografia);
  });

  it('usa la traducción cuando existe', () => {
    const cfg: EPKConfig = {
      ...base,
      traducciones: {
        en: {
          biografia: 'A vibrant blend.',
          textoPie: 'Electrobasureo live',
          riderTecnico: 'Professional PA.',
          miembros: { m1: { rol: 'Vocals and percussion', bio: 'Musician and actor.' } },
          videos: { v1: { titulo: 'Live on the street' } },
          datosContratacion: { formatos: 'Full band', necesidadesEscenario: '5x4m stage' },
        },
      },
    };
    const c = resolverContenidoEpk(cfg, 'en');
    expect(c.biografia).toBe('A vibrant blend.');
    expect(c.textoPie).toBe('Electrobasureo live');
    expect(c.riderTecnico).toBe('Professional PA.');
    expect(c.rolMiembro(base.miembros![1])).toBe('Vocals and percussion');
    expect(c.tituloVideo(base.videos![0])).toBe('Live on the street');
    expect(c.dato('formatos')).toBe('Full band');
  });

  it('cae al original CAMPO A CAMPO si la traducción está a medias', () => {
    // Es el caso importante: una traducción parcial tiene que leerse mezclada, nunca dejar
    // huecos en blanco en un dossier de contratación.
    const cfg: EPKConfig = { ...base, traducciones: { en: { biografia: 'A vibrant blend.' } } };
    const c = resolverContenidoEpk(cfg, 'en');
    expect(c.biografia).toBe('A vibrant blend.');
    expect(c.textoPie).toBe('Electrobasureo en directo');
    expect(c.riderTecnico).toBe('PA profesional, 4 monitores.');
    expect(c.rolMiembro(base.miembros![1])).toBe('Voz y percusión');
    expect(c.dato('formatos')).toBe('Banda completa');
  });

  it('una traducción en blanco no borra el texto original', () => {
    const cfg: EPKConfig = { ...base, traducciones: { en: { biografia: '   ', riderTecnico: '' } } };
    const c = resolverContenidoEpk(cfg, 'en');
    expect(c.biografia).toBe(base.biografia);
    expect(c.riderTecnico).toBe(base.riderTecnico);
  });

  it('un miembro que no está en la traducción conserva su rol en español', () => {
    const cfg: EPKConfig = {
      ...base,
      traducciones: { en: { miembros: { m1: { rol: 'Vocals' } } } },
    };
    const c = resolverContenidoEpk(cfg, 'en');
    expect(c.rolMiembro(base.miembros![1])).toBe('Vocals');
    expect(c.rolMiembro(base.miembros![0])).toBe('Guitarra');
  });

  it('la duración numérica se resuelve como cadena', () => {
    expect(resolverContenidoEpk(base, 'en').dato('duracionDirecto')).toBe('75');
  });

  it('aguanta un idioma sin traducir y un config nulo', () => {
    expect(resolverContenidoEpk(base, 'fr').biografia).toBe(base.biografia);
    expect(resolverContenidoEpk(null, 'en').biografia).toBe('');
  });
});
