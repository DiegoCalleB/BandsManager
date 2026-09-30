import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import { Lead } from "../types";
import {
  MapPin,
  Navigation,
  Eye,
  Check,
  Loader2,
  RefreshCw,
  Layers,
} from "lucide-react";
import { escapeHtml } from "../utils/escapeHtml";

interface VenueMapProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (leadId: string, data: Partial<Lead>) => void;
  activeCityFilter?: string;
  activeRegionFilter?: string;
}

// Available map tile presets for best clarity & readability (100% Free & No API Key Required)
type MapStyleKey = "streets" | "osm" | "satellite" | "positron" | "dark";

const MAP_STYLES: Record<
  MapStyleKey,
  { name: string; url: string; attr: string }
> = {
  streets: {
    name: "Callejero Claro (Recomendado)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attr: "&copy; Esri &mdash; OpenStreetMap contributors",
  },
  osm: {
    name: "OpenStreetMap Detallado",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attr: "&copy; OpenStreetMap contributors",
  },
  satellite: {
    name: "Satélite Híbrido (Estilo Google Maps)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr: "&copy; Esri World Imagery",
  },
  positron: {
    name: "⚪ Gris Minimalista",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attr: "&copy; Esri &mdash; Light Gray Canvas",
  },
  dark: {
    name: "Oscuro Nocturno",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attr: "&copy; Esri &mdash; Dark Gray Canvas",
  },
};

// Pre-loaded coordinates dictionary for Iconic Spanish Venues & Concert Halls
const KNOWN_VENUES_GEO: Record<string, [number, number]> = {
  // Madrid & alrededores
  revilive: [40.4005, -3.5973], // C. los Cavilas, 4, Vicálvaro, 28052 Madrid
  "revi live": [40.4005, -3.5973],
  revirock: [40.4005, -3.5973],
  "revi rock": [40.4005, -3.5973],
  "la riviera": [40.4147, -3.7258],
  wizink: [40.4239, -3.6717],
  "wizink center": [40.4239, -3.6717],
  "palacio de deportes": [40.4239, -3.6717],
  ochoymedio: [40.4267, -3.6998],
  "sala but": [40.4267, -3.6998],
  "sala el sol": [40.4194, -3.7013],
  "el sol": [40.4194, -3.7013],
  "sala copernico": [40.4371, -3.7153],
  copernico: [40.4371, -3.7153],
  "sala mon": [40.4385, -3.7145],
  "mon live": [40.4385, -3.7145],
  "sala nazca": [40.4502, -3.6961],
  "nazca live": [40.4502, -3.6961],
  "gruta 77": [40.38703, -3.72512], // C. Cuclillo, 6, Carabanchel, 28019 Madrid
  gruta77: [40.38703, -3.72512],
  "gruta 7": [40.38703, -3.72512],
  gruta7: [40.38703, -3.72512],
  shoko: [40.4093, -3.7118],
  shôko: [40.4093, -3.7118],
  "shoko madrid": [40.4093, -3.7118],
  "shôko madrid": [40.4093, -3.7118],
  independance: [40.4097, -3.6965],
  "independance club": [40.4097, -3.6965],
  "moby dick": [40.4552, -3.6923],
  "moby dick club": [40.4552, -3.6923],
  siroco: [40.4285, -3.7061],
  "cafe la palma": [40.4276, -3.7051],
  "café la palma": [40.4276, -3.7051],
  "cafe central": [40.4137, -3.702],
  "cafe berlin": [40.4206, -3.7082],
  "café berlín": [40.4206, -3.7082],
  clamores: [40.4308, -3.7011],
  "sala clamores": [40.4308, -3.7011],
  "galileo galilei": [40.4378, -3.7093],
  "honky tonk": [40.4303, -3.6963],
  "intruso bar": [40.4219, -3.7001],
  "el perro de la parte de atras": [40.4228, -3.7025],
  "el perro de la parte de atrás": [40.4228, -3.7025],
  "cadavra club": [40.4208, -3.7031],
  cadavra: [40.4208, -3.7031],
  morocco: [40.4204, -3.7005],
  "sala morocco": [40.4204, -3.7005],
  gotham: [40.4421, -3.7151],
  "gotham the club": [40.4421, -3.7151],
  "sala villanos": [40.4079, -3.6989],
  villanos: [40.4079, -3.6989],
  "sala caracol": [40.4061, -3.6974],
  "la paqui": [40.4267, -3.6998],
  "sala chango": [40.4347, -3.7004],

  // Barcelona & Catalunya
  razzmatazz: [41.3977, 2.1911],
  "sala razzmatazz": [41.3977, 2.1911],
  apolo: [41.3744, 2.1697],
  "sala apolo": [41.3744, 2.1697],
  "la 2 de apolo": [41.3744, 2.1697],
  sidecar: [41.3799, 2.1754],
  heliogabal: [41.4034, 2.1585],
  heliogàbal: [41.4034, 2.1585],
  bikini: [41.3892, 2.1345],
  "sala bikini": [41.3892, 2.1345],
  salamandra: [41.3601, 2.1121],
  "sala salamandra": [41.3601, 2.1121],
  "marula cafe": [41.3804, 2.1772],
  jamboree: [41.3795, 2.1751],
  "sala upload": [41.3695, 2.1485],
  "sala wolf": [41.3982, 2.1925],
  barts: [41.3749, 2.1706],
  "paral·lel 62": [41.3749, 2.1706],
  "palau sant jordi": [41.3638, 2.1526],
  "sant jordi club": [41.3638, 2.1526],

  // Valencia
  repvblicca: [39.5109, -0.4431],
  "sala repvblicca": [39.5109, -0.4431],
  "16 toneladas": [39.4795, -0.3892],
  "sala moon": [39.4608, -0.3807],
  "loco club": [39.4793, -0.3798],
  "matisse club": [39.4735, -0.3546],
  "sala wah wah": [39.4739, -0.3552],

  // Andalucía (Sevilla, Granada, Málaga...)
  "sala custom": [37.4045, -5.9555],
  custom: [37.4045, -5.9555],
  "sala x": [37.4026, -5.9926],
  malandar: [37.4069, -5.9934],
  fanatic: [37.3752, -5.9664],
  "sala fanatic": [37.3752, -5.9664],
  "industrial copera": [37.1432, -3.6067],
  "el tren": [37.2001, -3.6272],
  "sala el tren": [37.2001, -3.6272],
  "planta baja": [37.1775, -3.6045],
  "sala trinchera": [36.6974, -4.4647],
  "paris 15": [36.6953, -4.4697],
  "sala paris 15": [36.6953, -4.4697],

  // País Vasco & Norte
  "santana 27": [43.2505, -2.9099],
  "kafe antzokia": [43.2625, -2.9295],
  dabadaba: [43.3135, -1.9754],
  "sala jimmy jazz": [42.8447, -2.6713],
  helldorado: [42.8415, -2.6821],
  "escenario santander": [43.4471, -3.8052],
  "sala acapulco": [43.5385, -5.6644],

  // Murcia, Zaragoza, Galicia...
  "garaje beat club": [37.9947, -1.1398],
  "sala rem": [37.9863, -1.1348],
  "sala oasi": [41.6558, -0.8872],
  "la casa del loco": [41.6508, -0.8845],
  "sala capitol": [42.8797, -8.5441],
  pelicano: [43.3704, -8.4035],
  "sala playa club": [43.3687, -8.4116],
  "master club vigo": [42.2384, -8.7231],
};

