import { lazy, Suspense } from 'react';
import { ArrowLeft, Check, ExternalLink, Plus } from 'lucide-react';
import { Button, Chip } from '../../ui';
import type { SalaDelCatalogo } from '../../../services/apiCatalogo';
import { LogoSala } from './LogoSala';
import { urlSegura } from './urlSegura';

const MapaCatalogo = lazy(() => import('./MapaCatalogo'));

const NIVEL: Record<SalaDelCatalogo['nivel'], { etiqueta: string; explicacion: string }> = {
  verificada: { etiqueta: 'Verificada', explicacion: 'Bandas reales han escrito a esta sala y ha respondido, o su ficha está comprobada.' },
  probable: { etiqueta: 'Probable', explicacion: 'Tiene señales de que existe y está activa (web, contacto, bandas que la han contactado), pero nadie ha confirmado una respuesta.' },
  sin_verificar: { etiqueta: 'Sin verificar', explicacion: 'Viene de un mapa o un directorio y ninguna banda la ha contactado todavía. Puede estar desactualizada.' },
};

interface FichaSalaCatalogoProps {
  sala: SalaDelCatalogo;
  anadiendo: boolean;
  onAnadir: () => void;
  onVolver: () => void;
}

function Medidor({ etiqueta, valor, texto }: { etiqueta: string; valor: number; texto: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-[var(--ink-2)]">{etiqueta}</span>
        <span className="font-semibold tabular-nums">{texto}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-[var(--r-pill)] bg-[var(--sunken)]" role="img" aria-label={`${etiqueta}: ${texto}`}>
        <div className="h-full rounded-[var(--r-pill)] bg-[var(--acc)]" style={{ width: `${Math.max(4, valor)}%` }} />
      </div>
    </div>
  );
}

const Dato = ({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) => (
  <div>
    <dt className="text-xs text-[var(--ink-3)]">{etiqueta}</dt>
    <dd className="text-sm text-[var(--ink)]">{children}</dd>
  </div>
);

const Enlace = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--acc-ink)] underline-offset-2 hover:underline">
    {children}
    <ExternalLink className="h-3 w-3" aria-hidden />
  </a>
);

