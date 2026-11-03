/* =====================================================
   Автосалоны: список, страница салона, создание и правка своего салона.
   Салон — запись dealers {id, uid, name, reg, place, desc, services[], phone, logo, banner, hidden, created}.
   Объявление салона — обычное объявление с полем dealer (только свой салон — проверяет база).
   Подключается после features-plus.js, дополняет FEATURE_SCREENS, FEATURE_ACTIONS и TR.
   Права в базе: mashyn/supabase-update-dealers.sql
   ===================================================== */
// Значок «store» — в общем списке значков I (index.html): этот файл грузится раньше него

const DEALER_SERVICES = [['credit','Кредит'],['swap','Обмен'],['tradein','Трейд-ин'],['import','Пригон из-за рубежа'],['warranty','Гарантия'],['testdrive','Тест-драйв'],['delivery','Доставка']];
// В каких разделах объявление можно выставить от имени салона
// Разделы салона: авто, из-за рубежа, мотоциклы, техника и услуги (решения 2026-11-03)
const DEALER_SECS = ['cars','import','moto','tech'];

const dealerById = id => S.dealers.find(d=>d.id===id);
// Свои салоны (до DEALER_MAX — так же проверяет база, supabase-update-dealers-multi.sql)
const DEALER_MAX = 5;
const myDealers = () => { const u = me(); return u ? S.dealers.filter(d=>d.uid===u.id) : []; };
const myDealer = () => myDealers()[0] || null;
// Салон объявления при подаче: выбранный в форме, иначе первый свой; «без салона» — пусто
const pickDealer = d => { const ds = myDealers(); if (d.noDealer || !ds.length) return ''; return ds.some(x=>x.id===d.dealerId) ? d.dealerId : ds[0].id; };
// Скрытый салон видят только владелец и администрация
const dealerShown = d => !!d && (!d.hidden || me()?.id===d.uid || staffOn(me()));
const dealerCars = d => S.listings.filter(l=>l.dealer===d.id && DEALER_SECS.includes(l.sec) && visible(l));
const dealerPlace = d => { const r = REGIONS.find(x=>x.k===d.reg); const p = placeOf(d.place); return [p, r && regShort(r.k)].filter((x,i,a)=>x && a.indexOf(x)===i).join(', '); };
const dealerLogo = (d, size=56) => `<span class="dlogo" style="width:${size}px;height:${size}px">${d.logo?`<img src="${esc(d.logo)}" alt="">`:esc(initials(d.name||'?'))}</span>`;
const dealerBanner = d => `<div class="dbanner">${d.banner?`<img src="${esc(d.banner)}" alt="" loading="lazy">`:''}</div>`;

// Ссылка на салон в объявлении
const dealerLink = l => { const d = l.dealer && dealerById(l.dealer); if (!dealerShown(d)) return '';
  return `<button class="card pad row" style="text-align:left;gap:12px" data-a="dealer" data-v="${esc(d.id)}">${dealerLogo(d,44)}
    <span style="flex:1;min-width:0"><span class="tiny dim">Автосалон</span><br><b>${esc(d.name)}</b> <span class="small dim">· <span class="num">${dealerCars(d).length}</span> <span>авто</span></span></span>
    ${ic('back','style="width:18px;transform:rotate(180deg);color:var(--dim);flex:none"')}</button>`; };

// Карточка на главной: вход в раздел
const dealersHomeCard = () => { const n = S.dealers.filter(d=>!d.hidden).length;
  return `<button class="card pad row" data-a="dealers" style="text-align:left;gap:12px">${i3d('dealers')}
    <span style="flex:1"><b>Автосалоны</b><br><span class="small dim">${n ? `<span class="num">${n}</span> <span>салонов</span> · ` : ''}<span>машины от салонов и их услуги</span></span></span>${ic('back','style="width:18px;transform:rotate(180deg);color:var(--dim)"')}</button>`; };