// Madrid & City Districts coordinates for accurate regional placement
const DISTRICTS_GEO: Record<string, [number, number]> = {
  vicalvaro: [40.4038, -3.6062],
  vicálvaro: [40.4038, -3.6062],
  vallecas: [40.3889, -3.6558],
  "puente de vallecas": [40.3965, -3.6672],
  "villa de vallecas": [40.3789, -3.6212],
  carabanchel: [40.3855, -3.7397],
  villaverde: [40.3475, -3.6975],
  usera: [40.3817, -3.7088],
  barajas: [40.4735, -3.5786],
  hortaleza: [40.4725, -3.6536],
  tetuan: [40.4601, -3.6993],
  tetuán: [40.4601, -3.6993],
  chamberi: [40.4354, -3.7029],
  chamberí: [40.4354, -3.7029],
  malasaña: [40.4262, -3.7042],
  malasana: [40.4262, -3.7042],
  chueca: [40.4225, -3.6983],
  lavapies: [40.4103, -3.7011],
  lavapiés: [40.4103, -3.7011],
  "la latina": [40.4116, -3.7107],
  moncloa: [40.4355, -3.7196],
  aluche: [40.3872, -3.7667],
  argüelles: [40.4301, -3.7172],
  arguelles: [40.4301, -3.7172],
  poblenou: [41.4005, 2.2023],
  gracia: [41.4026, 2.1568],
  gràcia: [41.4026, 2.1568],
  sants: [41.3756, 2.1378],
  eixample: [41.3887, 2.1611],
  "sant andreu": [41.4358, 2.1906],
  ruzafa: [39.4625, -0.3721],
  russafa: [39.4625, -0.3721],
  "el carmen": [39.4789, -0.3804],
  triana: [37.3828, -6.0028],
  alameda: [37.4003, -5.9932],
};

