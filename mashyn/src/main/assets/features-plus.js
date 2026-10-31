/* =====================================================
   Чат с продавцом, история цены, «Продано»,
   отзывы о продавце, «Вы смотрели» и похожие объявления.
   Подключается после features.js, дополняет FEATURE_SCREENS и FEATURE_ACTIONS.
   ===================================================== */
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// Только одна коллекция с сервера — для чата, чтобы не тянуть всю базу
async function pullColl(c){
  await syncing;
  const {data, error} = await sb.from('mb_records').select('id,data').eq('coll', c);
  if (error) throw error;
  S[c] = data.map(r => r.data);
  synced[c] = new Map(S[c].map(r => [r.id, ser(c, r)]));
}

/* ================== История цены ================== */
// l.ph — все цены объявления по порядку: [{p, t}]
const priceDrop = l => {
  const ph = l.ph || [];
  if (ph.length < 2) return 0;
  const [a, b] = ph.slice(-2);
  return b.p < a.p && b.t > now() - 14*DAY ? a.p - b.p : 0;
};
const dropBadge = l => priceDrop(l) ? '<span class="badge b-ok">↓ Цена снижена</span>' : '';

function priceHistCard(l){
  const ph = l.ph || [];
  if (ph.length < 2) return '';
  const ps = ph.map(x => x.p), lo = Math.min(...ps), hi = Math.max(...ps), W = 300, H = 60;
  const pts = ph.map((x,i) => `${Math.round(i/(ph.length-1)*W)},${Math.round(H-6 - (hi===lo ? .5 : (x.p-lo)/(hi-lo))*(H-12))}`).join(' ');
  const rows = [...ph].reverse().map((x,i,arr) => { const prev = arr[i+1]; const d = prev ? x.p - prev.p : 0;
    return `<div class="r"><span class="dim">${dateStr(x.t)}</span><span class="num">${fmt(x.p)} TMT ${d ? `<span style="color:var(--${d<0?'ok':'warn'})">${d<0?'↓':'↑'} ${fmt(Math.abs(d))}</span>` : ''}</span></div>`; }).join('');
  return `<div class="card pad col" style="gap:8px"><div class="between"><h3>История цены</h3>${dropBadge(l)}</div>
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:60px" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>
    <div class="breakdown">${rows}</div></div>`;
}

// Избранное: если цена упала, пока вас не было, — уведомление
function checkFavPrices(){
  const u = me(); if (!u) return;
  const seen = lsGet('mb_favprice', {});
  let changed = false;
  for (const id of S.favs[u.id] || []){
    const l = S.listings.find(x => x.id===id); if (!l || !l.price) continue;
    if (seen[id] && l.price < seen[id] && visible(l)){ notify(u.id, `Цена снижена: «${l.title}» — ${fmt(l.price)} TMT (было ${fmt(seen[id])})`); changed = true; }
    seen[id] = l.price;
  }
  lsSet('mb_favprice', seen);
  if (changed) persist();
}

function priceSheet(l){
  openSheet(`<div class="between"><h2>Изменить цену</h2><button class="icon-btn" data-a="closesheet" aria-label="Закрыть">${ic('x')}</button></div>
    <div class="card pad small"><b>${esc(l.title)}</b><br><span class="dim num">Сейчас: ${esc(priceText(l))}</span></div>
    <div class="field"><label for="np_price">Новая цена, TMT</label><input class="inp num" id="np_price" type="number" inputmode="numeric" value="${l.price||''}"></div>
    <span class="tiny dim">Если снизите цену, у объявления появится отметка «Цена снижена», а тем, кто добавил его в избранное, придёт уведомление.</span>
    <button class="btn" data-a="pricesave" data-v="${l.id}">${ic('check')}Сохранить</button>`);
}

/* ================== Продано ================== */
const isSold = l => l.status==='sold';
const soldBanner = l => isSold(l) ? `<div class="card pad row" style="gap:10px;border-color:var(--ok)">${ic('check','style="width:22px;height:22px;color:var(--ok);flex:none"')}<div class="small"><b style="color:var(--ok)">Продано${l.soldAt?' '+dateStr(l.soldAt):''}</b><br><span class="dim">Объявление в архиве. Посмотрите похожие машины ниже.</span></div></div>` : '';

