import { Check, ExternalLink, Plus } from 'lucide-react';
import { Button, Chip, EmptyState, Input, Skeleton } from '../../ui';
import type { FestivalDelDirectorio } from '../../../services/apiCatalogo';
import { LogoSala } from './LogoSala';
import { urlSegura } from './urlSegura';
import { useCatalogoFestivales } from './useCatalogoFestivales';

const fecha = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

function FilaFestival({ f, sumando, onAnadir }: { f: FestivalDelDirectorio; sumando: boolean; onAnadir: () => void }) {
  const web = urlSegura(f.web);
  const convocatoria = f.convocatoria ? urlSegura(f.convocatoria.url) : null;
  return (
    <li className="flex items-start gap-3 rounded-[var(--r-m)] bg-[var(--bg)] p-3.5">
      <LogoSala nombre={f.nombre} website={f.web} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate text-sm font-semibold">{f.nombre}</p>
        <p className="truncate text-xs text-[var(--ink-2)]">{[f.ciudad, f.provincia !== f.ciudad ? f.provincia : null, f.edicion ? `${fecha(f.edicion.inicio)}–${fecha(f.edicion.fin)}` : null].filter(Boolean).join(' · ')}</p>
        <p className="line-clamp-2 text-xs text-[var(--ink-2)] text-pretty">{f.descripcion}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {f.estilos.slice(0, 3).map((e) => <Chip key={e}>{e}</Chip>)}
          {f.convocatoria && <Chip tone="acc">{f.convocatoria.cierre ? `Convocatoria hasta el ${fecha(f.convocatoria.cierre)}` : 'Tiene convocatoria'}</Chip>}
          {convocatoria && <a href={convocatoria} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--acc-ink)] hover:underline">Bases<ExternalLink className="h-3 w-3" aria-hidden /></a>}
          {web && <a href={web} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--acc-ink)] hover:underline">Web<ExternalLink className="h-3 w-3" aria-hidden /></a>}
        </div>
      </div>
      {f.ya_en_agenda ? (
        <span className="flex shrink-0 items-center gap-1 pt-1 text-xs font-medium text-[var(--ok)]"><Check className="h-3.5 w-3.5" aria-hidden />En tu agenda</span>
      ) : (
        <Button size="sm" variant="primary" disabled={sumando} onClick={onAnadir} aria-label={`Añadir ${f.nombre} a mi agenda`}>
          <Plus className="h-3.5 w-3.5" aria-hidden />{sumando ? 'Añadiendo…' : 'Añadir'}
        </Button>
      )}
    </li>
  );
}

/** Directorio de festivales: con su próxima edición y si tienen convocatoria abierta para bandas. */
export function ListaFestivalesCatalogo({ activo }: { activo: boolean }) {
  const { filtros, cambiar, datos, cargando, fallo, reintentar, anadir, anadiendo, errorAlta } = useCatalogoFestivales(activo);

  return (
    <>
      <div className="grid shrink-0 grid-cols-1 gap-2 p-4 sm:grid-cols-2 sm:px-5">
        <Input aria-label="Buscar festival por nombre" placeholder="Nombre del festival" value={filtros.texto} onChange={(e) => cambiar({ texto: e.target.value })} />
        <Input aria-label="Ciudad o provincia del festival" placeholder="Ciudad o provincia" value={filtros.lugar} onChange={(e) => cambiar({ lugar: e.target.value })} />
        <label className="flex items-center gap-2 text-xs text-[var(--ink-2)] sm:col-span-2">
          <input type="checkbox" checked={filtros.soloConConvocatoria} onChange={(e) => cambiar({ soloConConvocatoria: e.target.checked })} />
          Solo festivales con convocatoria para bandas
        </label>
      </div>
      {errorAlta && <p role="alert" className="mx-4 mb-2 rounded-[var(--r-m)] bg-[var(--alert-soft)] px-3.5 py-2.5 text-sm text-[var(--alert)] sm:mx-5">{errorAlta}</p>}
      <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
        {cargando && !datos ? (
          <ul className="space-y-2" aria-busy="true" aria-label="Buscando festivales">{[0, 1, 2].map((i) => <li key={i}><Skeleton className="h-20" /></li>)}</ul>
        ) : fallo ? (
          <EmptyState compact title="No hemos podido abrir el directorio." description="Prueba otra vez en un momento." action={<Button size="sm" variant="neutral" onClick={reintentar}>Reintentar</Button>} />
        ) : !datos || datos.festivales.length === 0 ? (
          <EmptyState compact title="Ningún festival encaja con eso." description="Prueba con otra ciudad o quita el filtro. Si no está, pídele al chat que lo busque por ti." />
        ) : (
          <>
            <p className="pb-2 text-xs text-[var(--ink-2)] tabular-nums" aria-live="polite">{datos.total > datos.festivales.length ? `Mostrando ${datos.festivales.length} de ${datos.total}.` : `${datos.total} ${datos.total === 1 ? 'festival' : 'festivales'}`}</p>
            <ul className={`space-y-2 transition-opacity ${cargando ? 'opacity-60' : ''}`}>
              {datos.festivales.map((f) => <FilaFestival key={f.slug} f={f} sumando={anadiendo.has(f.slug)} onAnadir={() => void anadir(f.slug)} />)}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
