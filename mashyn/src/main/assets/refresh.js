/* =====================================================
   Свежие данные без перезапуска приложения:
   — потянуть страницу вниз (как в других приложениях) — обновить сразу;
   — раз в минуту и при возвращении в приложение — тихая проверка.
     Сначала маленький запрос «когда последняя правка в базе»; всю базу
     тянем, только если что-то изменилось, — так сеть и телефон не нагружаются.
   Экран не прыгает: если вы листаете ленту, сверху появится «Новые объявления: N».
   Подключается после features-plus.js.
   ===================================================== */
const NO_AUTO_RENDER = ['post', 'auth', 'pay', 'chat'];   // формы и чат не перерисовываем сами
const LIST_SCREENS = ['home', 'section', 'catalog', 'favs'];
let lastStamp = '', checking = false;
const ICON_REFRESH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>';

// Время последней правки в базе — несколько байт вместо всей базы
async function serverStamp(){
  const {data, error} = await sb.from('mb_records').select('updated_at').order('updated_at', {ascending: false}).limit(1);
  if (error) throw error;
  return data[0]?.updated_at || '';
}
const curScreen = () => stack[stack.length-1]?.name;
const busy = () => !$('#sheet').hidden || !!$('#zoom') || NO_AUTO_RENDER.includes(curScreen()) || !!document.activeElement?.matches('input,textarea,select');

// Подтянуть всё и показать: вверху страницы — сразу, в середине ленты — плашкой «Новые объявления»
async function pullFresh(st){
  const before = new Set(S.listings.filter(visible).map(l => l.id));
  await refresh();
  lastStamp = st;
  checkFavPrices();
  const added = S.listings.filter(l => visible(l) && !before.has(l.id)).length;
  if (busy()) return;
  if (scrollY < 80){ render(); hidePill(); }
  else if (added && LIST_SCREENS.includes(curScreen())) showPill(added);
}

async function autoCheck(){
  if (checking || document.hidden || !navigator.onLine) return;
  checking = true;
  try { const st = await serverStamp(); if (st !== lastStamp) await pullFresh(st); }
  catch (e){ console.warn(e); }
  finally { checking = false; }
}
setInterval(autoCheck, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) autoCheck(); });

function showPill(n){
  let p = $('#freshPill');
  if (!p){ p = document.createElement('button'); p.id = 'freshPill'; p.className = 'fresh-pill'; p.dataset.a = 'freshshow'; document.body.append(p); }
  p.innerHTML = `${ic('up')}<span>Новые объявления: ${n}</span>`;
  p.hidden = false;
}
function hidePill(){ const p = $('#freshPill'); if (p) p.hidden = true; }

Object.assign(FEATURE_ACTIONS, {
  freshshow(){ hidePill(); render(); window.scrollTo({top: 0, behavior: 'smooth'}); }
});

/* ---------- Потянуть вниз, чтобы обновить ---------- */
let ptrY = null, ptrX = 0, ptrD = 0, ptrBusy = false;
function ptrEl(){
  let el = $('#ptr');
  if (!el){ el = document.createElement('div'); el.id = 'ptr'; el.className = 'ptr'; el.innerHTML = ICON_REFRESH; document.body.append(el); }
  return el;
}
function ptrHide(el){ el.style.transition = 'transform .2s, opacity .2s'; el.style.opacity = 0; el.style.transform = 'translateY(-60px)'; }

addEventListener('touchstart', e => {
  ptrY = (!ptrBusy && scrollY <= 0 && e.touches.length === 1 && !busy() && !e.target.closest('.chat')) ? e.touches[0].clientY : null;
  ptrX = e.touches[0].clientX; ptrD = 0;
}, {passive: true});

addEventListener('touchmove', e => {
  if (ptrY === null) return;
  const dy = e.touches[0].clientY - ptrY, dx = Math.abs(e.touches[0].clientX - ptrX);
  if (dy <= 0 || dx > dy || scrollY > 0){ ptrD = 0; if ($('#ptr')) ptrHide($('#ptr')); return; }
  ptrD = Math.min(dy * 0.5, 90);
  const el = ptrEl();
  el.style.transition = 'none';
  el.style.opacity = Math.min(ptrD / 60, 1);
  el.style.transform = `translateY(${ptrD - 60}px)`;
  el.firstElementChild.style.transform = `rotate(${ptrD * 4}deg)`;
}, {passive: true});

addEventListener('touchend', async () => {
  if (ptrY === null) return;
  ptrY = null;
  const el = $('#ptr'); if (!el) return;
  if (ptrD < 60){ ptrHide(el); return; }
  ptrBusy = true;
  el.style.transition = 'transform .2s'; el.style.transform = 'translateY(6px)'; el.classList.add('spin');
  try {
    const st = await serverStamp().catch(() => '');
    await refresh(); lastStamp = st; checkFavPrices();
    hidePill(); render(); toast('Данные обновлены');
  } catch (e){ console.warn(e); toast('Нет связи с сервером. Проверьте интернет.'); }
  ptrBusy = false; el.classList.remove('spin'); ptrHide(el);
});

TR_RE.push([/^Новые объявления: (\d+)$/, (m,n) => ['Täze bildirişler: '+n, 'New listings: '+n]]);
Object.assign(TR, {'Данные обновлены':['Maglumatlar täzelendi','Data updated']});
TR_SUB.splice(0, TR_SUB.length, ...Object.keys(TR).filter(k => k.length >= 6 && /[ «»:,.→₽]/.test(k)).sort((a,b) => b.length - a.length));
