/* Mezcla de la banda sonora (la usa cine.js): lo que hace un técnico de sonido en cualquier película.
   - Ducking asimétrico: la música baja rápido cuando entra la voz y sube despacio cuando acaba, así no «bombea» en las pausas
     entre frases (los huecos son de medio segundo).
   - Hueco de frecuencias: bajo la voz la música pierde 5 dB hacia los 2,8 kHz (donde está la inteligibilidad), así puede sonar
     más alta sin tapar el diálogo.
   - Limitador al final de la cadena, para que ninguna canción sature el altavoz.
   Niveles (todas las voces y canciones salen a -16/-17 LUFS; ver tools/mezcla.py): bajo la voz la música queda a unos -15 dB de ella y,
   sin diálogo, a unos -7 dB. */
(function () {
  var dip = null;
  window.CineMezcla = {
    cadena: function (ac, entrada) {
      dip = ac.createBiquadFilter(); dip.type = 'peaking'; dip.frequency.value = 2800; dip.Q.value = 0.9; dip.gain.value = 0;
      var lim = ac.createDynamicsCompressor();
      lim.threshold.value = -9; lim.knee.value = 8; lim.ratio.value = 8; lim.attack.value = 0.005; lim.release.value = 0.2;
      entrada.connect(dip); dip.connect(lim); lim.connect(ac.destination);
    },
    // por fotograma: baja rápido (ataque ~ 90 ms) y sube lento (suelta ~ 0,9 s)
    coef: function (objetivo, actual) { return objetivo < actual ? 0.17 : 0.03; },
    dip: function (vol, alto, bajo) { if (dip) dip.gain.value = -5 * Math.max(0, Math.min(1, (alto - vol) / (alto - bajo))); },
  };
})();
