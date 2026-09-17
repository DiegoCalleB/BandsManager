const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'CalendarView.tsx');
let text = fs.readFileSync(filePath, 'utf8');

const subStart = text.indexOf('create-event-unified-btn');
const before = text.slice(subStart - 200, subStart);
const after = text.slice(subStart, subStart + 1800);

console.log('--- BEFORE ---');
console.log(before);
console.log('--- AFTER ---');
console.log(after);
