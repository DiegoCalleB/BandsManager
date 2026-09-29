export interface MusicBrainzPlace {
  id: string;
  nombre: string;
  tipo: string;
  direccion: string;
  ciudad: string;
  pais: string;
  coordenadas?: { latitud: number; longitud: number };
  fuente: string;
}

export async function searchMusicBrainzVenues(params: {
  ciudad?: string;
  limit?: number;
  pais?: string;
}): Promise<MusicBrainzPlace[]> {
  const ciudad = (params.ciudad || "Madrid").trim();
  const limit = Math.max(1, Math.min(30, params.limit || 12));
  try {
    const cleanCity = ciudad.replace(/[^\p{L}\p{N}\s]/gu, "");
    const luceneQuery = `type:Venue AND (area:"${cleanCity}" OR city:"${cleanCity}")`;
    const encoded = encodeURIComponent(luceneQuery);
    const url = `https://musicbrainz.org/ws/2/place?query=${encoded}&limit=${limit}&fmt=json`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "BandManagerIO/1.0 ( contact@bandmanager.io )",
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      console.warn(`[MusicBrainz API] Error HTTP ${res.status} al consultar salas en ${ciudad}`);
      return [];
    }

    const data = await res.json();
    const places = data.places || [];

    return places
      .filter((p: any) => p.name && (p.type === "Venue" || !p.type))
      .map((p: any) => {
        let lat: number | undefined;
        let lng: number | undefined;
        if (p.coordinates?.latitude && p.coordinates?.longitude) {
          lat = parseFloat(p.coordinates.latitude);
          lng = parseFloat(p.coordinates.longitude);
        }

        return {
          id: p.id || `mb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          nombre: p.name,
          tipo: "Venue",
          direccion: p.address || "",
          ciudad: p.area?.name || ciudad,
          pais: p.area?.["iso-3166-1-codes"]?.[0] || params.pais || "España",
          coordenadas: (lat && lng) ? { latitud: lat, longitud: lng } : undefined,
          fuente: "MusicBrainz"
        };
      });
  } catch (err: any) {
    console.warn(`[MusicBrainz API] Excepción al consultar salas en ${ciudad}:`, err?.message);
    return [];
  }
}
