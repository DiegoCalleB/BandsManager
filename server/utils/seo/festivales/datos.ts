/**
 * Fichas del directorio de festivales. Añadir una = abrir un pull request con la ficha y su fuente.
 * Reglas: nada se inventa (si no se puede comprobar, se omite el campo) y `verificadoEn` es el día real de la comprobación.
 */
import type { Festival } from './tipos.js';

export const FESTIVALES: readonly Festival[] = [
  {
    slug: 'fim-vila-seca',
    nombre: 'FiM Vila-seca',
    ciudad: 'Vila-seca',
    provincia: 'Tarragona',
    pais: 'ES',
    estilos: ['emergente'],
    web: 'https://www.fim.cat/',
    fuente: 'https://www.fim.cat/es/profesionales/convocatoria-artistica-2027/',
    verificadoEn: '2026-10-19',
    descripcion: {
      es: 'Feria de música emergente y familiar de Vila-seca (Tarragona).',
      en: 'Emerging and family music fair in Vila-seca (Tarragona, Spain).',
    },
    edicion: { inicio: '2027-05-06', fin: '2027-05-09' },
    convocatoria: {
      url: 'https://www.fim.cat/es/profesionales/convocatoria-artistica-2027/',
      cierre: '2026-10-23',
      resumen: {
        es: 'Convocatoria artística 2027 para proyectos emergentes en fase inicial de carrera. Pueden presentarse grupos de Cataluña (con algún miembro residente o que ensaye allí). La inscripción se hace en pro.fim.cat.',
        en: 'Artistic call for the 2027 programme, for emerging acts at the start of their career. Groups from Catalonia can apply (a member lives or rehearses there). Applications go through pro.fim.cat.',
      },
    },
  },
  {
    slug: 'actual-logrono',
    nombre: 'Actual · Guerra de Bandas',
    ciudad: 'Logroño',
    provincia: 'La Rioja',
    pais: 'ES',
    estilos: ['emergente'],
    fuente: 'https://www.eldiario.es/la-rioja/guerra-bandas-trampolin-actual-2028-buscan-grupos-emergentes-13-edicion_1_13440466.html',
    verificadoEn: '2026-10-19',
    descripcion: {
      es: 'Concurso de bandas emergentes del festival Actual (Logroño): diez finalistas tocan en directo y el ganador entra en el cartel de Actual 2028.',
      en: 'Emerging-band contest of the Actual festival (Logroño): ten finalists play live and the winner joins the Actual 2028 line-up.',
    },
    convocatoria: {
      url: 'https://www.eldiario.es/la-rioja/guerra-bandas-trampolin-actual-2028-buscan-grupos-emergentes-13-edicion_1_13440466.html',
      resumen: {
        es: 'Decimotercera edición del concurso. Inscripción abierta desde el 12 de agosto; final en directo del 2 al 4 de enero de 2027 en la Sala Fundición. El premio son 2.500 € y entrar en el cartel de Actual 2028. No hemos podido confirmar el plazo de cierre: consulta las bases.',
        en: '13th edition of the contest. Registration opened on 12 August; live finals on 2 to 4 January 2027 at Sala Fundición. The prize is €2,500 and a place in the Actual 2028 line-up. We could not confirm the closing date: check the rules.',
      },
    },
  },
];
