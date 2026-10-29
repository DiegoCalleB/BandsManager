import React, { useEffect, useRef, useState } from 'react';
// Las letras de cartel (nombre y día de la fecha): solo se cargan con esta vista.
import '@fontsource/anton/latin-400.css';
import '@fontsource/dm-serif-display/latin-400.css';
import { Download, FileArchive, Move, Redo2, Scissors, Settings2, Share2, Undo2 } from 'lucide-react';
import type { Concert } from '../../types';
import { ActionMenu, Button, EmptyState, Select, Tabs } from '../ui';
import { FORMATOS, ORDEN_FORMATOS, dimensiones, type FormatoCartel } from '../../utils/cartel/formatos';
import { fechaCartel } from '../../utils/cartel/texto';
import { useEditorCartel } from './hooks/useEditorCartel';
import { SelectorFondo } from './SelectorFondo';
import { PreguntaCabeza } from './PreguntaCabeza';
import { EstiloBanda } from './EstiloBanda';
import { IdeaCartel } from './IdeaCartel';
import { AjustesCartel } from './AjustesCartel';
import { BarraAjusteTexto, CapaAjusteTexto } from './AjusteTexto';
import type { BloqueAjustable } from '../../utils/cartel/ajustesFinos';
import { puedeQuitarMarcaCartel } from '../../utils/planPermissions';

interface Props {
  concerts: Concert[];
  bandName: string;
  /** Plan de la banda activa: decide si se puede quitar la marca BandManager. */
  plan?: string;
  /** Logo, plantilla del dossier y género de la banda: su ADN visual automático. */
  banda?: { logoUrl?: string | null; plantilla?: string; genero?: string };
  /** Avisa a la app de lo ya guardado en el servidor, para que al volver a la vista siga ahí. */
  onCartelGuardado?: (concertId: string, cartel: { cartel_config?: unknown; cartel_url?: string }) => void;
  /** Si se llega desde la ficha de un bolo, ese bolo ya viene elegido. */
  initialConcertId?: string;
}

const PESTANAS = ORDEN_FORMATOS.map((id) => ({ id, label: FORMATOS[id].etiqueta }));

/**
 * Cartelería: abrir y tener cartel. El próximo bolo viene elegido y el cartel sale al instante
 * sin IA (color + la Onda); la IA y la foto son extras. Tres bloques en móvil: bolo, cartel, acciones.
 */
