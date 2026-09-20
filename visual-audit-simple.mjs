import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SCREENSHOTS_DIR = '/tmp/visual-audit-screenshots';
mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function main() {
  console.log('🎬 Starting visual audit...');
  
  // Use the preinstalled chromium
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium'
  });
  
  const page = await browser.newPage();
  
  try {
    // Open app
    console.log('🌐 Loading app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    // Take dark mode screenshots
    console.log('\n🌙 Dark Mode...');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(800);
    
    const screens = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'BookingCRM', path: '/booking' },
      { name: 'Repertorio', path: '/repertorio' },
    ];
    
    for (const screen of screens) {
      try {
        console.log(`  → ${screen.name}`);
        await page.goto(`http://localhost:5173${screen.path}`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: join(SCREENSHOTS_DIR, `${screen.name}-dark.png`), fullPage: true });
      } catch(e) {
        console.log(`    ✗ ${e.message}`);
      }
    }
    
    // Take light mode screenshots
    console.log('\n☀️  Light Mode...');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    });
    await page.waitForTimeout(800);
    
    for (const screen of screens) {
      try {
        console.log(`  → ${screen.name}`);
        await page.goto(`http://localhost:5173${screen.path}`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: join(SCREENSHOTS_DIR, `${screen.name}-light.png`), fullPage: true });
      } catch(e) {
        console.log(`    ✗ ${e.message}`);
      }
    }
    
    console.log('\n✅ Done! Screenshots: ' + SCREENSHOTS_DIR);
    
  } finally {
    await browser.close();
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
