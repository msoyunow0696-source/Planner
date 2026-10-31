/* =====================================================
   Функции для покупателей авто:
   оценка цены, «сообщить, когда появится», сравнение,
   проверенный продавец, VIN и подсказки для фото.
   Подключается до основного скрипта; экраны и действия
   добавляются в SCREENS и A в index.html (FEATURE_SCREENS, FEATURE_ACTIONS).
   ===================================================== */

const CAR_SECS = ['cars', 'import'];

/* ================== Цена на рынке ================== */
// Похожие объявления: та же марка и модель, год ±2
function marketStats({brand, model, year, exclude, moto}){
  if (!brand) return null;
  const m = (model||'').trim().toLowerCase();
  // Проданные за полгода тоже считаем — это реальные цены сделок. Мотоциклы сравниваем только с мотоциклами.
  const prices = S.listings.filter(l => (visible(l) || (l.status==='sold' && l.soldAt > now()-180*DAY)) && (moto ? l.sec==='moto' : CAR_SECS.includes(l.sec)) && l.id!==exclude && l.price>0
      && l.specs?.brand===brand && (!m || (l.specs.model||'').toLowerCase()===m)
      && (!year || !l.specs.year || Math.abs(l.specs.year - year) <= 2))
    .map(l => l.price).sort((a,b) => a-b);
  if (!prices.length) return {n:0};
  const mid = Math.floor(prices.length/2);
  const med = prices.length % 2 ? prices[mid] : Math.round((prices[mid-1]+prices[mid])/2);
  return {n:prices.length, med, min:prices[0], max:prices[prices.length-1]};
}

// Оценка цены конкретного объявления относительно рынка
function priceVerdict(l){
  if (!(CAR_SECS.includes(l.sec) || l.sec==='moto') || !l.price) return null;
  const st = marketStats({brand:l.specs?.brand, model:l.specs?.model, year:l.specs?.year, exclude:l.id, moto:l.sec==='moto'});
  if (!st || st.n < 2) return null;
  const d = Math.round((l.price - st.med) / st.med * 100);
  const kind = d <= -10 ? 'low' : d >= 10 ? 'high' : 'fair';
  return {...st, d, kind};
}

function priceCard(l){
  const v = priceVerdict(l);
  if (!v) return '';
  const label = v.kind==='low' ? `Ниже рынка на ${-v.d}%` : v.kind==='high' ? `Выше рынка на ${v.d}%` : 'Цена по рынку';
  const color = v.kind==='low' ? 'ok' : v.kind==='high' ? 'warn' : 'accent';
  return `<div class="card pad col" style="gap:8px"><div class="between"><h3>Цена на рынке</h3><span class="badge" style="background:color-mix(in srgb,var(--${color}) 18%,transparent);color:var(--${color})">${label}</span></div>
    <div class="breakdown"><div class="r"><span class="dim">Средняя цена</span><span class="num">${fmt(v.med)} TMT</span></div>
      <div class="r"><span class="dim">От и до</span><span class="num">${fmt(v.min)} – ${fmt(v.max)} TMT</span></div></div>
    <span class="tiny dim">По ${v.n} похожим объявлениям: та же марка и модель, год ±2</span></div>`;
}

/* ================== Проверенный продавец ================== */
const isVerified = uid => !!userById(uid)?.verified;
const verifiedBadge = l => isVerified(l.uid) ? '<span class="badge b-ok">✓ Проверенный</span>' : '';

/* ================== Сравнение ================== */
let CMP = [];
try { CMP = JSON.parse(localStorage.getItem('mb_cmp')) || []; } catch {}
const saveCmp = () => { try { localStorage.setItem('mb_cmp', JSON.stringify(CMP)); } catch {} };
const cmpBar = () => {
  const n = CMP.filter(id => S.listings.some(l => l.id===id)).length;
  return n && stack[stack.length-1]?.name!=='compare' ? `<button class="cmp-bar" data-a="cmpopen">${ic('list')}Сравнение · <b class="num">${n}</b></button>` : '';
};

/* ================== VIN ================== */
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;
const VIN_COUNTRY = {J:'Япония',K:'Корея',L:'Китай',S:'Великобритания',V:'Франция / Испания',W:'Германия',Y:'Швеция',Z:'Италия',X:'Россия',T:'Чехия',9:'Бразилия',1:'США',4:'США',5:'США',2:'Канада',3:'Мексика',6:'Австралия'};
const VIN_MAKER = {JT:'Toyota',JTJ:'Lexus',JTH:'Lexus',JN:'Nissan',JH:'Honda',JM:'Mazda',JF:'Subaru',JS:'Suzuki',JA:'Mitsubishi',KM:'Hyundai',KN:'Kia',KL:'Chevrolet (Корея)',
  WBA:'BMW',WBS:'BMW M',WDB:'Mercedes-Benz',WDD:'Mercedes-Benz',W1K:'Mercedes-Benz',W1N:'Mercedes-Benz',WVW:'Volkswagen',WV:'Volkswagen',WAU:'Audi',WP:'Porsche',
  '1G':'General Motors','2G':'General Motors','1F':'Ford','2F':'Ford','3F':'Ford','1N':'Nissan (США)','1HG':'Honda (США)','2HG':'Honda (Канада)','4T':'Toyota (США)','5T':'Toyota (США)',
  '2T':'Toyota (Канада)','5YJ':'Tesla','1C':'Chrysler / Jeep','5N':'Hyundai / Kia (США)','5X':'Hyundai / Kia (США)','KND':'Kia',SAL:'Land Rover',SAJ:'Jaguar',LVS:'Ford (Китай)',XTA:'Lada'};
function decodeVin(raw){
  const vin = String(raw||'').toUpperCase().replace(/\s/g,'');
  if (!VIN_RE.test(vin)) return null;
  const maker = VIN_MAKER[vin.slice(0,3)] || VIN_MAKER[vin.slice(0,2)] || '';
  const country = VIN_COUNTRY[vin[0]] || '';
  // Год по 10-му знаку: A=2010 … 9=2009 (цикл 30 лет, берём ближайший не позже следующего года)
  const codes = 'ABCDEFGHJKLMNPRSTVWXY123456789';
  const i = codes.indexOf(vin[9]);
  let year = null;
  if (i >= 0){ year = 2010 + i; while (year > new Date().getFullYear()+1) year -= 30; }
  // Контрольная цифра обязательна только для машин Северной Америки
  let check = null;
  if ('12345'.includes(vin[0])){
    const tr = {A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,J:1,K:2,L:3,M:4,N:5,P:7,R:9,S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9};
    const w = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];
    const sum = [...vin].reduce((s,c,k) => s + (/\d/.test(c) ? +c : tr[c]) * w[k], 0);
    check = (sum % 11 === 10 ? 'X' : String(sum % 11)) === vin[8];
  }
  return {vin, maker, country, year, check};
}

