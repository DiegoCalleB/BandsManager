/**
 * CSS de la hoja impresa: página, filas, columnas, tipografías y estilos manuscritos.
 * Extraído de printDocumentBuilder.ts (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { PAGE_MARGIN_X_MM, PAGE_MARGIN_Y_MM, PAGE_SHEET_HEIGHT_MM, SetlistStylePreset } from "./printLayout";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface buildPrintStylesParams {
  stylePreset: SetlistStylePreset;
  inkColor: "#0038a8" | "#111827" | "#dc2626" | "#7c3aed";
  showSongNumbers: boolean;
  handFont: "'Caveat', cursive, sans-serif" | "'Permanent Marker', cursive, sans-serif" | "'Courier Prime', monospace" | "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
}

/**
 * CSS de la hoja impresa: página, filas, columnas, tipografías y estilos manuscritos.
 * @param params Estado y callbacks del contenedor ({@link buildPrintStylesParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function buildPrintStyles({ stylePreset, inkColor, showSongNumbers, handFont }: buildPrintStylesParams) {
  // CSS de impresión: extraído a variable (en vez de embebido directamente en el HTML final
  // más abajo) para poder inyectar EXACTAMENTE el mismo CSS en el iframe de medición oculto
  // de auto-ajuste — misma altura real, no una aproximación heurística.
  const printCss = `
 @page {
 size: A4 portrait;
 margin: ${PAGE_MARGIN_Y_MM}mm ${PAGE_MARGIN_X_MM}mm;
 }
 * {
 box-sizing: border-box;
 }
 body {
 font-family: ${stylePreset === "rock_stage" ? "'Anton', 'Oswald', -apple-system, sans-serif" : stylePreset === "festival_bold" ? "'Oswald', sans-serif" : "-apple-system, BlinkMacSystemFont, sans-serif"};
 color: #000;
 background: #fff;
 margin: 0;
 padding: 0;
 -webkit-print-color-adjust: exact;
 print-color-adjust: exact;
 }
 .sheet-page {
 position: relative;
 /* isolation: la marca de agua (z-index:-1) debe quedar DETRÁS del contenido pero DELANTE del
 fondo blanco de la hoja; sin stacking context propio se colaba bajo el fondo y no se veía. */
 isolation: isolate;
 width: 100%;
 min-height: ${PAGE_SHEET_HEIGHT_MM}mm;
 display: flex;
 flex-direction: column;
 justify-content: space-between;
 padding: 2px;
 overflow: hidden;
 }
 .page-break {
 page-break-after: always;
 break-after: page;
 }

 /* Marca de agua: muy suave, de fondo, centrada — se nota que está pero no compite con
 la lectura. position:absolute la saca del flujo (no afecta en nada a la medición del
 auto-ajuste, que solo mide header/filas/footer por separado) y z-index negativo la
 deja detrás del contenido normal dentro del propio stacking context de .sheet-page.
 Si el grupo tiene logo lo usa en alta resolución (misma imagen original que en la
 cabecera, no una miniatura) — el texto con el nombre queda como alternativa cuando
 no hay logo subido. */
 .page-watermark {
 position: absolute;
 inset: 0;
 z-index: -1;
 display: flex;
 align-items: center;
 justify-content: center;
 pointer-events: none;
 user-select: none;
 overflow: hidden;
 }
 .page-watermark-logo {
 max-width: 65%;
 max-height: 65%;
 object-fit: contain;
 /* 0.09 se veía casi invisible en papel real (la pantalla ilumina el mismo valor de
 opacidad más de lo que refleja la tinta impresa) — subido a 0.16, todavía sutil
 como marca de agua de fondo, pero perceptible sin competir con el texto negro. */
 opacity: 0.14;
 /* grayscale + multiply: el logo se funde con el papel en vez de pintar su caja. */
 filter: grayscale(100%);
 mix-blend-mode: multiply;
 /* Borde difuminado: un logo con fondo opaco no deja un rectángulo duro, se desvanece. */
 -webkit-mask-image: radial-gradient(closest-side, #000 55%, transparent 100%);
 mask-image: radial-gradient(closest-side, #000 55%, transparent 100%);
 }
 .page-watermark-text {
 font-family:'Anton','Oswald', sans-serif;
 font-size: 80pt;
 font-weight: 900;
 letter-spacing: 4px;
 color: ${inkColor};
 opacity: 0.14;
 transform: rotate(-20deg);
 white-space: nowrap;
 }

 /* Header — padding/margin reducidos a propósito: cada mm que se ahorra aquí es un mm
 más de margen para las canciones, y así menos probabilidad de que una hoja con
 contenido ajustado necesite una segunda hoja casi vacía. */
 .page-header {
 display: flex;
 justify-content: space-between;
 align-items: center;
 border-bottom: 1px solid #000;
 padding-bottom: 3px;
 margin-bottom: 5px;
 gap: 12px;
 }
 /* Cabecera centrada y COMPACTA: el logo a un lado del nombre del grupo y del repertorio
 (como una sola pieza centrada) y la copia del músico en una línea fina debajo. Apilar logo,
 nombre, repertorio y músico ocupaba ~115px, un 11 % de la hoja. */
 .page-header.is-centered {
 flex-flow: row wrap;
 justify-content: center;
 gap: 2px 14px;
 padding-bottom: 3px;
 margin-bottom: 5px;
 text-align: center;
 }
 .is-centered .header-left {
 flex-direction: row;
 justify-content: center;
 gap: 10px;
 }
 .is-centered .band-text-block {
 align-items: center;
 text-align: center;
 }
 .is-centered .band-logo-img {
 height: 24px;
 max-width: 80px;
 }
 .is-centered .header-right {
 text-align: center;
 }
 .is-centered .tag-name {
 font-size: 9pt;
 }
 .header-left {
 display: flex;
 align-items: center;
 gap: 8px;
 }
 /* Alto fijo (height), NO max-height: un logo remoto aún sin cargar al MEDIR la hoja contaba como
 0px de alto y luego, ya cargado, empujaba la última canción a una hoja extra. */
 .band-logo-img {
 height: 24px;
 width: auto;
 max-width: 80px;
 object-fit: contain;
 filter: grayscale(100%) contrast(150%);
 }
 .band-text-block {
 display: flex;
 flex-direction: row;
 align-items: baseline;
 gap: 10px;
 min-width: 0;
 }
 .band-heading {
 font-family:'Anton','Oswald', sans-serif;
 font-size: 14pt;
 line-height: 1.1;
 margin: 0;
 letter-spacing: 0.5px;
 white-space: nowrap;
 color: #000;
 }
 /* Solo el nombre del repertorio, en una línea simple — sin badge ni duración/nº de
 temas, que era ruido que no aportaba nada al músico leyendo desde el escenario. */
 .setlist-meta {
 font-family:'Oswald', sans-serif;
 font-size: 9pt;
 font-weight: 700;
 color: #333;
 margin-top: 0px;
 white-space: nowrap;
 overflow: hidden;
 text-overflow: ellipsis;
 max-width: 100%;
 }

 .header-right {
 text-align: right;
 }
 .member-stage-tag {
 display: flex;
 align-items: baseline;
 justify-content: flex-end;
 gap: 6px;
 padding: 0;
 background: #fff;
 white-space: nowrap;
 }
 .tag-title {
 font-family:'Oswald', sans-serif;
 font-size: 5.5pt;
 font-weight: 700;
 color: #555;
 letter-spacing: 0.8px;
 }
 .tag-name {
 font-family:'Anton','Oswald', sans-serif;
 font-size: 10pt;
 line-height: 1.1;
 color: #000;
 margin-top: 0;
 }
 .tag-instrument {
 font-family: monospace;
 font-size: 7pt;
 font-weight: 800;
 color: #333;
 }

 /* Setlist Container: el ritmo vertical"sin nota" es el de una lista impresa normal
 y apretada (como si se hubiera impreso ANTES de añadir ninguna anotación) — el
 espacio para las notas manuscritas no se reserva aquí, se aprovecha el hueco que
 ya deja el propio interlineado del título (ver .song-notes-below más abajo). */
 .setlist-items-container {
 flex: 1;
 display: flex;
 flex-direction: column;
 /* Centrado vertical en el hueco entre cabecera y pie: con pocos temas el repertorio queda
 en medio de la hoja en vez de pegado arriba con un tercio de papel en blanco debajo. Si la
 hoja va llena no tiene efecto (no hay hueco que repartir). */
 justify-content: center;
 /* gap:0 a propósito: con 30+ canciones, cada px de gap se multiplica por el nº de
 filas — es lo que más margen aporta para caber en menos hojas (ver ROW_GAP_PX y
 line-height de .song-title, mismo motivo). */
 gap: 0px;
 }

 .setlist-song-item {
 padding: 3px 0;
 /* Red de seguridad de impresión: nuestro propio reparto por páginas (ver
 setlistPaginator.ts) es quien decide qué canción va en qué hoja, así que en el caso
 normal el navegador nunca tiene que partir nada por su cuenta. Pero si, por lo
 que sea (una fuente que tarda un pelín más en cargar, redondeo de subpíxel), el
 contenido real se pasa unos px del físico de la hoja, esto evita que sea una fila
 CONCRETA la que se parta a la mitad entre dos hojas — la empuja entera a la
 siguiente en vez de partirla visualmente por la mitad. */
 break-inside: avoid;
 page-break-inside: avoid;
 }

 /* .song-line nunca envuelve: el título se trunca con"..." antes de saltar a una
 segunda línea, así la fila mide siempre lo mismo y nada se monta encima de la
 canción anterior, sea cual sea la longitud del título o de las notas. Sin
 justify-content:space-between a propósito: la nota debe quedar pegada justo detrás
 del título (como un boli escribiendo a continuación), no flotando contra el margen
 derecho de la hoja con un hueco en blanco en medio. */
 .song-line {
 display: flex;
 align-items: baseline;
 gap: 5px;
 flex-wrap: nowrap;
 }
 .song-left {
 display: flex;
 align-items: baseline;
 flex-wrap: nowrap;
 gap: 8px;
 min-width: 0;
 flex: 0 1 auto;
 overflow: hidden;
 }
 .song-num {
 /* font-size inline por fila (no aquí): titleFontPt puede variar por miembro/página
 según el motor de maquetación (ver setlistPaginator.ts). */
 font-family:'Oswald', sans-serif;
 font-weight: 800;
 color: #444;
 min-width: 32px;
 flex-shrink: 0;
 }
 .song-title {
 /* font-size inline por fila (no aquí): mismo motivo que .song-num de arriba.
 line-height:1 (antes 1.1) por el mismo motivo que el gap:0 de arriba — con
 muchas filas, cada décima de interlineado de sobra se multiplica. */
 font-family: ${stylePreset === "rock_stage" ? "'Anton', 'Oswald', sans-serif" : "'Oswald', sans-serif"};
 font-weight: 900;
 letter-spacing: 0.5px;
 color: #000;
 line-height: 1;
 min-width: 0;
 flex-shrink: 1;
 overflow: hidden;
 text-overflow: ellipsis;
 white-space: nowrap;
 }

 /* Badges: nunca se encogen ni desaparecen — el título es el único que cede espacio */
 /* Tono y BPM en columna a la derecha (modo izquierda): alineados fila a fila como una tabla,
 no pegados al final de cada título a una distancia distinta. */
 .song-badges {
 margin-left: auto;
 display: flex;
 align-items: baseline;
 justify-content: flex-end;
 gap: 12px;
 padding-left: 12px;
 flex-shrink: 0;
 }
 .song-badges .tag-tonality { min-width: 2.2em; text-align: right; }
 .song-badges .tag-bpm { min-width: 4.4em; text-align: right; }
 .tag-tonality {
 font-family: monospace;
 font-size: 13pt;
 font-weight: 800;
 padding: 1px 6px;
 border-radius: 4px;
 /* Pastilla negra con letra blanca: la tonalidad se lee de un vistazo en el atril. */
 background: #000;
 color: #fff;
 -webkit-print-color-adjust: exact;
 print-color-adjust: exact;
 flex-shrink: 0;
 }
 .tag-bpm {
 font-family: monospace;
 font-size: 10pt;
 font-weight: 800;
 color: #111;
 flex-shrink: 0;
 }
 .tag-dur {
 font-family: monospace;
 flex-shrink: 0;
 font-size: 10pt;
 font-weight: 700;
 color: #666;
 }

 /* Notas"escritas a mano encima del repertorio ya impreso": las tres (miembro, nota
 del bolo, nota general) comparten la fuente manuscrita y solo se distinguen por su
 color de tinta. El tamaño de fuente (por línea, no por bloque) y si van al lado
 del título o en su propia línea debajo se calculan fila a fila en JS (ver
 computeNoteLayout/textFit.ts): se encoge la fuente tanto como haga falta — nunca
 se parte una nota en 2 líneas ni se trunca su texto. Por eso aquí no hay font-size
 ni max-width fijos: llegan inline por fila/línea. */
 /* Cada nota apilada en su propia línea (no todas seguidas), justo detrás del título
 (align-items:flex-start: el texto arranca pegado al título, no alineado contra el
 margen derecho del carril calculado — eso dejaba un hueco en blanco en medio).
 overflow:visible a propósito (ver .note-seg): en el caso raro de una nota
 patológicamente larga que ni encogida al mínimo cabe, se deja que asome un poco
 fuera de su carril en vez de recortarla sin avisar. */
 .song-notes-right {
 display: flex;
 flex-direction: column;
 align-items: flex-start;
 /* align-self:flex-start a propósito: .song-line usa align-items:baseline, y al ser
 este un contenedor flex-column con varias líneas apiladas, su"baseline" para el
 padre se toma de la ÚLTIMA línea — eso empujaba toda la columna hacia abajo,
 dejando un hueco entre el título y la primera nota. Con flex-start se ignora ese
 baseline y la columna se pega arriba, junto al título. */
 align-self: flex-start;
 gap: 0px;
 flex-shrink: 0;
 overflow: visible;
 line-height: 1;
 }
 /* margin-top negativo a propósito:"muerde" el hueco que ya deja el descendente/
 interlineado del título de arriba, para que la nota parezca escrita justo pegada
 a la línea impresa en vez de maquetada como una fila nueva con su propio aire. */
 .song-notes-below {
 display: flex;
 flex-direction: column;
 gap: 2px;
 padding-left: ${showSongNumbers ? "40px" : "6px"};
 margin-top: -10px;
 line-height: 1;
 }
 .note-seg {
 /* overflow:visible a propósito: el texto nunca se trunca (ver textFit.ts). Cada nota
 lleva su propio tamaño. Al lado del título (modo inline) se acepta solo si cabe en una
 línea (nowrap); debajo, si ni al tamaño mínimo legible cabe, baja a una segunda línea
 en vez de encogerse hasta ser ilegible (ver .song-notes-below .note-seg). */
 overflow: visible;
 white-space: nowrap;
 min-width: 0;
 max-width: 100%;
 }
 .note-member {
 font-family: ${handFont};
 font-weight: 700;
 color: ${inkColor} !important;
 letter-spacing: 0.2px;
 }
 .note-cue {
 font-family: ${handFont};
 font-weight: 700;
 color: #b45309;
 letter-spacing: 0.2px;
 }
 .note-general {
 font-family: ${handFont};
 font-weight: 600;
 color: #555;
 letter-spacing: 0.2px;
 }

 /* Dividers & Interludes — línea fina con el texto en medio, ocupando lo mínimo
 posible: son separadores de estructura, no canciones, no deben competir por
 espacio vertical con el repertorio. */
 .block-divider-item, .bis-divider-item {
 display: flex;
 align-items: center;
 gap: 8px;
 margin: 6px 0;
 break-inside: avoid;
 page-break-inside: avoid;
 }
 .divider-line {
 flex: 1;
 height: 1px;
 background: #000;
 }
 .block-title {
 font-family:'Oswald', sans-serif;
 font-size: 9pt;
 font-weight: 800;
 letter-spacing: 1px;
 color: #000;
 white-space: nowrap;
 }
 .bis-text {
 font-family:'Oswald', sans-serif;
 font-size: 9pt;
 font-weight: 800;
 letter-spacing: 1px;
 color: #000;
 white-space: nowrap;
 }

 .interlude-item {
 font-family:'Oswald', sans-serif;
 font-size: 10pt;
 font-weight: 700;
 color: #222;
 padding: 0px 0 0px ${showSongNumbers ? "40px" : "6px"};
 letter-spacing: 0.5px;
 break-inside: avoid;
 page-break-inside: avoid;
 }
 .interlude-title {
 font-weight: 800;
 letter-spacing: 1.5px;
 }
 /* La nota del interludio va en su propia línea, a mano como el resto de notas, y nunca pasa
 de una línea (elipsis): antes salía en monoespaciada y partida en dos. */
 .interlude-note {
 display: block;
 font-size: 11pt;
 font-family: ${handFont};
 font-weight: 600;
 color: #555;
 letter-spacing: 0.2px;
 white-space: nowrap;
 overflow: hidden;
 text-overflow: ellipsis;
 }

 /* Footer */
 /* padding/margin reducidos por el mismo motivo que el header: más espacio libre
 para las canciones. */
 .page-footer {
 display: flex;
 justify-content: space-between;
 align-items: center;
 border-top: 1px solid #000;
 padding-top: 0;
 margin-top: 1px;
 line-height: 1.1;
 font-family: monospace;
 font-size: 6pt;
 color: #444;
 }
 .footer-left {
 display: flex;
 align-items: center;
 gap: 6px;
 }
 .footer-qr { display: inline-flex; line-height: 0; }
 .footer-qr svg { display: block; }
 .app-logo-badge {
 font-weight: 900;
 color: #000;
 }
 .app-link {
 color: #000;
 text-decoration: none;
 font-weight: 700;
 }
 .footer-sep {
 color: #999;
 }
 .footer-right {
 display: flex;
 align-items: center;
 gap: 6px;
 font-weight: 700;
 }

 /* Repertorio centrado: número + título en el eje de la hoja, notas debajo también centradas
 (siempre en modo "below", ver forceBelowMode), interludios sin sangría. */
 .is-centered .song-line {
 justify-content: center;
 }
 /* Centrado: número + título como un solo texto en línea. Si el título baja a dos líneas,
 el número se queda pegado a la primera en vez de quedar suelto en el margen. */
 .is-centered .song-left {
 display: block;
 text-align: center;
 overflow: visible;
 }
 .is-centered .song-num {
 display: inline-block;
 min-width: 0;
 margin-right: 8px;
 }
 .is-centered .song-title {
 display: inline;
 white-space: normal;
 overflow: visible;
 text-overflow: clip;
 }
 /* Tono/BPM juntos y sin partirse: si no caben tras el título, bajan como un solo bloque. */
 .badges-inline {
 display: inline-block;
 white-space: nowrap;
 margin-left: 10px;
 }
 .song-left > .badges-inline { flex-shrink: 0; margin-left: 4px; }
 .badges-inline > span + span {
 margin-left: 8px;
 }
 .is-centered .song-notes-below {
 padding-left: 0;
 align-items: center;
 margin-top: -2px;
 }
 .song-notes-below .note-seg {
 white-space: normal;
 line-height: 1.15;
 }
 .is-centered .song-notes-below .note-seg {
 /* sin la inclinación manuscrita no se montan sobre el título ni sobre la fila siguiente */
 transform: none !important;
 }
 .is-centered .interlude-item {
 padding-top: 2px;
 padding-bottom: 2px;
 }
 .page-header.is-centered .band-heading {
 font-size: 15pt;
 letter-spacing: 1px;
 }
 .page-header.is-centered .setlist-meta {
 font-size: 9pt;
 letter-spacing: 0.5px;
 margin-top: 0;
 }
 .is-centered .interlude-item {
 padding-left: 0;
 text-align: center;
 }
 /* Dos columnas: el bloque entero se centra en vertical y las columnas arrancan alineadas
 arriba; un filete fino las separa. */
 .setlist-columns {
 flex: 1;
 display: flex;
 flex-direction: column;
 justify-content: center;
 }
 .setlist-columns-row {
 display: flex;
 align-items: flex-start;
 justify-content: center;
 }
 .setlist-columns-row .setlist-items-container {
 flex: none;
 justify-content: flex-start;
 }
 /* En columna, una nota que ni encogida al mínimo cabe en una línea baja a una segunda en vez de
 salirse hacia el filete o el margen (la fila se mide ya con ese alto). */
 .in-columns .song-notes-below {
 margin-top: -2px;
 }
 .in-columns .note-seg {
 white-space: normal;
 line-height: 1.05;
 }
 .is-centered .note-seg {
 text-align: center;
 }
 .col-divider {
 align-self: stretch;
 width: 1px;
 margin: 0 14px;
 background: #bdbdbd;
 }
 .page-footer.is-centered {
 justify-content: center;
 gap: 14px;
 }
 `;

  return { printCss };
}
