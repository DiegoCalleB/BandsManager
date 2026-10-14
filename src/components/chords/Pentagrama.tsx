import React, { useEffect, useRef, useState } from 'react';
import { claveParaMidi, notaDeMidi } from '../../utils/pentagrama';

interface Props {
  /** Alturas MIDI. `acorde`: todas a la vez en una redonda · `escala`: una detrás de otra, en negras. */
  midi: number[];
  modo: 'acorde' | 'escala';
  bemoles?: boolean;
  etiqueta: string;
}

/** Pentagrama con VexFlow, cargado solo al pedirlo: la librería no entra en el arranque de la app. */
export const Pentagrama: React.FC<Props> = ({ midi, modo, bemoles = false, etiqueta }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [fallo, setFallo] = useState(false);
  const clave = midi.join(',');

  useEffect(() => {
    const el = ref.current;
    if (!el || !midi.length) return;
    let vivo = true;
    void (async () => {
      try {
        const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = await import('vexflow');
        if (!vivo) return;
        el.replaceChildren();
        const cl = claveParaMidi(midi);
        const notas = modo === 'acorde' ? [midi] : midi.map((m) => [m]);
        const ancho = modo === 'acorde' ? 150 : Math.max(220, midi.length * 34 + 70);
        const r = new Renderer(el, Renderer.Backends.SVG);
        r.resize(ancho, 130);
        const ctx = r.getContext();
        const stave = new Stave(2, 24, ancho - 6);
        stave.addClef(cl).setContext(ctx).draw();
        const dur = modo === 'acorde' ? 'w' : 'q';
        const figuras = notas.map((grupo) => {
          const ordenadas = [...grupo].sort((a, b) => a - b).map((m) => notaDeMidi(m, bemoles));
          const nota = new StaveNote({ keys: ordenadas.map((o) => o.clave), duration: dur, clef: cl });
          ordenadas.forEach((o, i) => { if (o.alteracion) nota.addModifier(new Accidental(o.alteracion), i); });
          return nota;
        });
        const voz = new Voice({ numBeats: modo === 'acorde' ? 4 : figuras.length, beatValue: 4 });
        voz.addTickables(figuras);
        new Formatter().joinVoices([voz]).format([voz], ancho - 70);
        voz.draw(ctx, stave);
        el.querySelector('svg')?.setAttribute('role', 'img');
        el.querySelector('svg')?.setAttribute('aria-label', etiqueta);
      } catch {
        if (vivo) setFallo(true);
      }
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `clave` resume `midi`
  }, [clave, modo, bemoles, etiqueta]);

  if (fallo) return <p className="text-micro text-[var(--ink-2)] font-sans">No se pudo dibujar el pentagrama.</p>;
  return <div ref={ref} className="flex justify-center overflow-x-auto [&_svg]:max-w-full [&_svg_*]:fill-[var(--ink)] [&_svg_*]:stroke-[var(--ink)]" />;
};