function vinCard(l){
  const v = decodeVin(l.specs?.vin);
  if (!v) return '';
  const yearWarn = v.year && l.specs?.year && Math.abs(v.year - l.specs.year) > 1;
  const link = (href, label) => `<a class="btn sm ghost" href="${href}" target="_blank" rel="noopener">${label}</a>`;
  return `<div class="card pad col" style="gap:8px"><div class="between"><h3>Проверка по VIN</h3>${v.check===false?'<span class="badge b-bad">VIN с ошибкой</span>':v.check?'<span class="badge b-ok">✓ VIN корректный</span>':''}</div>
    <div class="copy-row"><span class="num" style="font-weight:700;letter-spacing:.06em;overflow-wrap:anywhere">${v.vin}</span><button class="btn sm ghost" data-a="copy" data-v="${v.vin}">${ic('copy')}</button></div>
    <div class="breakdown">${v.maker?`<div class="r"><span class="dim">Производитель</span><span>${esc(v.maker)}</span></div>`:''}
      ${v.country?`<div class="r"><span class="dim">Страна сборки</span><span>${esc(v.country)}</span></div>`:''}
      ${v.year?`<div class="r"><span class="dim">Год по VIN</span><span class="num" ${yearWarn?'style="color:var(--warn)"':''}>${v.year}</span></div>`:''}</div>
    ${yearWarn?`<div class="small" style="color:var(--warn)">Год в объявлении (${l.specs.year}) не совпадает с годом по VIN. Уточните у продавца.</div>`:''}
    <div class="row" style="flex-wrap:wrap;gap:6px">
      ${link('https://vpic.nhtsa.dot.gov/decoder/Decoder?VIN='+v.vin, 'Расшифровка VIN')}
      ${link('https://www.google.com/search?q=%22'+v.vin+'%22', 'Фото с аукционов')}
      ${'12345'.includes(v.vin[0])?link('https://www.nicb.org/vincheck', 'Угон и тотал (США)'):''}</div>
    <span class="tiny dim">В Туркменистане нет общей базы залогов и ДТП. Перед покупкой проверяйте документы и номер кузова на самой машине.</span></div>`;
}

/* ================== Подсказки для фото ================== */
const PHOTO_SHOTS = [
  ['Спереди под углом', 'Машина целиком, видны фары и бок'],
  ['Сзади под углом', 'Задние фонари и другой бок'],
  ['Сбоку', 'Ровно сбоку, вся машина в кадре'],
  ['Салон спереди', 'Руль, панель, передние сиденья'],
  ['Приборная панель', 'Включите зажигание: видно пробег и нет ошибок'],
  ['Подкапотное пространство', 'Двигатель чистый и сухой']
];
function photoTipsSheet(){
  openSheet(`<div class="between"><h2>Как сфотографировать машину</h2><button class="icon-btn" data-a="closesheet" aria-label="Закрыть">${ic('x')}</button></div>
    <div class="list" style="gap:8px">${PHOTO_SHOTS.map(([n,d],i)=>`<div class="row" style="gap:12px;align-items:flex-start"><span class="num" style="flex:none;width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:var(--accent);color:var(--on);font-weight:700">${i+1}</span><div><b class="small">${n}</b><br><span class="tiny dim">${d}</span></div></div>`).join('')}</div>
    <div class="card pad small col" style="gap:4px"><b>Советы</b>
      <span class="dim">☀️ Снимайте днём, при дневном свете, не против солнца</span>
      <span class="dim">🧽 Помойте машину — чистая продаётся быстрее и дороже</span>
      <span class="dim">📱 Держите телефон горизонтально, на уровне фар</span>
      <span class="dim">🚫 Без людей и мусора в кадре, номер можно закрыть</span></div>
    <button class="btn" data-a="closesheet">Понятно</button>`);
}

/* ================== «Сообщить, когда появится» ================== */
// Описание поиска словами: «Авто · Toyota · до 300 000 TMT · 2018–2020»
function alertText(a){
  const f = a.f || {};
  const parts = [t('s_'+a.sec)];
  if (a.q) parts.push('«'+a.q+'»');
  if (f.brand?.length) parts.push(f.brand.join(', '));
  if (f.pmin || f.pmax) parts.push((f.pmin?'от '+fmt(f.pmin)+' ':'')+(f.pmax?'до '+fmt(f.pmax)+' ':'')+'TMT');
  if (f.ymin || f.ymax) parts.push((f.ymin||'…')+'–'+(f.ymax||'…'));
  if (f.reg) parts.push(f.place || f.reg);
  for (const k of ['credit','swap']) if (f[k]?.length) parts.push('✓ '+YES_NO[k]);
  for (const k of MULTI_KEYS) if (!['credit','swap'].includes(k) && f[k]?.length) parts.push(f[k].join(', '));
  return parts.join(' · ');
}

