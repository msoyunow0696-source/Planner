// Дымовой тест собранной страницы в настоящем Chrome (запускается на GitHub Actions).
// Открывает страницу в размере телефона, перебирает типы лестниц и проверяет,
// что нет ошибок JavaScript, 3D-сцена рисует геометрию, а чертежи не пустые.
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

// Весь вывод дублируем в screenshots/log.txt (он публикуется вместе со скриншотами)
const logLines = [];
for (const k of ['log', 'error']) {
  const orig = console[k].bind(console);
  console[k] = (...a) => { logLines.push(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ')); orig(...a); };
}
const flushLog = () => { try { writeFileSync('screenshots/log.txt', logLines.join('\n') + '\n'); } catch {} };
import { resolve } from 'node:path';

const chrome = process.env.CHROME_PATH ||
  ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
if (!chrome) { console.error('Chrome не найден'); process.exit(1); }

const page_url = 'file://' + resolve('stairs/src/main/assets/index.html');
mkdirSync('screenshots', { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files']
});

let failed = false;
const errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(page_url, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1500));

  const glError = await page.$eval('#glError', el => !el.hidden);
  console.log('WebGL:', glError ? 'НЕДОСТУПЕН' : 'ok');

  for (const type of ['straight', 'lshape', 'ushape', 'spiral']) {
    await page.evaluate(t => {
      const s = document.getElementById('typeSelect');
      s.value = t;
      s.dispatchEvent(new Event('change'));
    }, type);
    await new Promise(r => setTimeout(r, 700));

    const info = await page.evaluate(() => {
      const st = window.__stairs || {};
      const blank = id => {
        const c = document.getElementById(id);
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let n = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
        return n;
      };
      return {
        n: st.model?.n, h: st.model?.h?.toFixed(1), type: st.model?.type,
        elements: st.model?.els?.length, warnings: st.model?.warnings,
        triangles: st.triangles,
        side: blank('sideCanvas'), front: blank('frontCanvas'), plan: blank('topCanvas'),
        results: document.getElementById('resultsBox').innerText.replace(/\n/g, ' | '),
        labels: document.querySelectorAll('.label3d').length
      };
    });
    console.log(`\n[${type}]`, JSON.stringify(info));
    if (info.type !== type) { console.error('  ✗ тип не применился'); failed = true; }
    if (!(info.side > 500 && info.front > 500 && info.plan > 500)) { console.error('  ✗ пустой 2D-чертёж'); failed = true; }
    if (!glError && !(info.triangles > 50)) { console.error('  ✗ 3D-сцена без геометрии'); failed = true; }

    // Скриншоты: 3D (панель закрыта) и чертежи
    await page.click('#buildBtn');
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `screenshots/${type}-3d.png` });
    await page.click('#btnViews');
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: `screenshots/${type}-2d.png` });
    await page.click('#btnPanel');   // вернуть панель для следующего типа
    await new Promise(r => setTimeout(r, 300));
  }

  // Мусор в поле ввода не должен ломать страницу
  await page.evaluate(() => {
    const i = document.getElementById('p_H');
    i.value = '';
    i.dispatchEvent(new Event('input'));
    i.value = '99999';
    i.dispatchEvent(new Event('input'));
  });
  await new Promise(r => setTimeout(r, 500));
  console.log('\nПредупреждения при H=99999:', await page.$eval('#warnBox', el => el.innerText));

  // Десктопный размер
  await page.setViewport({ width: 1366, height: 800 });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'screenshots/desktop.png' });
} catch (e) {
  errors.push('test: ' + (e && e.stack || e));
} finally {
  await browser.close();
}

if (errors.length) { console.error('\nОшибки страницы:\n' + errors.join('\n')); failed = true; }
console.log(failed ? '\n✗ SMOKE FAILED' : '\n✓ SMOKE OK');
flushLog();
process.exit(failed ? 1 : 0);
