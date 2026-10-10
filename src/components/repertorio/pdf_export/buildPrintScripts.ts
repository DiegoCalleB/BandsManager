/**
 * Scripts de impresión y vista previa y CSS específico de la vista previa del documento.
 * Extraído de printDocumentBuilder.ts (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { PAGE_MARGIN_X_MM, PAGE_MARGIN_Y_MM, PAGE_SHEET_HEIGHT_MM } from "./printLayout";

/**
 * Scripts de impresión y vista previa y CSS específico de la vista previa del documento.
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function buildPrintScripts() {
  // Script de la ventana de impresión: espera a que las fuentes estén cargadas antes de
  // llamar a window.print() (si no, imprimiría con la fuente de reserva, más ancha).
  const printScript = `
 <script>
 window.onload = () => {
 var go = function () {
 window.print();
 setTimeout(function () { window.close(); }, 800);
 };
 if (document.fonts && document.fonts.ready) {
 var done = false;
 var proceed = function () { if (!done) { done = true; go(); } };
 document.fonts.ready.then(proceed);
 setTimeout(proceed, 2000);
 } else {
 go();
 }
 };
 </script>`;

  // Vista previa: las MISMAS hojas que se imprimen, pintadas como papel A4 (el margen del
  // @page se simula con un borde blanco). Al hacer clic en un tema se avisa al modal para
  // editar su nota, y se informa de la altura para que el marco no necesite scroll interno.
  const previewCss = `
 @media screen {
 html { background: #d4d4d8; }
 body { margin: 0; padding: 16px 0 1px; }
 .sheet-page {
 box-sizing: content-box;
 width: calc(${210 - 2 * PAGE_MARGIN_X_MM}mm - 4px);
 min-height: calc(${PAGE_SHEET_HEIGHT_MM}mm - 4px);
 padding: 2px;
 border: solid #fff;
 border-width: ${PAGE_MARGIN_Y_MM}mm ${PAGE_MARGIN_X_MM}mm;
 background: #fff;
 margin: 0 auto 18px;
 box-shadow: 0 1px 3px rgba(0,0,0,.25), 0 8px 24px rgba(0,0,0,.12);
 }
 [data-song-id] { cursor: pointer; border-radius: 4px; }
 [data-song-id]:hover { background: rgba(242, 202, 80, .2); }
 }`;
  const previewScript = `
 <script>
 (function () {
 var send = function () {
 parent.postMessage({ type: "bm-preview-height", h: document.documentElement.scrollHeight }, "*");
 };
 window.addEventListener("load", send);
 if (document.fonts && document.fonts.ready) document.fonts.ready.then(send);
 document.addEventListener("click", function (e) {
 var el = e.target && e.target.closest ? e.target.closest("[data-song-id]") : null;
 if (el) parent.postMessage({ type: "bm-edit-song", id: el.getAttribute("data-song-id") }, "*");
 });
 })();
 </script>`;

  return { previewCss, previewScript, printScript };
}