/* ================== Экраны ================== */
const FEATURE_SCREENS = {
  // Сколько стоит моя машина?
  estimate(){
    const e = state.est = state.est || {};
    const brands = BRAND_GROUPS.cars.flatMap(g => Object.keys(CATALOG[g]));
    const st = e.brand ? marketStats(e) : null;
    const same = st && st.n ? rank(S.listings.filter(l => visible(l) && CAR_SECS.includes(l.sec) && l.specs?.brand===e.brand
      && (!e.model || (l.specs.model||'').toLowerCase()===e.model.toLowerCase()) && (!e.year || !l.specs.year || Math.abs(l.specs.year-e.year)<=2)), 'cheap') : [];
    return {title:'Сколько стоит машина?', html:`
      <div class="hero" style="min-height:0"><h1 style="font-size:1.2rem">Сколько стоит моя машина?</h1><p>Средняя цена по похожим объявлениям в приложении</p></div>
      <div class="col">
        <div class="field"><label for="e_brand">Марка</label><select class="inp" id="e_brand"><option value="">Не выбрано</option>${brands.map(b=>`<option ${e.brand===b?'selected':''}>${esc(b)}</option>`).join('')}</select></div>
        <div class="grid2"><div class="field"><label for="e_model">Модель</label><input class="inp" id="e_model" list="e_models" value="${esc(e.model||'')}" placeholder="Camry"><datalist id="e_models">${(e.brand?modelsOf(e.brand,'cars'):[]).map(m=>`<option value="${esc(m)}">`).join('')}</datalist></div>
          <div class="field"><label for="e_year">Год выпуска</label><input class="inp num" id="e_year" type="number" inputmode="numeric" value="${e.year||''}" placeholder="2018"></div></div>
        <button class="btn" data-a="estgo">${ic('search')}Узнать цену</button></div>
      ${!st ? '' : st.n ? `<div class="card pad col" style="gap:10px">
          <div class="price-big num" style="color:var(--accent)">${fmt(st.med)} TMT</div><span class="small dim">средняя цена</span>
          <div class="breakdown"><div class="r"><span class="dim">Самая низкая</span><span class="num">${fmt(st.min)} TMT</span></div>
            <div class="r"><span class="dim">Самая высокая</span><span class="num">${fmt(st.max)} TMT</span></div>
            <div class="r"><span class="dim">Похожих объявлений</span><span class="num">${st.n}</span></div></div>
          <span class="tiny dim">Цена зависит от пробега, состояния и комплектации. Это ориентир, а не точная оценка.</span></div>
        <div class="col"><h3>Похожие объявления</h3><div class="list">${same.slice(0,10).map(listCard).join('')}</div></div>`
      : emptyBox('Пока мало похожих объявлений', 'Попробуйте без модели или другой год. Чем больше объявлений в приложении, тем точнее оценка.')}`,
      after(){
        $('#e_brand').addEventListener('change', ev => { e.brand = ev.target.value; e.model=''; render(); });
      }};
  },

  // Сохранённые поиски
  alerts(){
    const u = me();
    if (!u) return {title:'Уведомления о поиске', html:guest()};
    const mine = S.alerts.filter(a => a.uid===u.id).sort((a,b) => b.created-a.created);
    return {title:'Уведомления о поиске', html:`
      <div class="card pad small col" style="gap:4px">${ic('bell','style="width:22px;height:22px;color:var(--accent)"')}<b>Сообщим о новых объявлениях</b>
        <span class="dim">Откройте раздел, настройте фильтры (марка, цена, год) и нажмите «Сообщить о новых». Когда появится подходящая машина, придёт уведомление.</span></div>
      <div class="list">${mine.length ? mine.map(a=>`<div class="card pad col" style="gap:8px"><b class="small">${esc(alertText(a))}</b>
        <div class="row" style="gap:6px"><button class="btn sm" data-a="alertopen" data-v="${a.id}">${ic('search')}Показать</button><button class="btn sm ghost" data-a="alertdel" data-v="${a.id}" aria-label="Удалить">${ic('trash')}</button></div></div>`).join('')
        : emptyBox('Пока нет сохранённых поисков', 'Сохраните поиск в любом разделе — и не пропустите нужную машину')}</div>
      <button class="btn ghost" data-a="sec" data-v="cars">${ic('car')}Перейти к авто</button>`};
  },

  // Сравнение машин
  compare(){
    const ls = CMP.map(id => S.listings.find(l => l.id===id)).filter(Boolean);
    if (ls.length < 2) return {title:'Сравнение', html:emptyBox('Добавьте 2–3 машины', 'Откройте объявление и нажмите «Сравнить»', `<button class="btn" data-a="sec" data-v="cars">${ic('car')}Перейти к авто</button>`)};
    const val = (l, k) => { const v = l.specs?.[k]; if (v==null || v==='') return '—';
      return YES_NO[k] ? (v==='yes'?'✓ Есть':'✗ Нет') : k==='km' ? fmt(v)+' км' : k==='engine' ? v+' л' : v; };
    const rows = [['year','Год'],['km','Пробег'],['fuel','Топливо'],['gear','Коробка'],['body','Кузов'],['engine','Двигатель'],['color','Цвет'],['credit','Кредит'],['swap','Обмен']]
      .filter(([k]) => ls.some(l => l.specs?.[k]));
    const best = (k, dir) => { const nums = ls.map(l => Number(l.specs?.[k])).filter(n => n>0); return nums.length>1 ? (dir<0?Math.min:Math.max)(...nums) : null; };
    const bYear = best('year', 1), bKm = best('km', -1), bPrice = Math.min(...ls.map(l => l.price||Infinity));
    const cell = (html, good) => `<td${good?' class="good"':''}>${html}</td>`;
    return {title:'Сравнение', html:`
      <div class="cmp-wrap"><table class="cmp">
        <tr><th></th>${ls.map(l=>`<td><button data-a="open" data-v="${l.id}" style="display:block;width:100%;text-align:left"><div class="cmp-pic">${mainPic(l)}</div><b class="small">${esc(l.title)}</b></button></td>`).join('')}</tr>
        <tr><th>Цена</th>${ls.map(l=>cell(`<b class="num">${esc(priceText(l))}</b>`, l.price===bPrice && ls.length>1)).join('')}</tr>
        <tr><th>Цена на рынке</th>${ls.map(l=>{ const v=priceVerdict(l); return cell(v ? (v.kind==='low'?`Ниже рынка на ${-v.d}%`:v.kind==='high'?`Выше рынка на ${v.d}%`:'Цена по рынку') : '—', v?.kind==='low'); }).join('')}</tr>
        ${rows.map(([k,n])=>`<tr><th>${n}</th>${ls.map(l=>cell(esc(val(l,k)), (k==='year'&&Number(l.specs?.year)===bYear) || (k==='km'&&Number(l.specs?.km)===bKm) || (YES_NO[k]&&l.specs?.[k]==='yes'))).join('')}</tr>`).join('')}
        <tr><th>${t('city')}</th>${ls.map(l=>cell(esc(placeText(l)))).join('')}</tr>
        <tr><th>${t('seller')}</th>${ls.map(l=>cell(esc(userById(l.uid)?.name||'—') + (isVerified(l.uid)?'<br><span class="badge b-ok">✓ Проверенный</span>':''))).join('')}</tr>
        <tr><th></th>${ls.map(l=>`<td><button class="btn sm ghost" data-a="cmptoggle" data-v="${l.id}">${ic('x')}Убрать</button></td>`).join('')}</tr>
      </table></div>
      <span class="tiny dim">Зелёным отмечено лучшее: цена, год, пробег, кредит и обмен.</span>`};
  }
};