Object.assign(FEATURE_SCREENS, {
  dealers(){
    const u = me(), mine = myDealers();
    const list = S.dealers.filter(dealerShown).map(d=>({d, n:dealerCars(d).length})).sort((a,b)=>b.n-a.n || (b.d.created||0)-(a.d.created||0));
    return {title:'Автосалоны', html:`
      <div class="hero dhero"><h1 style="font-size:1.2rem">Автосалоны</h1><p>Машины от салонов, кредит, обмен и другие услуги</p>
        <div class="row" style="flex-wrap:wrap;gap:8px">${mine.map(m=>`<button class="btn sm" data-a="dealer" data-v="${esc(m.id)}">${ic('store')}${mine.length>1?esc(m.name):'Мой салон'}</button>`).join('')}
          ${mine.length < DEALER_MAX ? `<button class="btn sm ${mine.length?'ghost':''}" data-a="dealernew">${ic('plus')}${mine.length?'Ещё салон':'Создать страницу салона'}</button>` : ''}</div></div>
      <div class="list">${list.length ? list.map(({d,n})=>`<button class="dcard" data-a="dealer" data-v="${esc(d.id)}">${dealerBanner(d)}
        <span class="dc-body">${dealerLogo(d,52)}<span style="flex:1;min-width:0"><b class="dc-name">${esc(d.name)}</b>${d.hidden?' <span class="badge b-bad">Скрыт</span>':''}
          <span class="small dim">${esc(dealerPlace(d))}</span></span><span class="dc-n"><b class="num">${n}</b><span class="tiny dim">авто</span></span></span></button>`).join('')
        : emptyBox('Пока нет салонов','Создайте страницу своего салона — это бесплатно')}</div>`};
  },

  dealer(id){
    const d = dealerById(id), u = me();
    if (!dealerShown(d)) return {title:'Автосалоны', html:emptyBox('Салон не найден','Возможно, его скрыли или удалили')};
    const own = u && u.id===d.uid, staff = staffOn(u), owner = userById(d.uid) || {};
    const all = rank(dealerCars(d));
    // Разделы салона: Все · Авто · Из-за рубежа · Мото (только те, где есть машины); марки — внутри выбранного раздела
    const secN = DEALER_SECS.map(k=>[k, all.filter(l=>l.sec===k).length]).filter(([,n])=>n);
    // «Все» — только машины; техника (самосвалы, фуры) — только в своей вкладке, не рядом с новыми машинами
    const autos = all.filter(l=>l.sec!=='tech'), ds = (state.dSec||{})[d.id] || (autos.length ? '' : 'tech'), cars = ds ? all.filter(l=>l.sec===ds) : autos;
    // Свои подборки салона (d.cols: {id, name, ids}) → «Новые / С пробегом» → марки
    const cols = (d.cols||[]).map(c=>({...c, n: cars.filter(l=>c.ids.includes(l.id)).length})).filter(c=>c.n || own);
    const dc = (state.dCol||{})[d.id] || '', colIds = (d.cols||[]).find(c=>c.id===dc)?.ids;
    const inCol = colIds ? cars.filter(l=>colIds.includes(l.id)) : cars;
    const du = (state.dUse||{})[d.id] || '', useN = ['new','used'].map(k=>[k, inCol.filter(l=>l.specs?.usage===k).length]);
    const pool = du ? inCol.filter(l=>l.specs?.usage===du) : inCol;
    const brands = {}; pool.forEach(l=>{ const b = brandOf(l); if (b) brands[b] = (brands[b]||0)+1; });
    const sel = (state.dBrand||{})[d.id] || '';
    const shown = sel ? pool.filter(l=>brandOf(l)===sel) : pool;
    const phone = d.phone || contactPhone(owner);
    const loose = own ? S.listings.filter(l=>l.uid===u.id && !l.dealer && DEALER_SECS.includes(l.sec)).length : 0;
    return {title:'Автосалон', html:`
      <div class="dhead">${dealerBanner(d)}<div class="dh-logo">${dealerLogo(d,72)}</div></div>
      <div class="col" style="gap:6px">
        ${d.hidden?'<div class="card pad small" style="border-color:var(--danger)"><b style="color:var(--danger)">Салон скрыт администрацией</b></div>':''}
        <h1 style="font-size:1.3rem">${esc(d.name)}</h1>
        ${dealerPlace(d)?`<div class="small dim row" style="gap:8px">${ic('pin','style="width:15px;height:15px"')}${esc(dealerPlace(d))}</div>`:''}
        ${d.services?.length?`<div class="row" style="flex-wrap:wrap;gap:6px">${DEALER_SERVICES.filter(([k])=>d.services.includes(k)).map(([,n])=>`<span class="badge b-ok">✓ <span>${n}</span></span>`).join('')}</div>`:''}
      </div>
      ${d.desc?`<p style="margin:0;white-space:pre-wrap">${esc(d.desc)}</p>`:''}
      <div class="card pad col" style="gap:10px"><h3>Контакты</h3>
        ${u ? `<div class="copy-row"><span class="phone-num num">${esc(fmtPhone(phone))}</span><button class="btn sm ghost" data-a="copy" data-v="${esc(phone)}">${ic('copy')}</button></div>
          <div class="grid2"><a class="btn" style="text-decoration:none" href="tel:${esc(phone)}">${ic('phone')}${t('call')}</a><a class="btn ghost" style="text-decoration:none" href="sms:${esc(phone)}">${ic('chat')}SMS</a></div>`
        : `<button class="btn" data-a="auth" data-v="login">${ic('lock')}${t('loginToCall')}</button>`}</div>
      ${own?`<div class="grid2"><button class="btn ghost" data-a="dealeredit" data-v="${esc(d.id)}">${ic('gear')}Изменить</button><button class="btn ghost" data-a="tab" data-v="post">${ic('plus')}Добавить авто</button></div>
        ${loose?`<button class="btn ghost" data-a="dealerlink" data-v="${esc(d.id)}">${ic('list')}Привязать мои объявления к салону · <span class="num">${loose}</span></button>`:''}`:''}
      <div class="col"><div class="sec-title"><h2>Машины салона</h2><span class="tiny dim num">${all.length}</span></div>
        ${secN.length>1?`<div class="seg">${[...(autos.length?[['',autos.length]]:[]), ...secN].map(([k,n])=>`<button class="${ds===k?'on':''}" data-a="dsec" data-v="${esc(d.id)}|${k}">${k?t('s_'+k):t('all')} <span class="num">${n}</span></button>`).join('')}</div>`:''}
        ${cols.length || own ? `<div class="chips">${cols.map(c=>`<button class="chip ${dc===c.id?'on':''}" data-a="dcol" data-v="${esc(d.id)}|${esc(c.id)}">${ic('list','style="width:15px;height:15px"')}${esc(c.name)} <span class="num">(${c.n})</span></button>${own?`<button class="chip" data-a="dcoledit" data-v="${esc(d.id)}|${esc(c.id)}" aria-label="Изменить подборку">${ic('edit','style="width:15px;height:15px"')}</button>`:''}`).join('')}${own?`<button class="chip" data-a="dcoledit" data-v="${esc(d.id)}|">${ic('plus','style="width:15px;height:15px"')}Подборка</button>`:''}</div>` : ''}
        ${useN.every(([,n])=>n) ? `<div class="chips">${[['',inCol.length], ...useN].map(([k,n])=>`<button class="chip ${du===k?'on':''}" data-a="duse" data-v="${esc(d.id)}|${k}">${k==='new'?'Новые':k==='used'?'С пробегом':'Все'} <span class="num">(${n})</span></button>`).join('')}</div>` : ''}
        ${Object.keys(brands).length>1?`<div class="chips"><button class="chip ${sel?'':'on'}" data-a="dbrand" data-v="${esc(d.id)}|"><span>Все</span> <span class="num">(${pool.length})</span></button>${Object.entries(brands).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([b,n])=>`<button class="chip ${sel===b?'on':''}" data-a="dbrand" data-v="${esc(d.id)}|${esc(b)}">${brandIcon(b,'sm')}${esc(b)} <span class="num">(${n})</span></button>`).join('')}</div>`:''}
        <div class="list">${shown.length ? shown.map(listCard).join('') : emptyBox('Машин пока нет', own ? 'Подайте объявление — оно появится здесь' : 'Салон ещё не выставил машины')}</div></div>
      <div class="row" style="flex-wrap:wrap;gap:8px">
        ${u && !own?`<button class="btn sm danger" data-a="complain" data-v="dealer:${esc(d.id)}">${ic('flag')}${t('complain')}</button>`:''}
        ${staff?`<button class="btn sm ${d.hidden?'':'danger'}" data-a="dealerhide" data-v="${esc(d.id)}">${d.hidden?'Показать салон':'Скрыть салон'}</button>`:''}</div>`};
  },

  dealeredit(){
    const u = me(); if (!u) return {title:'Автосалон', html:guest()};
    const d = state.dEdit; if (!d) return {title:'Автосалон', html:emptyBox('Нечего изменять','Откройте раздел «Автосалоны»')};
    const pic = (k, label, hint) => `<div class="field"><label>${label}</label><label class="dpic ${k}">${d[k]?`<img src="${esc(d[k])}" alt="">`:`${ic('photo')}<span class="small">${hint}</span>`}<input type="file" accept="image/*" data-dpic="${k}" hidden></label>
      ${d[k]?`<button type="button" class="link small" data-a="dpicdel" data-v="${k}">Убрать</button>`:''}</div>`;
    return {title: d.id ? 'Мой салон' : 'Новый салон', html:`
      <div class="card pad small dim">Страница салона бесплатная и появляется сразу. За ложные сведения салон могут скрыть по жалобам.</div>
      ${pic('banner','Фон сверху (баннер)','Широкое фото салона или площадки')}
      ${pic('logo','Логотип','Квадратная картинка')}
      <div class="field"><label for="de_name">Название салона *</label><input class="inp" id="de_name" maxlength="60" value="${esc(d.name||'')}" placeholder="Например: Ashgabat Motors"></div>
      <div class="field"><label>Город</label><button type="button" class="inp pick" data-a="citypick" data-v="dealer"><span>${esc(dealerPlace(d) || 'Выберите')}</span>${ic('chev')}</button></div>
      <div class="field"><label for="de_phone">Телефон салона</label><input class="inp num" id="de_phone" type="tel" maxlength="20" value="${esc(d.phone||'')}" placeholder="${esc(fmtPhone(u.phone))}"></div>
      <div class="field"><label>Услуги</label><div class="chips wrapc">${DEALER_SERVICES.map(([k,n])=>`<button type="button" class="chip ${(d.services||[]).includes(k)?'on':''}" data-a="dserv" data-v="${k}">${n}</button>`).join('')}</div></div>
      <div class="field"><label for="de_desc">О салоне</label><textarea class="inp" id="de_desc" maxlength="2000" placeholder="Адрес, часы работы, какие машины продаёте, условия кредита">${esc(d.desc||'')}</textarea></div>
      <div class="err" id="de_err"></div>
      <button class="btn" data-a="dealersave">${ic('check')}Сохранить</button>
      ${d.id?`<button class="btn ghost danger" data-a="dealerdel">Удалить страницу салона</button>`:''}`,
      after(){
        const f = k => $('#de_'+k);
        ['name','phone','desc'].forEach(k=>f(k).addEventListener('input',()=>{ d[k]=f(k).value; }));
        document.querySelectorAll('[data-dpic]').forEach(inp=>inp.addEventListener('change', async ()=>{ const file = inp.files[0]; if (!file) return;
          try{ d[inp.dataset.dpic] = await compress(file); }catch{ toast('Не удалось прочитать фото'); } render(); }));
      }};
  }
});

