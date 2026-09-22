import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: true, 
    args: ['--no-sandbox'],
    executablePath: '/opt/pw-browsers/chromium'
  });
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(text);
    } else if (msg.type() === 'warning') {
      warnings.push(text);
    }
    console.log(`[${msg.type().toUpperCase()}] ${text.substring(0, 100)}`);
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  
  console.log(`\n✓ Total errors: ${errors.length}`);
  console.log(`✓ Total warnings: ${warnings.length}`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e.substring(0, 150)}`));
  }
  
  await browser.close();
})();
