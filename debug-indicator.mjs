import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: true, 
    args: ['--no-sandbox'],
    executablePath: '/opt/pw-browsers/chromium'
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Set up console logging
  page.on('console', msg => {
    if (msg.type().includes('log')) {
      const text = msg.text();
      if (text.includes('SetlistEnergyVisualization') || text.includes('currentTime')) {
        console.log('DEBUG:', text);
      }
    }
  });
  
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  
  console.log('✓ Page loaded');
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/screenshot-1.png' });
  console.log('✓ Screenshot saved to /tmp/screenshot-1.png');
  
  await browser.close();
  console.log('✓ Done');
})();
