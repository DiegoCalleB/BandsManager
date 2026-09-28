export interface OpenDataCulturalEvent {
  id: string;
  titulo: string;
  entidad_o_lugar: string;
  direccion: string;
  ciudad: string;
  comunidad_autonoma: string;
  fecha_inicio?: string;
  precio?: string;
  enlace_oficial?: string;
  tipo_espacio: string;
  fuente: string;
}

export async function fetchMadridOpenDataCulturalEvents(): Promise<OpenDataCulturalEvent[]> {
  try {
    const url = "https://datos.madrid.es/egob/catalogo/206974-0-agenda-eventos-culturales-100.json";
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "BandManagerIO/1.0 ( cultural-radar@bandmanager.io )"
      }
    });
    if (!res.ok) {
      console.warn(`[OpenData Madrid] Error HTTP ${res.status}`);
      return [];
    }
    const rawText = await res.text();
    const cleanText = rawText.replace(/[\u0000-\u001F\u007F]/g, (c) => c === "\n" || c === "\r" || c === "\t" ? " " : "");
    const data = JSON.parse(cleanText);
    const items = data["@graph"] || [];
    const musicKeywords = ["concierto", "música", "musica", "recital", "banda", "acústico", "jazz", "rock", "pop", "flamenco", "orquesta", "coral"];
    const musicEvents = items.filter((item: any) => {
      const t = (item.title || "").toLowerCase();
      const d = (item.description || "").toLowerCase();
      return musicKeywords.some((kw) => t.includes(kw) || d.includes(kw));
    });

    return musicEvents.slice(0, 25).map((m: any, idx: number) => {
      const loc = m["event-location"] || "Centro Cultural Municipal";
      let tipoEspacio = "Centro Cultural";
      const locLower = loc.toLowerCase();
      if (locLower.includes("teatro")) tipoEspacio = "Teatro Municipal";
      else if (locLower.includes("auditorio")) tipoEspacio = "Auditorio";
      else if (locLower.includes("parque") || locLower.includes("plaza")) tipoEspacio = "Plaza / Parque";
      return {
        id: `od-madrid-${idx}-${Date.now().toString(36)}`,
        titulo: m.title || "Concierto Programado",
        entidad_o_lugar: loc,
        direccion: m.address?.area?.["formatted-address"] || m.address?.locality || "Madrid",
        ciudad: "Madrid",
        comunidad_autonoma: "Comunidad de Madrid",
        fecha_inicio: m.dtstart || undefined,
        precio: m.price || "Entrada libre / Acceso público",
        enlace_oficial: m.link || undefined,
        tipo_espacio: tipoEspacio,
        fuente: "Datos Abiertos Madrid"
      };
    });
  } catch (err: any) {
    console.warn("[OpenData Madrid] Error al parsear eventos culturales:", err?.message);
    return [];
  }
}