/* ================== Действия ================== */
const FEATURE_ACTIONS = {
  estimate(){ go('estimate'); },
  estgo(){ const e = state.est; e.brand = $('#e_brand').value; e.model = $('#e_model').value.trim(); e.year = Number($('#e_year').value) || null; render(); },

  alerts(){ go('alerts'); },
  alertsave(sec){
    const u = me(); if (!u){ go('auth','login'); return; }
    const a = {id:uid(), uid:u.id, sec, q:state.q||'', f:JSON.parse(JSON.stringify(state.filters[sec]||{})), created:now()};
    if (S.alerts.some(x => x.uid===u.id && alertText(x)===alertText(a))){ toast('Такой поиск уже сохранён'); return; }
    S.alerts.push(a); persist(); toast('Сохранено. Пришлём уведомление о новых объявлениях');
  },
  alertdel(id){ S.alerts = S.alerts.filter(a => a.id!==id); persist(); render(); },
  alertopen(id){ const a = S.alerts.find(x => x.id===id); if (!a) return; state.q = a.q||''; state.filters[a.sec] = JSON.parse(JSON.stringify(a.f||{})); go('section', a.sec); },

  cmptoggle(id){
    const i = CMP.indexOf(id);
    if (i >= 0) CMP.splice(i, 1);
    else { if (CMP.length >= 3){ toast('Можно сравнить до 3 машин'); return; } CMP.push(id); toast('Добавлено к сравнению'); }
    saveCmp(); render();
  },
  cmpopen(){ go('compare'); },

  verify(uid){ const x = userById(uid); x.verified = x.verified ? 0 : 1; persist(); toast(x.verified ? 'Продавец отмечен как проверенный' : 'Отметка снята'); render(); },
  phototips(){ photoTipsSheet(); }
};

/* =====================================================
   Поддержка, «О приложении», информационная панель,
   статистика продавца и «Поделиться»
   ===================================================== */
const APP_VERSION = '1.3';
const SITE_URL = 'https://alphadrive.pages.dev/';

/* ================== Поддержка ================== */
const SUP_TOPICS = ['Вопрос', 'Проблема в приложении', 'Оплата', 'Мошенник или обман', 'Предложение'];
const FAQ = [
  ['Как подать объявление?', 'Нажмите жёлтую кнопку «+» внизу, выберите раздел, заполните поля и добавьте до 10 фото. Нажмите «Опубликовать».'],
  ['Сколько стоит размещение?', 'Сейчас период запуска: все объявления бесплатные на 30 дней, продление тоже бесплатное.'],
  ['Почему объявление «На проверке»?', 'Бот нашёл в нём что-то подозрительное: ссылку, телефон в тексте или слишком низкую цену. Модератор проверит его в течение дня.'],
  ['Как продлить объявление?', 'Профиль → Мои объявления → кнопка «Продлить» у объявления, срок которого закончился.'],
  ['Я забыл пароль', 'Напишите нам ниже или позвоните. Администратор проверит номер и выдаст новый пароль.'],
  ['Как не попасть на мошенника?', 'Не переводите предоплату незнакомым. Смотрите машину вживую, проверяйте документы и VIN. На подозрительное объявление нажмите «Пожаловаться».'],
  ['Как узнать о новых машинах первым?', 'Откройте раздел, настройте фильтры и нажмите «Сообщить о новых по этому поиску». Уведомление придёт, даже если приложение закрыто.'],
  ['Как написать продавцу?', 'Откройте объявление и нажмите «Написать». Вся переписка — в Профиль → «Сообщения». Не переводите предоплату до осмотра машины.'],
  ['Как изменить цену или отметить «Продано»?', 'Профиль → Мои объявления: кнопка «Цена» меняет цену, кнопка «Продано» убирает объявление в архив. Если снизите цену, те, кто добавил объявление в избранное, получат уведомление.'],
  ['Как оставить отзыв о продавце?', 'Нажмите на имя продавца в объявлении. Отзыв можно оставить после переписки с ним или комментария к его объявлению.'],
  ['Как удалить аккаунт?', 'Профиль → внизу кнопка «Удалить аккаунт». Все ваши объявления тоже удалятся.']
];
const supPhone = () => S.settings.supPhone || S.settings.tmNumber || '';
const supStatus = s => s.status==='answered' ? '<span class="badge b-ok">Есть ответ</span>' : s.status==='closed' ? '<span class="badge b-dim">Закрыто</span>' : '<span class="badge b-warn">Ждёт ответа</span>';

function supportAdmin(){
  const list = [...S.support].sort((a,b) => (a.status==='open'?0:1)-(b.status==='open'?0:1) || b.time-a.time);
  if (!list.length) return emptyBox('Обращений нет', 'Здесь появятся вопросы и жалобы пользователей');
  return list.map(s => { const su = userById(s.uid) || {};
    return `<div class="adm-item"><div class="between"><span class="badge b-dim">${esc(s.topic)}</span>${supStatus(s)}</div>
      <div class="small"><b>${esc(su.name||'—')}</b> · <span class="num">${esc(fmtPhone(su.phone))}</span> · <span class="dim">${ago(s.time)}</span></div>
      <div class="small" style="white-space:pre-wrap">${esc(s.text)}</div>
      ${s.reply?`<div class="card pad small" style="border-color:var(--ok)"><b style="color:var(--ok)">Ответ:</b> ${esc(s.reply)}</div>`:''}
      ${s.status!=='closed'?`<textarea class="inp" id="rep_${s.id}" style="min-height:60px" maxlength="1000" placeholder="Ответ пользователю"></textarea>
      <div class="acts"><button class="btn sm" data-a="supreply" data-v="${s.id}">${ic('chat')}Ответить</button><button class="btn sm ghost" data-a="supclose" data-v="${s.id}">Закрыть</button></div>`:''}</div>`; }).join('');
}

