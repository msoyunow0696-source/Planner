import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { computeStair, DEFAULTS, TREAD_T, LANDING_T, FLOOR_T, COLUMN_R } from './model.js';

const $ = id => document.getElementById(id);
const STORE = 'stairs_params_v1';
const isMobile = () => window.matchMedia('(max-width: 900px)').matches;
const fmt = (v, d = 0) => Number(v).toFixed(d).replace('.', ',');

const C = { H: '#ff5555', h: '#5599ff', b: '#ffaa00', W: '#66cc66', L: '#dda0dd' };

/* ================= Параметры ================= */
let params = { ...DEFAULTS };
try { Object.assign(params, JSON.parse(localStorage.getItem(STORE)) || {}); } catch {}
const saveParams = () => { try { localStorage.setItem(STORE, JSON.stringify(params)); } catch {} };

const F = {
  H: { label: 'H высота', dot: C.H, step: 10, unit: 'мм' },
  h: { label: 'h подступ.', dot: C.h, step: 1, unit: 'мм' },
  b: { label: 'b проступь', dot: C.b, step: 1, unit: 'мм' },
  W: { label: 'W ширина', dot: C.W, step: 10, unit: 'мм' },
  platformLen: { label: '📏 Площадка', step: 10, unit: 'мм' },
  stepsToPlatform: { label: '🔢 Ступ. до пл.', step: 1, unit: '0=авто' },
  turn: { label: '↪ Поворот', select: [['left', 'Влево'], ['right', 'Вправо']] },
  gap: { label: '↔ Просвет', step: 10, unit: 'мм' },
  radius: { label: '🌀 Радиус', step: 10, unit: 'мм' },
  totalAngle: { label: '🔄 Угол', step: 5, unit: '°' },
  clockwise: { label: '⏰ По часовой', checkbox: true }
};
const FIELDS_BY_TYPE = {
  straight: ['H', 'h', 'b', 'W'],
  lshape: ['H', 'h', 'b', 'W', 'platformLen', 'stepsToPlatform', 'turn'],
  ushape: ['H', 'h', 'b', 'W', 'platformLen', 'stepsToPlatform', 'turn', 'gap'],
  spiral: ['H', 'h', 'radius', 'totalAngle', 'clockwise']
};

function updateParamsUI() {
  const box = $('paramsContainer');
  box.innerHTML = '';
  for (const key of FIELDS_BY_TYPE[params.type]) {
    const f = F[key];
    const row = document.createElement('div');
    row.className = 'row';
    const label = document.createElement('label');
    label.htmlFor = 'p_' + key;
    label.innerHTML = (f.dot ? `<span class="color-dot" style="background:${f.dot}"></span>` : '') + f.label;
    row.appendChild(label);

    let input;
    if (f.select) {
      input = document.createElement('select');
      f.select.forEach(([v, t]) => input.add(new Option(t, v)));
      input.value = params[key];
    } else if (f.checkbox) {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !!params[key];
    } else {
      input = document.createElement('input');
      input.type = 'number';
      input.inputMode = 'decimal';
      input.step = f.step;
      input.value = params[key];
      if (f.unit) input.placeholder = f.unit;
    }
    input.id = 'p_' + key;
    const onChange = () => {
      params[key] = f.checkbox ? input.checked : f.select ? input.value : input.value === '' ? NaN : Number(input.value);
      if (f.checkbox || f.select || Number.isFinite(params[key])) { saveParams(); scheduleBuild(); }
    };
    input.addEventListener(f.checkbox || f.select ? 'change' : 'input', onChange);
    row.appendChild(input);
    if (f.unit && !f.checkbox && !f.select) {
      const u = document.createElement('span');
      u.className = 'unit';
      u.textContent = f.unit;
      row.appendChild(u);
    }
    box.appendChild(row);
  }
}

/* ================= 3D-сцена ================= */
const BG = 0x1a1a2e;
let renderer = null, labelRenderer, scene, camera, controls, dirLight, floorMesh, grid;
const stairGroup = new THREE.Group();

