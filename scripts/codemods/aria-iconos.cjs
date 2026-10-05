/**
 * Codemod a11y: <button> cuyo único contenido es un icono y no tiene aria-label/title → se le pone nombre
 * según el icono de Lucide (cerrar, eliminar, editar…). Los iconos sin diccionario se listan para revisar a mano.
 * Uso: node scripts/codemods/aria-iconos.cjs [--dry]
 */
const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = process.cwd();
const dry = process.argv.includes('--dry');
const files = execSync("git ls-files ':(glob)src/**/*.tsx'", { cwd: ROOT }).toString().split('\n').filter((f) => f && !f.includes('components/ui/'));
const D = {
  X: 'Cerrar', XCircle: 'Cerrar', Trash2: 'Eliminar', Trash: 'Eliminar', Pencil: 'Editar', Edit: 'Editar', Edit2: 'Editar', Edit3: 'Editar', PenLine: 'Editar', SquarePen: 'Editar',
  Plus: 'Añadir', PlusCircle: 'Añadir', ChevronDown: 'Desplegar', ChevronUp: 'Plegar', ChevronRight: 'Siguiente', ChevronLeft: 'Anterior',
  ArrowLeft: 'Volver', ArrowRight: 'Siguiente', ArrowUp: 'Subir', ArrowDown: 'Bajar', Copy: 'Copiar', Download: 'Descargar', Upload: 'Subir archivo',
  Play: 'Reproducir', Pause: 'Pausar', Eye: 'Ver', EyeOff: 'Ocultar', Search: 'Buscar', Settings: 'Ajustes', Settings2: 'Ajustes', MoreVertical: 'Más opciones', MoreHorizontal: 'Más opciones', Ellipsis: 'Más opciones', EllipsisVertical: 'Más opciones',
  RefreshCw: 'Actualizar', RotateCcw: 'Deshacer', Check: 'Confirmar', CheckCircle: 'Confirmar', Save: 'Guardar', Share2: 'Compartir', Share: 'Compartir', ExternalLink: 'Abrir en otra pestaña',
  Star: 'Favorito', Heart: 'Me gusta', Bell: 'Avisos', Info: 'Información', HelpCircle: 'Ayuda', Filter: 'Filtros', Maximize2: 'Ampliar', Minimize2: 'Reducir', Mic: 'Grabar', Volume2: 'Volumen', VolumeX: 'Silenciar',
  Printer: 'Imprimir', Link: 'Enlace', Link2: 'Enlace', Send: 'Enviar', Mail: 'Correo', Phone: 'Llamar', MapPin: 'Ubicación',   Lock: 'Bloquear', Unlock: 'Desbloquear',
  GripVertical: 'Arrastrar para reordenar', Undo2: 'Deshacer', Redo2: 'Rehacer', SkipForward: 'Siguiente', SkipBack: 'Anterior', Repeat: 'Repetir', Shuffle: 'Aleatorio', Minus: 'Quitar', Sparkles: 'Asistente IA', Wand2: 'Asistente IA',
  Pin: 'Fijar', Smartphone: 'Vista móvil', Monitor: 'Vista escritorio', Bookmark: 'Guardar en marcadores',  ThumbsUp: 'Me gusta', ThumbsDown: 'No me gusta', MessageCircle: 'Comentar',    
};
let n = 0; const unknown = {};
for (const rel of files) {
  const abs = path.join(ROOT, rel);
  const src = fs.readFileSync(abs, 'utf8');
  if (!src.includes('<button')) continue;
  const sf = ts.createSourceFile(rel, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  (function visit(node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText() === 'button') {
      const kids = node.children.filter((k) => !(ts.isJsxText(k) && !/\S/.test(k.getText())));
      const attrs = node.openingElement.attributes.properties;
      const named = attrs.some((a) => (ts.isJsxAttribute(a) && ['aria-label', 'title', 'aria-labelledby'].includes(a.name.getText())) || ts.isJsxSpreadAttribute(a));
      if (!named && kids.length === 1 && ts.isJsxSelfClosingElement(kids[0]) && /^[A-Z]/.test(kids[0].tagName.getText())) {
        const icon = kids[0].tagName.getText();
        const label = D[icon];
        if (label) { edits.push({ pos: node.openingElement.tagName.getEnd(), text: ` aria-label="${label}"` }); n++; }
        else unknown[icon] = (unknown[icon] || 0) + 1;
      }
    }
    ts.forEachChild(node, visit);
  })(sf);
  if (!edits.length) continue;
  edits.sort((a, b) => b.pos - a.pos);
  let out = src;
  for (const e of edits) out = out.slice(0, e.pos) + e.text + out.slice(e.pos);
  if (!dry) fs.writeFileSync(abs, out);
}
console.log(JSON.stringify({ nombrados: n, sinDiccionario: unknown }));
