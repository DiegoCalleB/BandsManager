import { Song } from '../types';

export const SAMPLE_REPERTOIRE_SONGS: Song[] = [
  {
    id: 'sample-song-1',
    titulo: 'Brisa y Cacharros',
    duracion: '03:30',
    duracionSegundos: 210,
    tonalidad: 'Am',
    bpm: 124,
    afinacion: 'E Standard',
    albumDisco: 'Álbum Debut',
    estadoTema: 'listo',
    esVersionCovers: false,
    cifradoTexto: '[Intro]\n[Am] [F] [C] [G]\n\n[Estrofa]\n[Am]Sopla el viento en la ciudad...\n[F]Suenan cacharros al pasar...',
    notasInternas: 'Intro con sección de vientos y solo de trompeta. Tema ideal para abrir el concierto.'
  },
  {
    id: 'sample-song-2',
    titulo: 'Fuego en la Sala',
    duracion: '04:12',
    duracionSegundos: 252,
    tonalidad: 'Em',
    bpm: 138,
    afinacion: 'E Standard',
    albumDisco: 'Álbum Debut',
    estadoTema: 'listo',
    esVersionCovers: false,
    cifradoTexto: '[Intro]\n[Em] [D] [C] [B7]\n\n[Estribillo]\n[Em]Hay fuego en la sala, ¡sal a bailar!\n[D]El ska no perdona, retumba el compás...',
    notasInternas: 'Subida progresiva al final. Tema estelar para clímax o cierre en festival.'
  },
  {
    id: 'sample-song-3',
    titulo: 'Noches de Garaje',
    duracion: '03:45',
    duracionSegundos: 225,
    tonalidad: 'Dm',
    bpm: 115,
    afinacion: 'Drop D',
    albumDisco: 'EP Cacharros & Ritmo',
    estadoTema: 'listo',
    esVersionCovers: false,
    cifradoTexto: '[Intro]\n[Dm] [Bb] [F] [C]\n\n[Verso]\n[Dm]Luces rojas en el local...\n[Bb]Sudor y cables por el suelo...',
    notasInternas: 'Afinación en Drop D. Recordar cambio de instrumento antes de arrancar.'
  },
  {
    id: 'sample-song-4',
    titulo: 'Ska del Norte',
    duracion: '03:15',
    duracionSegundos: 195,
    tonalidad: 'A',
    bpm: 152,
    afinacion: 'E Standard',
    albumDisco: 'Single',
    estadoTema: 'listo',
    esVersionCovers: false,
    cifradoTexto: '[Intro]\n[A] [D] [E] [A]\n\n[Estribillo]\n[A]Bailando ska del norte hasta el amanecer...',
    notasInternas: 'Ritmo acelerado ska. Excelente para levantar la energía a mitad del pase.'
  },
  {
    id: 'sample-song-5',
    titulo: 'Maldita Dulzura (Cover)',
    duracion: '03:40',
    duracionSegundos: 220,
    tonalidad: 'C',
    bpm: 110,
    afinacion: 'E Standard',
    albumDisco: 'Covers & Versiones',
    estadoTema: 'listo',
    esVersionCovers: true,
    cifradoTexto: '[Verso]\n[C] [G] [Am] [F]\n\n[Estribillo]\n[C]Maldita dulzura la tuya...\n[G]me atrapa y me aleja de todo...',
    notasInternas: 'Versión adaptada a metales y ritmo festivo.'
  }
];

export function getSampleRepertoireForNewBand(bandName = 'Mi Banda'): Song[] {
  return SAMPLE_REPERTOIRE_SONGS.map((song, index) => ({
    ...song,
    id: `sample-${bandName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${index + 1}`
  }));
}
