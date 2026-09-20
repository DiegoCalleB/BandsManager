const { chromium } = require('playwright');
const { writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');

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

    // Check if login is needed
    const loginModal = await page.$('[class*="LoginModal"]');
    if (loginModal || await page.url().includes('login')) {
      console.log('🔐 Login required, attempting demo login...');
      // Try to find and click login button or use test credentials
      const demoButton = await page.$('button:has-text("Demo")') ||
                         await page.$('button:has-text("Login")');
      if (demoButton) {
        await demoButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Wait for main app to load
    await page.waitForTimeout(1500);

    // Define main screens to audit
    const screens = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Booking-Panel', path: '/booking' },
      { name: 'Repertorio', path: '/repertorio' },
      { name: 'Finanzas', path: '/finanzas' },
      { name: 'Fans', path: '/fans' },
      { name: 'Reels', path: '/reels' },
      { name: 'Ensayos', path: '/ensayos' },
      { name: 'Tour', path: '/tour' },
      { name: 'EPK', path: '/epk' },
    ];

    // Test both themes
    for (const theme of ['dark', 'light']) {
      console.log(`\n🎨 Auditing ${theme.toUpperCase()} mode...`);
      await setTheme(page, theme);

      for (const screen of screens) {
        try {
          console.log(`  → ${screen.name}...`);
          await page.goto(`http://localhost:5173${screen.path}`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000
          });
          await page.waitForTimeout(1000);
          await takeScreenshot(page, screen.name, theme);
        } catch (e) {
          screenshotLog.push(`⚠ ${screen.name} (${theme}): ${e.message}`);
          console.log(`  ⚠ Skipped: ${e.message}`);
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
    console.log('\n📁 Screenshots saved to:', SCREENSHOTS_DIR);
    process.exit(0);
  }
}

main();
