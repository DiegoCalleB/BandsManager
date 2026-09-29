import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SCREENSHOTS_DIR = '/tmp/visual-audit-screenshots';
mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const screenshotLog = [];

async function takeScreenshot(page, name, theme) {
  try {
    const filename = `${name}-${theme}.png`;
    const filepath = join(SCREENSHOTS_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    screenshotLog.push(`✓ ${filename}`);
    console.log(`✓ Screenshot: ${filename}`);
  } catch (e) {
    screenshotLog.push(`✗ ${name}-${theme}: ${e.message}`);
    console.log(`✗ Failed: ${name}-${theme}`);
  }
}

async function setTheme(page, theme) {
  const themeValue = theme === 'light' ? 'light' : 'dark';
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
  }, themeValue);
  await page.waitForTimeout(500);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  console.log('🎬 Starting visual audit...');
  console.log('📸 Screenshots will be saved to:', SCREENSHOTS_DIR);

  try {
    // Navigate to app
    console.log('\n🌐 Opening application...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for app to load
    await page.waitForTimeout(2000);

    // Check if login is needed and try to bypass
    try {
      await page.click('button:has-text("Demo Login")', { timeout: 3000 });
      console.log('🔐 Clicked demo login');
      await page.waitForTimeout(3000);
    } catch (e) {
      console.log('ℹ No demo login needed');
    }

    // Wait for main app to load
    await page.waitForTimeout(1500);

    // Define main screens to audit
    const screens = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'BookingCRM', path: '/booking' },
      { name: 'Repertorio', path: '/repertorio' },
      { name: 'Finanzas', path: '/finanzas' },
      { name: 'Fans', path: '/fans' },
      { name: 'Reels', path: '/reels' },
      { name: 'Ensayos', path: '/ensayos' },
      { name: 'TourManager', path: '/tour' },
      { name: 'EPK', path: '/epk' },
      { name: 'Planes', path: '/planes' },
    ];

    // Test both themes
    for (const theme of ['dark', 'light']) {
      console.log(`\n🎨 Auditing ${theme.toUpperCase()} mode...`);
      await setTheme(page, theme);
      await page.waitForTimeout(800);

      for (const screen of screens) {
        try {
          process.stdout.write(`  → ${screen.name}... `);
          await page.goto(`http://localhost:5173${screen.path}`, {
            waitUntil: 'load',
            timeout: 20000
          });
          await page.waitForTimeout(1500);
          await takeScreenshot(page, screen.name, theme);
        } catch (e) {
          screenshotLog.push(`⚠ ${screen.name} (${theme}): ${e.message}`);
          console.log(`✗ (${e.message.slice(0, 30)}...)`);
        }
      }
    }

    console.log('\n✅ Visual audit complete!');
    console.log('\n📊 Summary:');
    screenshotLog.forEach(log => console.log(`  ${log}`));

    // Save log
    writeFileSync(
      join(SCREENSHOTS_DIR, 'audit-log.txt'),
      screenshotLog.join('\n')
    );

  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await browser.close();
    console.log('\n📁 Screenshots: ' + SCREENSHOTS_DIR);
    console.log('📊 Total screenshots captured');
    process.exit(0);
  }
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