const mat = {
  tread: new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.5 }),
  riser: new THREE.MeshStandardMaterial({ color: 0x5599ff, roughness: 0.4 }),
  landing: new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.6 }),
  floor: new THREE.MeshStandardMaterial({ color: 0x55556a, roughness: 0.8 }),
  column: new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.3, roughness: 0.4 }),
  rail: new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.5, roughness: 0.3 })
};

function initScene() {
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch (e) {
    $('glError').hidden = false;
    return false;
  }
  scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 6, 25);
  camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.05, 200);
  camera.position.set(5, 4, 7);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.prepend(renderer.domElement);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(innerWidth, innerHeight);
  Object.assign(labelRenderer.domElement.style, { position: 'absolute', top: '0', left: '0', pointerEvents: 'none' });
  renderer.domElement.after(labelRenderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.495;

  scene.add(new THREE.AmbientLight(0x6a6a88, 0.9));
  dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  scene.add(dirLight, dirLight.target);
  const fill = new THREE.DirectionalLight(0x4466aa, 0.5);
  fill.position.set(-3, 2, -2);
  scene.add(fill);

  floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.8 }));
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = -0.002;
  floorMesh.receiveShadow = true;
  grid = new THREE.GridHelper(20, 40, 0x444466, 0x2a2a40);
  scene.add(floorMesh, grid, stairGroup);
  return true;
}

function clearGroup() {
  while (stairGroup.children.length) {
    const o = stairGroup.children[0];
    stairGroup.remove(o);           // CSS2D-подписи сами удаляют свой DOM при remove
    o.traverse(c => { if (c.geometry) c.geometry.dispose(); });
  }
}

/** Плита по контуру в плане (мм), от y0 до y1. */
function slab(poly, y0, y1, material) {
  if (y1 - y0 <= 0.5) return;
  const shape = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x / 1000, -z / 1000)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: (y1 - y0) / 1000, bevelEnabled: false, curveSegments: 1 });
  const m = new THREE.Mesh(geo, material);
  m.rotation.x = -Math.PI / 2;
  m.position.y = y0 / 1000;
  m.castShadow = m.receiveShadow = true;
  stairGroup.add(m);
}

const V = (x, y, z) => new THREE.Vector3(x / 1000, y / 1000, z / 1000);

function label3D(text, pos, color) {
  const div = document.createElement('div');
  div.className = 'label3d';
  div.textContent = text;
  div.style.color = color;
  const l = new CSS2DObject(div);
  l.position.copy(pos);
  stairGroup.add(l);
}

function dim3D(a, b, color, text) {
  const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
  stairGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color })));
  if (text) label3D(text, a.clone().add(b).multiplyScalar(0.5), color);
}

