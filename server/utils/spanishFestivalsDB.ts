// Base de datos local de festivales españoles con fechas históricas
// Se actualiza anualmente. Formato: nombre normalizado → {nombre oficial, fechas}

export interface FestivalEntry {
  nombre: string;
  aliases?: string[];
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
  imagen_url?: string;
  notas?: string;
}

export const SPANISH_FESTIVALS: FestivalEntry[] = [
  // JULIO-AGOSTO - PRINCIPALES
  {
    nombre: "Festival de Benicàssim",
    aliases: ["FIB", "Benicassim", "Benicàssim Festival"],
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
    aliases: ["Bilbao BBK Live", "BBK"],
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
    aliases: ["Mad Cool"],
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
    aliases: ["Primavera Sound", "Primavera Sound BCN"],
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
    aliases: ["Sonar", "Sonar Barcelona"],
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
    aliases: ["Cruilla", "Cruïlla Barcelona"],
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
    aliases: ["Arenal Sound Burriana", "Arenal"],
    ciudad: "Burriana",
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
    aliases: ["Festival Tomavistas"],
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
    aliases: ["Vitoria Jazz"],
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
    aliases: ["Azkena", "ARF"],
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
    nombre: "Alterna Festival",
    aliases: ["Alterna", "Alterna Fest", "Festival Alterna", "Alterna El Bonillo"],
    ciudad: "El Bonillo",
    region: "Castilla-La Mancha",
    mes_inicio: 7, dia_inicio: 5, mes_fin: 7, dia_fin: 6,
    website: "https://alternafestival.es",
    email: "info@alternafestival.es",
    instagram: "@alternafestival",
    genero: "Rock, Punk, Ska, Rap, Metal, Mestizaje",
    aforo: 8000
  },
  {
    nombre: "Aúpa Lumbreiras",
    aliases: ["Aupa Lumbreiras", "Aúpa Lumbreiras!!", "Aupa Lumbreiras Villena", "Lumbreiras"],
    ciudad: "Villena",
    region: "Comunidad Valenciana",
    mes_inicio: 8, dia_inicio: 14, mes_fin: 8, dia_fin: 16,
    website: "http://www.aupalumbreiras.com",
    email: "info@aupalumbreiras.com",
    instagram: "@aupalumbreiras",
    genero: "Punk, Rock, Ska, Hardcore, Metal",
    aforo: 15000
  },
  {
    nombre: "Leyendas del Rock",
    aliases: ["Leyendas", "Leyendas del Rock Villena"],
    ciudad: "Villena",
    region: "Comunidad Valenciana",
    mes_inicio: 8, dia_inicio: 7, mes_fin: 8, dia_fin: 10,
    website: "https://www.leyendasdelrockfestival.com",
    email: "info@leyendasdelrockfestival.com",
    instagram: "@leyendasdelrock_oficial",
    genero: "Heavy Metal, Hard Rock, Power Metal, Folk Metal",
    aforo: 18000
  },
  {
    nombre: "Cabo de Plata",
    aliases: ["Cabo de Plata Barbate", "Festival Cabo de Plata"],
    ciudad: "Barbate",
    region: "Andalucía",
    mes_inicio: 7, dia_inicio: 24, mes_fin: 7, dia_fin: 27,
    website: "https://www.cabodeplata.com",
    email: "info@cabodeplata.com",
    instagram: "@cabodeplata",
    genero: "Reggae, Rap, Mestizaje, Rock, Fusion",
    aforo: 30000
  },
  {
    nombre: "O Son do Camiño",
    aliases: ["Son do Camiño", "O Son do Camino", "O Son do Camiño Santiago"],
    ciudad: "Santiago de Compostela",
    region: "Galicia",
    mes_inicio: 5, dia_inicio: 30, mes_fin: 6, dia_fin: 1,
    website: "https://www.osondocamino.es",
    email: "info@osondocamino.es",
    instagram: "@osondocamino",
    genero: "Rock, Pop, Indie, Electrónica",
    aforo: 40000
  },
  {
    nombre: "Canela Party",
    aliases: ["Canela Party Torremolinos", "Canela Fest"],
    ciudad: "Torremolinos",
    region: "Andalucía",
    mes_inicio: 8, dia_inicio: 21, mes_fin: 8, dia_fin: 24,
    website: "https://canelaparty.com",
    email: "info@canelaparty.com",
    instagram: "@canelaparty",
    genero: "Indie, Rock, Punk, Pop",
    aforo: 10000
  },
  {
    nombre: "Low Festival",
    aliases: ["Low Festival Benidorm", "Low Fest"],
    ciudad: "Benidorm",
    region: "Comunidad Valenciana",
    mes_inicio: 7, dia_inicio: 26, mes_fin: 7, dia_fin: 28,
    website: "https://lowfestival.es",
    email: "info@lowfestival.es",
    instagram: "@lowfestival",
    genero: "Indie, Rock, Electrónica, Pop",
    aforo: 25000
  },
  {
    nombre: "Palencia Sonora",
    aliases: ["Festival Palencia Sonora"],
    ciudad: "Palencia",
    region: "Castilla y León",
    mes_inicio: 6, dia_inicio: 6, mes_fin: 6, dia_fin: 9,
    website: "https://www.palenciasonora.com",
    email: "info@palenciasonora.com",
    instagram: "@palenciasonora",
    genero: "Indie, Pop, Rock",
    aforo: 8000
  },
  {
    nombre: "Inverfest Madrid",
    aliases: ["Inverfest", "Inverfest Festival", "Ciclo Inverfest"],
    ciudad: "Madrid",
    region: "Comunidad de Madrid",
    mes_inicio: 1, dia_inicio: 9, mes_fin: 2, dia_fin: 8,
    website: "https://inverfest.com",
    email: "info@inverfest.com",
    instagram: "@inverfest",
    genero: "Indie, Rock, Pop, Flamenco, Canción de Autor",
    aforo: 15000
  },
  {
    nombre: "Noches del Botánico",
    aliases: ["Noches del Botanico", "Botanico Madrid"],
    ciudad: "Madrid",
    region: "Comunidad de Madrid",
    mes_inicio: 6, dia_inicio: 4, mes_fin: 7, dia_fin: 31,
    website: "https://www.nochesdelbotanico.com",
    email: "info@nochesdelbotanico.com",
    instagram: "@nochesbotanico",
    genero: "Jazz, Rock, Pop, Flamenco, Fusion",
    aforo: 4000
  },
  {
    nombre: "Sonorama Ribera",
    aliases: ["Sonorama", "Sonorama Aranda"],
    ciudad: "Aranda de Duero",
    region: "Castilla y León",
    mes_inicio: 8, dia_inicio: 7, mes_fin: 8, dia_fin: 11,
    website: "https://sonorama-aranda.com",
    email: "booking@sonorama-aranda.com",
    instagram: "@sonoramaribera",
    genero: "Indie, Pop, Rock, Rap",
    aforo: 30000
  },
  {
    nombre: "Warm Up Estrella de Levante",
    aliases: ["Warm Up", "Warmup Murcia", "Warm Up Festival"],
    ciudad: "Murcia",
    region: "Región de Murcia",
    mes_inicio: 5, dia_inicio: 3, mes_fin: 5, dia_fin: 4,
    website: "https://warmupfestival.es",
    email: "info@warmupfestival.es",
    instagram: "@warmupfestival",
    genero: "Indie, Electrónica, Rock, Pop",
    aforo: 20000
  },
  {
    nombre: "SanSan Festival",
    aliases: ["SanSan", "SanSan Benicassim"],
    ciudad: "Benicàssim",
    region: "Comunidad Valenciana",
    mes_inicio: 3, dia_inicio: 28, mes_fin: 3, dia_fin: 30,
    website: "https://sansanfestival.com",
    email: "info@sansanfestival.com",
    instagram: "@sansanfestival",
    genero: "Indie, Pop, Rock",
    aforo: 18000
  },
  {
    nombre: "Interestelar Sevilla",
    aliases: ["Interestelar", "Interestelar Festival"],
    ciudad: "Sevilla",
    region: "Andalucía",
    mes_inicio: 5, dia_inicio: 17, mes_fin: 5, dia_fin: 18,
    website: "https://interestelarsevilla.weebly.com",
    email: "info@interestelarsevilla.com",
    instagram: "@interestelarsevilla",
    genero: "Indie, Pop, Rock",
    aforo: 20000
  },
  {
    nombre: "Festival Pirata Madrid",
    aliases: ["Pirata Madrid", "Pirata Rock Madrid", "Pirata Festival Madrid"],
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
    nombre: "Pirata Beach Festival",
    aliases: ["Pirata Beach", "Pirata Rock", "Pirata Festival", "Pirata Gandia", "Pirata Rock Gandia", "Pirata Beach Gandia"],
    ciudad: "Gandía",
    region: "Comunidad Valenciana",
    mes_inicio: 7, dia_inicio: 18, mes_fin: 7, dia_fin: 20,
    website: "https://piratafestival.com",
    email: "booking@piratafestival.com",
    instagram: "@piratarockfestival",
    genero: "Rock, Punk, Ska, Mestizaje, Rap",
    aforo: 25000
  },
  {
    nombre: "Viña Rock",
    aliases: ["Vina Rock", "Vinarock", "Festival Viña Rock"],
    ciudad: "Villarrobledo",
    region: "Castilla-La Mancha",
    mes_inicio: 4, dia_inicio: 28, mes_fin: 5, dia_fin: 1,
    website: "https://www.vina-rock.com",
    email: "info@vina-rock.com",
    instagram: "@vinarockoficial",
    genero: "Rock, Punk, Ska, Rap, Mestizaje",
    aforo: 60000
  },
  {
    nombre: "Resurrection Fest",
    aliases: ["Resu", "Resurrection Fest Viveiro", "Resurrection"],
    ciudad: "Viveiro",
    region: "Galicia",
    mes_inicio: 6, dia_inicio: 26, mes_fin: 6, dia_fin: 29,
    website: "https://www.resurrectionfest.es",
    email: "info@resurrectionfest.es",
    instagram: "@resurrectionfest",
    genero: "Metal, Hardcore, Punk, Rock",
    aforo: 30000
  },
  {
    nombre: "Rototom Sunsplash",
    aliases: ["Rototom", "Rototom Benicassim"],
    ciudad: "Benicàssim",
    region: "Comunidad Valenciana",
    mes_inicio: 8, dia_inicio: 16, mes_fin: 8, dia_fin: 21,
    website: "https://rototomsunsplash.com",
    email: "info@rototom.com",
    instagram: "@rototomsunsplash",
    genero: "Reggae, Dub, Ska, Dancehall",
    aforo: 30000
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
  }
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
  const normalizedCity = ciudad ? normalizeFestivalName(ciudad) : "";

  // 1. Exact or Alias match with City check
  for (const f of SPANISH_FESTIVALS) {
    const fNorm = normalizeFestivalName(f.nombre);
    const aliases = (f.aliases || []).map(normalizeFestivalName);
    const allNames = [fNorm, ...aliases];
    const fCityNorm = normalizeFestivalName(f.ciudad);

    const cityMatches = !normalizedCity || normalizedCity.includes(fCityNorm) || fCityNorm.includes(normalizedCity);

    const nameMatches = allNames.some(alias => 
      alias === normalized || alias.includes(normalized) || normalized.includes(alias)
    );

    if (nameMatches && cityMatches) {
      return f;
    }
  }

  // 2. Token overlap match (brand keyword + city match or brand keyword in venueName)
  for (const f of SPANISH_FESTIVALS) {
    const fNorm = normalizeFestivalName(f.nombre);
    const aliases = (f.aliases || []).map(normalizeFestivalName);
    const allNames = [fNorm, ...aliases];
    const fCityNorm = normalizeFestivalName(f.ciudad);

    const brandKeywords = allNames.map(n => n.replace(/festival|rock|beach|sound|live|music|fest/gi, '').trim()).filter(b => b.length >= 4);

    for (const kw of brandKeywords) {
      if (kw && normalized.includes(kw)) {
        const cityMatches = !normalizedCity || normalizedCity.includes(fCityNorm) || fCityNorm.includes(normalizedCity);
        if (cityMatches) return f;
      }
    }
  }

  return null;
}

export function formatFestivalDates(festival: FestivalEntry): { start: string; end: string } {
  const year = new Date().getFullYear();
  const start = `${year}-${String(festival.mes_inicio).padStart(2, "0")}-${String(festival.dia_inicio).padStart(2, "0")}`;
  const end = `${year}-${String(festival.mes_fin).padStart(2, "0")}-${String(festival.dia_fin).padStart(2, "0")}`;
  return { start, end };
}
