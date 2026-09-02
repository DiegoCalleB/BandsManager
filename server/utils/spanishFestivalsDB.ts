// Base de datos local de festivales españoles con fechas históricas
// Se actualiza anualmente. Formato: nombre normalizado → {nombre oficial, fechas}

export interface FestivalEntry {
  nombre: string;
  ciudad: string;
  region?: string;
  mes_inicio: number; // 1-12
  dia_inicio: number; // 1-31
  mes_fin: number;
  dia_fin: number;
  email?: string;
  telefono?: string;
  website?: string;
  instagram?: string;
  direccion?: string;
  aforo?: number;
  genero?: string;
  notas?: string;
}

export const SPANISH_FESTIVALS: FestivalEntry[] = [
  // JULIO-AGOSTO - PRINCIPALES
  {
    nombre: "Festival de Benicàssim",
    ciudad: "Benicàssim",
    region: "Valencia",
    mes_inicio: 7, dia_inicio: 15, mes_fin: 7, dia_fin: 22,
    website: "https://www.fiberfib.com/",
    email: "info@fiberfib.com",
    telefono: "+34 964 30 17 78",
    instagram: "@fiberfib",
    genero: "Rock, Indie, Pop, Electrónica",
    aforo: 20000
  },
  {
    nombre: "BBK Live",
    ciudad: "Bilbao",
    region: "País Vasco",
    mes_inicio: 7, dia_inicio: 10, mes_fin: 7, dia_fin: 13,
    website: "https://www.bbklive.net/",
    email: "info@bbklive.net",
    instagram: "@bbklive",
    genero: "Rock, Pop, Indie",
    aforo: 15000
  },
  {
    nombre: "Mad Cool Festival",
    ciudad: "Madrid",
    region: "Madrid",
    mes_inicio: 7, dia_inicio: 1, mes_fin: 7, dia_fin: 7,
    website: "https://www.madcoolfestival.es/",
    email: "info@madcoolfestival.es",
    instagram: "@madcoolfestival",
    genero: "Rock, Pop, Indie, Electrónica",
    aforo: 25000
  },
  {
    nombre: "Primavera Sound Barcelona",
    ciudad: "Barcelona",
    region: "Cataluña",
    mes_inicio: 6, dia_inicio: 1, mes_fin: 6, dia_fin: 10,
    website: "https://www.primaverasound.com/",
    email: "info@primaverasound.com",
    instagram: "@primaverasound",
    genero: "Indie, Rock, Pop, Electrónica, Hip-hop",
    aforo: 20000
  },
  {
    nombre: "Sónar Barcelona",
    ciudad: "Barcelona",
    region: "Cataluña",
    mes_inicio: 6, dia_inicio: 13, mes_fin: 6, dia_fin: 15,
    website: "https://sonar.es/",
    email: "info@sonar.es",
    instagram: "@sonarbcn",
    genero: "Electrónica, Techno, House, Experimental",
    aforo: 12000
  },
  {
    nombre: "Festival Cruïlla",
    ciudad: "Barcelona",
    region: "Cataluña",
    mes_inicio: 7, dia_inicio: 15, mes_fin: 7, dia_fin: 25,
    website: "https://www.cruilla.cat/",
    email: "info@cruilla.cat",
    instagram: "@cruillabcn",
    genero: "Rock, Pop, Indie, Electrónica, Hip-hop",
    aforo: 18000
  },
  {
    nombre: "Arenal Sound",
    ciudad: "Jávea",
    region: "Valencia",
    mes_inicio: 8, dia_inicio: 1, mes_fin: 8, dia_fin: 10,
    website: "https://www.arenalsound.com/",
    email: "info@arenalsound.com",
    instagram: "@arenalsound",
    genero: "Rock, Indie, Pop, Electrónica",
    aforo: 25000
  },
  {
    nombre: "Tomavistas",
    ciudad: "Madrid",
    region: "Madrid",
    mes_inicio: 8, dia_inicio: 15, mes_fin: 8, dia_fin: 25,
    website: "https://www.tomavistas.es/",
    email: "info@tomavistas.es",
    instagram: "@tomavistas",
    genero: "Indie, Rock, Pop",
    aforo: 12000
  },
  {
    nombre: "Festival de Jazz de Vitoria",
    ciudad: "Vitoria",
    region: "País Vasco",
    mes_inicio: 8, dia_inicio: 1, mes_fin: 8, dia_fin: 20,
    website: "https://www.jazztalent.es/",
    email: "info@jazztalent.es",
    genero: "Jazz, Blues, Soul",
    aforo: 5000
  },

  // OTROS FESTIVALES
  {
    nombre: "Rock in Rio",
    ciudad: "Madrid",
    region: "Madrid",
    mes_inicio: 6, dia_inicio: 1, mes_fin: 6, dia_fin: 10,
    website: "https://www.rockinrio.es/",
    email: "info@rockinrio.es",
    instagram: "@rockinrio",
    genero: "Rock, Pop, Electrónica, Reggaeton",
    aforo: 80000
  },
  {
    nombre: "Azkena Rock Festival",
    ciudad: "Vitoria",
    region: "País Vasco",
    mes_inicio: 6, dia_inicio: 15, mes_fin: 6, dia_fin: 18,
    website: "https://www.azkenafest.com/",
    email: "info@azkenafest.com",
    instagram: "@azkenafest",
    genero: "Rock, Punk, Blues",
    aforo: 8000
  },
  {
    nombre: "Festival de Guitarra de Córdoba",
    ciudad: "Córdoba",
    region: "Andalucía",
    mes_inicio: 7, dia_inicio: 1, mes_fin: 7, dia_fin: 31,
    website: "https://www.guitarracordoba.com/",
    email: "info@guitarracordoba.com",
    genero: "Guitarra, Flamenco, Clásica",
    aforo: 2000
  },
  {
    nombre: "Festival de Música de Nerja",
    ciudad: "Nerja",
    region: "Andalucía",
    mes_inicio: 7, dia_inicio: 1, mes_fin: 8, dia_fin: 31,
    website: "https://www.festivalneria.com/",
    email: "info@festivalneria.com",
    genero: "Clásica, Ópera, Cámara",
    aforo: 3000
  },
  {
    nombre: "Festival Pirata Madrid",
    ciudad: "Madrid",
    region: "Comunidad de Madrid",
    mes_inicio: 10, dia_inicio: 4, mes_fin: 10, dia_fin: 5,
    website: "https://piratafestival.com",
    email: "info@piratafestival.com",
    instagram: "@piratafestival",
    genero: "Rock, Punk, Ska, Rap, Mestizaje",
    aforo: 15000
  },
  {
    nombre: "Pirata Rock",
    ciudad: "Gandía",
    region: "Valencia",
    mes_inicio: 7, dia_inicio: 18, mes_fin: 7, dia_fin: 20,
    website: "https://piratafestival.com",
    email: "info@piratafestival.com",
    instagram: "@piratafestival",
    genero: "Rock, Punk, Ska, Mestizaje",
    aforo: 20000
  },
  {
    nombre: "Festival de Flamenco de Córdoba",
    ciudad: "Córdoba",
    region: "Andalucía",
    mes_inicio: 10, dia_inicio: 1, mes_fin: 10, dia_fin: 31,
    website: "https://www.flamencocordoba.com/",
    email: "info@flamencocordoba.com",
    genero: "Flamenco",
    aforo: 2000
  },
];

