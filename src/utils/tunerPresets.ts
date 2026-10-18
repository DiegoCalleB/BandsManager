export interface PresetString {
  note: string;
  octave: number;
  freq: number;
  label: string; // e.g."6ª - E2"
}

export interface TunerPreset {
  id: string;
  name: string;
  category: "guitar" | "bass" | "ukulele";
  description?: string;
  strings: PresetString[];
}

export const TunerPresets: TunerPreset[] = [
  {
    id: "guitar_std",
    name: "Guitarra Estándar (E A D G B E)",
    category: "guitar",
    description: "6 cuerdas estándar (Mi, La, Re, Sol, Si, Mi)",
    strings: [
      { note: "E", octave: 2, freq: 82.41, label: "6ª cuerda - E2 (Grave)" },
      { note: "A", octave: 2, freq: 110.0, label: "5ª cuerda - A2" },
      { note: "D", octave: 3, freq: 146.83, label: "4ª cuerda - D3" },
      { note: "G", octave: 3, freq: 196.0, label: "3ª cuerda - G3" },
      { note: "B", octave: 3, freq: 246.94, label: "2ª cuerda - B3" },
      { note: "E", octave: 4, freq: 329.63, label: "1ª cuerda - E4 (Aguda)" },
    ],
  },
  {
    id: "guitar_dropd",
    name: "Guitarra Drop D (D A D G B E)",
    category: "guitar",
    description: "Afinación en Re grave para rock y metal",
    strings: [
      { note: "D", octave: 2, freq: 73.42, label: "6ª cuerda - D2 (Drop D)" },
      { note: "A", octave: 2, freq: 110.0, label: "5ª cuerda - A2" },
      { note: "D", octave: 3, freq: 146.83, label: "4ª cuerda - D3" },
      { note: "G", octave: 3, freq: 196.0, label: "3ª cuerda - G3" },
      { note: "B", octave: 3, freq: 246.94, label: "2ª cuerda - B3" },
      { note: "E", octave: 4, freq: 329.63, label: "1ª cuerda - E4" },
    ],
  },
  {
    id: "guitar_7",
    name: "Guitarra 7 Cuerdas (B E A D G B E)",
    category: "guitar",
    description: "Guitarra de rango extendido con Si grave",
    strings: [
      { note: "B", octave: 1, freq: 61.74, label: "7ª cuerda - B1" },
      { note: "E", octave: 2, freq: 82.41, label: "6ª cuerda - E2" },
      { note: "A", octave: 2, freq: 110.0, label: "5ª cuerda - A2" },
      { note: "D", octave: 3, freq: 146.83, label: "4ª cuerda - D3" },
      { note: "G", octave: 3, freq: 196.0, label: "3ª cuerda - G3" },
      { note: "B", octave: 3, freq: 246.94, label: "2ª cuerda - B3" },
      { note: "E", octave: 4, freq: 329.63, label: "1ª cuerda - E4" },
    ],
  },
  {
    id: "ukulele_std",
    name: "Ukelele Estándar / High-G (G C E A)",
    category: "ukulele",
    description: "Afinación reentrante tradicional (Soprano, Concierto, Tenor)",
    strings: [
      {
        note: "G",
        octave: 4,
        freq: 392.0,
        label: "4ª cuerda - G4 (Sol agudo / High-G)",
      },
      { note: "C", octave: 4, freq: 261.63, label: "3ª cuerda - C4 (Do)" },
      { note: "E", octave: 4, freq: 329.63, label: "2ª cuerda - E4 (Mi)" },
      { note: "A", octave: 4, freq: 440.0, label: "1ª cuerda - A4 (La)" },
    ],
  },
  {
    id: "ukulele_lowg",
    name: "Ukelele Low-G (G C E A - Sol Grave)",
    category: "ukulele",
    description: "Sol grave en 4ª cuerda, ideal para melodías y fingerpicking",
    strings: [
      {
        note: "G",
        octave: 3,
        freq: 196.0,
        label: "4ª cuerda - G3 (Sol grave / Low-G)",
      },
      { note: "C", octave: 4, freq: 261.63, label: "3ª cuerda - C4 (Do)" },
      { note: "E", octave: 4, freq: 329.63, label: "2ª cuerda - E4 (Mi)" },
      { note: "A", octave: 4, freq: 440.0, label: "1ª cuerda - A4 (La)" },
    ],
  },
  {
    id: "ukulele_baritone",
    name: "Ukelele Barítono (D G B E)",
    category: "ukulele",
    description: "Afinación estándar del ukelele barítono (Re, Sol, Si, Mi)",
    strings: [
      { note: "D", octave: 3, freq: 146.83, label: "4ª cuerda - D3 (Re)" },
      { note: "G", octave: 3, freq: 196.0, label: "3ª cuerda - G3 (Sol)" },
      { note: "B", octave: 3, freq: 246.94, label: "2ª cuerda - B3 (Si)" },
      { note: "E", octave: 4, freq: 329.63, label: "1ª cuerda - E4 (Mi)" },
    ],
  },
  {
    id: "ukulele_d",
    name: "Ukelele Afinación en D (A D F# B)",
    category: "ukulele",
    description: "Afinación hawaiana tradicional un tono más aguda",
    strings: [
      { note: "A", octave: 4, freq: 440.0, label: "4ª cuerda - A4 (La)" },
      { note: "D", octave: 4, freq: 293.66, label: "3ª cuerda - D4 (Re)" },
      { note: "F#", octave: 4, freq: 369.99, label: "2ª cuerda - F#4 (Fa#)" },
      { note: "B", octave: 4, freq: 493.88, label: "1ª cuerda - B4 (Si)" },
    ],
  },
  {
    id: "bass_4",
    name: "Bajo Eléctrico 4 Cuerdas (E A D G)",
    category: "bass",
    description: "4 cuerdas estándar (Mi, La, Re, Sol)",
    strings: [
      { note: "E", octave: 1, freq: 41.2, label: "4ª cuerda - E1 (Grave)" },
      { note: "A", octave: 1, freq: 55.0, label: "3ª cuerda - A1" },
      { note: "D", octave: 2, freq: 73.42, label: "2ª cuerda - D2" },
      { note: "G", octave: 2, freq: 98.0, label: "1ª cuerda - G2 (Aguda)" },
    ],
  },
  {
    id: "bass_5",
    name: "Bajo Eléctrico 5 Cuerdas (B E A D G)",
    category: "bass",
    description: "5 cuerdas con Si super grave adicional",
    strings: [
      {
        note: "B",
        octave: 0,
        freq: 30.87,
        label: "5ª cuerda - B0 (Super Grave)",
      },
      { note: "E", octave: 1, freq: 41.2, label: "4ª cuerda - E1" },
      { note: "A", octave: 1, freq: 55.0, label: "3ª cuerda - A1" },
      { note: "D", octave: 2, freq: 73.42, label: "2ª cuerda - D2" },
      { note: "G", octave: 2, freq: 98.0, label: "1ª cuerda - G2" },
    ],
  },
];