Object.assign(FEATURE_ACTIONS, {
  dealers(){ go('dealers'); },
  dealer(id){ go('dealer', id); },
  dealernew(){ const u = me(); if (!u){ go('auth','login'); return; }
    if (myDealers().length >= DEALER_MAX){ toast('Не больше 5 салонов на один аккаунт'); return; }
    state.dEdit = {name: u.type==='company' && u.company || '', reg: REGIONS[0].k, place:'', desc:'', phone:'', services:[], logo:'', banner:''}; go('dealeredit'); },
  dealeredit(id){ const mine = myDealers().find(x=>x.id===id) || myDealer(); if (!mine) return; state.dEdit = JSON.parse(JSON.stringify(mine)); go('dealeredit'); },
  dserv(k, el){ const s = state.dEdit.services = state.dEdit.services || []; const i = s.indexOf(k); i<0 ? s.push(k) : s.splice(i,1); el.classList.toggle('on', i<0); },
  dpicdel(k){ state.dEdit[k] = ''; render(); },
  async dealersave(){
    const u = me(), d = state.dEdit, err = $('#de_err'); if (!u || !d || state.saving) return;
    d.name = (d.name||'').trim(); d.desc = (d.desc||'').trim(); d.phone = (d.phone||'').trim();
    if (d.name.length < 2) return err.textContent = 'Укажите название салона';
    state.saving = true; err.textContent = '';
    if ((d.logo||'').startsWith('data:') || (d.banner||'').startsWith('data:')) upBusy('Сохраняем страницу салона…', 'Загружаем картинки…', null);
    try { d.logo = d.logo ? await withTimeout(uploadPhoto(d.logo), 60000) : ''; d.banner = d.banner ? await withTimeout(uploadPhoto(d.banner), 60000) : ''; }
    catch (e) { busyErr(upErr(e), 'dealersave'); return; }
    finally { state.saving = false; }
    busyOff();
    const rec = {id: d.id || uid(), uid: u.id, name: d.name, reg: d.reg, place: d.place||'', desc: d.desc, phone: d.phone, services: d.services||[], logo: d.logo, banner: d.banner,
      hidden: d.hidden || false, created: d.created || now()};
    const i = S.dealers.findIndex(x=>x.id===rec.id); if (i<0) S.dealers.push(rec); else S.dealers[i] = rec;
    // Ждём ответа базы: если не приняла (например, не обновлена), форма остаётся с понятной причиной
    state.saving = true; err.textContent = 'Сохраняем…'; persist(); await syncing; state.saving = false;
    if (synced.dealers?.get(rec.id) !== ser('dealers', rec)){
      if (i<0) S.dealers = S.dealers.filter(x=>x.id!==rec.id);
      d.logo = rec.logo; d.banner = rec.banner;
      const e = $('#de_err'); if (e) e.textContent = u.role==='admin' ? 'База ещё не готова для салонов: запустите файл supabase-update-dealers.sql в Supabase (SQL Editor) и попробуйте снова.' : 'Не удалось сохранить страницу салона. Попробуйте позже или напишите в поддержку.';
      return;
    }
    state.dEdit = null; toast('Страница салона сохранена'); go('dealer', rec.id, true);
  },
  dealerdel(){ confirmSheet('Удалить страницу салона? Объявления останутся, но без салона.', 'Удалить', {a:'dealerdelok', v:''}); },
  dealerdelok(){ closeSheet(); const mine = myDealers().find(x=>x.id===state.dEdit?.id); if (!mine) return;
    S.listings.forEach(l=>{ if (l.dealer===mine.id && l.uid===mine.uid) delete l.dealer; });
    S.dealers = S.dealers.filter(x=>x.id!==mine.id); state.dEdit = null; persist(); toast('Страница салона удалена'); root('home'); go('dealers'); },
  dealerlink(id){ const u = me(), mine = myDealers().find(x=>x.id===id) || myDealer(); if (!mine) return; let n = 0;
    S.listings.forEach(l=>{ if (l.uid===u.id && !l.dealer && DEALER_SECS.includes(l.sec)){ l.dealer = mine.id; n++; } });
    persist(); toast(`Привязано объявлений: ${n}`); render(); },
  dcol(v){ const i = v.indexOf('|'), id = v.slice(0,i), c = v.slice(i+1); const cur = (state.dCol||{})[id];
    state.dCol = {...(state.dCol||{}), [id]: cur===c ? '' : c}; state.dBrand = {...(state.dBrand||{}), [id]: ''}; render(); },
  duse(v){ const i = v.indexOf('|'), id = v.slice(0,i); state.dUse = {...(state.dUse||{}), [id]: v.slice(i+1)}; state.dBrand = {...(state.dBrand||{}), [id]: ''}; render(); },
  // Подборка салона: название и отмеченные машины (только владелец салона)
  dcoledit(v){ const i = v.indexOf('|'), d = dealerById(v.slice(0,i)), u = me(); if (!d || !u || u.id!==d.uid) return;
    const c = (d.cols||[]).find(x=>x.id===v.slice(i+1)) || {id:'', name:'', ids:[]}, cars = rank(dealerCars(d));
    openSheet(`<div class="between"><h2>${c.id?'Подборка':'Новая подборка'}</h2><button class="icon-btn" data-a="closesheet" aria-label="Закрыть">${ic('x')}</button></div>
      <div class="field"><label for="dc_name">Название</label><input class="inp" id="dc_name" maxlength="30" value="${esc(c.name)}" placeholder="Акция, Chevrolet, Для семьи"></div>
      <div class="field"><label>Машины в подборке</label><div class="blist" id="dc_ids">${cars.map(l=>`<label class="check"><input type="checkbox" value="${esc(l.id)}" ${c.ids.includes(l.id)?'checked':''}>${brandIcon(brandOf(l),'sm')}<span>${esc(l.title)}</span></label>`).join('') || '<p class="small dim">В салоне пока нет машин</p>'}</div></div>
      <div class="err" id="dc_err"></div>
      <div class="grid2">${c.id?`<button class="btn ghost danger" data-a="dcoldel" data-v="${esc(d.id)}|${esc(c.id)}">${ic('trash')}Удалить</button>`:'<span></span>'}<button class="btn" data-a="dcolsave" data-v="${esc(d.id)}|${esc(c.id)}">${ic('check')}Сохранить</button></div>`); },
  dcolsave(v){ const i = v.indexOf('|'), d = dealerById(v.slice(0,i)), u = me(); if (!d || !u || u.id!==d.uid) return;
    const name = $('#dc_name').value.replace(/\s+/g,' ').trim(), ids = [...document.querySelectorAll('#dc_ids input:checked')].map(x=>x.value);
    if (!name) return $('#dc_err').textContent = 'Напишите название подборки';
    if (!ids.length) return $('#dc_err').textContent = 'Отметьте хотя бы одну машину';
    const cols = (d.cols||[]).slice(), id = v.slice(i+1), k = cols.findIndex(x=>x.id===id);
    if (k<0 && cols.length>=10) return $('#dc_err').textContent = 'Не больше 10 подборок';
    const rec = {id: id || uid(), name, ids}; if (k<0) cols.push(rec); else cols[k] = rec;
    d.cols = cols; persist(); closeSheet(); toast('Подборка сохранена'); render(); },
  dcoldel(v){ const i = v.indexOf('|'), d = dealerById(v.slice(0,i)), u = me(); if (!d || !u || u.id!==d.uid) return;
    d.cols = (d.cols||[]).filter(x=>x.id!==v.slice(i+1)); state.dCol = {...(state.dCol||{}), [d.id]: ''}; persist(); closeSheet(); toast('Подборка удалена'); render(); },
  dsec(v){ const i = v.indexOf('|'), id = v.slice(0,i); state.dSec = {...(state.dSec||{}), [id]: v.slice(i+1)}; state.dBrand = {...(state.dBrand||{}), [id]: ''}; state.dCol = {...(state.dCol||{}), [id]: ''}; state.dUse = {...(state.dUse||{}), [id]: ''}; render(); },
  dbrand(v){ const i = v.indexOf('|'); state.dBrand = {...(state.dBrand||{}), [v.slice(0,i)]: v.slice(i+1)}; render(); },
  dealerhide(id){ const d = dealerById(id); if (!d || !staffOn(me())) return; d.hidden = !d.hidden;
    if (!d.hidden) S.complaints = S.complaints.filter(c=>c.target!==id);
    persist(); toast(d.hidden ? 'Салон скрыт' : 'Салон снова виден'); render(); }
});