/* ================== Отзывы о продавце ================== */
function ratingOf(sid){
  const rs = S.reviews.filter(r => r.to===sid);
  return {n:rs.length, avg:rs.length ? rs.reduce((s,r)=>s+r.stars,0)/rs.length : 0, list:rs.sort((a,b)=>b.time-a.time)};
}
const stars = (n, size=14) => `<span style="color:#f6c343;font-size:${size}px;letter-spacing:1px">${'★'.repeat(Math.round(n))}<span style="opacity:.3">${'★'.repeat(5-Math.round(n))}</span></span>`;
const ratingLine = sid => { const r = ratingOf(sid); return r.n ? `${stars(r.avg)} <b class="num small">${r.avg.toFixed(1)}</b> <span class="tiny dim">· ${r.n} отз.</span>` : '<span class="tiny dim">Пока нет отзывов</span>'; };
// Отзыв — только тем, с кем была переписка или чьё объявление комментировали
const talkedTo = (u, sid) => S.msgs.some(m => (m.uid===u.id && m.to===sid) || (m.uid===sid && m.to===u.id))
  || S.comments.some(c => c.uid===u.id && S.listings.find(l => l.id===c.lid)?.uid===sid);
const canReview = (u, sid) => u && u.id!==sid && !S.reviews.some(r => r.uid===u.id && r.to===sid) && talkedTo(u, sid);

/* ================== Чат ================== */
const chatKey = (lid, other) => lid + '|' + other;
let CHAT_SEEN = lsGet('mb_chatseen', {});
function threadsOf(u){
  const m = {};
  for (const x of S.msgs){
    if (x.uid!==u.id && x.to!==u.id) continue;
    const other = x.uid===u.id ? x.to : x.uid, k = chatKey(x.lid, other);
    (m[k] = m[k] || {k, lid:x.lid, other, list:[]}).list.push(x);
  }
  return Object.values(m).map(th => { th.list.sort((a,b)=>a.time-b.time); th.last = th.list[th.list.length-1];
    th.unread = th.list.filter(x => x.uid!==u.id && x.time > (CHAT_SEEN[th.k]||0)).length; return th; })
    .sort((a,b) => b.last.time - a.last.time);
}
const unreadChats = () => { const u = me(); return u ? threadsOf(u).reduce((s,th)=>s+th.unread,0) : 0; };
const QUICK = ['Здравствуйте! Машина ещё продаётся?', 'Какой торг возможен?', 'Можно посмотреть сегодня?', 'Были ли ДТП и окрасы?'];
const RISKY = /(предоплат|переведи|переводом|номер карты|залог|öňünden|https?:\/\/|t\.me)/i;
const timeStr = ts => new Date(ts).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'});
let chatTimer = null;

/* ================== Вы смотрели и похожие ================== */
let SEEN = lsGet('mb_seen', []);
function markSeen(id){ SEEN = [id, ...SEEN.filter(x => x!==id)].slice(0, 20); lsSet('mb_seen', SEEN); }
const seenList = exclude => SEEN.filter(id => id!==exclude).map(id => S.listings.find(l => l.id===id)).filter(l => l && visible(l));
const miniCard = l => `<button class="vc" data-a="open" data-v="${l.id}"><div class="th">${mainPic(l)}</div>${priceDrop(l)?'<span class="badge b-ok">↓ Цена</span>':''}
  <div class="info"><span class="small" style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(l.title)}</span><span class="p num">${esc(priceText(l))}</span><span class="tiny dim">${esc(placeText(l))}</span></div></button>`;
