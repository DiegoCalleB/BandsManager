const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const filePath = path.join(__dirname, '..', 'src', 'components', 'CalendarView.tsx');
const code = fs.readFileSync(filePath, 'utf8');

const sourceFile = ts.createSourceFile(
  'CalendarView.tsx',
  code,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);

const diagnostics = sourceFile.parseDiagnostics;
console.log('Parse diagnostics count:', diagnostics.length);
for (const diag of diagnostics) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(diag.start);
  console.log(`Line ${line + 1}:${character + 1} - ${ts.flattenDiagnosticMessageText(diag.messageText, '\n')}`);
}