/* ================== Информационная панель (админ) ================== */
function adminDashboard(){
  const T0 = now(), WEEK = 7*DAY;
  const vis = S.listings.filter(visible);
  const bar = (rows) => { const max = Math.max(1, ...rows.map(r=>r[1]));
    return rows.map(([n,v]) => `<div class="dbar"><span class="small">${n}</span><div class="track"><i style="width:${Math.round(v/max*100)}%"></i></div><b class="num small">${v}</b></div>`).join(''); };
  const count = (arr, key) => { const m = {}; arr.forEach(x => { const k = key(x); if (k) m[k] = (m[k]||0)+1; }); return Object.entries(m).sort((a,b)=>b[1]-a[1]); };
  const tiles = [
    ['Пользователей', S.users.length, `+${S.users.filter(u=>u.created>T0-WEEK).length} за 7 дней`],
    ['Активных объявлений', vis.length, `+${S.listings.filter(l=>l.created>T0-WEEK).length} за 7 дней`],
    ['Просмотров', S.listings.reduce((s,l)=>s+(l.views||0),0), 'всего'],
    ['Комментариев', S.comments.length, `+${S.comments.filter(c=>c.time>T0-WEEK).length} за 7 дней`]
  ];
  const todo = [
    ['Оплаты ждут проверки', S.payments.filter(p=>p.status==='pending').length, 'pay'],
    ['Объявления на проверке', S.listings.filter(l=>l.status==='review').length, 'mod'],
    ['Жалобы', new Set(S.complaints.map(c=>c.target)).size, 'cmp'],
    ['Обращения в поддержку', S.support.filter(s=>s.status==='open').length, 'sup']
  ];
  const topViews = [...vis].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,5);
  return `<div class="dtiles">${tiles.map(([n,v,d])=>`<div class="card pad"><b class="num" style="font-size:1.4rem">${v}</b><div class="small">${n}</div><div class="tiny dim">${d}</div></div>`).join('')}</div>
    <div class="card pad col" style="gap:8px"><h3>Нужно сделать</h3>${todo.map(([n,v,k])=>`<button class="between" style="padding:6px 0" data-a="atab" data-v="${k}"><span class="small">${n}</span><span class="badge ${v?'b-warn':'b-ok'} num">${v}</span></button>`).join('')}</div>
    <div class="card pad col" style="gap:8px"><h3>Объявления по разделам</h3>${bar(SECTIONS.map(s=>[t('s_'+s.k), vis.filter(l=>l.sec===s.k).length]))}</div>
    <div class="card pad col" style="gap:8px"><h3>Популярные марки</h3>${bar(count(vis.filter(l=>CAR_SECS.includes(l.sec)), l=>l.specs?.brand).slice(0,6)) || '<span class="small dim">Пока нет данных</span>'}</div>
    <div class="card pad col" style="gap:8px"><h3>Регионы</h3>${bar(count(vis, l=>l.reg).slice(0,7)) || '<span class="small dim">Пока нет данных</span>'}</div>
    <div class="card pad col" style="gap:8px"><h3>Самые просматриваемые</h3>${topViews.length ? topViews.map(l=>`<button class="between" style="padding:6px 0;text-align:left" data-a="open" data-v="${l.id}"><span class="small" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(l.title)}</span><span class="tiny dim num" style="flex:none">👁 ${l.views||0}</span></button>`).join('') : '<span class="small dim">Пока нет данных</span>'}</div>`;
}

/* ================== Статистика продавца и «Поделиться» ================== */
const sellerStats = l => `<span class="tiny dim num">👁 ${l.views||0} · 👍 ${l.likes?.length||0} · 💬 ${S.comments.filter(c=>c.lid===l.id).length}</span>`;
function shareRow(l){
  const text = `${l.title} — ${priceText(l)}. Alpha Drive: ${SITE_URL}`;
  return `<div class="card pad col" style="gap:8px"><h3>Поделиться</h3><div class="grid2">
    <a class="btn ghost" href="https://wa.me/?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">${ic('chat')}WhatsApp</a>
    <a class="btn ghost" href="https://t.me/share/url?url=${encodeURIComponent(SITE_URL)}&text=${encodeURIComponent(l.title+' — '+priceText(l))}" target="_blank" rel="noopener">${ic('up')}Telegram</a></div>
    <button class="btn sm ghost" data-a="copy" data-v="${esc(text)}">${ic('copy')}Скопировать текст</button></div>`;
}

