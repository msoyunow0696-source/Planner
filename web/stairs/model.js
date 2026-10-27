// Расчёт геометрии лестницы. Все размеры в миллиметрах.
// Модуль без зависимостей: его используют и 3D-сцена, и 2D-чертежи, и тесты.
//
// Система координат: X — вперёд по первому маршу, Y — вверх, Z — вправо
// (если смотреть вверх по лестнице). В плане (виде сверху) Z направлен вниз.

export const DEFAULTS = {
  type: 'straight',
  H: 3000,            // высота от пола до пола
  h: 175,             // желаемая высота подступенка
  b: 280,             // проступь
  W: 1000,            // ширина марша
  platformLen: 1000,  // длина площадки
  stepsToPlatform: 0, // ступеней до площадки (0 = авто)
  turn: 'left',       // поворот для Г/П-образной
  gap: 100,           // просвет между маршами П-образной
  radius: 1500,       // наружный радиус винтовой
  totalAngle: 360,    // угол поворота винтовой
  clockwise: true
};

export const TREAD_T = 40;     // толщина проступи
export const LANDING_T = 60;   // толщина площадки
export const FLOOR_T = 200;    // толщина перекрытия верхнего этажа
export const FLOOR_LEN = 400;  // сколько показывать верхнего перекрытия
export const COLUMN_R = 80;    // радиус центрального столба винтовой
export const RAIL_H = 900;     // высота поручня

const LIMITS = {
  H: [300, 15000], h: [100, 300], b: [100, 600], W: [300, 3000],
  platformLen: [300, 5000], stepsToPlatform: [0, 200], gap: [0, 1500],
  radius: [400, 5000], totalAngle: [30, 1080]
};

const FIELD_NAMES = {
  H: 'Высота H', h: 'Подступенок h', b: 'Проступь b', W: 'Ширина W',
  platformLen: 'Длина площадки', stepsToPlatform: 'Ступеней до площадки',
  gap: 'Просвет', radius: 'Радиус', totalAngle: 'Угол поворота'
};

function normalize(raw, warnings) {
  const p = { ...DEFAULTS, ...raw };
  for (const key of Object.keys(LIMITS)) {
    const [min, max] = LIMITS[key];
    let v = Number(p[key]);
    if (!Number.isFinite(v)) {
      v = DEFAULTS[key];
      warnings.push(`${FIELD_NAMES[key]}: некорректное значение, взято ${v}`);
    } else if (v < min || v > max) {
      const c = Math.min(max, Math.max(min, v));
      warnings.push(`${FIELD_NAMES[key]}: ограничено до ${c} (допустимо ${min}–${max})`);
      v = c;
    }
    p[key] = v;
  }
  p.stepsToPlatform = Math.round(p.stepsToPlatform);
  if (!['straight', 'lshape', 'ushape', 'spiral'].includes(p.type)) p.type = 'straight';
  p.turn = p.turn === 'right' ? 'right' : 'left';
  p.clockwise = p.clockwise !== false && p.clockwise !== 'false';
  return p;
}

const rect = (x0, x1, z0, z1) => {
  const xa = Math.min(x0, x1), xb = Math.max(x0, x1);
  const za = Math.min(z0, z1), zb = Math.max(z0, z1);
  return [[xa, za], [xb, za], [xb, zb], [xa, zb]];
};

const sector = (r0, r1, a0, a1, seg) => {
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const a = a0 + (a1 - a0) * i / seg;
    pts.push([r1 * Math.cos(a), r1 * Math.sin(a)]);
  }
  for (let i = seg; i >= 0; i--) {
    const a = a0 + (a1 - a0) * i / seg;
    pts.push([r0 * Math.cos(a), r0 * Math.sin(a)]);
  }
  return pts;
};

