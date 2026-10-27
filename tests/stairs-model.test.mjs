// Проверка расчётов конструктора лестниц: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStair, DEFAULTS } from '../web/stairs/model.js';

const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

const bbox = poly => {
  const xs = poly.map(p => p[0]), zs = poly.map(p => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
};
const overlap = (a, b) => a.x0 < b.x1 - 1e-6 && b.x0 < a.x1 - 1e-6 && a.z0 < b.z1 - 1e-6 && b.z0 < a.z1 - 1e-6;

// Общие свойства для любой лестницы
function checkCommon(r) {
  const { n, h, els, p } = r;
  assert.ok(near(n * h, p.H), 'n·h = H');
  const walk = els.filter(e => e.kind !== 'floor');
  assert.equal(walk.length, n - 1, 'проступей (вкл. площадку) = n−1');
  walk.forEach((e, i) => assert.ok(near(e.top, (i + 1) * h), `уровень ${i + 1}`));
  const floor = els.at(-1);
  assert.equal(floor.kind, 'floor');
  assert.ok(near(floor.top, p.H), 'верхний пол на высоте H');
}

test('прямая: длина и шаг', () => {
  const r = computeStair({ ...DEFAULTS, type: 'straight' });
  checkCommon(r);
  assert.equal(r.n, 18);
  assert.ok(near(r.h, 3000 / 18));
  assert.equal(r.flights[0], 17 * 280);
  // ступени идут подряд по X
  r.els.slice(0, -1).forEach((e, i) => {
    const bb = bbox(e.poly);
    assert.ok(near(bb.x0, i * 280) && near(bb.x1, (i + 1) * 280));
  });
});

for (const turn of ['left', 'right']) {
  test(`Г-образная (${turn}): второй марш уходит в сторону и не пересекается с первым`, () => {
    const r = computeStair({ ...DEFAULTS, type: 'lshape', turn });
    checkCommon(r);
    const [s1, s2] = r.steps;
    assert.equal(s1 + s2 + 1, r.n - 1);
    const boxes = r.els.map(e => bbox(e.poly));
    // никакие два элемента не накладываются в плане
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++)
        assert.ok(!overlap(boxes[i], boxes[j]), `элементы ${i} и ${j} пересекаются`);
    // ступени второго марша сдвигаются по Z (раньше стояли в одной точке)
    const second = r.els.slice(s1 + 1, s1 + 1 + s2).map(e => bbox(e.poly));
    const zs = new Set(second.map(b => Math.round(b.z0)));
    assert.equal(zs.size, s2);
    const sign = turn === 'right' ? 1 : -1;
    assert.ok(second.every(b => Math.sign(b.z0 + b.z1) === sign), 'направление поворота');
  });

  test(`П-образная (${turn}): марши рядом, не накладываются`, () => {
    const r = computeStair({ ...DEFAULTS, type: 'ushape', turn, gap: 150 });
    checkCommon(r);
    const boxes = r.els.map(e => bbox(e.poly));
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++)
        assert.ok(!overlap(boxes[i], boxes[j]), `элементы ${i} и ${j} пересекаются`);
    const [s1] = r.steps;
    const f1 = boxes[0], f2 = boxes[s1 + 1];
    assert.ok(near(Math.min(Math.abs(f1.z1 - f2.z0), Math.abs(f2.z1 - f1.z0)), 150), 'просвет между маршами');
  });
}

test('Г-образная: заданное число ступеней до площадки', () => {
  const r = computeStair({ ...DEFAULTS, type: 'lshape', stepsToPlatform: 5 });
  assert.deepEqual(r.steps, [5, r.n - 2 - 5]);
  assert.equal(r.els[5].kind, 'landing');
  const bad = computeStair({ ...DEFAULTS, type: 'lshape', stepsToPlatform: 99 });
  assert.ok(bad.warnings.some(w => w.includes('до площадки')));
});

test('винтовая: угол, проступь по линии хода, направление', () => {
  const r = computeStair({ ...DEFAULTS, type: 'spiral', radius: 1500, totalAngle: 270, clockwise: true });
  checkCommon(r);
  assert.ok(near(r.stepDeg * (r.n - 1), 270));
  assert.ok(near(r.effB, r.stepDeg * Math.PI / 180 * r.walkR));
  assert.ok(r.effB > 150 && r.effB < 300);
  const ccw = computeStair({ ...DEFAULTS, type: 'spiral', clockwise: false });
  // по часовой — первая ступень в +Z, против — в −Z
  const zMid = poly => poly.reduce((s, p) => s + p[1], 0) / poly.length;
  assert.ok(zMid(r.els[1].poly) > 0 && zMid(ccw.els[1].poly) < 0);
  assert.equal(r.headroom, null, 'меньше одного витка — проход не считается');
});

test('винтовая больше витка: проверка высоты прохода', () => {
  const r = computeStair({ ...DEFAULTS, type: 'spiral', totalAngle: 720, H: 3000, radius: 1000 });
  assert.ok(r.headroom > 0);
  assert.ok(r.warnings.some(w => w.includes('прохода')));
});

test('ввод вне диапазона и мусор', () => {
  const r = computeStair({ ...DEFAULTS, H: 'abc', h: 5, W: -1 });
  assert.equal(r.p.H, DEFAULTS.H);
  assert.equal(r.p.h, 100);
  assert.equal(r.p.W, 300);
  assert.ok(r.warnings.length >= 3);
  checkCommon(r);
});

test('формула Блонделя для стандартной лестницы — норма', () => {
  const r = computeStair({ ...DEFAULTS, H: 2800, h: 175, b: 280 });
  assert.equal(r.n, 16);
  assert.ok(near(r.blondel, 2 * 175 + 280));
  assert.equal(r.blondelStatus, 'ok');
});
