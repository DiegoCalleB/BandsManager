const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'CalendarView.tsx');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Check line 1473 to 2002
let openDivs = 0;
for (let i = 1472; i < 2001; i++) {
  const line = lines[i];
  const opens = (line.match(/<div[ >]/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  openDivs += (opens - closes);
  if (opens || closes) {
    // console.log(`Line ${i+1}: opens=${opens}, closes=${closes}, total=${openDivs} | ${line.trim()}`);
  }
}
console.log('Open divs remaining at line 2001:', openDivs);
