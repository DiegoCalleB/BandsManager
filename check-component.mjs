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
  
  // Check for SetlistEnergyVisualization text
  const energyTitle = await page.locator('text=Mapa de Energía').count();
  console.log(`Found "Mapa de Energía": ${energyTitle}`);
  
  // Check for "Reproduciendo" legend
  const legend = await page.locator('text=Reproduciendo').count();
  console.log(`Found "Reproduciendo": ${legend}`);
  
  // Check for album image
  const images = await page.locator('img[alt*="Setlist"]').count();
  console.log(`Found album images: ${images}`);
  
  // Check the full page HTML to see what's rendered
  const html = await page.content();
  if (html.includes('SetlistEnergyVisualization')) {
    console.log('✓ Component name found in HTML');
  }
  if (html.includes('Mapa de Energía')) {
    console.log('✓ "Mapa de Energía" found in HTML');
  }
  if (html.includes('Reproduciendo')) {
    console.log('✓ "Reproduciendo" found in HTML');
  }
  
  await browser.close();
})();
