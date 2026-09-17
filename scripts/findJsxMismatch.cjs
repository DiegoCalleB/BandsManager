const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const filePath = path.join(__dirname, '..', 'src', 'components', 'CalendarView.tsx');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Check line 1470 to 2005
const tags = [];
for (let i = 1472; i < 2002; i++) {
  const line = lines[i];
  // Find all JSX tags
  const regex = /<\/?([A-Za-z0-9_.-]+)(?:\s+[^>]*)?>|(<[A-Za-z0-9_.-]+(?:\s+[^>]*)?\/>)/g;
  let match;
  while ((match = regex.exec(line)) !== null) {
    const full = match[0];
    if (full.startsWith('{/*') || full.startsWith('//')) continue;
    if (full.endsWith('/>')) {
      // self closing
      // console.log(`Line ${i+1}: self-closing ${full}`);
    } else if (full.startsWith('</')) {
      const tagName = match[1];
      const last = tags.pop();
      if (last && last.tagName !== tagName) {
        console.log(`MISMATCH at Line ${i+1}: expected </${last.tagName}> (from line ${last.line}) but found </${tagName}>`);
      } else {
        // console.log(`Line ${i+1}: closed <${tagName}> from line ${last ? last.line : 'unknown'}`);
      }
    } else {
      const tagName = match[1];
      tags.push({ tagName, line: i + 1 });
    }
  }
}

console.log('Unclosed tags before line 2001:');
console.log(tags);