/** Ступеней до площадки: заданное значение или половина. */
function pickStepsBefore(requested, treadsBesideLanding, warnings) {
  // treadsBesideLanding = все проступи, кроме площадки
  if (requested >= 1 && requested <= treadsBesideLanding) return requested;
  if (requested !== 0) {
    warnings.push(`Ступеней до площадки: допустимо 1–${treadsBesideLanding}, выбрано автоматически`);
  }
  return Math.max(1, Math.ceil(treadsBesideLanding / 2));
}

export function computeStair(raw) {
  const warnings = [];
  const p = normalize(raw, warnings);
  const { H, b, W } = p;

  // n — число подъёмов (подступенков). Проступей n−1: верхняя «ступень» — это пол этажа.
  const n = Math.max(2, Math.ceil(H / p.h - 1e-9));
  const h = H / n;
  const nt = n - 1;

  const els = [];   // элементы по ходу движения снизу вверх
  const add = (kind, poly, level) => els.push({ kind, poly, level, top: level * h });
  const res = { p, n, h, nt, els, warnings, effB: b, flights: [], landing: null, rail: null, walkR: null, headroom: null };

  let type = p.type;
  if ((type === 'lshape' || type === 'ushape') && nt < 2) {
    warnings.push('Слишком мало ступеней для площадки — построена прямая лестница');
    type = 'straight';
  }
  res.type = type;

  if (type === 'straight') {
    for (let i = 0; i < nt; i++) add('tread', rect(i * b, (i + 1) * b, -W / 2, W / 2), i + 1);
    add('floor', rect(nt * b, nt * b + FLOOR_LEN, -W / 2, W / 2), n);
    res.flights = [nt * b];
  }

  else if (type === 'lshape') {
    const s1 = pickStepsBefore(p.stepsToPlatform, nt - 1, warnings);
    const s2 = nt - 1 - s1;
    let Lp = p.platformLen;
    if (Lp < W) {
      warnings.push(`Площадка (${Lp}) короче ширины марша — увеличена до ${W}`);
      Lp = W;
    }
    const s = p.turn === 'right' ? 1 : -1;
    const X0 = s1 * b;
    for (let i = 0; i < s1; i++) add('tread', rect(i * b, (i + 1) * b, -W / 2, W / 2), i + 1);
    add('landing', rect(X0, X0 + Lp, -W / 2, W / 2), s1 + 1);
    const xa = X0 + Lp - W, xb = X0 + Lp;
    for (let j = 0; j < s2; j++) {
      add('tread', rect(xa, xb, s * (W / 2 + j * b), s * (W / 2 + (j + 1) * b)), s1 + 2 + j);
    }
    const zf = W / 2 + s2 * b;
    add('floor', rect(xa, xb, s * zf, s * (zf + FLOOR_LEN)), n);
    res.flights = [s1 * b, s2 * b];
    res.steps = [s1, s2];
    res.landing = [Lp, W];
  }

  else if (type === 'ushape') {
    const s1 = pickStepsBefore(p.stepsToPlatform, nt - 1, warnings);
    const s2 = nt - 1 - s1;
    let Lp = p.platformLen;
    if (Lp < W) warnings.push(`Длина площадки (${Lp}) меньше ширины марша (${W}) — неудобный разворот`);
    const g = p.gap;
    const s = p.turn === 'right' ? 1 : -1;
    const X0 = s1 * b;
    const z1a = s * (-g / 2 - W), z1b = s * (-g / 2);   // первый марш
    const z2a = s * (g / 2), z2b = s * (g / 2 + W);     // второй марш
    for (let i = 0; i < s1; i++) add('tread', rect(i * b, (i + 1) * b, z1a, z1b), i + 1);
    add('landing', rect(X0, X0 + Lp, z1a, z2b), s1 + 1);
    for (let j = 0; j < s2; j++) add('tread', rect(X0 - (j + 1) * b, X0 - j * b, z2a, z2b), s1 + 2 + j);
    const xf = X0 - s2 * b;
    add('floor', rect(xf - FLOOR_LEN, xf, z2a, z2b), n);
    res.flights = [s1 * b, s2 * b];
    res.steps = [s1, s2];
    res.landing = [Lp, 2 * W + g];
  }

  else if (type === 'spiral') {
    const R = p.radius;
    const r0 = COLUMN_R;
    const stepDeg = p.totalAngle / nt;
    const a = stepDeg * Math.PI / 180;
    const dir = p.clockwise ? 1 : -1;   // +угол = по часовой, если смотреть сверху
    const seg = Math.max(3, Math.ceil(stepDeg / 4));
    for (let k = 0; k < nt; k++) {
      const a0 = dir * k * a, a1 = dir * (k + 1) * a;
      add('tread', sector(r0, R, Math.min(a0, a1), Math.max(a0, a1), seg), k + 1);
    }
    const fa0 = dir * nt * a, fa1 = dir * (nt * a + Math.max(a, Math.PI / 6));
    add('floor', sector(r0, R, Math.min(fa0, fa1), Math.max(fa0, fa1), seg), n);

    // Проступь считается по линии хода — посередине ширины ступени
    const rw = (r0 + R) / 2;
    res.walkR = rw;
    res.effB = a * rw;
    res.flights = [p.totalAngle * Math.PI / 180 * rw];
    res.stepDeg = stepDeg;
    res.width = R - r0;
    if (res.effB < 180) warnings.push(`Проступь по линии хода ${res.effB.toFixed(0)} мм — узко (лучше ≥ 200): увеличьте радиус или угол`);
    if (R - r0 < 600) warnings.push(`Ширина ступени ${(R - r0).toFixed(0)} мм — узко (лучше ≥ 700)`);

    // Высота прохода: расстояние до ступени на витке выше
    const perTurn = 360 / stepDeg;
    if (nt > perTurn) {
      res.headroom = perTurn * h - TREAD_T;
      if (res.headroom < 2000) warnings.push(`Высота прохода под витком ≈ ${res.headroom.toFixed(0)} мм — меньше 2000`);
    }

    // Поручень по наружному краю
    const rr = R - 50;
    const railY = deg => h * (deg / stepDeg) + h + RAIL_H;
    const pts = [];
    const total = p.totalAngle;
    for (let t = 0; t <= total + 1e-6; t += Math.min(5, stepDeg / 2)) {
      const ang = dir * t * Math.PI / 180;
      pts.push([rr * Math.cos(ang), railY(t), rr * Math.sin(ang)]);
    }
    const posts = [];
    for (let k = 0; k < nt; k += 2) {
      const tm = (k + 0.5) * stepDeg;
      const ang = dir * tm * Math.PI / 180;
      posts.push([rr * Math.cos(ang), rr * Math.sin(ang), (k + 1) * h, railY(tm)]);
    }
    res.rail = { points: pts, posts };
  }

  // Эргономика
  res.angleDeg = Math.atan(h / res.effB) * 180 / Math.PI;
  res.blondel = 2 * h + res.effB;
  res.blondelStatus = res.blondel >= 600 && res.blondel <= 650 ? 'ok'
    : res.blondel >= 580 && res.blondel <= 670 ? 'warn' : 'error';
  res.riserStatus = h >= 150 && h <= 180 ? 'ok' : h >= 120 && h <= 200 ? 'warn' : 'error';
  if (type !== 'spiral') {
    res.angleStatus = res.angleDeg <= 37 ? 'ok' : res.angleDeg <= 45 ? 'warn' : 'error';
  } else {
    res.angleStatus = res.angleDeg <= 45 ? 'ok' : res.angleDeg <= 55 ? 'warn' : 'error';
  }
  if (h > 200) warnings.push(`Подступенок ${h.toFixed(0)} мм — высоко (норма до 200)`);
  if (type !== 'spiral' && W < 800) warnings.push(`Ширина марша ${W} мм — меньше 800`);

  // Габариты в плане
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const el of els) for (const [x, z] of el.poly) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  res.extents = { minX, maxX, minZ, maxZ };
  return res;
}
