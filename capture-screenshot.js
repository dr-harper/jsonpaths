const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set viewport to a common desktop size
  await page.setViewport({ width: 1440, height: 900 });
  
  // Navigate to the local development server
  await page.goto('http://localhost:3000', {
    waitUntil: 'networkidle2'
  });
  
  // Wait a bit for any animations or dynamic content
  await page.waitForTimeout(1000);
  
  // Take a screenshot
  const timestamp = new Date().getTime();
  const screenshotPath = `./screenshot-${timestamp}.png`;
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: false // Just capture the viewport
  });
  
  console.log(`Screenshot saved to: ${screenshotPath}`);
  
  await browser.close();
})();