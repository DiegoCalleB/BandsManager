import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Wand2 } from 'lucide-react';
import type { Concert } from '../../types';
import { Button, EmptyState, Field, Select, Textarea } from '../ui';
import { datosCartel, dibujarCartel } from '../../utils/cartelCompose';
import { generarFondoCartel, type EstiloCartel } from '../../utils/promocionApi';

const ESTILOS: { id: EstiloCartel; etiqueta: string }[] = [
  { id: 'gigposter', etiqueta: 'Serigrafía' },
  { id: 'neon', etiqueta: 'Neón' },
  { id: 'collage', etiqueta: 'Collage punk' },
  { id: 'minimal', etiqueta: 'Minimal' },
  { id: 'vintage', etiqueta: 'Vintage 70' },
];

interface Props {
  concerts: Concert[];
  bandName: string;
}

/** Conciertos de los que tiene sentido hacer cartel: confirmados, no privados, de hoy en adelante. */
function conciertosParaCartel(concerts: Concert[]): Concert[] {
  const hoy = new Date().toISOString().slice(0, 10);
  return concerts
    .filter((c) => c.tipo !== 'privado' && !c.is_posible && (c.fecha || '') >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

const CarteleriaView: React.FC<Props> = ({ concerts, bandName }) => {
  const opciones = useMemo(() => conciertosParaCartel(concerts), [concerts]);
  const [concertId, setConcertId] = useState('');
  const [estilo, setEstilo] = useState<EstiloCartel>('gigposter');
  const [instrucciones, setInstrucciones] = useState('');
  // El fondo es de un concierto concreto: se guarda con su id y solo vale mientras siga elegido.
  const [fondo, setFondo] = useState<{ concertId: string; url: string } | null>(null);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const elegido = opciones.find((c) => c.id === (concertId || opciones[0]?.id));
  const fondoUrl = fondo && fondo.concertId === elegido?.id ? fondo.url : null;

  useEffect(() => {
    if (!fondoUrl || !elegido || !canvasRef.current) return;
    dibujarCartel(canvasRef.current, fondoUrl, datosCartel(elegido, bandName)).catch((e) => {
      console.warn('[Cartelería] No se pudo componer el cartel:', e);
      setError('No pudimos componer el cartel. Genera otro fondo.');
    });
  }, [fondoUrl, elegido, bandName]);

  const generar = async () => {
    if (!elegido) return;
    setGenerando(true);
    setError(null);
    try {
      const r = await generarFondoCartel({ concertId: elegido.id, estilo, instrucciones: instrucciones.trim() || undefined });
      setFondo({ concertId: elegido.id, url: r.url });
    } catch (e) {
      console.warn('[Cartelería] Falló la generación del fondo:', e);
      setError(e instanceof Error && e.message ? e.message : 'No pudimos generar el fondo. Prueba en un rato.');
    } finally {
      setGenerando(false);
    }
  };

  const descargar = () => {
    const canvas = canvasRef.current;
    if (!canvas || !elegido) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `cartel-${bandName}-${elegido.fecha}.png`.replace(/\s+/g, '-').toLowerCase();
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  };

  if (opciones.length === 0) {
    return (
      <div data-modulo="reels" className="mx-auto max-w-3xl px-4 py-8">
        <EmptyState
          title="No hay bolo que anunciar."
          description="Confirma una fecha en el calendario y aquí te preparamos el cartel."
        />
      </div>
    );
  }

  return (
    <div data-modulo="reels" className="mx-auto grid max-w-5xl gap-6 px-4 py-6 md:grid-cols-[1fr_minmax(0,22rem)]">
      <div className="order-first flex items-start justify-center rounded-[var(--r-l)] bg-[var(--sunken)] p-4 md:order-last md:sticky md:top-4 md:self-start">
        <div className="w-full max-w-xs">
          {fondoUrl ? (
            <canvas ref={canvasRef} className="aspect-[4/5] w-full rounded-[var(--r-m)]" aria-label="Vista previa del cartel" />
          ) : (
            <div className="grid aspect-[4/5] w-full place-items-center rounded-[var(--r-m)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--ink-2)]">
              {generando ? 'Pintando el fondo…' : 'Aquí aparecerá tu cartel.'}
            </div>
          )}
        </div>
      </div>

      <div className="grid content-start gap-4">
        <Field label="Concierto">
          <Select value={elegido?.id ?? ''} onChange={(e) => setConcertId(e.target.value)}>
            {opciones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fecha} · {c.sala}
                {c.ciudad ? `, ${c.ciudad}` : ''}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-1.5">
          <span className="text-xs font-medium text-[var(--ink-2)]">Estilo</span>
          <div className="flex flex-wrap gap-2">
            {ESTILOS.map((e) => (
              <Button key={e.id} size="sm" variant={estilo === e.id ? 'inverse' : 'neutral'} onClick={() => setEstilo(e.id)}>
                {e.etiqueta}
              </Button>
            ))}
          </div>
        </div>

        <Field label="Indicaciones" optional hint="Colores, ambiente, objetos. El texto del cartel lo ponemos nosotros, sin erratas.">
          <Textarea rows={2} maxLength={300} value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} />
        </Field>

        {error && <p className="rounded-[var(--r-s)] bg-[var(--alert-soft)] px-3 py-2 text-sm text-[var(--alert)]">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={generar} disabled={generando}>
            <Wand2 className="size-4" aria-hidden />
            {fondoUrl ? 'Otro fondo' : 'Generar cartel'}
          </Button>
          {fondoUrl && (
            <Button onClick={descargar}>
              <Download className="size-4" aria-hidden />
              Descargar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarteleriaView;
