/**
 * Mesa de luz con los highlights detectados y sus señales de energía.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Flame, Layers, Play } from "lucide-react";
import type { ViralWindow } from "./reelsApiTypes";
import { useReelsCenter } from "./ReelsCenterContext";
import { formatTime, parseRangeTimes } from "./reelsHelpers";

/**
 * Mesa de luz con los highlights detectados y sus señales de energía.
 * @returns Sección de interfaz.
 */
export function HighlightsLighttable() {
  const { highlights, colors, textSub, viralWindows, energyWindows, timelineDuration, selectedHighlightIndex, handleSelectHighlight } = useReelsCenter();
  return (
    <>
      {highlights.length > 0 && (
      <div className={`${colors.card} p-5 space-y-4`}>
        <div className={` pb-2 `}>
          <h3
            className={`text-sm font-bold font-display flex items-center gap-2 text-[var(--acc)]`}
          >
            <Layers className="w-4 h-4" /> Mesa de Luz de Clips
            Sugeridos (Highlights)
          </h3>
          <p className={`text-micro font-sans mt-1 ${textSub}`}>
            Hemos localizado {highlights.length} momentos de alto
            potencial. Haz clic en un clip para seleccionarlo,
            previsualizarlo y ajustar su programación.
          </p>
        </div>

        {/* Mapa de señales: si hay desglose (volumen/arranque/ritmo visual) se usa ese, porque
 explica MEJOR por qué se ha elegido cada momento; si no, se cae al de solo energía. */}
        {(viralWindows.length > 0 || energyWindows.length > 0) &&
          timelineDuration > 0 &&
          (() => {
            const ventanas =
              viralWindows.length > 0 ? viralWindows : energyWindows;
            const conDesglose = viralWindows.length > 0;
            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-micro font-sans text-[var(--ink-2)]">
                    {conDesglose
                      ? "Señales medidas (volumen · arranque · montaje)"
                      : "Energía medida en el audio"}
                  </span>
                  <span className="text-micro font-sans text-[var(--ok)]">
                    ● {ventanas.length} tramos con potencial
                  </span>
                </div>
                <div
                  className={`relative w-full h-7 rounded-[var(--r-s)] overflow-hidden bg-[var(--surface)]`}
                >
                  {ventanas.map((v, i) => {
                    const izq = Math.max(
                      0,
                      Math.min(
                        100,
                        (v.start / timelineDuration) * 100,
                      ),
                    );
                    const ancho = Math.max(
                      0.8,
                      Math.min(
                        100 - izq,
                        ((v.end - v.start) / timelineDuration) * 100,
                      ),
                    );
                    const titulo =
                      conDesglose && "motivo" in v
                        ? `${formatTime(v.start)} - ${formatTime(v.end)} · potencial ${v.score}/100\nvolumen ${(v as ViralWindow).energia} · arranque ${(v as ViralWindow).arranque} · montaje ${(v as ViralWindow).dinamismo}\n${(v as ViralWindow).motivo}`
                        : `${formatTime(v.start)} - ${formatTime(v.end)} · energía ${v.score}/100`;
                    return (
                      <div
                        key={`${v.start}-${i}`}
                        className="absolute top-0 bottom-0 rounded-[var(--r-s)]"
                        title={titulo}
                        style={{
                          left: `${izq}%`,
                          width: `${ancho}%`,
                          background: "var(--acc)",
                          opacity:
                            0.25 +
                            (Math.max(0, Math.min(100, v.score)) /
                              100) *
                              0.75,
                        }}
                      />
                    );
                  })}
                  {/* Dónde ha caído el clip seleccionado sobre ese mapa */}
                  {(() => {
                    const clip = highlights[selectedHighlightIndex];
                    if (!clip) return null;
                    const { start, end } = parseRangeTimes(
                      clip.range,
                    );
                    if (end <= start) return null;
                    const izq = Math.max(
                      0,
                      Math.min(100, (start / timelineDuration) * 100),
                    );
                    const ancho = Math.max(
                      0.8,
                      Math.min(
                        100 - izq,
                        ((end - start) / timelineDuration) * 100,
                      ),
                    );
                    return (
                      <div
                        className="absolute top-0 bottom-0 -2 rounded-[var(--r-s)] pointer-events-none"
                        style={{
                          left: `${izq}%`,
                          width: `${ancho}%`,
                          boxShadow:
                            "0 0 0 1px rgba(16,185,129,0.6) inset",
                        }}
                      />
                    );
                  })()}
                </div>
                <p className="text-micro font-sans text-[var(--ink-2)] leading-tight">
                  {conDesglose
                    ? "Cuanto más intenso, más potencial combinado (volumen + arranque + montaje). El recuadro verde es el corte seleccionado."
                    : "Cuanto más intenso, más suena la banda en ese punto. El recuadro verde es el corte seleccionado."}
                </p>
                {(() => {
                  // El motivo de la ventana que coincide con el corte seleccionado, para no obligar a
                  // pasar el ratón por encima de una barra diminuta para leerlo.
                  const clip = highlights[selectedHighlightIndex];
                  if (!clip || !conDesglose) return null;
                  const { start } = parseRangeTimes(clip.range);
                  const ventana = viralWindows.find(
                    (v) => Math.abs(v.start - start) <= 2,
                  );
                  if (!ventana?.motivo) return null;
                  return (
                    <p
                      className={`text-micro font-sans italic leading-snug pt-0.5 text-[var(--acc)]`}
                    >
                      "{ventana.motivo}"
                    </p>
                  );
                })()}
              </div>
            );
          })()}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {highlights.map((clip, index) => {
            const isSelected = selectedHighlightIndex === index;
            return (
              <div
                id={`clip-card-${index}`}
                key={clip.id || index}
                onClick={() => handleSelectHighlight(index)}
                className={` rounded-[var(--r-m)] p-3.5 cursor-pointer transition-ui space-y-3 relative group overflow-hidden ${
                  isSelected
                    ? " bg-[var(--acc)]/5"
                    : " bg-[var(--surface)] hover:bg-[var(--bg)]/50"
                }`}
              >
                {/* Simulated miniature video thumbnail track design */}
                <div
                  className={`w-full h-20 rounded-[var(--r-s)] relative flex flex-col justify-between p-2 overflow-hidden bg-[var(--sunken)]`}
                >
                  {/* Waveforms illustration background */}
                  <div className="absolute inset-x-0 bottom-0 h-8 flex items-end gap-[2px] opacity-25 px-1">
                    {[
                      35, 45, 60, 20, 80, 50, 95, 30, 45, 75, 25, 40,
                      60, 80, 25, 50, 70, 90, 40, 20, 45, 80, 60,
                    ].map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 bg-[var(--acc)]`}
                        style={{
                          height: `${isSelected ? h : h * 0.7}%`,
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-micro font-sans font-bold px-1.5 py-0.5 rounded self-start z-10 bg-[var(--acc)] text-[var(--on-acc)]`}
                  >
                    {clip.range}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center z-0 opacity-80 transition-transform">
                    <div className="w-8 h-8 rounded-[var(--r-pill)] bg-[var(--surface)] flex items-center justify-center text-[var(--acc)]">
                      <Play className="w-3.5 h-3.5 fill-[var(--acc)] ml-0.5" />
                    </div>
                  </div>
                  <span className="text-micro font-sans text-[var(--ink-2)] self-end z-10 bg-[var(--surface)] px-1 rounded truncate w-full">
                    CLIP-{index + 1}.mp4
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4
                    className={`text-xs font-bold font-sans line-clamp-1 flex items-center gap-1 transition-colors text-[var(--ink-2)] group-hover:text-[var(--acc)]`}
                  >
                    {clip.title}
                  </h4>
                  <p
                    className={`text-micro font-sans leading-normal line-clamp-2 ${textSub}`}
                  >
                    {clip.description}
                  </p>
                </div>

                {/* Virality score meter */}
                <div className={`space-y-1 pt-1.5 `}>
                  <div className="flex justify-between items-center text-micro font-sans text-[var(--ink-2)]">
                    <span className="flex items-center gap-1">
                      <Flame
                        className={`w-3 h-3 text-[var(--acc)]`}
                      />{" "}
                      Virality Score:
                    </span>
                    <span
                      className={`font-bold text-[var(--acc)]`}
                    >
                      {clip.virality}%
                    </span>
                  </div>
                  <div
                    className={`w-full h-1 rounded-[var(--r-pill)] overflow-hidden bg-[var(--sunken)]`}
                  >
                    <div
                      className={`h-full bg-[var(--acc)]`}
                      style={{ width: `${clip.virality}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </>
  );
}
