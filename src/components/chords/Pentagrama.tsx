import React, { useEffect, useRef, useState } from 'react';
import { claveParaMidi, notaDeMidi, type Clave } from '../../utils/pentagrama';

interface Props {
  /** Alturas MIDI. `acorde`: todas a la vez en una redonda · `escala`: una detrás de otra, en negras. */
  midi: number[];
  modo: 'acorde' | 'escala';
  bemoles?: boolean;
  /** Fija la clave (por instrumento); sin ella se elige por la altura. */
  clave?: Clave;
  /** Papel de cada nota (en el orden de `midi`): raiz, tercera, quinta, septima o paso. Cada papel tiene su color. */
  roles?: string[];
  /** Solo en `acorde`: una nota suelta (MIDI) tras el acorde, la de paso hacia el siguiente. */
  paso?: number;
  etiqueta: string;
}

/** Encaja el SVG a lo dibujado: las notas muy graves o agudas (líneas adicionales) no se cortan. */
function ajustarAlto(svg: SVGSVGElement | null, ancho: number): void {
  if (!svg) return;
  try {
    const { y, height } = svg.getBBox();
    const arriba = Math.min(0, y - 8);
    const alto = Math.max(130 + arriba, y + height + 8) - arriba;
    svg.setAttribute('viewBox', `0 ${arriba} ${ancho} ${alto}`);
    svg.setAttribute('height', String(alto));
  } catch { /* sin getBBox (tests, SVG fuera de pantalla): vale el alto por defecto */ }
}

/** Pentagrama con VexFlow, cargado solo al pedirlo: la librería no entra en el arranque de la app. */
export const Pentagrama: React.FC<Props> = ({ midi, modo, bemoles = false, clave: claveFija, roles, paso, etiqueta }) => {
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
        const cl = claveFija ?? claveParaMidi(midi);
        const conPaso = modo === 'acorde' && paso !== undefined;
        const acorde = midi.map((m, i) => ({ m, rol: roles?.[i] }));
        const notas = modo === 'acorde' ? (conPaso ? [acorde, [{ m: paso, rol: 'paso' }]] : [acorde]) : midi.map((m, i) => [{ m, rol: roles?.[i] }]);
        const ancho = modo === 'acorde' ? (conPaso ? 200 : 150) : Math.max(220, midi.length * 34 + 70);
        const r = new Renderer(el, Renderer.Backends.SVG);
        r.resize(ancho, 130);
        const ctx = r.getContext();
        const stave = new Stave(2, 24, ancho - 6);
        stave.addClef(cl).setContext(ctx).draw();
        const figuras = notas.map((grupo, gi) => {
          const dur = modo !== 'acorde' ? 'q' : conPaso ? (gi === 0 ? 'h' : 'q') : 'w';
          const por = [...grupo].sort((a, b) => a.m - b.m);
          const ordenadas = por.map((g) => notaDeMidi(g.m, bemoles));
          const nota = new StaveNote({ keys: ordenadas.map((o) => o.clave), duration: dur, clef: cl });
          ordenadas.forEach((o, i) => { if (o.alteracion) nota.addModifier(new Accidental(o.alteracion), i); });
          return nota;
        });
        const voz = new Voice({ numBeats: modo === 'acorde' ? (conPaso ? 3 : 4) : figuras.length, beatValue: 4 });
        voz.addTickables(figuras);
        new Formatter().joinVoices([voz]).format([voz], ancho - 70);
        voz.draw(ctx, stave);
        // Cada nota lleva su papel como clase; el color sale de los tokens (ver abajo).
        figuras.forEach((f, i) => notas[i].slice().sort((a, b) => a.m - b.m).forEach((g, k) => {
          if (!g.rol) return;
          f.noteHeads[k]?.getSVGElement()?.classList.add(`nota-${g.rol}`);
          f.getModifiers().filter((x) => x.getIndex() === k && x.getCategory() === Accidental.CATEGORY).forEach((x) => x.getSVGElement()?.classList.add(`nota-${g.rol}`));
        }));
        const svg = el.querySelector('svg');
        svg?.setAttribute('role', 'img');
        svg?.setAttribute('aria-label', etiqueta);
        ajustarAlto(svg, ancho);
      } catch {
        if (vivo) setFallo(true);
      }
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `clave` resume `midi`
  }, [clave, modo, bemoles, claveFija, roles, paso, etiqueta]);

  if (fallo) return <p className="text-micro text-[var(--ink-2)] font-sans">No se pudo dibujar el pentagrama.</p>;
  return <div ref={ref} className="flex justify-center overflow-x-auto [&_svg]:max-w-full [&_svg_*]:fill-[var(--ink)] [&_svg_*]:stroke-[var(--ink)] [&_.nota-raiz_*]:fill-[var(--ok)] [&_.nota-raiz_*]:stroke-[var(--ok)] [&_.nota-tercera_*]:fill-[var(--tentative)] [&_.nota-tercera_*]:stroke-[var(--tentative)] [&_.nota-septima_*]:fill-[var(--ink-2)] [&_.nota-septima_*]:stroke-[var(--ink-2)] [&_.nota-paso_*]:fill-[var(--acc)] [&_.nota-paso_*]:stroke-[var(--acc)]" />;
};
