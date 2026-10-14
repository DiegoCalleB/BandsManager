import { describe, expect, it } from "vitest";
import { FUNDIDO_LOOP_SEG, loopViable, planearRenderClip } from "../clipFiltros.js";
import { buildHookAss, normalizarHook } from "../hookRotulo.js";

describe("planearRenderClip", () => {
  it("sin nada extra reproduce el render de siempre (sin grafo, mapeo por defecto)", () => {
    const p = planearRenderClip({ cropMode: "none", duracion: 30 });
    expect(p.filtroComplejo).toEqual([]);
    expect(p.mapas).toEqual([]);
    expect(p.opcionesSalida).toContain("-crf 23");
    expect(p.opcionesSalida).toContain("-preset veryfast");
  });

  it("encadena encuadre → subtítulos → hook y mapea la última etiqueta", () => {
    const p = planearRenderClip({ cropMode: "crop", duracion: 20, rutaSubtitulos: "/tmp/s.ass", rutaHook: "/tmp/h.ass" });
    expect(p.filtroComplejo.at(-2)).toMatch(/^\[v\]subtitles='.*s\.ass'\[vs\]$/);
    expect(p.filtroComplejo.at(-1)).toMatch(/^\[vs\]subtitles='.*h\.ass'\[vh\]$/);
    expect(p.mapas).toEqual(["-map [vh]", "-map 0:a?"]);
  });

  it("beat-drop: golpe de luz solo en los compases dados, animado por fotograma; sin golpes no hay flash", () => {
    const con = planearRenderClip({ cropMode: "crop", duracion: 20, beatDropFx: true, golpes: [0.5, 2.5] });
    expect(con.filtroComplejo.join(";")).toMatch(/\[v\]eq=brightness='if\(between\(t,0\.500,0\.620\)\+between\(t,2\.500,2\.620\),0\.07,0\)'.*:eval=frame\[vb\]/);
    expect(con.mapas[0]).toBe("-map [vb]");
    // Nunca el flash ciego de buildVerticalFilter (mod(t,4) sin eval=frame).
    expect(con.filtroComplejo.join(";")).not.toContain("mod(t,4)");
    const sin = planearRenderClip({ cropMode: "crop", duracion: 20, beatDropFx: true });
    expect(sin.filtroComplejo.join(";")).not.toContain("eq=");
  });

  it("calidad alta: 30 fps constantes, keyframe cada 2 s, crf 19, AAC 192k/48k", () => {
    const o = planearRenderClip({ cropMode: "crop", duracion: 20, calidad: "alta" }).opcionesSalida;
    expect(o).toEqual(expect.arrayContaining(["-preset medium", "-crf 19", "-r 30", "-g 60", "-b:a 192k", "-ar 48000"]));
  });

  it("normaliza el volumen a -14 LUFS sin tocar el vídeo", () => {
    const p = planearRenderClip({ cropMode: "none", duracion: 20, normalizarVolumen: true });
    expect(p.filtroComplejo).toContain("[0:v]null[v]");
    expect(p.filtroComplejo.join(";")).toContain("loudnorm=I=-14:TP=-1:LRA=11");
    expect(p.mapas).toEqual(["-map [v]", "-map [an]"]);
  });

  it("loop: el cuerpo se cruza con la cabeza y el clip pierde exactamente el cruce", () => {
    const p = planearRenderClip({ cropMode: "crop", duracion: 12, loop: true, normalizarVolumen: true });
    expect(p.loopAplicado).toBe(true);
    expect(p.duracionFinal).toBeCloseTo(12 - FUNDIDO_LOOP_SEG, 5);
    const g = p.filtroComplejo.join(";");
    expect(g).toContain(`xfade=transition=fade:duration=${FUNDIDO_LOOP_SEG}:offset=11.200`);
    expect(g).toContain("amix=inputs=2:duration=longest:normalize=0,atrim=0:11.600");
    expect(g).not.toContain("acrossfade");
    expect(p.mapas).toEqual(["-map [vloop]", "-map [aloop]"]);
  });

  it("un clip demasiado corto no se hace loop", () => {
    expect(loopViable(3)).toBe(false);
    const p = planearRenderClip({ cropMode: "crop", duracion: 3, loop: true });
    expect(p.loopAplicado).toBe(false);
    expect(p.duracionFinal).toBe(3);
  });

  it("sin pista de audio no se construye cadena de audio", () => {
    const p = planearRenderClip({ cropMode: "crop", duracion: 12, loop: true, normalizarVolumen: true, sinAudio: true });
    expect(p.filtroComplejo.join(";")).not.toMatch(/loudnorm|amix/);
    expect(p.mapas).toEqual(["-map [vloop]"]);
  });
});

describe("hook", () => {
  it("normaliza: sin etiquetas ASS, sin saltos y con tope de palabras", () => {
    expect(normalizarHook("  {\\an1}Nadie\nesperaba   esto  ")).toBe("an1Nadie esperaba esto");
    expect(normalizarHook("a b c d e f g h i j").split(" ")).toHaveLength(8);
    expect(normalizarHook("")).toBe("");
  });

  it("ASS: caja opaca arriba, 0–2,5 s y con fundido", () => {
    const ass = buildHookAss("Nadie esperaba este final")!;
    expect(ass).toContain("PlayResY: 1920");
    expect(ass).toMatch(/Style: Hook,Arial,\d+,.*,3,\d+,0,8,/); // BorderStyle 3, Alignment 8 (arriba)
    expect(ass).toContain("Dialogue: 1,0:00:00.00,0:00:02.50,Hook,,0,0,0,,{\\fad(150,250)}");
  });

  it("sin texto no hay capa", () => {
    expect(buildHookAss("   ")).toBeNull();
  });
});
