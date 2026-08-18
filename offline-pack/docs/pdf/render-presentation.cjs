// Render the StockApp presentation HTML to a vector PDF (A4, multi-page).
// Uses Playwright page.pdf() with the document's own @page + .page rules,
// which guarantees exactly one PDF page per .page section.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const htmlPath = process.argv[2];
  const pdfPath  = process.argv[3];
  if (!htmlPath || !pdfPath) {
    console.error('Usage: node render-presentation.js <input.html> <output.pdf>');
    process.exit(1);
  }

  const fileUrl = 'file:///' + path.resolve(htmlPath).replace(/\\/g, '/');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  // Make sure web fonts (if any) are ready before printing.
  await page.evaluate(() => document.fonts ? document.fonts.ready : Promise.resolve());

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    preferCSSPageSize: true,
  });

  await browser.close();
  console.log('PDF généré :', pdfPath);
})().catch(err => { console.error(err); process.exit(1); });
