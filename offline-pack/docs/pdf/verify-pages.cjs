// Vérification visuelle : capture chaque section .page en PNG pour détecter
// un éventuel débordement de contenu (texte coupé en bas de page A4).
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const htmlPath = process.argv[2];
  const outDir   = process.argv[3] || '.';
  if (!htmlPath) { console.error('Usage: node verify-pages.cjs <input.html> [outDir]'); process.exit(1); }

  const fileUrl = 'file:///' + path.resolve(htmlPath).replace(/\\/g, '/');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 794, height: 1123 }); // A4 @ 96dpi
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // Pour chaque .page, on mesure le dépassement du contenu vs la hauteur A4.
  const report = await page.evaluate(() => {
    const pages = Array.from(document.querySelectorAll('.page'));
    const A4px = 1123; // 297mm @ 96dpi approx
    return pages.map((el, i) => {
      // scrollHeight = hauteur réelle du contenu ; on compare au height fixe.
      const overflow = el.scrollHeight - el.clientHeight;
      return {
        page: i + 1,
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
        overflowPx: overflow,
        overflowMm: Math.round(overflow / 1123 * 297 * 10) / 10,
        status: overflow > 2 ? 'OVERFLOW' : 'ok'
      };
    });
  });

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
  const problems = report.filter(r => r.status === 'OVERFLOW');
  if (problems.length) {
    console.error('\n⚠️  DÉBORDEMENT détecté sur ' + problems.length + ' page(s):');
    problems.forEach(p => console.error('  - page ' + p.page + ' : +' + p.overflowMm + ' mm (' + p.overflowPx + 'px)'));
    process.exit(2);
  } else {
    console.log('\n✅ Aucun débordement — les ' + report.length + ' pages tiennent en A4.');
  }
})().catch(err => { console.error(err); process.exit(1); });