Object.assign(FEATURE_SCREENS, {
  support(){
    const u = me(), p = supPhone(), tg = (S.settings.supTg||'').replace(/^@/,''), em = S.settings.supEmail||'';
    const mine = u ? S.support.filter(s=>s.uid===u.id).sort((a,b)=>b.time-a.time) : [];
    return {title:'Служба поддержки', html:`
      <div class="hero" style="min-height:0"><h1 style="font-size:1.2rem">Служба поддержки</h1><p>Ответим на вопросы, поможем с объявлением и разберёмся с жалобой</p></div>
      <div class="card pad col" style="gap:8px"><h3>Связаться с нами</h3>
        ${p?`<div class="copy-row"><span class="phone-num num">${esc(fmtPhone(p))}</span><button class="btn sm ghost" data-a="copy" data-v="${esc(p)}">${ic('copy')}</button></div>
        <div class="grid2"><a class="btn" href="tel:${esc(p)}">${ic('phone')}${t('call')}</a><a class="btn ghost" href="https://wa.me/${esc(p.replace(/\D/g,''))}" target="_blank" rel="noopener">${ic('chat')}WhatsApp</a></div>
        <span class="small dim">IMO: тот же номер</span>`:''}
        ${tg?`<a class="btn ghost" href="https://t.me/${esc(tg)}" target="_blank" rel="noopener">${ic('up')}Telegram @${esc(tg)}</a>`:''}
        ${em?`<a class="btn ghost" href="mailto:${esc(em)}">${ic('chat')}${esc(em)}</a>`:''}
        <span class="tiny dim">Работаем каждый день с 09:00 до 21:00</span></div>
      <div class="col" style="gap:8px"><h3>Частые вопросы</h3>${FAQ.map(([q,a])=>`<details class="faq"><summary>${q}</summary><p class="small dim">${a}</p></details>`).join('')}</div>
      <div class="card pad col" style="gap:10px"><h3>Написать нам</h3>
        ${u ? `<div class="field"><label for="sup_topic">Тема</label><select class="inp" id="sup_topic">${SUP_TOPICS.map(x=>`<option>${x}</option>`).join('')}</select></div>
          <textarea class="inp" id="sup_text" style="min-height:90px" maxlength="1000" placeholder="Опишите вопрос или проблему. Если про объявление — напишите его название."></textarea>
          <div class="err" id="sup_err"></div><button class="btn" data-a="supsend">${ic('chat')}Отправить</button>`
        : `<button class="btn ghost" data-a="auth" data-v="login">${ic('lock')}Войдите, чтобы написать в поддержку</button>`}</div>
      ${mine.length?`<div class="col" style="gap:8px"><h3>Мои обращения</h3>${mine.map(s=>`<div class="card pad col" style="gap:6px"><div class="between"><span class="badge b-dim">${esc(s.topic)}</span>${supStatus(s)}</div>
        <span class="small" style="white-space:pre-wrap">${esc(s.text)}</span><span class="tiny dim">${ago(s.time)}</span>
        ${s.reply?`<div class="small" style="border-left:3px solid var(--ok);padding-left:10px"><b style="color:var(--ok)">Поддержка:</b> ${esc(s.reply)}</div>`:''}</div>`).join('')}</div>`:''}`};
  },

  about(){
    return {title:'О приложении', html:`
      <div class="col" style="align-items:center;text-align:center;gap:8px;padding-top:6px"><img src="logo.png" alt="" style="width:84px;height:84px;border-radius:24px">
        <h1 style="font-size:1.4rem">Alpha <span style="color:var(--accent)">Drive</span></h1><span class="small dim">Версия ${APP_VERSION}</span></div>
      <div class="card pad col" style="gap:6px"><p style="margin:0">Alpha Drive — автомаркет Туркменистана. Только машины и всё, что с ними связано: продажа авто и мотоциклов, пригон из-за рубежа, запчасти, спецтехника, аренда, СТО и работа для водителей.</p></div>
      <div class="card pad col" style="gap:8px"><h3>Что умеет приложение</h3>
        ${['Объявления о машинах с фото, VIN и ✓ кредитом / обменом','Мотоциклы, скутеры и квадроциклы — отдельный раздел','Новые и с пробегом — переключатель в один клик','Чат с продавцом прямо в приложении','Оценка цены: дешевле или дороже рынка','История цены и отметка «Цена снижена»','Отзывы и рейтинг продавцов','Уведомления о новых машинах по вашему поиску','Сравнение 2–3 машин рядом','Проверенные продавцы и автосалоны','Три языка: Türkmençe, Русский, English'].map(x=>`<div class="row small" style="gap:8px">${ic('check','style="width:18px;height:18px;color:var(--ok);flex:none"')}<span>${x}</span></div>`).join('')}</div>
      <details class="faq"><summary>Правила размещения</summary><div class="small dim col" style="gap:6px">
        <span>1. Только настоящие машины, запчасти и услуги. Без одежды, техники для дома и прочего.</span>
        <span>2. Фото — только вашей машины. Чужие фото из интернета запрещены.</span>
        <span>3. Цена должна быть настоящей. Цена «для привлечения» — повод для удаления.</span>
        <span>4. Без ссылок, оскорблений и телефонов в тексте — номер берётся из профиля.</span>
        <span>5. Одна машина — одно объявление. Повторы удаляются.</span>
        <span>6. За обман и мошенничество аккаунт блокируется.</span></div></details>
      <details class="faq"><summary>Политика конфиденциальности</summary><div class="small dim col" style="gap:6px">
        <span>Мы храним: имя, номер телефона, почту (если указали), ваши объявления, фото, комментарии и обращения в поддержку.</span>
        <span>Номер телефона видят только вошедшие пользователи — чтобы покупатель мог позвонить продавцу.</span>
        <span>Пароль хранится в зашифрованном виде, его не видит даже администратор.</span>
        <span>Мы не продаём и не передаём ваши данные третьим лицам.</span>
        <span>Удалить аккаунт и все данные можно в Профиле в любой момент.</span></div></details>
      <div class="card menu">
        <button data-a="support">${ic('chat')}<span class="grow">Служба поддержки</span></button>
        <a href="${SITE_URL}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px">${ic('globe')}<span class="grow">Сайт приложения</span></a></div>
      <span class="tiny dim" style="text-align:center">© ${new Date().getFullYear()} Alpha Drive · Performance | Style | Service</span>`};
  }
});

Object.assign(FEATURE_ACTIONS, {
  support(){ go('support'); },
  about(){ go('about'); },
  supsend(){
    const u = me(), text = $('#sup_text').value.trim(), err = $('#sup_err'); err.textContent = '';
    if (text.length < 5) return err.textContent = 'Напишите хотя бы пару слов';
    S.support.push({id:uid(), uid:u.id, topic:$('#sup_topic').value, text, time:now(), status:'open', reply:''});
    persist(); toast('Отправлено. Мы ответим в уведомлениях'); render();
  },
  supreply(id){
    const s = S.support.find(x=>x.id===id), text = $('#rep_'+id).value.trim();
    if (!text){ toast('Напишите ответ'); return; }
    s.reply = text; s.status = 'answered';
    notify(s.uid, 'Ответ поддержки: '+text);
    persist(); toast('Ответ отправлен'); render();
  },
  supclose(id){ const s = S.support.find(x=>x.id===id); s.status = 'closed'; persist(); render(); }
});

/* ================== Безопасная сделка ================== */
// Памятка покупателю в каждом чужом объявлении
function safetyCard(l){
  const fresh = (userById(l.uid)?.created || 0) > now() - 3*DAY;
  return `<div class="card pad col" style="gap:6px;border-color:color-mix(in srgb,var(--warn) 45%,transparent)">
    <div class="row" style="gap:8px">${ic('shield','style="width:20px;height:20px;color:var(--warn);flex:none"')}<b>Безопасная сделка</b></div>
    ${fresh && !isVerified(l.uid)?'<span class="small" style="color:var(--warn)">⚠️ Продавец зарегистрировался недавно. Будьте особенно внимательны.</span>':''}
    <span class="small dim">• Не переводите предоплату и «залог» до осмотра машины</span>
    <span class="small dim">• Смотрите машину вживую, сверяйте VIN с документами</span>
    <span class="small dim">• Слишком низкая цена — частый признак обмана</span>
    <button class="link small" style="text-align:left" data-a="complain" data-v="listing:${l.id}">Подозрительно? Пожалуйтесь — модератор проверит</button></div>`;
}

