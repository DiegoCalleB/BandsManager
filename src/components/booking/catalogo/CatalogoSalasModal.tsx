import { lazy, Suspense, useState } from 'react';
import { List, Map as MapaIcono, Search, X } from 'lucide-react';
import { ModalPortal } from '../../common/ModalPortal';
import { Button, EmptyState, IconButton, Input, Select, Skeleton, Tabs } from '../../ui';
import { FichaSalaCatalogo } from './FichaSalaCatalogo';
import { ListaFestivalesCatalogo } from './ListaFestivalesCatalogo';
import { ListaSalasCatalogo } from './ListaSalasCatalogo';
import { useCatalogoSalas, type VistaCatalogo } from './useCatalogoSalas';

const MapaCatalogo = lazy(() => import('./MapaCatalogo'));

interface CatalogoSalasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Seccion = 'salas' | 'festivales';

const TIPOS = [
  { valor: '', texto: 'Todos los tipos' },
  { valor: 'sala', texto: 'Salas' },
  { valor: 'festival', texto: 'Festivales' },
  { valor: 'discoteca', texto: 'Discotecas' },
  { valor: 'ayuntamiento', texto: 'Ayuntamientos' },
];

const SECCIONES = [
  { id: 'salas' as const, label: 'Salas' },
  { id: 'festivales' as const, label: 'Festivales' },
];

const VISTAS = [
  { id: 'lista' as const, label: 'Lista', icon: List },
  { id: 'mapa' as const, label: 'Mapa', icon: MapaIcono },
];