// Pre-loaded coordinates dictionary for Spanish cities, towns, festivals, and provinces
const SPANISH_CITIES_GEO: Record<string, [number, number]> = {
  // Major Capitals & Cities'Ávila': [40.6565, -4.6818],'Avila': [40.6565, -4.6818],'Madrid': [40.4168, -3.7038],'Barcelona': [41.3851, 2.1734],'Valencia': [39.4699, -0.3763],'Sevilla': [37.3891, -5.9845],'Zaragoza': [41.6488, -0.8896],'Málaga': [36.7213, -4.4214],'Malaga': [36.7213, -4.4214],'Murcia': [37.9922, -1.1307],'Palma': [39.5696, 2.6502],'Las Palmas': [28.1235, -15.4363],'Bilbao': [43.2630, -2.9350],'Alicante': [38.3452, -0.4810],'Córdoba': [37.8882, -4.7794],'Cordoba': [37.8882, -4.7794],'Valladolid': [41.6523, -4.7245],'Vigo': [42.2406, -8.7207],'Gijón': [43.5357, -5.6615],'Gijon': [43.5357, -5.6615],'Granada': [37.1773, -3.5986],'A Coruña': [43.3623, -8.4115],'Coruña': [43.3623, -8.4115],'Vitoria': [42.8467, -2.6716],'Vitoria-Gasteiz': [42.8467, -2.6716],'Badajoz': [38.8794, -6.9706],'Oviedo': [43.3614, -5.8593],'San Sebastián': [43.3183, -1.9812],'San Sebastian': [43.3183, -1.9812],'Donostia': [43.3183, -1.9812],'Pamplona': [42.8125, -1.6458],'Santander': [43.4623, -3.8099],'Burgos': [42.3440, -3.6969],'Salamanca': [40.9701, -5.6635],'Albacete': [38.9942, -1.8585],'Logroño': [42.4650, -2.4456],'Logrono': [42.4650, -2.4456],'Cáceres': [39.4753, -6.3723],'Caceres': [39.4753, -6.3723],'León': [42.5987, -5.5671],'Leon': [42.5987, -5.5671],'Cádiz': [36.5271, -6.2886],'Cadiz': [36.5271, -6.2886],'Jaén': [37.7796, -3.7849],'Jaen': [37.7796, -3.7849],'Ourense': [42.3358, -7.8639],'Lugo': [43.0099, -7.5560],'Girona': [41.9794, 2.8214],'Toledo': [39.8628, -4.0273],'Huelva': [37.2614, -6.9447],'Guadalajara': [40.6327, -3.1682],'Ciudad Real': [38.9863, -3.9273],'Zamora': [41.5063, -5.7446],'Segovia': [40.9429, -4.1088],'Cuenca': [40.0704, -2.1374],'Huesca': [42.1361, -0.4087],'Teruel': [40.3456, -1.1072],'Soria': [41.7640, -2.4688],'Almería': [36.8340, -2.4637],'Almeria': [36.8340, -2.4637],'Pontevedra': [42.4310, -8.6444],'Castellón': [39.9864, -0.0513],'Castellon': [39.9864, -0.0513],
  // Key Music & Festival Towns'Villarrobledo': [39.2699, -2.6033], // Viña Rock'Barbate': [36.1923, -5.9220], // Cabo de Plata'Santiago de Compostela': [42.8782, -8.5448],'Santiago': [42.8782, -8.5448],'Lanuza': [42.7561, -0.3150], // Pirineos Sur'Caldas de Reis': [42.6027, -8.6427], // PortAmérica'Aranda de Duero': [41.6704, -3.6892], // Sonorama'Ponferrada': [42.5466, -6.5962],'Ferrara': [44.8381, 11.6198],'Ferrera': [44.8381, 11.6198],'Gandía': [38.9678, -0.1818],'Gandia': [38.9678, -0.1818],'Benicàssim': [40.0558, 0.0637], // FIB'Benicassim': [40.0558, 0.0637],'Ortigueira': [43.6833, -7.8500],'Algeciras': [36.1308, -5.4488],'Jerez': [36.6850, -6.1261],'Jerez de la Frontera': [36.6850, -6.1261],'Mérida': [38.9161, -6.3437],'Merida': [38.9161, -6.3437],'Plasencia': [40.0294, -6.0886],'Béjar': [40.3861, -5.7661],'Arévalo': [41.0631, -4.7205],'Las Navas del Marqués': [40.6053, -4.3314],'El Tiemblo': [40.4144, -4.5008],'Ávila - Arévalo': [41.0631, -4.7205],'Ávila - Las Navas': [40.6053, -4.3314],'Ávila - El Tiemblo': [40.4144, -4.5008],'Alcalá de Henares': [40.4819, -3.3643],'Getafe': [40.3083, -3.7327],'Leganés': [40.3281, -3.7635],'Móstoles': [40.3228, -3.8649],'Alcorcón': [40.3458, -3.8249],'Reus': [41.1561, 1.1069],'Mataró': [41.5421, 2.4445],'Figueres': [42.2665, 2.9610],'Vic': [41.9304, 2.2542],'Sitges': [41.2372, 1.8059],'Lorca': [37.6712, -1.7017],'Cartagena': [37.6257, -0.9966],'Talavera de la Reina': [39.9631, -4.8308],'Torrelavega': [43.3494, -4.0478],'Irún': [43.3378, -1.7888],'Eibar': [43.1842, -2.4714],'Barakaldo': [43.2974, -2.9877],'Getxo': [43.3578, -3.0131],'Ronda': [36.7423, -5.1671],'Antequera': [37.0184, -4.5587],'Motril': [36.7464, -3.5186],'Marbella': [36.5101, -4.8824],'Fuengirola': [36.5398, -4.6247],'Torremolinos': [36.6208, -4.4998],
  // Autonomous Communities & Regions fallback'Andalucía': [37.5443, -4.7278],'Andalucia': [37.5443, -4.7278],'Cataluña': [41.8205, 1.8401],'Catalunya': [41.8205, 1.8401],'Galicia': [42.5751, -8.1339],'Comunidad de Madrid': [40.4168, -3.7038],'Castilla y León': [41.6523, -4.7245],'Castilla-La Mancha': [39.8628, -4.0273],'País Vasco': [43.0000, -2.6000],'Euskadi': [43.0000, -2.6000],'Comunidad Valenciana': [39.4699, -0.3763],'Aragón': [41.6488, -0.8896],'Asturias': [43.3614, -5.8593],'Extremadura': [39.4753, -6.3723],'Navarra': [42.8125, -1.6458],'Cantabria': [43.4623, -3.8099],'Región de Murcia': [37.9922, -1.1307],'La Rioja': [42.4650, -2.4456]
};

