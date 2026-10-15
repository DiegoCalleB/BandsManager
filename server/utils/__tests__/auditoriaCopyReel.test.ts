import { describe, expect, it } from "vitest";
import { auditarCopyReel, sanearCopyReel, type CopyReel } from "../auditoriaCopyReel.js";

const bueno: CopyReel = {
  hookText: "Nadie esperaba este final",
  recommendedCopy: "Último tema en la Sala Sol y la gente no se quería ir. Así sonó cuando apagamos los micros.\n\n¿Qué canción cerraríais vosotros?",
  copyTikTok: "Apagamos los micros y siguieron cantando.",
  copyYouTube: "El público acaba la canción por nosotros",
  copyFacebook: "Último tema en la Sala Sol. Apagamos los micros y la sala siguió cantando sola. Gracias, Madrid.",
  hashtags: ["#directo", "#indiemadrid", "#salasol", "#musicaenvivo"]
};

const codigos = (c: CopyReel) => auditarCopyReel(c).problemas.map((p) => p.codigo);

describe("auditarCopyReel", () => {
  it("un copy limpio es apto y puntúa alto", () => {
    const r = auditarCopyReel(bueno);
    expect(r.problemas).toEqual([]);
    expect(r.apto).toBe(true);
    expect(r.puntuacion).toBe(100);
  });

  it("veta el cebo de engagement que Meta penaliza", () => {
    for (const cebo of ["Comenta SÍ si te gusta", "Dale like y comparte", "Etiqueta a quien...", "Comparte si eres fan"]) {
      expect(codigos({ ...bueno, recommendedCopy: cebo })).toContain("cebo_engagement");
    }
    expect(auditarCopyReel({ ...bueno, copyTikTok: "Dale like" }).apto).toBe(false);
  });

  it("veta clichés de reels y palabras de IA del repo", () => {
    expect(codigos({ ...bueno, recommendedCopy: "Un momento épico en directo" })).toContain("cliche");
    expect(codigos({ ...bueno, copyFacebook: "Una experiencia inolvidable para todos" })).toContain("palabra_ia");
  });

  it("los hashtags no van dentro del texto", () => {
    expect(codigos({ ...bueno, recommendedCopy: "Qué noche #directo" })).toContain("hashtag_en_texto");
  });

  it("límites por plataforma: hook ≤8 palabras, título de Shorts ≤60, pie de Instagram ≤2200", () => {
    expect(codigos({ ...bueno, hookText: "uno dos tres cuatro cinco seis siete ocho nueve" })).toContain("hook_largo");
    expect(codigos({ ...bueno, hookText: "" })).toContain("hook_vacio");
    expect(codigos({ ...bueno, copyYouTube: "x".repeat(61) })).toContain("youtube_largo");
    expect(codigos({ ...bueno, recommendedCopy: "a ".repeat(1200) })).toContain("instagram_largo");
  });

  it("número de hashtags: avisa fuera de 3-8", () => {
    expect(codigos({ ...bueno, hashtags: ["#uno"] })).toContain("hashtags_numero");
    expect(auditarCopyReel({ ...bueno, hashtags: ["#uno"] }).apto).toBe(true); // es aviso, no error
  });

  it("el arranque visible de Instagram (~125 caracteres) debe cerrar una idea", () => {
    const largo = `${"palabra ".repeat(20)}y sigue sin punto ${"más texto ".repeat(10)}`;
    expect(codigos({ ...bueno, recommendedCopy: largo })).toContain("arranque_cortado");
  });

  it("estilo: más de 2 emojis y guion largo avisan", () => {
    expect(codigos({ ...bueno, copyTikTok: "Brutal 🔥🔥🔥" })).toContain("emojis");
    expect(codigos({ ...bueno, copyFacebook: "Último tema — y la sala cantó." })).toContain("guion_largo");
  });

  it("la puntuación baja más por errores que por avisos", () => {
    const conAviso = auditarCopyReel({ ...bueno, hashtags: ["#uno"] }).puntuacion;
    const conError = auditarCopyReel({ ...bueno, copyTikTok: "Dale like" }).puntuacion;
    expect(conAviso).toBeGreaterThan(conError);
    expect(conAviso).toBeLessThan(100);
  });
});

describe("sanearCopyReel", () => {
  it("saca los hashtags del texto a la lista, sin duplicados", () => {
    const r = sanearCopyReel({ ...bueno, recommendedCopy: "Qué noche #directo #Madrid", hashtags: ["#directo"] });
    expect(r.recommendedCopy).toBe("Qué noche");
    expect(r.hashtags).toEqual(["#directo", "#Madrid"]);
  });

  it("normaliza hashtags (almohadilla, sin espacios) y deja como mucho 8", () => {
    const r = sanearCopyReel({ ...bueno, hashtags: ["directo", "#indie madrid", ...Array.from({ length: 10 }, (_, i) => `#t${i}`)] });
    expect(r.hashtags[0]).toBe("#directo");
    expect(r.hashtags[1]).toBe("#indiemadrid");
    expect(r.hashtags).toHaveLength(8);
  });

  it("recorta el título de Shorts a 60 caracteres sin partir palabras", () => {
    const r = sanearCopyReel({ ...bueno, copyYouTube: "El público de Madrid acaba la canción por nosotros cuando apagamos todo" });
    expect(r.copyYouTube.length).toBeLessThanOrEqual(60);
    expect(r.copyYouTube.endsWith(" ")).toBe(false);
    expect("El público de Madrid acaba la canción por nosotros cuando apagamos todo".startsWith(r.copyYouTube)).toBe(true);
  });

  it("lo que ya está bien no se toca", () => {
    expect(sanearCopyReel(bueno)).toEqual(bueno);
  });
});
