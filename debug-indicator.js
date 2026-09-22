const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  console.log('✓ Page loaded');
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/screenshot-1.png' });
  console.log('✓ Screenshot 1 saved');
  
  // Look for SetlistEnergyVisualization
  const ondaContainer = await page.locator('[class*="space-y-4"]').first();
  console.log('Looking for Onda container...');
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/screenshot-2.png' });
  console.log('✓ Screenshot 2 saved');
  
  await browser.close();
  console.log('✓ Done');
})();