// Smart normalizer & lookup function to ensure every lead gets realistic coords in its actual city & venue
function resolveLeadCoordinates(lead: Lead, index: number): [number, number] {
  const rawVenue = (lead.nombre_sala || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  const rawAddress = (lead.direccion || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  const rawCity = (lead.ciudad || "").trim();
  const rawRegion = (lead.region || "").trim();

  // 1. Check Known Iconic Venues (Exact & fuzzy match)
  for (const [vKey, coords] of Object.entries(KNOWN_VENUES_GEO)) {
    const normKey = vKey
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (
      rawVenue.includes(normKey) ||
      normKey.includes(rawVenue) ||
      rawAddress.includes(normKey)
    ) {
      return coords;
    }
  }

  // 2. Check Specific Neighborhoods / Districts in Address or City (e.g. "Vicálvaro", "Vallecas", "Poblenou")
  for (const [dKey, coords] of Object.entries(DISTRICTS_GEO)) {
    const normDist = dKey
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (
      rawAddress.includes(normDist) ||
      rawVenue.includes(normDist) ||
      rawCity.toLowerCase().includes(normDist)
    ) {
      return offsetCoords(coords, index, 0.003); // very subtle jitter so nearby venues don't overlap exactly
    }
  }

  // 3. Exact match in city
  if (SPANISH_CITIES_GEO[rawCity]) {
    const base = SPANISH_CITIES_GEO[rawCity];
    return offsetCoords(base, index);
  }

  // 2. Clean city name (e.g."Barbate (Cádiz)" ->"Barbate","Lanuza (Huesca)" ->"Lanuza")
  const mainPart = rawCity.split(/[\(\-\/\,]/)[0].trim();
  if (SPANISH_CITIES_GEO[mainPart]) {
    const base = SPANISH_CITIES_GEO[mainPart];
    return offsetCoords(base, index);
  }

  // 3. Extract parenthetical part (e.g."Barbate (Cádiz)" ->"Cádiz")
  const matchParen = rawCity.match(/\(([^)]+)\)/);
  if (matchParen && matchParen[1]) {
    const inside = matchParen[1].trim();
    if (SPANISH_CITIES_GEO[inside]) {
      const base = SPANISH_CITIES_GEO[inside];
      return offsetCoords(base, index);
    }
  }

  // 4. Fuzzy match normalized tokens
  const normCity = rawCity
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  for (const [key, coords] of Object.entries(SPANISH_CITIES_GEO)) {
    const normKey = key
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (normCity.includes(normKey) || normKey.includes(normCity)) {
      return offsetCoords(coords, index);
    }
  }

  // 5. Region match
  if (rawRegion && SPANISH_CITIES_GEO[rawRegion]) {
    const base = SPANISH_CITIES_GEO[rawRegion];
    return offsetCoords(base, index);
  }

  // 6. Region fuzzy match
  if (rawRegion) {
    const normRegion = rawRegion
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    for (const [key, coords] of Object.entries(SPANISH_CITIES_GEO)) {
      const normKey = key
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (normRegion.includes(normKey) || normKey.includes(normRegion)) {
        return offsetCoords(coords, index);
      }
    }
  }

  // 7. Deterministic Spain-wide spread (no hardcoded Madrid dump)
  let hash = 0;
  const seedStr = lead.id + lead.nombre_sala + rawCity;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const lat = 37.2 + (Math.abs(hash) % 55) / 10; // Spread 37.2N to 42.7N across Spain
  const lng = -6.5 + (Math.abs(hash >> 3) % 85) / 10; // Spread -6.5W to 2.0E across Spain
  return [lat, lng];
}

function offsetCoords(
  base: [number, number],
  index: number,
  radiusMultiplier: number = 0.008,
): [number, number] {
  const angle = index * 137.5 * (Math.PI / 180); // Golden angle scatter
  const radius = radiusMultiplier + (index % 5) * 0.002; // Controlled spread
  return [
    base[0] + Math.sin(angle) * radius,
    base[1] + Math.cos(angle) * radius,
  ];
}

// Local cache for Nominatim geocoded queries
const GEO_CACHE: Record<string, [number, number]> = {};

// Helper functions for marker tooltips
function getStatusBadge(estado: string) {
  switch (estado) {
    case "aprobado":
      return {
        text: "✓ Aprobado / Confirmado",
        bg: "#dcfce7",
        color: "#166534",
      };
    case "pendiente_aprobacion":
      return {
        text: "Pendiente Aprobación",
        bg: "#fef3c7",
        color: "#92400e",
      };
    case "interesado":
      return { text: "Interesado", bg: "#dbeafe", color: "#1e40af" };
    case "negociando":
      return { text: "En Negociación", bg: "#e0e7ff", color: "#3730a3" };
    case "esperando_respuesta":
      return {
        text: "Esperando Respuesta",
        bg: "#f3e8ff",
        color: "#6b21a8",
      };
    case "no_interesado":
      return { text: "No Interesado", bg: "#ffe4e6", color: "#9f1239" };
    case "nuevo":
    default:
      return { text: "Nuevo Contacto", bg: "#f1f5f9", color: "#334155" };
  }
}

function getFormattedLeadDate(lead: Lead): string {
  if (lead.fecha_ultima_respuesta) {
    return `Resp: ${lead.fecha_ultima_respuesta}`;
  }
  if (lead.fecha_envio) {
    return `Envío: ${lead.fecha_envio}`;
  }
  return "Fecha por determinar";
}

export const VenueMap: React.FC<VenueMapProps> = ({
  leads,
  selectedLead,
  onSelectLead,
  onUpdateLead,
  activeCityFilter = "",
  activeRegionFilter = "",
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroup = useRef<any>(null);

  const [mapStyle, setMapStyle] = useState<MapStyleKey>("streets");
  const [showStyleMenu, setShowStyleMenu] = useState<boolean>(false);

  const [geoPositions, setGeoPositions] = useState<
    Record<string, [number, number]>
  >({});
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [geocodedCount, setGeocodedCount] = useState<number>(0);

  // Initialize Map with Marker Clustering
  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMap.current) {
      // Default initial view: Spain center
      const map = L.map(mapRef.current, {
        center: [40.4168, -3.7038],
        zoom: 6,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Tile Layer (Default to Voyager for crisp bright visibility)
      const currentPreset = MAP_STYLES[mapStyle];
      const layer = L.tileLayer(currentPreset.url, {
        attribution: currentPreset.attr,
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = layer;

      // Marker Cluster Group (Agrupación por zonas como Celeritas / Google Maps)
      const clusterGroup = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        removeOutsideVisibleBounds: true,
        maxClusterRadius: 50,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          let size = 38;
          let bgColor = "var(--acc)";
          let textColor = "#ffffff";
          let ringColor = "rgba(79, 70, 229, 0.25)";

          if (count >= 20) {
            size = 48;
            bgColor = "var(--acc)";
            textColor = "#ffffff";
            ringColor = "rgba(67, 56, 202, 0.35)";
          } else if (count >= 8) {
            size = 42;
            bgColor = "var(--acc)";
            textColor = "#ffffff";
            ringColor = "rgba(59, 130, 246, 0.3)";
          }

          return L.divIcon({
            html: `
 <div style="
 width: ${size}px;
 height: ${size}px;
 background-color: ${bgColor};
 color: ${textColor};
 border-radius: 50%;
 box-shadow: 0 0 0 2px ${ringColor};
 font-weight: 800;
 font-family: ui-monospace, monospace;
 font-size: ${size > 42 ? "13px" : "11px"};
 display: flex;
 align-items: center;
 justify-content: center;
 cursor: pointer;
 transition: transform 0.2s ease;">
 ${count}
 </div>
 `,
            className: "custom-cluster-badge",
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });
        },
      });

      markersGroup.current = clusterGroup;
      map.addLayer(clusterGroup);
      leafletMap.current = map;
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        tileLayerRef.current = null;
        markersGroup.current = null;
      }
    };
  }, []);

  // Handle Tile Style changes dynamically
  useEffect(() => {
    if (!leafletMap.current) return;
    if (
      tileLayerRef.current &&
      leafletMap.current.hasLayer(tileLayerRef.current)
    ) {
      leafletMap.current.removeLayer(tileLayerRef.current);
    }
    const currentPreset = MAP_STYLES[mapStyle];
    const layer = L.tileLayer(currentPreset.url, {
      attribution: currentPreset.attr,
      maxZoom: 19,
    }).addTo(leafletMap.current);
    tileLayerRef.current = layer;
  }, [mapStyle]);

  // Geocode leads to ensure accurate locations across all Spain cities & regions
  useEffect(() => {
    let isSubscribed = true;

    const resolveCoords = async () => {
      setIsGeocoding(true);
      const newCoords: Record<string, [number, number]> = {};
      const pendingToGeocode: { lead: Lead; index: number }[] = [];

      // Calculate base coords using smart dictionary & fuzzy location resolver
      leads.forEach((lead, index) => {
        const fullKey = `${lead.nombre_sala}-${lead.ciudad}`
          .toLowerCase()
          .trim();

        // Instantly resolve accurate local venue/district/city coordinates
        const resolved = resolveLeadCoordinates(lead, index);
        newCoords[lead.id] = resolved;

        // Check if it's already a known iconic venue with pinpoint coordinates
        const rawVenue = (lead.nombre_sala || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();
        const isKnownExactVenue = Object.keys(KNOWN_VENUES_GEO).some(
          (k) => rawVenue.includes(k) || k.includes(rawVenue),
        );

        // If it has a specific street address or is an unlisted venue/town, queue for fine-tuning door number
        if (
          !isKnownExactVenue &&
          (lead.direccion || !SPANISH_CITIES_GEO[lead.ciudad.trim()])
        ) {
          pendingToGeocode.push({ lead, index });
        }
      });

      if (isSubscribed) {
        setGeoPositions((prev) => ({ ...prev, ...newCoords }));
        setGeocodedCount(Object.keys(newCoords).length);
        setIsGeocoding(false);
      }

      // Background fine-tuning for unknown towns & specific addresses via Nominatim (non-blocking)
      for (const item of pendingToGeocode) {
        if (!isSubscribed) break;
        const { lead } = item;
        const query = lead.direccion
          ? `${lead.direccion}, ${lead.ciudad}, España`
          : `${lead.nombre_sala || ""}, ${lead.ciudad}, ${lead.region || "España"}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
            {
              headers: { "Accept-Language": "es" },
            },
          );
          const data = await res.json();
          if (data && data[0]) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            const coords: [number, number] = [lat, lon];
            const fullKey = `${lead.nombre_sala}-${lead.ciudad}`.toLowerCase();
            GEO_CACHE[fullKey] = coords;
            if (isSubscribed) {
              setGeoPositions((prev) => ({ ...prev, [lead.id]: coords }));
            }
          }
        } catch (e) {
          // If network blocked, keep the smart resolveLeadCoordinates result (no Madrid fallback!)
        }
        await new Promise((r) => setTimeout(r, 500));
      }
    };

    resolveCoords();

    return () => {
      isSubscribed = false;
    };
  }, [leads]);

  const hasInitialFitRef = useRef<boolean>(false);
  const prevFilterKeyRef = useRef<string>("");
  const markersMapRef = useRef<Record<string, L.Marker>>({});

  // Render Markers on Map & Pan to fit bounds
  useEffect(() => {
    if (!leafletMap.current || !markersGroup.current) return;

    markersGroup.current.clearLayers();
    markersMapRef.current = {};
    const bounds = L.latLngBounds([]);
    let validCount = 0;

    const isDarkMap = mapStyle === "dark";
    const isSatellite = mapStyle === "satellite";

    const currentFilterKey = `${activeCityFilter || ""}|${activeRegionFilter || ""}|${leads.map((l) => l.id).join(",")}`;
    const filterChanged = prevFilterKeyRef.current !== currentFilterKey;

    leads.forEach((lead) => {
      const pos = geoPositions[lead.id];
      if (!pos) return;

      bounds.extend(pos);
      validCount++;

      // Badge color based on status (Google Maps style vibrant pins)
      let pinColor = "#e11d48"; // Rose/Red default
      if (lead.estado === "aprobado" || lead.estado === ("confirmado" as any))
        pinColor = "var(--ok)"; // Green
      else if (lead.estado === "pendiente_aprobacion")
        pinColor = "var(--acc)"; // Amber
      else if (lead.estado === "interesado" || lead.estado === "negociando")
        pinColor = "#2563eb"; // Blue
      else if (lead.estado === "no_interesado") pinColor = "#64748b"; // Slate

      const isSelected = selectedLead?.id === lead.id;

      let cleanMapImg = lead.imagen_url || "";
      if (cleanMapImg.includes("icon.horse/icon/")) {
        const domain = cleanMapImg
          .replace(/https?:\/\/icon\.horse\/icon\//, "")
          .split("/")[0];
        if (domain)
          cleanMapImg = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      }

      const fallbackIcon =
        lead.icono && !lead.icono.startsWith("http")
          ? lead.icono
          : lead.tipo === "festival"
            ? "🎪"
            : lead.tipo === "ayuntamiento"
              ? "🏛️"
              : lead.tipo === "discoteca"
                ? "🪩"
                : lead.tipo === "medio"
                  ? "📻"
                  : lead.tipo === "grupo"
                    ? "🎸"
                    : "🏛️";

      const venueIconHtml = cleanMapImg
        ? `
 <img src="${cleanMapImg}" onerror="this.style.display='none'" style="
 width: 22px;
 height: 22px;
 border-radius: 50%;
 object-fit: cover;
 margin-right: 4px;" />
 `
        : `
 <div style="
 width: 22px;
 height: 22px;
 border-radius: 50%;
 background-color: ${pinColor};
 color: white;
 display: flex;
 align-items: center;
 justify-content: center;
 font-size: 11px;
 margin-right: 4px;
 font-weight: bold;">
 ${fallbackIcon}
 </div>
 `;

      // Google Maps style pill badge + clean text label without background box
      const customIcon = L.divIcon({
        className: "custom-venue-pin",
        html: `
 <div style="
 position: relative;
 display: inline-flex;
 align-items: center;
 gap: 6px;
 cursor: pointer;
 user-select: none;
 transform: translate(-10px, -15px);
 z-index: ${isSelected ? 1000 : 100};">
 <!-- Google Maps Pill Badge -->
 <div style="
 display: inline-flex;
 align-items: center;
 background: #ffffff;
 border-radius: 20px;
 padding: 2px 8px 2px 3px;
 white-space: nowrap;
 position: relative;
 z-index: 2;
 transform: ${isSelected ? "scale(1.15)" : "scale(1)"};
 transition: transform 0.15s ease;">
 ${venueIconHtml}
 <span style="
 font-family: system-ui, -apple-system, BlinkMacSystemFont,'Segoe UI', Roboto, sans-serif;
 font-size: 11px;
 font-weight: 800;
 color: #1e293b;">
 ${lead.aforo > 0 ? (lead.aforo >= 1000 ? `${(lead.aforo / 1000).toFixed(1)}k` : lead.aforo) : "Sala"}
 </span>
 </div>

 <!-- Google Maps Clean Text Label (Sin Fondo / Sin caja rectangular) -->
 <div style="
 font-family: system-ui, -apple-system, BlinkMacSystemFont,'Segoe UI', Roboto, sans-serif;
 font-size: 11px;
 font-weight: 800;
 line-height: 1.15;
 white-space: nowrap;
 color: ${isSatellite || isDarkMap ? "#ffffff" : "#0f172a"};
 text-shadow: ${
   isSatellite || isDarkMap
     ? "-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 0 4px #000, 0 1px 3px rgba(0,0,0,0.9)"
     : "-1.5px -1.5px 0 #ffffff, 1.5px -1.5px 0 #ffffff, -1.5px 1.5px 0 #ffffff, 1.5px 1.5px 0 #ffffff, -2px 0 0 #ffffff, 2px 0 0 #ffffff, 0 -2px 0 #ffffff, 0 2px 0 #ffffff, 0 1px 3px rgba(0,0,0,0.6)"
 };
 letter-spacing: -0.1px;
 z-index: 1;">
 ${escapeHtml(lead.nombre_sala)}
 </div>
 </div>
 `,
        iconSize: [120, 28],
        iconAnchor: [12, 14],
      });

      const marker = L.marker(pos, { icon: customIcon });
      markersMapRef.current[lead.id] = marker;

      // Popup content
      const popupHtml = document.createElement("div");
      popupHtml.className = "font-sans p-1 min-w-[200px] text-[var(--ink)]";
      popupHtml.innerHTML = `
 <div style="font-family: system-ui, sans-serif;">
 <div style="font-size: 13px; font-weight: 700; margin-bottom: 2px; color: ${"#0f172a"};">
 ${escapeHtml(lead.nombre_sala)}
 </div>
 <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
 📍 ${escapeHtml(lead.ciudad)} ${lead.region ? `(${escapeHtml(lead.region)})` : ""}
 </div>
 <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 10px; font-size: 10px; font-family: monospace;">
 <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">
 👥 ${lead.aforo > 0 ? `${lead.aforo} personas` : "Sin aforo"}
 </span>
 <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">
 ${escapeHtml(lead.genero || "Música")}
 </span>
 </div>
 <div style="font-size: 10px; margin-bottom: 8px; font-family: monospace;">
 📧 ${lead.email_contacto ? escapeHtml(lead.email_contacto) : '<span style="color:#e11d48; font-weight:bold;">⚠️ Sin email</span>'}
 </div>
 <div style="display: flex; gap: 6px; margin-top: 8px;">
 <button id="pop-select-${lead.id}" style="
 flex: 1;
 background: #4f46e5;
 color: white;
 padding: 6px 8px;
 border-radius: 6px;
 font-size: 11px;
 font-weight: bold;
 cursor: pointer;">
 👁️ Intervenir
 </button>
 ${
   lead.estado === "pendiente_aprobacion"
     ? `
 <button id="pop-approve-${lead.id}" style="
 background: var(--ok);
 color: white;
 padding: 6px 8px;
 border-radius: 6px;
 font-size: 11px;
 font-weight: bold;
 cursor: pointer;">
 ⚡ Aprobar
 </button>
 `
     : ""
 }
 </div>
 </div>
 `;

      // Bind actions in popup
      marker.bindPopup(popupHtml);

      // Custom Hover Tooltip showing date and status
      const statusBadge = getStatusBadge(lead.estado);
      const formattedDate = getFormattedLeadDate(lead);

      const tooltipHtml = `
 <div style="
 font-family: system-ui, -apple-system, BlinkMacSystemFont,'Segoe UI', Roboto, sans-serif;
 padding: 6px 10px;
 min-width: 170px;
 max-width: 250px;
 color: #0f172a;">
 <div style="font-size: 12px; font-weight: 800; color: #0f172a; margin-bottom: 2px; line-height: 1.25;">
 ${escapeHtml(lead.nombre_sala)}
 </div>
 <div style="font-size: 10.5px; color: #64748b; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
 <span>📍 ${escapeHtml(lead.ciudad)}${lead.region ? ` (${escapeHtml(lead.region)})` : ""}</span>
 </div>
 <div style="display: flex; flex-direction: column; gap: 4px;">
 <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
 <span style="
 background: ${statusBadge.bg};
 color: ${statusBadge.color};
 font-size: 9.5px;
 font-weight: 700;
 padding: 2px 7px;
 border-radius: 12px;
 white-space: nowrap;">
 ${statusBadge.text}
 </span>
 ${lead.aforo > 0 ? `<span style="font-size: 9.5px; color: #475569; font-weight: 600;">👥 ${lead.aforo} cap.</span>` : ""}
 </div>
 <div style="font-size: 10px; color: #334155; font-weight: 600; font-family: monospace; display: flex; align-items: center; gap: 4px; margin-top: 1px;">
 <span>📅 ${formattedDate}</span>
 </div>
 </div>
 </div>
 `;

      marker.bindTooltip(tooltipHtml, {
        direction: "top",
        offset: [0, -14],
        opacity: 0.98,
        className: "custom-venue-map-tooltip",
      });

      marker.on("popupopen", () => {
        const btnSelect = document.getElementById(`pop-select-${lead.id}`);
        if (btnSelect) {
          btnSelect.onclick = () => {
            onSelectLead(lead);
          };
        }
        const btnApprove = document.getElementById(`pop-approve-${lead.id}`);
        if (btnApprove) {
          btnApprove.onclick = () => {
            onUpdateLead(lead.id, { estado: "aprobado" });
            marker.closePopup();
          };
        }
      });

      marker.addTo(markersGroup.current);
    });

    // Auto fit bounds ONLY on initial load or when filter / leads list actually changes
    if (validCount > 0) {
      if (!hasInitialFitRef.current || filterChanged) {
        leafletMap.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 14,
        });
        hasInitialFitRef.current = true;
        prevFilterKeyRef.current = currentFilterKey;
      }
    }
  }, [geoPositions, leads, mapStyle, activeCityFilter, activeRegionFilter]);

  // Invalidate size on container resize (without resetting zoom/bounds on cluster expand)
  useEffect(() => {
    if (!leafletMap.current || !mapRef.current) return;
    const observer = new ResizeObserver(() => {
      if (leafletMap.current) {
        leafletMap.current.invalidateSize();
      }
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  // Focus on selected lead when user selects a venue
  useEffect(() => {
    if (!leafletMap.current || !selectedLead) return;
    const pos = geoPositions[selectedLead.id];
    if (!pos) return;

    const marker = markersMapRef.current[selectedLead.id];
    if (marker && markersGroup.current) {
      if (
        typeof markersGroup.current.zoomToShowLayer === "function" &&
        typeof markersGroup.current.hasLayer === "function" &&
        markersGroup.current.hasLayer(marker)
      ) {
        try {
          markersGroup.current.zoomToShowLayer(marker, () => {
            if (marker && typeof marker.openPopup === "function") {
              marker.openPopup();
            }
          });
        } catch (e) {
          leafletMap.current.setView(
            pos,
            Math.max(leafletMap.current.getZoom(), 15),
            { animate: true },
          );
          if (marker && typeof marker.openPopup === "function") {
            marker.openPopup();
          }
        }
      } else {
        leafletMap.current.setView(
          pos,
          Math.max(leafletMap.current.getZoom(), 15),
          { animate: true },
        );
        marker.openPopup();
      }
    } else {
      leafletMap.current.setView(
        pos,
        Math.max(leafletMap.current.getZoom(), 15),
        { animate: true },
      );
    }
  }, [selectedLead, geoPositions]);

  // Handle Manual Fit Zoom to active city or all markers
  const handleRecenter = () => {
    if (!leafletMap.current || Object.keys(geoPositions).length === 0) return;
    const bounds = L.latLngBounds([]);
    (Object.values(geoPositions) as [number, number][]).forEach((pos) =>
      bounds.extend(pos),
    );
    leafletMap.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  };

  return (
    <div
      className="relative w-full h-[550px] sm:h-[650px] rounded-[var(--r-l)] overflow-hidden transition-ui"
      style={{
        borderColor: "#e2e8f0",
      }}
    >
      <style>{`
 .leaflet-tooltip.custom-venue-map-tooltip {
 background: #ffffff !important;
 border-radius: 12px !important;
 padding: 0 !important;
 color: #0f172a !important;
 pointer-events: none !important;
 }
 .leaflet-tooltip.custom-venue-map-tooltip::before {
 border-top-color: #ffffff !important;
 }
 `}</style>
      {/* Map DOM Element */}
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* Floating Control Overlay */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pointer-events-none">
        {/* City Info Card */}
        <div
          className={`pointer-events-auto px-3.5 py-2 rounded-[var(--r-m)] flex items-center gap-2 font-sans text-xs ${"bg-[var(--surface)] text-[var(--ink)]"}`}
        >
          <MapPin className="w-4 h-4 text-[var(--acc)] animate-bounce" />
          <div>
            <span className="font-bold">
              {activeCityFilter
                ? `Salas en ${activeCityFilter}`
                : activeRegionFilter
                  ? `Salas en ${activeRegionFilter}`
                  : "Mapa Global de Salas"}
            </span>
            <span className="ml-2 text-micro opacity-75">
              ({leads.length} {leads.length === 1 ? "sala" : "salas"})
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pointer-events-auto flex items-center gap-2 relative">
          {isGeocoding && (
            <div
              className={`px-3 py-1.5 rounded-[var(--r-m)] text-micro font-sans flex items-center gap-1.5 ${"bg-[var(--acc-soft)]  text-[var(--ink)]"}`}
            >
              <Loader2 className="w-3 h-3 animate-spin text-[var(--acc)]" />
              <span>Geolocalizando salas...</span>
            </div>
          )}

          {/* Style selector menu */}
          <div className="relative">
            <button
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              className={`px-3 py-2 rounded-[var(--r-m)] font-sans text-xs font-bold flex items-center gap-1.5 active:scale-[0.97] transition-ui cursor-pointer ${"bg-[var(--ink)]/95 hover:bg-[var(--sunken)] text-[var(--ink)]"}`}
            >
              <Layers className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span>Estilo Mapa</span>
            </button>

            {showStyleMenu && (
              <div
                className={`absolute left-0 sm:left-auto sm:right-0 top-11 w-64 max-w-[85vw] p-2 rounded-[var(--r-m)] space-y-1 font-sans text-xs z-[1100] ${"bg-[var(--surface)]/95 text-[var(--ink)]"}`}
              >
                <div className="text-micro font-bold text-[var(--ink-2)] px-2 py-1 flex items-center justify-between">
                  <span>Elegir Capa de Mapa</span>
                  <span className="text-micro font-normal text-[var(--ink-2)]">
                    ({Object.keys(MAP_STYLES).length} opciones)
                  </span>
                </div>
                {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setMapStyle(key);
                      setShowStyleMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-[var(--r-s)] text-xs font-bold transition-ui cursor-pointer flex items-center justify-between gap-2 ${
                      mapStyle === key
                        ? "bg-[var(--tentative)]/80 text-[var(--ink)]"
                        : "hover:bg-[var(--sunken)] text-[var(--ink-2)]"
                    }`}
                  >
                    <span className="truncate">{MAP_STYLES[key].name}</span>
                    {mapStyle === key && (
                      <Check className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleRecenter}
            className={`px-3 py-2 rounded-[var(--r-m)] font-sans text-xs font-bold flex items-center gap-1.5 active:scale-[0.97] transition-ui cursor-pointer ${"bg-[var(--ink)]/90 hover:bg-[var(--sunken)] text-[var(--ink)]"}`}
          >
            <Navigation className="w-3.5 h-3.5 text-[var(--acc)]" />
            <span>Centrar Vista</span>
          </button>
        </div>
      </div>

      {/* Floating Legend */}
      <div
        className={`absolute bottom-3 left-3 z-[1000] p-2.5 rounded-[var(--r-m)] font-sans text-micro space-y-1 hidden sm:block ${"bg-[var(--surface)]/90 text-[var(--ink-2)]"}`}
      >
        <div className="font-bold text-micro mb-1 text-[var(--ink-2)]">
          Leyenda
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-[var(--r-pill)] bg-[var(--ok)] inline-block" />
          <span>Aprobado / Confirmado</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-[var(--r-pill)] bg-[var(--acc)] inline-block" />
          <span>Pendiente aprobación</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-[var(--r-pill)] bg-[var(--tentative)]/50 inline-block" />
          <span>Interesado / Negociando</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-[var(--r-pill)] bg-[var(--tentative)] inline-block" />
          <span>Nuevo / Contactado</span>
        </div>
      </div>
    </div>
  );
};