/** Explorar el catálogo compartido (salas y festivales) y añadir lo que encaje a la agenda de la banda, en lista, en mapa o ficha a ficha. */
export function CatalogoSalasModal({ isOpen, onClose }: CatalogoSalasModalProps) {
  const [seccion, setSeccion] = useState<Seccion>('salas');
  const [vista, setVista] = useState<VistaCatalogo>('lista');
  const c = useCatalogoSalas(isOpen, vista);
  if (!isOpen) return null;

  const enFicha = seccion === 'salas' && c.ficha !== null;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto overscroll-contain bg-[var(--scrim)]/90 p-2 pb-24 pt-2 sm:items-center sm:p-6 animate-fadeIn">
        <div role="dialog" aria-modal="true" aria-label="Catálogo de salas" className="my-auto flex h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--r-l)] bg-[var(--surface)] text-[var(--ink)] sm:h-[90vh]">
          <div className="flex shrink-0 items-start justify-between gap-3 bg-[var(--bg)]/60 p-4 sm:p-5">
            <div>
              <h2 className="text-base font-bold text-[var(--acc-ink)]">Catálogo de salas y festivales</h2>
              <p className="text-xs text-[var(--ink-2)] text-pretty">Lo que han encontrado todas las bandas, lo más fiable primero. Al añadirlo, pasa a tu agenda con su contacto.</p>
            </div>
            <IconButton label="Cerrar catálogo" onClick={onClose}>
              <X className="h-4 w-4" />
            </IconButton>
          </div>

          {!enFicha && (
            <div className="flex shrink-0 items-center justify-between gap-3 px-4 pt-3 sm:px-5">
              <Tabs aria-label="Qué buscar" items={SECCIONES} value={seccion} onChange={(id) => setSeccion(id as Seccion)} layout="fill" className="w-52" />
              {seccion === 'salas' && <Tabs aria-label="Cómo verlas" items={VISTAS} value={vista} onChange={(id) => setVista(id as VistaCatalogo)} layout="fill" className="w-44" />}
            </div>
          )}

          {seccion === 'festivales' ? (
            <ListaFestivalesCatalogo activo={isOpen} />
          ) : enFicha && c.ficha ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {c.errorAlta && <p role="alert" className="mb-3 rounded-[var(--r-m)] bg-[var(--alert-soft)] px-3.5 py-2.5 text-sm text-[var(--alert)]">{c.errorAlta}</p>}
              <FichaSalaCatalogo sala={c.ficha} anadiendo={c.anadiendo.has(c.ficha.id)} onAnadir={() => void c.anadir(c.ficha!.id)} onVolver={c.cerrarFicha} />
            </div>
          ) : (
            <>
              <div className="grid shrink-0 grid-cols-1 gap-2 p-4 sm:grid-cols-[1fr_1fr_auto] sm:px-5">
                <div className="relative">
                  <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-3)]" />
                  <Input aria-label="Buscar por nombre o género" className="pl-9" placeholder="Nombre o género" value={c.filtros.texto} onChange={(e) => c.cambiar({ texto: e.target.value })} />
                </div>
                <Input aria-label="Ciudad o región" placeholder="Ciudad o región" value={c.filtros.lugar} onChange={(e) => c.cambiar({ lugar: e.target.value })} />
                <Select aria-label="Tipo de espacio" value={c.filtros.tipo} onChange={(e) => c.cambiar({ tipo: e.target.value })}>
                  {TIPOS.map((t) => (
                    <option key={t.valor} value={t.valor}>{t.texto}</option>
                  ))}
                </Select>
                <div className="sm:col-span-3 sm:max-w-xs">
                  <Input aria-label="Aforo orientativo" type="number" inputMode="numeric" min={1} placeholder="Aforo orientativo (personas)" value={c.filtros.aforo} onChange={(e) => c.cambiar({ aforo: e.target.value })} />
                  {c.filtros.aforo.trim() && Number(c.filtros.aforo) > 0 && <p className="pt-1 text-xs text-[var(--ink-3)]">Salas de unas {Math.round(Number(c.filtros.aforo) * 0.5)} a {Math.round(Number(c.filtros.aforo) * 1.5)} personas.</p>}
                </div>
                <label className="flex items-center gap-2 text-xs text-[var(--ink-2)] sm:col-span-3">
                  <input type="checkbox" checked={c.filtros.conContacto} onChange={(e) => c.cambiar({ conContacto: e.target.checked })} />
                  Solo salas con contacto para escribirles
                </label>
              </div>

              {c.errorAlta && <p role="alert" className="mx-4 mb-2 rounded-[var(--r-m)] bg-[var(--alert-soft)] px-3.5 py-2.5 text-sm text-[var(--alert)] sm:mx-5">{c.errorAlta}</p>}

              {vista === 'mapa' ? (
                <VistaMapa c={c} />
              ) : (
                <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
                  {c.cargando && !c.resultado ? (
                    <ul className="space-y-2" aria-busy="true" aria-label="Buscando salas">
                      {[0, 1, 2, 3].map((i) => (
                        <li key={i}><Skeleton className="h-16" /></li>
                      ))}
                    </ul>
                  ) : c.fallo ? (
                    <EmptyState compact title="No hemos podido abrir el catálogo." description="Prueba otra vez en un momento." action={<Button size="sm" variant="neutral" onClick={c.reintentar}>Reintentar</Button>} />
                  ) : !c.resultado || c.resultado.salas.length === 0 ? (
                    <EmptyState compact title="Ninguna sala encaja con eso." description="Prueba con otra ciudad o quita algún filtro. Si no está, pídele al chat que la busque por ti." />
                  ) : (
                    <>
                      <p className="pb-2 text-xs text-[var(--ink-2)] tabular-nums" aria-live="polite">
                        {c.resultado.total > c.resultado.mostradas ? `Mostrando ${c.resultado.mostradas} de ${c.resultado.total}. Afina la búsqueda o mira el mapa para ver el resto.` : `${c.resultado.total} ${c.resultado.total === 1 ? 'sala' : 'salas'}`}
                      </p>
                      <ListaSalasCatalogo salas={c.resultado.salas} cargando={c.cargando} anadiendo={c.anadiendo} onAnadir={(id) => void c.anadir(id)} onAbrir={(s) => void c.abrirFicha(s)} />
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}

/** El mapa con sus filtros: cuenta cuántas salas faltan por situar para no dar la impresión de que no existen. */
function VistaMapa({ c }: { c: ReturnType<typeof useCatalogoSalas> }) {
  const sinSituar = c.mapa ? c.mapa.total - c.mapa.puntos.length : 0;
  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 sm:px-5 sm:pb-5">
      <p className="pb-2 text-xs text-[var(--ink-2)] tabular-nums" aria-live="polite">
        {c.falloMapa ? (
          <>No hemos podido cargar el mapa. <button type="button" className="text-[var(--acc-ink)] underline" onClick={c.reintentar}>Reintentar</button></>
        ) : c.mapa ? (
          `${c.mapa.puntos.length} ${c.mapa.puntos.length === 1 ? 'sala situada' : 'salas situadas'} en el mapa${sinSituar > 0 ? `; otras ${sinSituar} aún sin situar (míralas en la lista)` : ''}. Los puntos tenues son aproximados.`
        ) : (
          'Cargando el mapa…'
        )}
      </p>
      <div className={`relative min-h-64 flex-1 overflow-hidden rounded-[var(--r-m)] bg-[var(--sunken)] transition-opacity ${c.cargandoMapa ? 'opacity-60' : ''}`}>
        <Suspense fallback={<Skeleton className="h-full w-full" />}>
          <MapaCatalogo puntos={c.mapa?.puntos ?? []} onSeleccionar={(id) => void c.abrirFicha(id)} />
        </Suspense>
        {c.abriendoFicha && <p className="absolute bottom-3 left-3 rounded-[var(--r-pill)] bg-[var(--surface)] px-3 py-1.5 text-xs">Abriendo ficha…</p>}
      </div>
    </div>
  );
}