function similarTo(l){
  const s = l.specs || {};
  return S.listings.filter(x => x.id!==l.id && visible(x) && (x.sec===l.sec || (CAR_SECS.includes(l.sec) && CAR_SECS.includes(x.sec))))
    .map(x => { let sc = 0; const xs = x.specs || {};
      if (s.brand && xs.brand===s.brand) sc += 3;
      if (s.model && (xs.model||'').toLowerCase()===s.model.toLowerCase()) sc += 3;
      if (s.body && xs.body===s.body) sc += 1;
      if (s.year && xs.year && Math.abs(xs.year-s.year)<=3) sc += 1;
      if (l.price && x.price && Math.abs(x.price-l.price) <= l.price*.25) sc += 2;
      if (x.reg===l.reg) sc += .5;
      return [sc, x]; })
    .filter(([sc]) => sc >= 2).sort((a,b) => b[0]-a[0]).slice(0, 8).map(([,x]) => x);
}
const rowBlock = (title, arr) => arr.length ? `<div class="col"><div class="sec-title"><h2>${title}</h2><span class="tiny dim">${arr.length}</span></div><div class="vip-row">${arr.map(miniCard).join('')}</div></div>` : '';

/* ================== Экраны ================== */
Object.assign(FEATURE_SCREENS, {
  chats(){
    const u = me();
    if (!u) return {title:'Сообщения', html:guest()};
    const ths = threadsOf(u);
    return {title:'Сообщения', html:`<h2>Сообщения</h2>
      <div class="list">${ths.length ? ths.map(th => { const l = S.listings.find(x=>x.id===th.lid), o = userById(th.other) || {name:'—'};
        return `<button class="card pad row" style="text-align:left;gap:12px" data-a="chat" data-v="${th.k}">
          <div style="width:56px;height:44px;border-radius:10px;overflow:hidden;flex:none">${l?mainPic(l):''}</div>
          <div style="flex:1;min-width:0"><div class="between"><b class="small">${esc(o.name)}</b><span class="tiny dim">${ago(th.last.time)}</span></div>
            <div class="tiny dim" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(l?.title||'Объявление удалено')}</div>
            <div class="small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${th.unread?'font-weight:700':''}">${th.last.uid===u.id?'Вы: ':''}${esc(th.last.text)}</div></div>
          ${th.unread?`<span class="badge b-vip num">${th.unread}</span>`:''}</button>`; }).join('')
        : emptyBox('Пока нет сообщений', 'Откройте объявление и нажмите «Написать», чтобы задать вопрос продавцу')}</div>`};
  },

  chat(k){
    const u = me();
    if (!u) return {title:'Чат', html:guest()};
    const [lid, other] = k.split('|');
    const l = S.listings.find(x=>x.id===lid), o = userById(other) || {name:'—'};
    const list = S.msgs.filter(m => m.lid===lid && ((m.uid===u.id && m.to===other) || (m.uid===other && m.to===u.id))).sort((a,b)=>a.time-b.time);
    CHAT_SEEN[k] = now(); lsSet('mb_chatseen', CHAT_SEEN);
    const risky = list.some(m => m.uid===other && RISKY.test(m.text));
    let day = '';
    return {title:o.name, html:`
      ${l?`<button class="card pad row" style="text-align:left;gap:12px" data-a="open" data-v="${l.id}"><div style="width:64px;height:48px;border-radius:10px;overflow:hidden;flex:none">${mainPic(l)}</div>
        <div style="flex:1;min-width:0"><b class="small" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(l.title)}</b><span class="small num" style="color:var(--accent)">${esc(priceText(l))}</span>${isSold(l)?' <span class="badge b-ok">Продано</span>':''}</div></button>`:''}
      <button class="row small" style="gap:8px;text-align:left" data-a="seller" data-v="${other}"><div class="ava" style="width:32px;height:32px;font-size:.75rem">${initials(o.name)}</div><span><b>${esc(o.name)}</b>${o.verified?' <span style="color:var(--ok)">✓</span>':''}<br>${ratingLine(other)}</span></button>
      ${risky?`<div class="card pad small" style="border-color:var(--danger)"><b style="color:var(--danger)">⚠️ Осторожно</b><br><span class="dim">Собеседник просит предоплату или прислал ссылку. Не переводите деньги до осмотра машины.</span> <button class="link small" data-a="complain" data-v="listing:${lid}">Пожаловаться</button></div>`:''}
      <div class="chat" id="chatbox">${list.length ? list.map(m => { const d = dateStr(m.time); const sep = d!==day ? (day=d, `<div class="chat-day tiny dim">${d}</div>`) : '';
          return `${sep}<div class="bubble ${m.uid===u.id?'me':''}"><span>${esc(m.text)}</span><span class="tiny">${timeStr(m.time)}</span></div>`; }).join('')
        : '<p class="small dim" style="text-align:center;margin:20px 0">Напишите продавцу. Номер телефона показывать не обязательно — общайтесь здесь.</p>'}</div>
      ${!list.some(m=>m.uid===u.id) && l?.uid!==u.id ? `<div class="chips">${QUICK.map(q=>`<button class="chip" data-a="chatquick" data-v="${esc(q)}">${esc(q)}</button>`).join('')}</div>` : ''}
      <div class="chat-input"><textarea id="ch_text" class="inp" maxlength="1000" rows="1" placeholder="Сообщение" aria-label="Сообщение">${esc(state.chatDraft?.[k]||'')}</textarea>
        <button class="btn" data-a="chatsend" data-v="${k}" aria-label="Отправить">${ic('up','style="transform:rotate(90deg)"')}</button></div>
      <span class="tiny dim" style="text-align:center">Никогда не переводите предоплату до осмотра машины</span>`,
      after(){
        const box = $('#chatbox'); box && box.lastElementChild?.scrollIntoView({block:'end'});
        const ta = $('#ch_text'); ta.addEventListener('input', () => { (state.chatDraft = state.chatDraft || {})[k] = ta.value; });
        ta.addEventListener('keydown', e => { if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); A.chatsend(k); } });
        // Пока чат открыт, раз в 6 секунд проверяем новые сообщения
        clearInterval(chatTimer);
        chatTimer = setInterval(async () => {
          const cur = stack[stack.length-1];
          if (cur.name!=='chat' || cur.arg!==k){ clearInterval(chatTimer); return; }
          if (document.hidden || !$('#sheet').hidden) return;
          const n = S.msgs.length;
          try { await pullColl('msgs'); } catch { return; }
          if (S.msgs.length !== n) render();
        }, 6000);
      }};
  },

  seller(sid){
    const x = userById(sid);
    if (!x) return {title:'Продавец', html:emptyBox('Продавец не найден', 'Возможно, аккаунт удалён')};
    const u = me(), r = ratingOf(sid);
    const act = S.listings.filter(l => l.uid===sid && visible(l)), sold = S.listings.filter(l => l.uid===sid && isSold(l));
    const dist = [5,4,3,2,1].map(s => [s, r.list.filter(v=>v.stars===s).length]);
    state.rvStars = state.rvStars || 0;
    return {title:x.name, html:`
      <div class="card pad seller"><div class="ava" style="width:56px;height:56px;border-radius:18px;font-size:1.1rem">${initials(x.name)}</div>
        <div style="flex:1;min-width:0"><h2 style="font-size:1.05rem">${esc(x.name)}</h2>
          <div class="small dim">${x.type==='company'?'Компания':'Частное лицо'}${x.verified?' · <span style="color:var(--ok)">✓ Проверенный продавец</span>':''}</div>
          <div style="margin-top:4px">${ratingLine(sid)}</div></div></div>
      <div class="stat-row"><div class="stat"><b class="num">${act.length}</b><span class="tiny dim">в продаже</span></div>
        <div class="stat"><b class="num">${sold.length}</b><span class="tiny dim">продано</span></div>
        <div class="stat"><b class="num">${x.created?Math.max(1,Math.round((now()-x.created)/(30*DAY))):'—'}</b><span class="tiny dim">мес. в Alpha Drive</span></div></div>
      <div class="card pad col" style="gap:10px"><div class="between"><h3>Отзывы</h3>${r.n?`<span><b class="num" style="font-size:1.3rem">${r.avg.toFixed(1)}</b> ${stars(r.avg,16)}</span>`:''}</div>
        ${r.n?dist.map(([s,c])=>`<div class="dbar"><span class="small num">${s} ★</span><div class="track"><i style="width:${Math.round(c/r.n*100)}%"></i></div><b class="num small">${c}</b></div>`).join(''):''}
        ${r.list.map(v => { const a = userById(v.uid)||{name:'?'}; const ll = S.listings.find(z=>z.id===v.lid);
          return `<div class="cm"><div class="ava">${initials(a.name)}</div><div class="body"><div class="meta"><b style="color:var(--text)">${esc(a.name)}</b>${stars(v.stars,12)}<span>${ago(v.time)}</span></div>
            ${ll?`<span class="tiny dim">${esc(ll.title)}</span>`:''}${v.text?`<p>${esc(v.text)}</p>`:''}</div></div>`; }).join('') || '<p class="small dim" style="margin:0">Пока нет отзывов.</p>'}
        ${canReview(u, sid) ? `<div class="col" style="gap:8px;border-top:1px solid var(--line);padding-top:10px"><b class="small">Оставить отзыв</b>
            <div class="row" style="gap:4px">${[1,2,3,4,5].map(s=>`<button data-a="rvstar" data-v="${s}" aria-label="${s} звёзд" style="font-size:28px;color:${s<=state.rvStars?'#f6c343':'var(--line)'}">★</button>`).join('')}</div>
            <textarea class="inp" id="rv_text" style="min-height:70px" maxlength="500" placeholder="Как прошла сделка? Машина соответствовала описанию?"></textarea>
            <div class="err" id="rv_err"></div><button class="btn" data-a="rvsend" data-v="${sid}">${ic('star')}Отправить отзыв</button></div>`
          : u && u.id!==sid && !S.reviews.some(v=>v.uid===u.id && v.to===sid) ? '<span class="tiny dim">Отзыв можно оставить после переписки с продавцом.</span>' : ''}</div>
      ${act.length?`<div class="col"><h3>Объявления продавца</h3><div class="list">${rank(act).map(listCard).join('')}</div></div>`:''}`};
  }
});