function build3D(m) {
  clearGroup();
  const spiral = m.type === 'spiral';
  for (const el of m.els) {
    if (el.kind === 'tread') {
      slab(el.poly, el.top - TREAD_T, el.top, mat.tread);
      if (!spiral) slab(el.poly, el.top - m.h, el.top - TREAD_T, mat.riser);
    } else if (el.kind === 'landing') {
      slab(el.poly, el.top - LANDING_T, el.top, mat.landing);
      slab(el.poly, el.top - m.h, el.top - LANDING_T, mat.riser);
    } else {
      slab(el.poly, el.top - FLOOR_T, el.top, mat.floor);
    }
  }

  if (spiral) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(COLUMN_R / 1000, COLUMN_R / 1000, (m.p.H + 1000) / 1000, 24), mat.column);
    col.position.y = (m.p.H + 1000) / 2000;
    col.castShadow = true;
    stairGroup.add(col);
    if (m.rail) {
      const curve = new THREE.CatmullRomCurve3(m.rail.points.map(([x, y, z]) => V(x, y, z)));
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(40, m.rail.points.length * 2), 0.022, 8, false), mat.rail);
      tube.castShadow = true;
      stairGroup.add(tube);
      for (const [x, z, y0, y1] of m.rail.posts) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, (y1 - y0) / 1000, 8), mat.rail);
        post.position.set(x / 1000, (y0 + y1) / 2000, z / 1000);
        stairGroup.add(post);
      }
    }
  }

  // Размеры
  const e = m.extents, H = m.p.H;
  const dx = e.maxX - e.minX, dz = e.maxZ - e.minZ;
  dim3D(V(e.minX - 300, 0, e.minZ), V(e.minX - 300, H, e.minZ), 0xff5555, `H=${fmt(H)}`);
  dim3D(V(e.minX, 0, e.maxZ + 300), V(e.maxX, 0, e.maxZ + 300), 0xdda0dd, `${fmt(dx)}`);
  dim3D(V(e.maxX + 300, 0, e.minZ), V(e.maxX + 300, 0, e.maxZ), 0x66cc66, `${fmt(dz)}`);
  if (!spiral) {
    const first = m.els[0].poly;
    const x0 = Math.min(...first.map(p => p[0])), x1 = Math.max(...first.map(p => p[0]));
    const z1 = Math.max(...first.map(p => p[1]));
    dim3D(V(x1 + 60, 0, z1 + 60), V(x1 + 60, m.h, z1 + 60), 0x5599ff, `h=${fmt(m.h, 1)}`);
    dim3D(V(x0, m.h + 80, z1 + 60), V(x1, m.h + 80, z1 + 60), 0xffaa00, `b=${fmt(m.p.b)}`);
  } else {
    dim3D(V(0, 30, 0), V(m.p.radius, 30, 0), 0x66cc66, `R=${fmt(m.p.radius)}`);
  }
}

function fitCamera(m) {
  const e = m.extents, H = m.p.H;
  const cx = (e.minX + e.maxX) / 2000, cz = (e.minZ + e.maxZ) / 2000, cy = H / 2000;
  const size = Math.max(e.maxX - e.minX, e.maxZ - e.minZ, H) / 1000;
  const target = new THREE.Vector3(cx, cy * 0.8, cz);
  controls.target.copy(target);
  // Расстояние, при котором вся лестница влезает и по высоте, и по ширине экрана
  const radius = 0.5 * Math.hypot(e.maxX - e.minX, e.maxZ - e.minZ, H) / 1000 + 0.3;
  const halfV = THREE.MathUtils.degToRad(camera.fov / 2);
  const halfH = Math.atan(Math.tan(halfV) * camera.aspect);
  const dist = radius / Math.sin(Math.min(halfV, halfH)) * 1.05;
  camera.position.copy(target).add(new THREE.Vector3(0.75, 0.6, 1.1).normalize().multiplyScalar(dist));
  camera.far = size * 30 + 30;
  camera.updateProjectionMatrix();
  controls.minDistance = 0.5;
  controls.maxDistance = size * 8 + 5;
  controls.update();

  scene.fog.near = size * 3;
  scene.fog.far = size * 9 + 8;
  floorMesh.position.set(cx, -0.002, cz);
  grid.position.set(Math.round(cx), 0, Math.round(cz));

  dirLight.position.set(cx + size, size * 2 + 2, cz + size * 0.8);
  dirLight.target.position.copy(target);
  const sc = dirLight.shadow.camera;
  sc.left = sc.bottom = -size * 1.2;
  sc.right = sc.top = size * 1.2;
  sc.near = 0.1;
  sc.far = size * 6 + 6;
  sc.updateProjectionMatrix();
}

/* ================= 2D-чертежи ================= */
const VIEW_W = 300, VIEW_H = 200;
const ctxs = {};
['sideCanvas', 'frontCanvas', 'topCanvas'].forEach(id => {
  const c = $(id);
  c.width = VIEW_W * 2;
  c.height = VIEW_H * 2;
  ctxs[id] = c.getContext('2d');
});