Object.assign(TR, {
  'Автосалоны':['Awtosalonlar','Car dealers'], 'Автосалон':['Awtosalon','Car dealer'], 'Мой салон':['Meniň salonym','My dealership'], 'Новый салон':['Täze salon','New dealership'],
  'Создать страницу салона':['Salonyň sahypasyny döret','Create a dealer page'], 'Машины от салонов, кредит, обмен и другие услуги':['Salonlardan maşynlar, karz, çalyşmak we beýleki hyzmatlar','Cars from dealers, credit, trade and more'],
  'машины от салонов и их услуги':['salonlardan maşynlar we hyzmatlar','dealer cars and services'], 'салонов':['salon','dealers'], 'авто':['awto','cars'],
  'Пока нет салонов':['Entek salon ýok','No dealers yet'], 'Создайте страницу своего салона — это бесплатно':['Salonyňyzyň sahypasyny dörediň — mugt','Create your dealer page — it is free'],
  'Скрыт':['Gizlin','Hidden'], 'Салон не найден':['Salon tapylmady','Dealer not found'], 'Возможно, его скрыли или удалили':['Ony gizlän ýa-da pozan bolmagy mümkin','It may have been hidden or deleted'],
  'Салон скрыт администрацией':['Salony administrasiýa gizledi','Hidden by administration'], 'Контакты':['Habarlaşmak','Contacts'], 'Изменить':['Üýtget','Edit'],
  'Добавить авто':['Awto goş','Add a car'], 'Привязать мои объявления к салону · ':['Bildirişlerimi salona birikdir · ','Link my listings to the dealer · '],
  'Машины салона':['Salonyň maşynlary','Dealer cars'], 'Машин пока нет':['Entek maşyn ýok','No cars yet'],
  'Подайте объявление — оно появится здесь':['Bildiriş goýuň — şu ýerde peýda bolar','Post a listing — it will show up here'], 'Салон ещё не выставил машины':['Salon entek maşyn goýmady','The dealer has no cars yet'],
  'Показать салон':['Salony görkez','Show dealer'], 'Скрыть салон':['Salony gizle','Hide dealer'],
  'Страница салона бесплатная и появляется сразу. За ложные сведения салон могут скрыть по жалобам.':['Salonyň sahypasy mugt we derrew peýda bolýar. Ýalan maglumat üçin şikaýat boýunça gizlenip bilner.','The dealer page is free and appears right away. False information may get it hidden after complaints.'],
  'Фон сверху (баннер)':['Ýokarky surat (banner)','Top background (banner)'], 'Широкое фото салона или площадки':['Salonyň ýa-da meýdançanyň giň suraty','A wide photo of the showroom or lot'],
  'Логотип':['Logotip','Logo'], 'Квадратная картинка':['Inedördül surat','Square picture'],
  'Название салона *':['Salonyň ady *','Dealer name *'], 'Телефон салона':['Salonyň telefony','Dealer phone'], 'Услуги':['Hyzmatlar','Services'], 'О салоне':['Salon barada','About the dealer'],
  'Адрес, часы работы, какие машины продаёте, условия кредита':['Salgy, iş wagty, haýsy maşynlary satýarsyňyz, karz şertleri','Address, hours, which cars you sell, credit terms'],
  'Удалить страницу салона':['Salonyň sahypasyny poz','Delete dealer page'], 'Укажите название салона':['Salonyň adyny ýazyň','Enter the dealer name'],
  'Загружаем картинки…':['Suratlar ýüklenýär…','Uploading pictures…'], 'Сохраняем…':['Saklanýar…','Saving…'],
  'Не удалось сохранить страницу салона. Попробуйте позже или напишите в поддержку.':['Salonyň sahypasyny saklap bolmady. Soňrak synanyşyň ýa-da goldawa ýazyň.','Could not save the dealer page. Try later or contact support.'], 'Страница салона сохранена':['Salonyň sahypasy saklandy','Dealer page saved'],
  'Удалить страницу салона? Объявления останутся, но без салона.':['Salonyň sahypasyny pozmalymy? Bildirişler galar, ýöne salonsyz.','Delete the dealer page? Listings stay, without the dealer.'],
  'Страница салона удалена':['Salonyň sahypasy pozuldy','Dealer page deleted'], 'Салон скрыт':['Salon gizlendi','Dealer hidden'], 'Салон снова виден':['Salon ýene görünýär','Dealer visible again'],
  'Трейд-ин':['Trade-in','Trade-in'], 'Пригон из-за рубежа':['Daşary ýurtdan getirmek','Import from abroad'], 'Гарантия':['Kepillik','Warranty'], 'Тест-драйв':['Test-sürüş','Test drive'],
  'Салон':['Salon','Dealer'], 'Объявление от салона':['Salondan bildiriş','Listing from the dealer']
});
TR_RE.push([/^Привязано объявлений: (\d+)$/, (m,n) => ['Birikdirilen bildiriş: '+n, 'Listings linked: '+n]]);
TR_SUB.splice(0, TR_SUB.length, ...Object.keys(TR).filter(k => k.length >= 6 && /[ «»:,.→₽]/.test(k)).sort((a,b) => b.length - a.length));