// Normaliza nombres para búsqueda (elimina acentos, espacios extras, etc.)
function normalizeFestivalName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // elimina acentos
    .replace(/[^a-z0-9\s]/g, "") // elimina puntuación
    .replace(/\s+/g, " ")
    .trim();
}

export function searchFestivalByName(venueName: string, ciudad?: string): FestivalEntry | null {
  if (!venueName) return null;

  const normalized = normalizeFestivalName(venueName);

  // Búsqueda exacta o parcial
  const match = SPANISH_FESTIVALS.find(f => {
    const fNormalized = normalizeFestivalName(f.nombre);
    const cityMatch = !ciudad || normalizeFestivalName(ciudad).includes(normalizeFestivalName(f.ciudad));

    return (fNormalized.includes(normalized) || normalized.includes(fNormalized)) && cityMatch;
  });

  return match || null;
}

export function formatFestivalDates(festival: FestivalEntry): { start: string; end: string } {
  const year = new Date().getFullYear();
  const start = `${year}-${String(festival.mes_inicio).padStart(2, "0")}-${String(festival.dia_inicio).padStart(2, "0")}`;
  const end = `${year}-${String(festival.mes_fin).padStart(2, "0")}-${String(festival.dia_fin).padStart(2, "0")}`;
  return { start, end };
}