const KIND_STYLE = {
  tread: { fill: 'rgba(85,153,255,0.25)', stroke: '#5599ff' },
  landing: { fill: 'rgba(170,170,170,0.35)', stroke: '#bbbbbb' },
  floor: { fill: 'rgba(120,120,140,0.45)', stroke: '#8888a0' }
};

/** Масштаб «данные → экран» с отступами. flipV — ось вверх (виды сбоку/спереди). */
function fitView(u0, u1, v0, v1, flipV, m = { l: 44, r: 16, t: 26, b: 26 }) {
  const k = Math.min((VIEW_W - m.l - m.r) / Math.max(1, u1 - u0), (VIEW_H - m.t - m.b) / Math.max(1, v1 - v0));
  const offU = m.l + ((VIEW_W - m.l - m.r) - (u1 - u0) * k) / 2;
  const offV = m.t + ((VIEW_H - m.t - m.b) - (v1 - v0) * k) / 2;
  return {
    k,
    X: u => offU + (u - u0) * k,
    Y: v => flipV ? offV + (v1 - v) * k : offV + (v - v0) * k
  };
}

function dim2D(ctx, x1, y1, x2, y2, text, color) {
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);
  for (const [x, y] of [[x1, y1], [x2, y2]]) {
    if (vertical) { ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); }
    else { ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); }
  }
  ctx.stroke();
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  if (vertical) {
    ctx.translate(mx - 9, my);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(text, 0, 0);
  } else {
    ctx.fillText(text, mx, my - 8);
  }
  ctx.restore();
}

function viewFrame(ctx, title) {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#9aa';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, 6, 5);
}

const elRange = (el, axis) => {
  const vals = el.poly.map(p => p[axis]);
  return [Math.min(...vals), Math.max(...vals)];
};
const elBottom = (el, m) => el.kind === 'floor' ? el.top - FLOOR_T
  : (m.type === 'spiral' && el.kind === 'tread') ? el.top - TREAD_T : el.top - m.h;

/** Вид сбоку (axis 0 = X) или спереди (axis 1 = Z). */
function drawElevation(ctx, m, axis, title) {
  viewFrame(ctx, title);
  const e = m.extents, H = m.p.H;
  const [u0, u1] = axis === 0 ? [e.minX, e.maxX] : [e.minZ, e.maxZ];
  const t = fitView(u0, u1, 0, H, true);
  // пол
  ctx.strokeStyle = '#556';
  ctx.beginPath(); ctx.moveTo(t.X(u0) - 10, t.Y(0)); ctx.lineTo(t.X(u1) + 10, t.Y(0)); ctx.stroke();
  for (const el of m.els) {
    const [a, b] = elRange(el, axis);
    const st = KIND_STYLE[el.kind];
    const x = t.X(a), w = (b - a) * t.k, yTop = t.Y(el.top), yBot = t.Y(elBottom(el, m));
    ctx.fillStyle = st.fill;
    ctx.fillRect(x, yTop, w, yBot - yTop);
    ctx.strokeStyle = st.stroke;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x, yTop, w, yBot - yTop);
    if (el.kind === 'tread') {
      ctx.strokeStyle = C.b;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, yTop); ctx.lineTo(x + w, yTop); ctx.stroke();
    }
  }
  dim2D(ctx, t.X(u0) - 16, t.Y(0), t.X(u0) - 16, t.Y(H), `H=${fmt(H)}`, C.H);
  dim2D(ctx, t.X(u0), t.Y(0) + 14, t.X(u1), t.Y(0) + 14, fmt(u1 - u0), axis === 0 ? C.L : C.W);
}