/** Ficha de una sala del catálogo: qué sabemos de ella, cuánto fiarse y dónde está. */
export function FichaSalaCatalogo({ sala, anadiendo, onAnadir, onVolver }: FichaSalaCatalogoProps) {
  const nivel = NIVEL[sala.nivel];
  const web = urlSegura(sala.website);
  const instagram = sala.instagram ? urlSegura(sala.instagram.startsWith('http') ? sala.instagram : `https://instagram.com/${sala.instagram.replace(/^@/, '')}`) : null;
  const situada = sala.lat !== null && sala.lon !== null;
  const lugar = [sala.ciudad, sala.region && sala.region !== sala.ciudad ? sala.region : null].filter(Boolean).join(' · ');

  return (
    <div className="space-y-4">
      <Button size="sm" variant="ghost" onClick={onVolver} className="-ml-2">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />Volver al catálogo
      </Button>

      <div className="flex items-start gap-3">
        <LogoSala nombre={sala.nombre} website={sala.website} className="h-14 w-14" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="text-lg font-bold text-balance">{sala.nombre}</h3>
          {lugar && <p className="text-sm text-[var(--ink-2)]">{lugar}</p>}
          <div className="flex flex-wrap gap-1.5">
            <Chip tone={sala.nivel === 'sin_verificar' ? 'neutral' : 'ok'}>{nivel.etiqueta}</Chip>
            {sala.tipo !== 'sala' && <Chip>{sala.tipo}</Chip>}
            {sala.posiblemente_cerrada && <Chip tone="alert">Google la da por cerrada</Chip>}
            {sala.bandas_con_respuesta > 0 && <Chip tone="acc">{sala.bandas_con_respuesta === 1 ? 'Ha respondido a 1 banda' : `Ha respondido a ${sala.bandas_con_respuesta} bandas`}</Chip>}
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-[var(--r-m)] bg-[var(--bg)] p-3.5">
        <Medidor etiqueta="Fiabilidad" valor={sala.nivel === 'verificada' ? 100 : sala.nivel === 'probable' ? 60 : 25} texto={nivel.etiqueta} />
        <p className="text-xs text-[var(--ink-2)] text-pretty">{nivel.explicacion}</p>
        <Medidor etiqueta="Ficha completa" valor={sala.completitud} texto={`${sala.completitud} %`} />
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Dato etiqueta="Dirección">{sala.direccion ?? <span className="text-[var(--ink-3)]">Sin dirección</span>}</Dato>
        <Dato etiqueta="Aforo">{sala.aforo ? `${sala.aforo} personas` : <span className="text-[var(--ink-3)]">Sin dato</span>}</Dato>
        <Dato etiqueta="Género">{sala.genero ?? <span className="text-[var(--ink-3)]">Sin dato</span>}</Dato>
        <Dato etiqueta="Web">{web ? <Enlace href={web}>{new URL(web).hostname.replace(/^www\./, '')}</Enlace> : <span className="text-[var(--ink-3)]">Sin web</span>}</Dato>
        <Dato etiqueta="Instagram">{instagram ? <Enlace href={instagram}>{sala.instagram!.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')}</Enlace> : <span className="text-[var(--ink-3)]">Sin Instagram</span>}</Dato>
        <Dato etiqueta="Contacto">
          {sala.tiene_email || sala.tiene_telefono
            ? [sala.tiene_email && 'Email de la sala', sala.tiene_telefono && 'Teléfono fijo'].filter(Boolean).join(' y ') + ' (te lo damos al añadirla)'
            : <span className="text-[var(--ink-3)]">Sin contacto todavía</span>}
        </Dato>
      </dl>

      {situada ? (
        <div className="space-y-1.5">
          <div className="h-48 overflow-hidden rounded-[var(--r-m)] bg-[var(--sunken)]">
            <Suspense fallback={<div className="h-full w-full animate-pulse" />}>
              <MapaCatalogo fijo puntos={[{ id: sala.id, nombre: sala.nombre, lat: sala.lat!, lon: sala.lon!, nivel: sala.nivel, coordenadas_aprox: sala.coordenadas_aprox, ya_en_agenda: sala.ya_en_agenda }]} />
            </Suspense>
          </div>
          {sala.coordenadas_aprox && <p className="text-xs text-[var(--ink-2)]">Ubicación aproximada: el punto es el de {sala.ciudad ?? 'su ciudad'}, no el del local.</p>}
          <Enlace href={`https://www.openstreetmap.org/?mlat=${sala.lat}&mlon=${sala.lon}#map=16/${sala.lat}/${sala.lon}`}>Abrir en OpenStreetMap</Enlace>
        </div>
      ) : (
        <p className="text-xs text-[var(--ink-3)]">Todavía no la hemos situado en el mapa.</p>
      )}

      {sala.fuentes.includes('osm') && (
        <p className="text-xs text-[var(--ink-3)]">
          Parte de estos datos vienen de <Enlace href="https://www.openstreetmap.org/copyright">OpenStreetMap</Enlace> (datos de sus colaboradores, licencia ODbL).
        </p>
      )}

      <div className="sticky bottom-0 -mx-1 flex justify-end bg-[var(--surface)] px-1 pt-2">
        {sala.ya_en_agenda ? (
          <span className="flex items-center gap-1.5 py-2 text-sm font-medium text-[var(--ok)]"><Check className="h-4 w-4" aria-hidden />En tu agenda</span>
        ) : (
          <Button variant="primary" disabled={anadiendo} onClick={onAnadir} aria-label={`Añadir ${sala.nombre} a mi agenda`}>
            <Plus className="h-4 w-4" aria-hidden />{anadiendo ? 'Añadiendo…' : 'Añadir a mi agenda'}
          </Button>
        )}
      </div>
    </div>
  );
}