/* ================== Действия ================== */
Object.assign(FEATURE_ACTIONS, {
  chats(){ go('chats'); },
  chat(k){ go('chat', k); },
  write(lid){
    const u = me(); if (!u){ go('auth','login'); return; }
    const l = S.listings.find(x=>x.id===lid); if (!l || l.uid===u.id) return;
    go('chat', chatKey(lid, l.uid));
  },
  chatquick(text){ const ta = $('#ch_text'); ta.value = text; ta.focus(); },
  chatsend(k){
    const u = me(), ta = $('#ch_text'), text = ta.value.trim();
    if (!text) return;
    const [lid, to] = k.split('|');
    S.msgs.push({id:uid(), uid:u.id, to, lid, text, time:now()});
    if (state.chatDraft) delete state.chatDraft[k];
    persist(); render();
  },

  pricesheet(id){ const l = S.listings.find(x=>x.id===id); if (l) priceSheet(l); },
  pricesave(id){
    const l = S.listings.find(x=>x.id===id), p = Number($('#np_price').value);
    if (!(p > 0)){ toast('Укажите цену'); return; }
    if (p === l.price){ closeSheet(); return; }
    l.ph = l.ph?.length ? l.ph : [{p:l.price, t:l.created}];
    l.ph.push({p, t:now()}); l.ph = l.ph.slice(-20);
    const down = p < l.price; l.price = p;
    persist(); closeSheet(); toast(down ? 'Цена снижена. Покупатели увидят отметку «Цена снижена»' : 'Цена изменена'); render();
  },

  sold(id){ confirmSheet('Машина продана? Объявление уйдёт в архив, а покупатели перестанут звонить.', 'Да, продано', {a:'soldok', v:id}); },
  soldok(id){ const l = S.listings.find(x=>x.id===id); l.status = 'sold'; l.soldAt = now(); persist(); closeSheet(); toast('Поздравляем с продажей! 🎉'); render(); },

  seller(sid){ state.rvStars = 0; go('seller', sid); },
  rvstar(v){ const txt = $('#rv_text')?.value; state.rvStars = Number(v); render(); if (txt) $('#rv_text').value = txt; },
  rvsend(sid){
    const u = me(), text = $('#rv_text').value.trim(), err = $('#rv_err');
    if (!state.rvStars) return err.textContent = 'Поставьте оценку от 1 до 5 звёзд';
    const lid = S.msgs.filter(m => (m.uid===u.id && m.to===sid) || (m.uid===sid && m.to===u.id)).map(m=>m.lid)[0] || '';
    S.reviews.push({id:uid(), uid:u.id, to:sid, lid, stars:state.rvStars, text, time:now()});
    state.rvStars = 0; persist(); toast('Спасибо за отзыв!'); render();
  }
});