function drawPlan(ctx, m) {
  viewFrame(ctx, 'План (вид сверху)');
  const e = m.extents;
  const t = fitView(e.minX, e.maxX, e.minZ, e.maxZ, false, { l: 16, r: 34, t: 30, b: 12 });
  const walkPts = [];
  m.els.forEach((el, i) => {
    const st = KIND_STYLE[el.kind];
    ctx.beginPath();
    el.poly.forEach(([x, z], j) => j ? ctx.lineTo(t.X(x), t.Y(z)) : ctx.moveTo(t.X(x), t.Y(z)));
    ctx.closePath();
    ctx.fillStyle = st.fill;
    ctx.fill();
    ctx.strokeStyle = el.kind === 'tread' ? C.b : st.stroke;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // центр элемента (для винтовой — на линии хода)
    let cx, cz;
    if (m.type === 'spiral') {
      const [xa, za] = el.poly[0], [xb, zb] = el.poly[el.poly.length / 2 - 1];  // края наружной дуги
      const am = Math.atan2(za + zb, xa + xb);
      cx = m.walkR * Math.cos(am); cz = m.walkR * Math.sin(am);
    } else {
      cx = el.poly.reduce((s, p) => s + p[0], 0) / el.poly.length;
      cz = el.poly.reduce((s, p) => s + p[1], 0) / el.poly.length;
    }
    walkPts.push([t.X(cx), t.Y(cz)]);
    if (el.kind !== 'floor' && Math.min(m.effB, m.p.W) * t.k >= 11) {
      ctx.fillStyle = '#dde';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), t.X(cx), t.Y(cz));
    }
  });

  if (m.type === 'spiral') {
    ctx.fillStyle = '#ccc';
    ctx.beginPath(); ctx.arc(t.X(0), t.Y(0), Math.max(2, COLUMN_R * t.k), 0, Math.PI * 2); ctx.fill();
  }

  // Линия хода со стрелкой
  if (walkPts.length > 1) {
    ctx.save();
    ctx.strokeStyle = '#ff7777';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    walkPts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();
    ctx.setLineDash([]);
    const [xa, ya] = walkPts.at(-2), [xb, yb] = walkPts.at(-1);
    const ang = Math.atan2(yb - ya, xb - xa);
    ctx.fillStyle = '#ff7777';
    ctx.beginPath();
    ctx.moveTo(xb, yb);
    ctx.lineTo(xb - 8 * Math.cos(ang - 0.4), yb - 8 * Math.sin(ang - 0.4));
    ctx.lineTo(xb - 8 * Math.cos(ang + 0.4), yb - 8 * Math.sin(ang + 0.4));
    ctx.fill();
    ctx.restore();
  }

  dim2D(ctx, t.X(e.minX), t.Y(e.minZ) - 12, t.X(e.maxX), t.Y(e.minZ) - 12, fmt(e.maxX - e.minX), C.L);
  dim2D(ctx, t.X(e.maxX) + 22, t.Y(e.minZ), t.X(e.maxX) + 22, t.Y(e.maxZ), fmt(e.maxZ - e.minZ), C.W);
}

function draw2D(m) {
  drawElevation(ctxs.sideCanvas, m, 0, 'Вид сбоку');
  drawElevation(ctxs.frontCanvas, m, 1, 'Вид спереди');
  drawPlan(ctxs.topCanvas, m);
}

/* ================= Результаты ================= */
const BADGE = { ok: 'норма', warn: 'допустимо', error: 'вне нормы' };
const badge = (st, text = BADGE[st]) => `<span class="badge ${st}">${text}</span>`;

