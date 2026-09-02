// Base de datos local de festivales españoles con fechas históricas
// Se actualiza anualmente. Formato: nombre normalizado → {nombre oficial, fechas}

export interface FestivalEntry {
  nombre: string;
  ciudad: string;
  mes_inicio: number; // 1-12
  dia_inicio: number; // 1-31
  mes_fin: number;
  dia_fin: number;
  notas?: string;
}

export const SPANISH_FESTIVALS: FestivalEntry[] = [
  // ENERO
  { nombre: "Festival de Músicas del Mundo de Cádiz", ciudad: "Cádiz", mes_inicio: 1, dia_inicio: 15, mes_fin: 1, dia_fin: 25 },

  // FEBRERO
  { nombre: "Carnaval de Cádiz", ciudad: "Cádiz", mes_inicio: 2, dia_inicio: 1, mes_fin: 2, dia_fin: 15 },
  { nombre: "Sónar Barcelona", ciudad: "Barcelona", mes_inicio: 6, dia_inicio: 13, mes_fin: 6, dia_fin: 15 },

  // MARZO
  { nombre: "Festival de Mérida", ciudad: "Mérida", mes_inicio: 3, dia_inicio: 1, mes_fin: 5, dia_fin: 31 },

  // ABRIL
  { nombre: "Feria de Abril de Sevilla", ciudad: "Sevilla", mes_inicio: 4, dia_inicio: 1, mes_fin: 4, dia_fin: 15 },
  { nombre: "Día de Andalucía", ciudad: "Andalucía", mes_inicio: 2, dia_inicio: 28, mes_fin: 3, dia_fin: 1 },

  // MAYO
  { nombre: "Festiberia", ciudad: "Getafe", mes_inicio: 5, dia_inicio: 1, mes_fin: 5, dia_fin: 31 },
  { nombre: "Veranos de la Villa", ciudad: "Madrid", mes_inicio: 6, dia_inicio: 1, mes_fin: 8, dia_fin: 31 },

  // JUNIO
  { nombre: "Festival de Música de Mérida", ciudad: "Mérida", mes_inicio: 6, dia_inicio: 1, mes_fin: 8, dia_fin: 31 },
  { nombre: "Vive Latino", ciudad: "Madrid", mes_inicio: 6, dia_inicio: 1, mes_fin: 6, dia_fin: 30 },
  { nombre: "Mad Cool Festival", ciudad: "Madrid", mes_inicio: 7, dia_inicio: 1, mes_fin: 7, dia_fin: 7 },
  { nombre: "Festival Cruïlla", ciudad: "Barcelona", mes_inicio: 7, dia_inicio: 15, mes_fin: 7, dia_fin: 25 },

  // JULIO
  { nombre: "Festival de Benicàssim", ciudad: "Benicàssim", mes_inicio: 7, dia_inicio: 15, mes_fin: 7, dia_fin: 22 },
  { nombre: "BBK Live", ciudad: "Bilbao", mes_inicio: 7, dia_inicio: 10, mes_fin: 7, dia_fin: 13 },
  { nombre: "Primavera Sound Barcelona", ciudad: "Barcelona", mes_inicio: 6, dia_inicio: 1, mes_fin: 6, dia_fin: 10 },
  { nombre: "Festival de Guitarra de Córdoba", ciudad: "Córdoba", mes_inicio: 7, dia_inicio: 1, mes_fin: 7, dia_fin: 31 },
  { nombre: "Arenal Sound", ciudad: "Jávea", mes_inicio: 8, dia_inicio: 1, mes_fin: 8, dia_fin: 10 },

  // AGOSTO
  { nombre: "Festival de Jazz de Vitoria", ciudad: "Vitoria", mes_inicio: 8, dia_inicio: 1, mes_fin: 8, dia_fin: 20 },
  { nombre: "Tomavistas", ciudad: "Madrid", mes_inicio: 8, dia_inicio: 15, mes_fin: 8, dia_fin: 25 },
  { nombre: "Festival de Música de Castell de Peralada", ciudad: "Peralada", mes_inicio: 7, dia_inicio: 15, mes_fin: 8, dia_fin: 31 },
  { nombre: "Sónar Lisboa", ciudad: "Lisboa", mes_inicio: 8, dia_inicio: 1, mes_fin: 8, dia_fin: 5 },

  // SEPTIEMBRE
  { nombre: "Festival de Jazz de San Sebastián", ciudad: "San Sebastián", mes_inicio: 7, dia_inicio: 25, mes_fin: 8, dia_fin: 5 },
  { nombre: "Salónica Rock", ciudad: "Zaragoza", mes_inicio: 9, dia_inicio: 1, mes_fin: 9, dia_fin: 10 },

  // OCTUBRE
  { nombre: "Festival de Flamenco de Córdoba", ciudad: "Córdoba", mes_inicio: 10, dia_inicio: 1, mes_fin: 10, dia_fin: 31 },
  { nombre: "Festival de Jazz de Madrid", ciudad: "Madrid", mes_inicio: 11, dia_inicio: 1, mes_fin: 11, dia_fin: 30 },

  // NOVIEMBRE
  { nombre: "Festival de Máscaras de Mondoñedo", ciudad: "Mondoñedo", mes_inicio: 11, dia_inicio: 1, mes_fin: 11, dia_fin: 15 },

  // DICIEMBRE
  { nombre: "Navidad en la Puerta del Sol", ciudad: "Madrid", mes_inicio: 12, dia_inicio: 1, mes_fin: 1, dia_fin: 6 },

  // FESTIVALES MENORES / REGIONALES
  { nombre: "Festival de Música de Sitges", ciudad: "Sitges", mes_inicio: 10, dia_inicio: 1, mes_fin: 10, dia_fin: 31 },
  { nombre: "Festival de Música de Soria", ciudad: "Soria", mes_inicio: 8, dia_inicio: 1, mes_fin: 8, dia_fin: 31 },
  { nombre: "Rock in Rio", ciudad: "Madrid", mes_inicio: 6, dia_inicio: 1, mes_fin: 6, dia_fin: 10 },
  { nombre: "Festival de Música de Alcalá", ciudad: "Alcalá de Henares", mes_inicio: 7, dia_inicio: 1, mes_fin: 7, dia_fin: 31 },
  { nombre: "Festival de Jazz de Getxo", ciudad: "Getxo", mes_inicio: 8, dia_inicio: 1, mes_fin: 8, dia_fin: 15 },
  { nombre: "Azkena Rock Festival", ciudad: "Vitoria", mes_inicio: 6, dia_inicio: 15, mes_fin: 6, dia_fin: 18 },
  { nombre: "Festival de Riojas", ciudad: "Logroño", mes_inicio: 8, dia_inicio: 15, mes_fin: 8, dia_fin: 25 },
  { nombre: "Intrusión Festival", ciudad: "Málaga", mes_inicio: 8, dia_inicio: 20, mes_fin: 8, dia_fin: 25 },
  { nombre: "Festicket", ciudad: "Barcelona", mes_inicio: 9, dia_inicio: 1, mes_fin: 9, dia_fin: 30 },
  { nombre: "Festival de Música de Nerja", ciudad: "Nerja", mes_inicio: 7, dia_inicio: 1, mes_fin: 8, dia_fin: 31 },
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
