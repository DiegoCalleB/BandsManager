import { useEffect, useEffectEvent, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';

/** Lo que el mapa necesita de una sala. `PuntoDelMapa` de la API lo cumple. */
export interface PuntoEnMapa {
  id: string;
  nombre: string;
  lat: number;
  lon: number;
  nivel: 'sin_verificar' | 'probable' | 'verificada';
  coordenadas_aprox: boolean;
  ya_en_agenda: boolean;
}

interface MapaCatalogoProps {
  puntos: PuntoEnMapa[];
  seleccionada?: string | null;
  onSeleccionar?: (id: string) => void;
  /** Con `true` el mapa no se mueve con el dedo ni la rueda (miniatura dentro de una ficha). */
  fijo?: boolean;
  className?: string;
}

const COLOR_NIVEL: Record<PuntoEnMapa['nivel'], string> = { verificada: 'var(--acc)', probable: 'var(--ok)', sin_verificar: 'var(--ink-3)' };

function iconoDe(p: PuntoEnMapa, seleccionada: boolean): L.DivIcon {
  const tamano = seleccionada ? 22 : 16;
  // Más suave si el punto es el de la ciudad y no el del local; un punto en el centro marca las que ya están en la agenda.
  const centro = p.ya_en_agenda ? `<span style="width:6px;height:6px;border-radius:50%;background:var(--surface)"></span>` : '';
  return L.divIcon({
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${tamano}px;height:${tamano}px;border-radius:50%;background:${COLOR_NIVEL[p.nivel]};opacity:${p.coordenadas_aprox ? 0.55 : 1}">${centro}</span>`,
    className: 'catalogo-punto',
    iconSize: [tamano, tamano],
    iconAnchor: [tamano / 2, tamano / 2],
  });
}

function iconoDeGrupo(cluster: L.MarkerCluster): L.DivIcon {
  const n = cluster.getChildCount();
  const tamano = n >= 100 ? 46 : n >= 20 ? 40 : 34;
  return L.divIcon({
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${tamano}px;height:${tamano}px;border-radius:50%;background:var(--acc);color:var(--surface);font-size:12px;font-weight:700;font-variant-numeric:tabular-nums">${n}</span>`,
    className: 'catalogo-grupo',
    iconSize: [tamano, tamano],
    iconAnchor: [tamano / 2, tamano / 2],
  });
}

/** Las salas del catálogo en un mapa de OpenStreetMap, agrupadas por zona. */
export default function MapaCatalogo({ puntos, seleccionada = null, onSeleccionar, fijo = false, className = 'h-full w-full' }: MapaCatalogoProps) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const grupo = useRef<L.MarkerClusterGroup | null>(null);
  const alSeleccionar = useEffectEvent((id: string) => onSeleccionar?.(id));

  useEffect(() => {
    if (!contenedor.current) return;
    const m = L.map(contenedor.current, { center: [40.4168, -3.7038], zoom: 6, zoomControl: !fijo, dragging: !fijo, scrollWheelZoom: !fijo, touchZoom: !fijo, doubleClickZoom: !fijo, boxZoom: !fijo, keyboard: !fijo });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(m);
    const g = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 45, iconCreateFunction: iconoDeGrupo });
    m.addLayer(g);
    mapa.current = m;
    grupo.current = g;
    return () => {
      m.remove();
      mapa.current = null;
      grupo.current = null;
    };
  }, [fijo]);

  useEffect(() => {
    const g = grupo.current;
    const m = mapa.current;
    if (!g || !m) return;
    g.clearLayers();
    for (const p of puntos) {
      const marcador = L.marker([p.lat, p.lon], { icon: iconoDe(p, p.id === seleccionada), title: p.nombre, keyboard: true });
      marcador.on('click', () => alSeleccionar(p.id));
      g.addLayer(marcador);
    }
    if (puntos.length === 1) m.setView([puntos[0].lat, puntos[0].lon], 15);
    else if (puntos.length > 1) m.fitBounds(L.latLngBounds(puntos.map((p) => [p.lat, p.lon] as [number, number])), { padding: [24, 24], maxZoom: 12 });
  }, [puntos, seleccionada]);

  return <div ref={contenedor} className={className} role="application" aria-label="Mapa de salas" />;
}