function showResults(m) {
  const rows = [];
  const row = (l, v) => rows.push(`<div class="res-row"><span class="res-label">${l}</span><span class="res-value">${v}</span></div>`);
  row('Подъёмов', `${m.n} <span class="dim">(проступей ${m.nt})</span>`);
  row('Подступенок факт.', `${fmt(m.h, 1)} мм ${badge(m.riserStatus, m.riserStatus === 'ok' ? 'комфорт' : BADGE[m.riserStatus])}`);
  if (m.type === 'spiral') {
    row('Угол ступени', `${fmt(m.stepDeg, 1)}°`);
    row('Проступь по линии хода', `${fmt(m.effB)} мм`);
    row('Ширина ступени', `${fmt(m.width)} мм`);
    row('Длина по линии хода', `${fmt(m.flights[0])} мм`);
    if (m.headroom) row('Высота прохода', `${fmt(m.headroom)} мм ${badge(m.headroom >= 2000 ? 'ok' : 'error')}`);
  } else if (m.flights.length === 2) {
    row('Марши', `${m.steps[0]} + ${m.steps[1]} ступ.`);
    row('Длина маршей', `${fmt(m.flights[0])} + ${fmt(m.flights[1])} мм`);
    row('Площадка', `${fmt(m.landing[0])} × ${fmt(m.landing[1])} мм`);
  } else {
    row('Длина марша (L)', `${fmt(m.flights[0])} мм`);
  }
  const e = m.extents;
  row('Габарит в плане', `${fmt(e.maxX - e.minX)} × ${fmt(e.maxZ - e.minZ)} мм`);
  row('Угол наклона', `${fmt(m.angleDeg, 1)}° ${badge(m.angleStatus)}`);
  row('Формула Блонделя', `${fmt(m.blondel)} мм ${badge(m.blondelStatus, m.blondelStatus === 'ok' ? 'идеал' : BADGE[m.blondelStatus])}`);
  $('resultsBox').innerHTML = rows.join('');

  const wb = $('warnBox');
  wb.innerHTML = m.warnings.map(w => `<div>⚠ ${w}</div>`).join('');
  wb.hidden = m.warnings.length === 0;

  $('summary').textContent = `${m.n} подъёмов · h ${fmt(m.h, 1)} · ${fmt(m.angleDeg, 1)}°` +
    (m.warnings.length ? ` · ⚠ ${m.warnings.length}` : '');
}

/* ================= Сборка всего ================= */
let lastType = null;
function buildAll(fit) {
  const m = computeStair(params);
  showResults(m);
  draw2D(m);
  if (renderer) {
    build3D(m);
    if (fit || m.type !== lastType) fitCamera(m);
  }
  lastType = m.type;
  window.__stairs = { model: m };
  return m;
}

let buildTimer = null;
function scheduleBuild() {
  clearTimeout(buildTimer);
  buildTimer = setTimeout(() => buildAll(false), 250);
}

/* ================= Мобильный интерфейс ================= */
const panel = $('panel'), views = $('views2d');
function setPanel(open) {
  panel.classList.toggle('collapsed', !open);
  $('btnPanel').classList.toggle('active', open);
}
function setViews(open) {
  views.classList.toggle('show', open);
  $('btnViews').classList.toggle('active', open);
  if (open && isMobile()) setPanel(false);
}
$('btnPanel').addEventListener('click', () => {
  const open = panel.classList.contains('collapsed');
  setPanel(open);
  if (open && isMobile()) setViews(false);
});
$('btnViews').addEventListener('click', () => setViews(!views.classList.contains('show')));
$('panelClose').addEventListener('click', () => setPanel(false));

/* ================= Запуск ================= */
const typeSelect = $('typeSelect');
typeSelect.value = params.type;
typeSelect.addEventListener('change', () => {
  params.type = typeSelect.value;
  saveParams();
  updateParamsUI();
  buildAll(true);
});
$('buildBtn').addEventListener('click', () => {
  buildAll(true);
  if (isMobile()) setPanel(false);
});
$('resetBtn').addEventListener('click', () => {
  params = { ...DEFAULTS, type: params.type };
  saveParams();
  updateParamsUI();
  buildAll(true);
});

$('hint').textContent = matchMedia('(pointer: coarse)').matches
  ? '☝ Вращение — пальцем · Масштаб — щипком'
  : '🖱️ Вращение — мышью · Колёсико — масштаб';

const glOk = initScene();
updateParamsUI();
buildAll(true);
if (isMobile()) setViews(false); else setViews(true);

window.addEventListener('resize', () => {
  if (!renderer) return;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
});

if (glOk) {
  (function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    window.__stairs.triangles = renderer.info.render.triangles;
  })();
}
