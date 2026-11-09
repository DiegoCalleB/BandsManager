import { describe, expect, it } from 'vitest';
import { revisarReglasDelPitch } from '../reglasPitchFestival';
import { PLANTILLA_FESTIVAL_EN, PLANTILLA_FESTIVAL_ES, redactarPitchFestival } from '../../../src/utils/plantillaFestival';

const ahora = new Date('2026-11-09T10:00:00Z');
const evitar = ['slot', 'a media tarde', 'caldear', 'platos fuertes', 'Un saludo', 'dinamizador de pista', 'ficha técnica', 'proceso de contratación'];

describe('revisarReglasDelPitch', () => {
  it('un texto de la plantilla cumple todas las reglas', () => {
    const t = redactarPitchFestival({ nombre_sala: 'Fumega Fest', ciudad: 'Betanzos', genero: 'Rock' }, { banda: 'Los Ejemplos', estiloBanda: 'electrónica y ska', ahora });
    expect(revisarReglasDelPitch(t, evitar)).toEqual([]);
  });

  it('detecta lo que prohíbe la campaña o el ADN de la banda, sin distinguir mayúsculas', () => {
    expect(revisarReglasDelPitch('Asunto: X\n\nEncajamos en esa franja A MEDIA TARDE para caldear.', evitar).join(' ')).toMatch(/a media tarde.*caldear|caldear.*a media tarde/);
  });

  it('detecta muletillas de IA, aperturas prohibidas, guiones largos y enlaces sueltos', () => {
    const motivos = revisarReglasDelPitch('Asunto: X\n\nEspero que este correo te encuentre bien. Es fundamental destacar — mira https://x.es', []).join(' | ');
    expect(motivos).toMatch(/fundamental/);
    expect(motivos).toMatch(/Espero que este correo/);
    expect(motivos).toMatch(/guion largo/);
    expect(motivos).toMatch(/enlace/);
  });

  it('avisa de huecos sin rellenar y de longitud fuera de rango', () => {
    expect(revisarReglasDelPitch('Asunto: X\n\nHola {festival}', []).join(' ')).toMatch(/hueco/);
    expect(revisarReglasDelPitch('Asunto: X\n\nCorto.', []).join(' ')).toMatch(/palabras/);
  });

  it('el asunto no cuenta como palabras del cuerpo y las plantillas por defecto cumplen el rango', () => {
    for (const plantilla of [PLANTILLA_FESTIVAL_ES, PLANTILLA_FESTIVAL_EN]) {
      const t = plantilla.replace(/\{banda\}/g, 'Los Ejemplos').replace('{estilo_banda}', 'electrónica y ska').replace(/\{festival\}/g, 'Fumega Fest').replace('{linea_publico}', 'Conocemos de sobra el pulso y la caña que pide vuestro público entre el rock.').replace('{frase_edicion}', ' Nos apetece mucho pasar por Betanzos.');
      expect(revisarReglasDelPitch(t, [])).toEqual([]);
    }
  });
});
