/** Textos de interfaz del directorio de festivales. */
import type { IdiomaSeo } from '../rutas.js';
import type { EstiloFestival } from './tipos.js';

export const ESTILOS: Record<IdiomaSeo, Record<EstiloFestival, string>> = {
  es: { rock: 'Rock', indie: 'Indie', pop: 'Pop', metal: 'Metal', electronica: 'Electrónica', folk: 'Folk', jazz: 'Jazz', urbano: 'Urbano', emergente: 'Bandas emergentes' },
  en: { rock: 'Rock', indie: 'Indie', pop: 'Pop', metal: 'Metal', electronica: 'Electronic', folk: 'Folk', jazz: 'Jazz', urbano: 'Urban', emergente: 'Emerging bands' },
};

export const TEXTOS_FESTIVALES = {
  es: {
    titulo: 'Festivales y convocatorias para bandas | BandManager',
    descripcion: 'Festivales de España que programan bandas, con convocatorias abiertas y plazos. Cada ficha enlaza su fuente y la fecha en que se comprobó.',
    h1: 'Festivales y convocatorias para bandas',
    intro: 'Un directorio pequeño y cuidado: solo fichas que hemos comprobado contra una fuente y con la fecha de la comprobación a la vista. Una ficha que lleva un año sin revisarse desaparece.',
    abiertas: 'Convocatorias abiertas',
    todos: 'Todos los festivales',
    sinAbiertas: 'Ahora mismo no hay ninguna convocatoria abierta con plazo confirmado.',
    metodo: 'Cómo mantenemos los datos',
    metodoTexto: 'Los datos entran por revisión: cada ficha lleva su fuente y el día en que se comprobó, y caduca al año. Si ves algo desactualizado, escríbenos a info@bandmanager.io y lo revisamos contra la fuente.',
    dondeEsta: 'Dónde', estilo: 'Estilo', edicion: 'Próxima edición', convocatoria: 'Convocatoria', plazo: 'Plazo de inscripción',
    fuente: 'Fuente', verificado: 'Comprobado el', web: 'Web oficial', verBases: 'Ver bases y inscripción',
    abierta: 'Abierta', cerrada: 'Cerrada', sinPlazo: 'Plazo sin confirmar', sinConvocatoria: 'Sin convocatoria publicada',
    consejo: 'Antes de escribir', consejoTexto: 'Lee las bases en la fuente oficial: los plazos y requisitos cambian cada edición. Y prepara el EPK y un correo corto; tienes cómo hacerlo en la guía.',
    guia: 'Cómo presentar tu banda a un festival', volver: 'Todos los festivales', noEncontradoTitulo: 'Festival no encontrado · BandManager', noEncontradoH1: 'Esta ficha no está disponible',
    noEncontradoIntro: 'Puede que haya caducado o que no exista. Mira el resto del directorio.',
    ctaTitulo: 'Lleva el seguimiento de tus envíos', ctaTexto: 'Guarda a qué festivales has escrito, cuándo y qué te contestaron, en un solo sitio.', ctaBoton: 'Crear cuenta gratis',
    enBreve: (n: string) => `${n} · ficha del directorio de festivales de BandManager`,
    tituloFicha: (n: string, c: string) => `${n} (${c}): convocatoria y datos | BandManager`,
  },
  en: {
    titulo: 'Festivals and open calls for bands | BandManager',
    descripcion: 'Festivals in Spain that book bands, with open calls and deadlines. Every listing links its source and the date it was checked.',
    h1: 'Festivals and open calls for bands',
    intro: 'A small, carefully kept directory: only listings we have checked against a source, with the date of the check in plain sight. A listing that has gone a year without review disappears.',
    abiertas: 'Open calls',
    todos: 'All festivals',
    sinAbiertas: 'There is no open call with a confirmed deadline right now.',
    metodo: 'How we keep the data right',
    metodoTexto: 'Data goes in through review: every listing carries its source and the day it was checked, and expires after a year. If something looks out of date, write to info@bandmanager.io and we will check it against the source.',
    dondeEsta: 'Where', estilo: 'Style', edicion: 'Next edition', convocatoria: 'Open call', plazo: 'Application deadline',
    fuente: 'Source', verificado: 'Checked on', web: 'Official website', verBases: 'See rules and apply',
    abierta: 'Open', cerrada: 'Closed', sinPlazo: 'Deadline not confirmed', sinConvocatoria: 'No call published',
    consejo: 'Before you write', consejoTexto: 'Read the rules at the official source: deadlines and requirements change every edition. And have your EPK and a short email ready; the guide shows how.',
    guia: 'How to pitch your band to a festival', volver: 'All festivals', noEncontradoTitulo: 'Festival not found · BandManager', noEncontradoH1: 'This listing is not available',
    noEncontradoIntro: 'It may have expired or never existed. Browse the rest of the directory.',
    ctaTitulo: 'Keep track of your submissions', ctaTexto: 'Save which festivals you wrote to, when, and what they replied, all in one place.', ctaBoton: 'Create a free account',
    enBreve: (n: string) => `${n} · listing in the BandManager festival directory`,
    tituloFicha: (n: string, c: string) => `${n} (${c}): open call and details | BandManager`,
  },
} as const;