/* ================== Почта: подтверждение и «Забыли пароль?» ================== */
// Письма отправляет функция mail в Supabase (через Gmail)
async function callMail(body){
  const {data, error} = await sb.functions.invoke('mail', {body:{...body, lang:LANG}});
  if (!error) return data || {ok:true};
  try { return await error.context.json(); } catch { return {error:'net'}; }
}
const MAIL_ERR = {
  email:'Проверьте адрес почты', taken:'Эта почта уже используется', 'too-many':'Слишком много писем. Попробуйте через час.',
  auth:'Войдите в аккаунт ещё раз', 'mail-not-configured':'Отправка писем ещё не настроена. Напишите в поддержку.', net:'Нет связи с сервером. Проверьте интернет.'
};
const mailErr = e => MAIL_ERR[e] || 'Не удалось отправить письмо. Попробуйте позже.';

async function sendVerify(email){
  const r = await callMail({action:'verify-send', email});
  if (!r.ok){ toast(mailErr(r.error)); return false; }
  const u = me(); if (u){ u.email = email; u.emailVerified = false; }
  toast('Письмо отправлено. Откройте почту и нажмите «Подтвердить почту»');
  return true;
}

function emailCard(u){
  return `<div class="card pad col" style="gap:8px">
    <div class="between"><b class="small">Электронная почта</b>${u.email ? (u.emailVerified ? '<span class="badge b-ok">✓ Подтверждена</span>' : '<span class="badge b-warn">Не подтверждена</span>') : ''}</div>
    ${u.email && !u.emailVerified ? `<span class="small dim">Мы отправили письмо на ${esc(u.email)}. Откройте его и нажмите «Подтвердить почту». Письма нет? Проверьте папку «Спам».</span>` : ''}
    ${u.email && u.emailVerified ? `<span class="small dim">${esc(u.email)} — можно входить по почте и восстанавливать пароль через письмо.</span>` : ''}
    ${!u.email ? '<span class="small dim">Добавьте почту — по ней можно входить и восстановить пароль, если забудете.</span>' : ''}
    <div class="row" style="gap:8px"><input class="inp" id="em_new" type="email" autocomplete="email" placeholder="${u.email ? 'Другая почта' : 'example@gmail.com'}" style="flex:1;min-width:0">
      <button class="btn sm" data-a="mailverify">${u.email && !u.emailVerified ? 'Отправить ещё раз' : 'Подтвердить'}</button></div></div>`;
}

function forgotSheet(){
  openSheet(`<div class="between"><h2>Восстановление пароля</h2><button class="icon-btn" data-a="closesheet" aria-label="Закрыть">${ic('x')}</button></div>
    <div class="col" style="gap:8px"><b class="small">По подтверждённой почте</b>
      <span class="small dim">Пришлём письмо со ссылкой. Нажмите на неё и придумайте новый пароль.</span>
      <input class="inp" id="fg_email" type="email" autocomplete="email" placeholder="example@gmail.com">
      <button class="btn" data-a="mailreset">${ic('chat')}Отправить письмо</button></div>
    <div class="card pad small col"><b>Если почты нет</b><span class="dim">Напишите в поддержку с того номера, на который зарегистрирован аккаунт. Администратор проверит и сбросит пароль.</span><button class="link small" style="text-align:left" data-a="support">Служба поддержки</button></div>`);
}

Object.assign(FEATURE_ACTIONS, {
  async mailverify(){
    const u = me(); if (!u){ go('auth','login'); return; }
    const email = ($('#em_new').value.trim() || u.email || '').toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)){ toast('Проверьте адрес почты'); return; }
    if (await sendVerify(email)) render();
  },
  async mailreset(){
    const email = $('#fg_email').value.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)){ toast('Проверьте адрес почты'); return; }
    const r = await callMail({action:'reset-send', email});
    if (r.error && r.error!=='net'){ toast(mailErr(r.error)); return; }
    if (r.error){ toast(mailErr('net')); return; }
    closeSheet(); toast('Если эта почта подтверждена, письмо уже отправлено. Проверьте почту и папку «Спам».');
  }
});

/* ================== Видео в объявлении ================== */
// Бесплатное хранилище — 1 ГБ на всё, поэтому видео короткое и лёгкое
const VIDEO_MB = 25, VIDEO_SEC = 60;
const VIDEO_PREFIX = 'https://qjllrvbkwglgcnxteenx.supabase.co/storage/v1/object/public/video/';
const isVideoUrl = u => typeof u === 'string' && u.startsWith(VIDEO_PREFIX);

function checkVideo(file){
  if (file.size > VIDEO_MB*1048576){ toast(`Видео больше ${VIDEO_MB} МБ. Снимите короче или в меньшем качестве.`); return Promise.resolve(false); }
  return new Promise(res => {
    const v = document.createElement('video'), url = URL.createObjectURL(file);
    v.preload = 'metadata';
    v.onloadedmetadata = () => { URL.revokeObjectURL(url);
      if (v.duration > VIDEO_SEC + 1){ toast(`Видео длиннее ${VIDEO_SEC} секунд. Обрежьте его.`); res(false); } else res(true); };
    v.onerror = () => { URL.revokeObjectURL(url); res(true); };   // формат не читается в браузере — проверит сервер по размеру
    v.src = url;
  });
}

async function uploadVideo(file){
  const ext = ((file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '')) || 'mp4';
  const type = file.type || ({mov:'video/quicktime', webm:'video/webm', '3gp':'video/3gpp'})[ext] || 'video/mp4';
  const path = `${S.session}/${Date.now()}-${uid()}.${ext}`;
  const {error} = await sb.storage.from('video').upload(path, file, {contentType:type});
  if (error) throw error;
  return sb.storage.from('video').getPublicUrl(path).data.publicUrl;
}

/* ================== Настройки ================== */
const FONT_SIZES = [[0.9,'Маленький'],[1,'Обычный'],[1.12,'Крупный'],[1.25,'Очень крупный']];
function applyFont(){ document.documentElement.style.fontSize = (16 * (S.settings.fontSize || 1)) + 'px'; }