const CarteleriaView: React.FC<Props> = ({ concerts, bandName, plan, banda, onCartelGuardado, initialConcertId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ajustandoTexto, setAjustandoTexto] = useState(false);
  const [bloqueElegido, setBloqueElegido] = useState<BloqueAjustable | null>(null);
  const ed = useEditorCartel({ canvasRef, concerts, bandName, initialConcertId, puedeQuitarMarca: puedeQuitarMarcaCartel(plan), banda, onCartelGuardado });
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false);
  const { deshacer, rehacer } = ed;

  // Ctrl/⌘+Z deshace y Ctrl/⌘+Mayús+Z (o Ctrl+Y) rehace, salvo mientras se escribe en un campo.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || (e.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable]')) return;
      const k = e.key.toLowerCase();
      if (k === 'z' || k === 'y') {
        e.preventDefault();
        (k === 'y' || e.shiftKey ? rehacer : deshacer)();
      }
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [deshacer, rehacer]);

  if (!ed.concierto) {
    return (
      <div data-modulo="reels" className="mx-auto max-w-3xl px-4 py-8">
        <EmptyState title="No hay bolo que anunciar." description="Confirma una fecha en el calendario y aquí tendrás su cartel en un toque." />
      </div>
    );
  }

  return (
    <div data-modulo="reels" className="mx-auto grid max-w-5xl gap-5 px-4 py-4 md:grid-cols-[minmax(0,1fr)_22rem] md:gap-8 md:py-6">
      {/* Bloque 1 · el bolo */}
      <div className="md:col-start-2 md:row-start-1">
        <Select aria-label="Bolo" value={ed.concierto.id} onChange={(e) => ed.elegirConcierto(e.target.value)}>
          {ed.opciones.map((c) => (
            <option key={c.id} value={c.id}>
              {fechaCartel(c.fecha).toLowerCase()} · {c.sala}
              {c.ciudad ? `, ${c.ciudad}` : ''}
            </option>
          ))}
        </Select>
      </div>

      {/* Bloque 2 · el cartel */}
      <div className="grid gap-3 md:col-start-1 md:row-span-3 md:row-start-1">
        <Tabs aria-label="Formato" layout="fill" items={PESTANAS} value={ed.formato} onChange={(f: FormatoCartel) => ed.elegirFormato(f)} />
        <div className="grid place-items-center rounded-[var(--r-l)] bg-[var(--sunken)] p-3 md:p-6">
          <div className="relative max-w-full">
            <canvas ref={canvasRef} aria-label={`Vista previa del cartel, formato ${FORMATOS[ed.formato].etiqueta}`}
              className="block h-auto max-h-[52vh] w-auto max-w-full rounded-[var(--r-s)] md:max-h-[72vh]" />
            {ajustandoTexto && (
              <CapaAjusteTexto cajas={ed.cajas} ancho={1080} alto={dimensiones(FORMATOS[ed.formato], 1080).alto} ajustes={ed.ajustes.ajustesFinos[ed.formato] ?? {}}
                elegido={bloqueElegido} onElegir={setBloqueElegido} onAjustar={ed.ajustarBloque} />
            )}
          </div>
          {ajustandoTexto && (
            <div className="mt-3">
              <BarraAjusteTexto elegido={bloqueElegido} ajustes={ed.ajustes.ajustesFinos[ed.formato] ?? {}} onAjustar={ed.ajustarBloque} onReiniciar={ed.reiniciarAjustesFinos} hayAjustes={ed.hayAjustesFinos} />
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <Button size="xs" variant="raised" aria-label="Deshacer" disabled={!ed.puedeDeshacer} onClick={ed.deshacer}>
              <Undo2 className="size-3.5" aria-hidden />
            </Button>
            <Button size="xs" variant="raised" aria-label="Rehacer" disabled={!ed.puedeRehacer} onClick={ed.rehacer}>
              <Redo2 className="size-3.5" aria-hidden />
            </Button>
            <Button size="xs" variant={ajustandoTexto ? 'inverse' : 'raised'} aria-pressed={ajustandoTexto} onClick={() => setAjustandoTexto((v) => !v)}>
              <Move className="size-3.5" aria-hidden />
              {ajustandoTexto ? 'Listo' : 'Ajustar el texto'}
            </Button>
          </div>
        </div>
      </div>

      {/* Bloque 3 · fondo y acciones */}
      <div className="grid content-start gap-4 md:col-start-2 md:row-start-2">
        {ed.faltaCabeza && <PreguntaCabeza bandas={ed.bandas} onElegir={(cabeza) => ed.cambiarAjustes({ cabeza })} />}

        <SelectorFondo
          fondo={ed.fondo}
          onFondo={ed.elegirFondo}
          foto={ed.foto}
          onFoto={ed.elegirFoto}
          fondosIa={ed.fondosIa}
          onGenerarIa={ed.generarIa}
          generando={ed.generando}
          onRetocar={ed.retocarIa}
          letrasFallidas={ed.letrasFallidas !== null}
          onRepetirSinLetras={ed.repetirSinLetras}
          retocando={ed.retocando}
          iaFalla={ed.iaFalla}
          letrasIa={ed.letrasIa}
          onLetrasIa={ed.setLetrasIa}
          puedeLetrasIa={ed.puedeLetrasIa}
          estiloInicial={ed.adn.estiloSugerido}
          paletaBanda={ed.adn.paletaBanda}
          panelIdea={<IdeaCartel idea={ed.idea} />}
          panelBanda={
            <EstiloBanda
              referencias={ed.adn.adn.referencias}
              anteriores={ed.anteriores}
              favoritos={ed.adn.adn.favoritos}
              aprender={ed.adn.adn.aprender}
              subiendo={ed.adn.subiendo}
              queMira={ed.adn.referenciasQueMiraLaIa}
              onSubir={ed.adn.subirReferencia}
              onAnadirAnterior={ed.adn.usarComoReferencia}
              onQuitarReferencia={ed.adn.quitarReferencia}
              onUsarFavorito={ed.usarFavorito}
              onQuitarFavorito={ed.adn.quitarFavorito}
              onAprender={ed.adn.alternarAprender}
            />
          }
        />

        {ed.error && <p role="alert" className="rounded-[var(--r-s)] bg-[var(--alert-soft)] px-3 py-2 text-sm text-[var(--alert)]">{ed.error}</p>}

        {/* En móvil el botón flotante del chat ocupa la esquina derecha: se le deja hueco. */}
        <div className="flex items-center gap-2 pr-16 md:pr-0">
          <ActionMenu
            label="Más opciones del cartel"
            items={[
              { label: 'Descargar', icon: Download, onSelect: ed.descargar },
              { label: 'Descargar los 3 formatos', icon: FileArchive, onSelect: ed.descargarTodos },
              ...(ed.formato === 'imprimir' ? [{ label: 'Descargar para imprenta (sangrado y marcas)', icon: Scissors, onSelect: ed.descargarImprenta }] : []),
              { label: 'Ajustes del cartel', icon: Settings2, onSelect: () => setAjustesAbiertos(true) },
            ]}
          />
          <Button variant="primary" size="lg" className="flex-1" onClick={ed.compartir} disabled={ed.exportando}>
            <Share2 className="size-4" aria-hidden />
            {ed.exportando ? 'Preparando…' : 'Compartir'}
          </Button>
        </div>
        {ed.publicado && <p className="text-xs text-[var(--ink-2)]">El cartel ya sale en la página del bolo y al pegar su enlace en WhatsApp.</p>}

        <AjustesCartel
          abierto={ajustesAbiertos}
          onCerrar={() => setAjustesAbiertos(false)}
          ajustes={ed.ajustes}
          onCambiar={ed.cambiarAjustes}
          bandas={ed.bandas}
          tieneHorario={ed.tieneHorario}
          nombreBanda={bandName}
          lugarBolo={[ed.concierto?.sala, ed.concierto?.ciudad].filter(Boolean).join(', ')}
          tieneDireccion={ed.tieneDireccion}
          tieneEnlace={ed.tieneEnlace}
          tieneLogo={ed.tieneLogo}
          puedeQuitarMarca={ed.puedeQuitarMarca}
          logos={ed.logos}
          subiendoLogo={ed.subiendoLogo}
          onSubirLogo={ed.subirLogo}
          onQuitarLogo={ed.quitarLogo}
        />
      </div>
    </div>
  );
};

export default CarteleriaView;
