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
  
  // Look for the rounded container with bg-surface
  const containers = await page.locator('[class*="rounded-[var(--r-m)]"][class*="p-4"]').count();
  console.log(`Found ${containers} potential Onda containers`);
  
  // Look for flex containers with gap
  const flexContainers = await page.locator('[class*="space-y-4"]').count();
  console.log(`Found ${flexContainers} space-y-4 containers`);
  
  // Look for any visible text related to energy
  const pageText = await page.innerText('body');
  
  if (pageText.includes('Energía')) {
    console.log('✓ Found "Energía" in page');
  } else {
    console.log('✗ "Energía" NOT found in page');
  }
  
  if (pageText.includes('Reproduciendo')) {
    console.log('✓ Found "Reproduciendo" in page');
  } else {
    console.log('✗ "Reproduciendo" NOT found in page');
  }
  
  if (pageText.includes('Setlist')) {
    console.log('✓ Found "Setlist" in page');
  } else {
    console.log('✗ "Setlist" NOT found in page');
  }
  
  // Get all text content
  const allText = pageText.substring(0, 500);
  console.log('\nFirst 500 chars of page text:');
  console.log(allText);
  
  await browser.close();
})();