/* ================== Переводы новых фраз ================== */
Object.assign(TR, {
  'Сообщения':['Hatlar','Messages'], 'Написать':['Ýaz','Message'], 'Сообщение':['Hat','Message'], 'Вы: ':['Siz: ','You: '],
  'Пока нет сообщений':['Entek hat ýok','No messages yet'],
  'Откройте объявление и нажмите «Написать», чтобы задать вопрос продавцу':['Bildirişi açyň we satyja sorag bermek üçin «Ýaz» basyň','Open a listing and tap “Message” to ask the seller'],
  'Напишите продавцу. Номер телефона показывать не обязательно — общайтесь здесь.':['Satyja ýazyň. Telefon belgiňizi görkezmek hökman däl — şu ýerde gürleşiň.','Write to the seller. No need to share your number — chat here.'],
  'Здравствуйте! Машина ещё продаётся?':['Salam! Maşyn entek satylýarmy?','Hello! Is the car still for sale?'],
  'Какой торг возможен?':['Näçe arzanladyp bolar?','How much can you lower the price?'],
  'Можно посмотреть сегодня?':['Şu gün görüp bolarmy?','Can I see it today?'],
  'Были ли ДТП и окрасы?':['Awariýa we reňklenen ýeri barmy?','Any accidents or repainting?'],
  'Никогда не переводите предоплату до осмотра машины':['Maşyny görmezden öň hiç haçan öňünden töleg geçirmäň','Never send a prepayment before seeing the car'],
  '⚠️ Осторожно':['⚠️ Seresap boluň','⚠️ Be careful'],
  'Собеседник просит предоплату или прислал ссылку. Не переводите деньги до осмотра машины.':['Gürrüňdeşiňiz öňünden töleg soraýar ýa-da salgy iberdi. Maşyny görmezden pul geçirmäň.','The other person asks for a prepayment or sent a link. Don’t send money before seeing the car.'],
  'История цены':['Bahanyň taryhy','Price history'], '↓ Цена снижена':['↓ Baha arzanlady','↓ Price reduced'], '↓ Цена':['↓ Baha','↓ Price'],
  'Изменить цену':['Bahany üýtget','Change price'], 'Новая цена, TMT':['Täze baha, TMT','New price, TMT'], 'Сохранить':['Ýatda sakla','Save'],
  'Если снизите цену, у объявления появится отметка «Цена снижена», а тем, кто добавил его в избранное, придёт уведомление.':['Bahany arzanlatsaňyz, bildirişde «Baha arzanlady» belligi peýda bolar, ony halanlaryna goşanlara habar barar.','If you lower the price, the listing gets a “Price reduced” mark and people who saved it get a notification.'],
  'Цена снижена. Покупатели увидят отметку «Цена снижена»':['Baha arzanlady. Alyjylar «Baha arzanlady» belligini görer','Price reduced. Buyers will see the “Price reduced” mark'],
  'Цена изменена':['Baha üýtgedildi','Price changed'], 'Укажите цену':['Bahany görkeziň','Enter a price'],
  'Продано':['Satyldy','Sold'], 'Продано!':['Satyldy!','Sold!'], 'продано':['satyldy','sold'], 'в продаже':['satuwda','for sale'],
  'Объявление в архиве. Посмотрите похожие машины ниже.':['Bildiriş arhiwde. Aşakda meňzeş maşynlara serediň.','This listing is archived. See similar cars below.'],
  'Машина продана? Объявление уйдёт в архив, а покупатели перестанут звонить.':['Maşyn satyldymy? Bildiriş arhiwe geçer, alyjylar jaň etmegi bes eder.','Car sold? The listing goes to the archive and buyers stop calling.'],
  'Да, продано':['Hawa, satyldy','Yes, sold'], 'Поздравляем с продажей! 🎉':['Satuwyňyz bilen gutlaýarys! 🎉','Congrats on the sale! 🎉'],
  'Отзывы':['Teswirler','Reviews'], 'Пока нет отзывов':['Entek teswir ýok','No reviews yet'], 'Пока нет отзывов.':['Entek teswir ýok.','No reviews yet.'],
  'Оставить отзыв':['Teswir galdyr','Leave a review'], 'Отправить отзыв':['Teswiri iber','Send review'], 'Спасибо за отзыв!':['Teswiriňiz üçin sag boluň!','Thanks for the review!'],
  'Как прошла сделка? Машина соответствовала описанию?':['Söwda nähili geçdi? Maşyn beýany bilen gabat geldimi?','How did the deal go? Did the car match the description?'],
  'Поставьте оценку от 1 до 5 звёзд':['1-den 5-e çenli baha goýuň','Rate from 1 to 5 stars'],
  'Отзыв можно оставить после переписки с продавцом.':['Teswiri satyjy bilen hat alyşandan soň galdyryp bolýar.','You can leave a review after chatting with the seller.'],
  'Объявления продавца':['Satyjynyň bildirişleri','Seller’s listings'], 'мес. в Alpha Drive':['aý Alpha Drive-da','months on Alpha Drive'],
  'Все объявления продавца и отзывы':['Satyjynyň ähli bildirişleri we teswirleri','All seller listings and reviews'],
  'Вы смотрели':['Siz serediňiz','Recently viewed'], 'Похожие объявления':['Meňzeş bildirişler','Similar listings'],
  'Продавец не найден':['Satyjy tapylmady','Seller not found'], 'Отметить «Продано»':['«Satyldy» diýip belle','Mark as sold'],
  // Новый / с пробегом и мотоциклы
  'Новый':['Täze','New'], 'Новые':['Täzeler','New'], 'С пробегом':['Ulanylan','Used'],
  'Тип':['Görnüşi','Type'], 'Объём':['Göwrümi','Displacement'], 'Объём, см³':['Göwrümi, sm³','Engine size, cc'], 'Мото':['Moto','Moto'],
  'Мотоцикл':['Motosikl','Motorcycle'], 'Скутер / мопед':['Skuter / moped','Scooter / moped'], 'Эндуро / кросс':['Enduro / kross','Enduro / motocross'],
  'Спортбайк':['Sport baýk','Sport bike'], 'Круизер / чоппер':['Kruizer / çopper','Cruiser / chopper'], 'Квадроцикл':['Kwadrosikl','ATV / quad'],
  'Мотоцикл с коляской':['Kolýaskaly motosikl','Motorcycle with sidecar'], 'Трицикл / грузовой':['Trisikl / ýük','Trike / cargo'],
  'Электромотоцикл':['Elektromotosikl','Electric motorcycle'], 'Питбайк / детский':['Pitbaýk / çagalar üçin','Pit bike / kids'],
  'Авто, мото, импорт, аренда':['Awtoulag, moto, getirmek, kärende','Cars, motorcycles, imports, rental'],
  // «О приложении» и частые вопросы, версия 1.3
  'Alpha Drive — автомаркет Туркменистана. Только машины и всё, что с ними связано: продажа авто и мотоциклов, пригон из-за рубежа, запчасти, спецтехника, аренда, СТО и работа для водителей.':['Alpha Drive — Türkmenistanyň awtobazary. Diňe maşynlar we olar bilen baglanyşykly zatlar: awtoulag we motosikl satuwy, daşary ýurtdan getirmek, şaýlar, ýörite tehnika, kärende, awtoserwis we sürüjiler üçin iş.','Alpha Drive is the car marketplace of Turkmenistan. Only vehicles and everything around them: cars and motorcycles for sale, imports, parts, heavy machinery, rental, service and driver jobs.'],
  'Мотоциклы, скутеры и квадроциклы — отдельный раздел':['Motosikller, skuterler we kwadrosikller — aýratyn bölüm','Motorcycles, scooters and ATVs — a separate section'],
  'Новые и с пробегом — переключатель в один клик':['Täze we ulanylan — bir basyşda saýlaň','New or used — one tap to switch'],
  'Чат с продавцом прямо в приложении':['Programmanyň içinde satyjy bilen hat alyşmak','Chat with the seller right in the app'],
  'История цены и отметка «Цена снижена»':['Bahanyň taryhy we «Baha arzanlady» belligi','Price history and the “Price reduced” mark'],
  'Отзывы и рейтинг продавцов':['Satyjylar barada teswirler we reýting','Seller reviews and ratings'],
  'Как написать продавцу?':['Satyja nädip ýazmaly?','How do I message a seller?'],
  'Откройте объявление и нажмите «Написать». Вся переписка — в Профиль → «Сообщения». Не переводите предоплату до осмотра машины.':['Bildirişi açyň we «Ýaz» basyň. Ähli hatlar — Profil → «Hatlar». Maşyny görmezden öň öňünden töleg geçirmäň.','Open a listing and tap “Message”. All chats are in Profile → “Messages”. Don’t send a prepayment before seeing the car.'],
  'Как изменить цену или отметить «Продано»?':['Bahany nädip üýtgetmeli ýa-da «Satyldy» diýip bellemeli?','How do I change the price or mark it sold?'],
  'Профиль → Мои объявления: кнопка «Цена» меняет цену, кнопка «Продано» убирает объявление в архив. Если снизите цену, те, кто добавил объявление в избранное, получат уведомление.':['Profil → Meniň bildirişlerim: «Baha» düwmesi bahany üýtgedýär, «Satyldy» düwmesi bildirişi arhiwe geçirýär. Bahany arzanlatsaňyz, ony halanlaryna goşanlara habar barar.','Profile → My listings: “Price” changes the price, “Sold” moves the listing to the archive. If you lower the price, people who saved it get a notification.'],
  'Как оставить отзыв о продавце?':['Satyjy barada nädip teswir galdyrmaly?','How do I review a seller?'],
  'Нажмите на имя продавца в объявлении. Отзыв можно оставить после переписки с ним или комментария к его объявлению.':['Bildirişde satyjynyň adyna basyň. Teswiri onuň bilen hat alyşandan ýa-da bildirişine teswir ýazandan soň galdyryp bolýar.','Tap the seller’s name in a listing. You can review them after chatting or commenting on their listing.']
});
TR_RE.push(
  [/^Сообщение от (.+?): (.*)$/s, (m,a,b) => [a+' hat iberdi: '+b, 'Message from '+a+': '+b]],
  [/^Цена снижена: «(.+)» — ([\d ]+) TMT \(было ([\d ]+)\)$/, (m,a,b,c) => ['Baha arzanlady: «'+a+'» — '+b+' TMT ('+c+' bolupdy)', 'Price reduced: “'+a+'” — '+b+' TMT (was '+c+')']],
  [/^Сейчас: (.+)$/, (m,a) => ['Häzir: '+a, 'Now: '+a]],
  [/^Продано (\d\d\.\d\d\.\d{4})$/, (m,a) => ['Satyldy '+a, 'Sold '+a]],
  [/^· (\d+) отз\.$/, (m,n) => ['· '+n+' teswir', '· '+n+' reviews']]
);
TR_SUB.splice(0, TR_SUB.length, ...Object.keys(TR).filter(k => k.length >= 6 && /[ «»:,.→₽]/.test(k)).sort((a,b) => b.length - a.length));