Object.assign(FEATURE_SCREENS, {
  settings(){
    const st = S.settings, onOff = (k, on) => `<div class="seg"><button class="${on?'on':''}" data-a="setopt" data-v="${k}:1">Вкл.</button><button class="${on?'':'on'}" data-a="setopt" data-v="${k}:0">Выкл.</button></div>`;
    return {title:'Настройки', html:`
      <div class="col"><h3>${t('language')}</h3><div class="seg"><button class="${LANG==='tm'?'on':''}" data-a="setlang" data-v="tm">Türkmençe</button><button class="${LANG==='ru'?'on':''}" data-a="setlang" data-v="ru">Русский</button><button class="${LANG==='en'?'on':''}" data-a="setlang" data-v="en">English</button></div></div>
      <div class="col"><h3>${t('theme')}</h3><div class="themes">${THEMES.map(th=>`<button class="th-sw ${st.theme===th.k?'on':''}" style="background:linear-gradient(150deg,${th.a},${th.b})" data-a="theme" data-v="${th.k}" aria-label="${th.n}" title="${th.n}"><span style="background:${th.c}"></span></button>`).join('')}</div>
        <div class="themes tiny dim" style="text-align:center">${THEMES.map(th=>`<span>${th.n}</span>`).join('')}</div></div>
      <div class="col"><h3>Размер шрифта</h3><div class="seg">${FONT_SIZES.map(([k,n])=>`<button class="${(st.fontSize||1)===k?'on':''}" data-a="setfont" data-v="${k}" style="font-size:${k*.85}rem">Aa</button>`).join('')}</div>
        <span class="small dim">${FONT_SIZES.find(([k])=>k===(st.fontSize||1))?.[1]||''}: так будет выглядеть текст во всём приложении.</span></div>
      <div class="card pad col" style="gap:10px">
        <div class="between" style="gap:10px"><div><b class="small">${NB?'Уведомления на телефон':'Уведомления на это устройство'}</b><br><span class="tiny dim">Когда приложение закрыто: комментарии, ответы поддержки, новые машины по поиску</span></div></div>${NB?onOff('notifs', st.notifs!==false):webNotifCtl(onOff)}
        <div class="between" style="gap:10px;margin-top:6px"><div><b class="small">Цена в рублях</b><br><span class="tiny dim">Показывать «≈ … ₽» под ценой объявления</span></div></div>${onOff('showRub', st.showRub!==false)}</div>
      <div class="card menu">
        <button data-a="support">${ic('chat')}<span class="grow">Служба поддержки</span></button>
        <button data-a="about">${ic('shield')}<span class="grow">О приложении<br><span class="tiny dim">Правила размещения, конфиденциальность, версия ${APP_VERSION}</span></span></button>
        <button data-a="reload">${ic('up')}<span class="grow">Обновить данные</span></button>
        ${NB ? '' : `<a href="${SITE_URL}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px">${ic('plus')}<span class="grow">Скачать приложение для Android</span></a>`}
        ${CMP.length?`<button data-a="cmpclear">${ic('trash')}<span class="grow">Очистить сравнение (${CMP.length})</span></button>`:''}
      </div>
      <span class="tiny dim" style="text-align:center">Alpha Drive · ${APP_VERSION}</span>`};
  }
});

Object.assign(FEATURE_ACTIONS, {
  settings(){ go('settings'); },
  setfont(v){ S.settings.fontSize = Number(v); applyFont(); persist(); render(); },
  setopt(v){
    const [k, on] = v.split(':'); S.settings[k] = on==='1'; persist();
    if (k==='notifs'){ if (!NB){ if (on==='1') pushOn(); else pushOff(); } else if (on==='1') deviceOn(); else NB.disable(); }
    render();
  },
  cmpclear(){ CMP = []; saveCmp(); toast('Список сравнения очищен'); render(); }
});

/* ================== «Поделиться» объявлением ================== */
// Отправляется прямая ссылка на объявление: страница на сайте, а с неё — «Открыть в приложении»
const listingLink = l => `${SITE_URL}l.html?id=${encodeURIComponent(l.id)}&lang=${LANG}`;
function shareSheet(l){
  const link = listingLink(l), text = `${l.title} — ${priceText(l)}
${link}`;
  const enc = encodeURIComponent;
  openSheet(`<div class="between"><h2>Поделиться</h2><button class="icon-btn" data-a="closesheet" aria-label="Закрыть">${ic('x')}</button></div>
    <div class="card pad small"><b>${esc(l.title)}</b><br><span class="dim num">${esc(priceText(l))}</span></div>
    <div class="copy-row"><span class="small" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(link)}</span><button class="btn sm ghost" data-a="copy" data-v="${esc(link)}" aria-label="Скопировать ссылку">${ic('copy')}</button></div>
    ${NB && NB.share ? `<button class="btn" data-a="sharenative" data-v="${esc(l.id)}">${ic('up')}Отправить ссылку (IMO, Telegram, WhatsApp…)</button>` : ''}
    <div class="grid2">
      <a class="btn ${NB && NB.share ? 'ghost' : ''}" href="https://wa.me/?text=${enc(text)}" target="_blank" rel="noopener">${ic('chat')}WhatsApp</a>
      <a class="btn ghost" href="https://t.me/share/url?url=${enc(link)}&text=${enc(l.title+' — '+priceText(l))}" target="_blank" rel="noopener">${ic('up')}Telegram</a></div>
    <button class="btn ghost" data-a="copy" data-v="${esc(link)}">${ic('copy')}Скопировать ссылку</button>`);
}
Object.assign(FEATURE_ACTIONS, {
  share(id){ const l = S.listings.find(x => x.id===id); if (l) shareSheet(l); },
  // Обычное меню «Поделиться» телефона — все приложения сразу
  sharenative(id){ const l = S.listings.find(x => x.id===id); if (l && NB && NB.share) NB.share(`${l.title} — ${priceText(l)}
${listingLink(l)}`); }
});
// Открыли ссылку на объявление — сразу показываем его в приложении
window.mbOpenListing = id => { id = String(id||'').replace(/[^a-z0-9-]/gi, ''); if (id) go('detail', id); };
