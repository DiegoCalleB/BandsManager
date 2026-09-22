import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: true, 
    args: ['--no-sandbox'],
    executablePath: '/opt/pw-browsers/chromium'
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  // Check for SetlistEnergyVisualization container
  const ondaVisualization = await page.locator('[class*="space-y-4"]').count();
  console.log(`Found ${ondaVisualization} space-y-4 containers`);
  
  // Check for Onda component
  const ondaBars = await page.locator('svg').count();
  console.log(`Found ${ondaBars} SVG elements`);
  
  // Check for the progress indicator (green bar)
  const greenBars = await page.locator('[style*="bg-[var(--ok)]"]').count();
  console.log(`Found ${greenBars} elements with ok color`);
  
  // Look for progress indicator specifically
  const indicators = await page.locator('[style*="left:"]').count();
  console.log(`Found ${indicators} elements with left positioning`);
  
  // Check console for errors
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  
  await page.waitForTimeout(1000);
  
  if (logs.filter(l => l.includes('SetlistEnergyVisualization')).length > 0) {
    console.log('\n✓ Debug logs found:');
    logs.filter(l => l.includes('SetlistEnergyVisualization')).forEach(l => console.log(l));
  }
  
  await browser.close();
})();
