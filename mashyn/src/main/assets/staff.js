/* =====================================================
   Сотрудники и пользователи в админ-панели:
   роли «Управляющий» и «Оператор», вход сотрудника только
   с разрешения админа (supabase-update-staff.sql),
   список пользователей с поиском и карточкой человека.
   Подключается после features-plus.js.
   ===================================================== */
const ROLES = {admin:'Администратор', moder:'Управляющий', operator:'Оператор', user:'Пользователь'};
const roleName = r => ROLES[r] || ROLES.user;
const isStaffRole = r => r==='moder' || r==='operator';
// Что может каждая роль (показываем админу и самому сотруднику)
const ROLE_CAN = {
  moder:'Проверка объявлений, жалобы, поддержка, блокировка пользователей',
  operator:'Поддержка и вопросы из помощника, проверка объявлений, жалобы. Пользователей только смотрит',
  admin:'Всё, плюс оплаты, настройки, роли, сброс пароля и «Проверенный продавец»'
};
// Вкладки админ-панели по ролям
const ROLE_TABS = {moder:['mod','cmp','sup','users'], operator:['sup','mod','cmp','users']};

// Статус текущего входа сотрудника: null — не запрашивал, pending — ждёт админа, ok — разрешён, no — отклонён
let STAFF = {status:null, list:null, loaded:0};
// Админ работает сразу; управляющий и оператор — только на входе, который разрешил админ
const staffOn = u => !!u && (u.role==='admin' || (isStaffRole(u.role) && STAFF.status==='ok'));

async function staffStatus(){
  const u = me();
  STAFF.status = null;
  if (!u || !isStaffRole(u.role)) return;
  const {data, error} = await sb.rpc('mb_staff_status');
  if (error) console.warn(error.message); else STAFF.status = data || null;
}

// Короткое имя устройства для админа: «Android · Chrome»
function deviceName(){
  const ua = navigator.userAgent;
  const os = NB ? 'Android-приложение' : /iPhone|iPad/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : 'Компьютер';
  const br = NB ? '' : /Edg\//.test(ua) ? 'Edge' : /YaBrowser/.test(ua) ? 'Яндекс' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : '';
  return br ? `${os} · ${br}` : os;
}

// Экран сотрудника, пока админ не разрешил вход
function staffGate(u){
  const st = STAFF.status;
  const head = st==='pending' ? ['clock', 'Ждём разрешения администратора', 'Админу пришло уведомление. Как только он разрешит вход, нажмите «Проверить».', 'var(--warn)']
    : st==='no' ? ['x', 'Администратор не разрешил этот вход', 'Если это были вы — запросите доступ снова и предупредите администратора.', 'var(--danger)']
    : ['shield', 'Вход сотрудника подтверждает администратор', 'Нажмите «Запросить доступ» — админ получит уведомление с названием этого устройства.', 'var(--accent)'];
  return {title:t('admin'), html:`
    <div class="card pad col" style="gap:10px;align-items:center;text-align:center;padding:24px 18px;border-color:${head[3]}">
      <span style="width:56px;height:56px;border-radius:18px;display:grid;place-items:center;background:color-mix(in srgb,${head[3]} 18%,transparent);color:${head[3]}">${ic(head[0],'style="width:28px;height:28px"')}</span>
      <h2 style="font-size:1.1rem">${head[1]}</h2><p class="small dim" style="margin:0">${head[2]}</p>
      <span class="badge b-vip">${roleName(u.role)}</span><span class="tiny dim">Устройство: ${esc(deviceName())}</span>
      ${st==='pending' ? `<button class="btn" data-a="staffcheck">${ic('check')}Проверить</button><button class="btn ghost sm" data-a="staffreq">Отправить запрос ещё раз</button>`
        : `<button class="btn" data-a="staffreq">${ic('lock')}Запросить доступ</button>`}</div>
    <div class="card pad small col" style="gap:6px"><b>Почему так</b><span class="dim">Это защита от мошенников: даже если кто-то узнает ваш пароль и войдёт, без разрешения админа он не увидит панель и ничего не сможет изменить. После «Выйти» разрешение пропадает.</span>
      <span class="dim"><b style="color:var(--text)">${roleName(u.role)}:</b> ${ROLE_CAN[u.role]}</span></div>`};
}

/* ================== Вкладка «Сотрудники» (только админ) ================== */
async function staffLoad(force){
  if (!force && STAFF.list && now() - STAFF.loaded < 15000) return;
  STAFF.loaded = now();
  const {data, error} = await sb.rpc('mb_staff_list');
  if (error){ STAFF.list = STAFF.list || []; STAFF.err = error.message; }
  else { STAFF.list = data || []; STAFF.err = ''; }
  const cur = stack[stack.length-1];
  if (cur.name==='admin' && state.admTab==='staff' && $('#sheet').hidden) render();
}
const staffPending = () => (STAFF.list||[]).filter(r=>r.status==='pending').length;

function staffAdmin(){
  if (!STAFF.list) return '<div class="card pad small dim">Загружаем запросы…</div>';
  const when = ts => ago(new Date(ts).getTime());
  const pend = STAFF.list.filter(r=>r.status==='pending');
  const team = S.users.filter(x=>isStaffRole(x.role));
  const sessions = id => STAFF.list.filter(r=>r.uid===id && r.status==='ok');
  return `${STAFF.err?`<div class="card pad small" style="border-color:var(--danger)"><b style="color:var(--danger)">Сервер не ответил:</b> ${esc(STAFF.err)}<br><span class="dim">Если пишет, что функции нет — выполните supabase-update-staff.sql в Supabase.</span></div>`:''}
    <div class="card pad col" style="gap:8px"><div class="between"><h3>Запросы на вход</h3><button class="btn sm ghost" data-a="staffreload">Обновить</button></div>
      ${pend.length ? pend.map(r=>{ const x = userById(r.uid)||{name:'—'};
        return `<div class="adm-item"><div class="between"><b>${esc(x.name)}</b><span class="badge b-warn">${roleName(x.role)}</span></div>
          <span class="small dim">${esc(r.device||'Устройство')} · ${when(r.created_at)}</span><span class="small dim num">${esc(fmtPhone(x.phone))}</span>
          <div class="red-note">Разрешайте, только если точно знаете, что это сотрудник входит сам (позвоните ему).</div>
          <div class="acts"><button class="btn sm" data-a="staffok" data-v="${r.sid}">${ic('check')}Разрешить</button><button class="btn sm danger" data-a="staffno" data-v="${r.sid}">Отклонить</button></div></div>`; }).join('')
        : '<span class="small dim">Новых запросов нет. Когда сотрудник войдёт и попросит доступ, запрос появится здесь и придёт уведомление.</span>'}</div>
    <div class="card pad col" style="gap:8px"><h3>Сотрудники</h3>
      ${team.length ? team.map(x=>{ const ss = sessions(x.id);
        return `<div class="adm-item"><div class="between"><b>${esc(x.name)}</b><span class="badge ${x.role==='moder'?'b-top':'b-vip'}">${roleName(x.role)}</span></div>
          <span class="small dim num">${esc(fmtPhone(x.phone))}</span>
          <span class="small">${ss.length ? `Разрешённые входы: ${ss.map(r=>esc(r.device||'устройство')).join(', ')}` : '<span class="dim">Сейчас нет разрешённых входов</span>'}</span>
          <div class="acts"><button class="btn sm ghost" data-a="usopen" data-v="${x.id}">Роль и профиль</button>${ss.length?`<button class="btn sm danger" data-a="staffrevoke" data-v="${x.id}">Закрыть все входы</button>`:''}</div></div>`; }).join('')
        : '<span class="small dim">Пока нет сотрудников. Откройте вкладку «Пользователи», найдите человека и назначьте роль.</span>'}</div>
    <div class="card pad small col" style="gap:6px"><b>Роли</b>${['moder','operator','admin'].map(r=>`<span><b>${roleName(r)}:</b> <span class="dim">${ROLE_CAN[r]}</span></span>`).join('')}
      <span class="dim">Каждый вход управляющего или оператора вы разрешаете сами — так мошенник с украденным паролем не получит доступ.</span></div>`;
}

/* ================== Вкладка «Пользователи» ================== */
const US_FILTERS = [['all','Все'],['new','Новые за 7 дней'],['person','Частные'],['company','Компании'],['verified','Проверенные'],['staff','Сотрудники'],['blocked','Заблокированные']];
const usMatch = (x, f) => f==='new' ? (x.created||0) > now()-7*DAY : f==='person' ? x.type!=='company' : f==='company' ? x.type==='company'
  : f==='verified' ? !!x.verified : f==='staff' ? x.role!=='user' : f==='blocked' ? !!x.blocked : true;
const usListings = id => S.listings.filter(l=>l.uid===id);
const roleBadge = x => x.role==='admin' ? '<span class="badge b-vip">Администратор</span>' : isStaffRole(x.role) ? `<span class="badge b-top">${roleName(x.role)}</span>` : '';

function usersAdmin(u){
  const f = state.usF || 'all';
  const all = [...S.users].sort((a,b)=>(b.created||0)-(a.created||0));
  const list = all.filter(x=>usMatch(x, f));
  return `<label class="search">${ic('search')}<input id="us_q" type="search" placeholder="Имя, телефон или компания" value="${esc(state.usQ||'')}" aria-label="Поиск пользователей"></label>
    <div class="chips">${US_FILTERS.map(([k,n])=>`<button class="chip ${f===k?'on':''}" data-a="usf" data-v="${k}">${n} · ${all.filter(x=>usMatch(x,k)).length}</button>`).join('')}</div>
    <span class="tiny dim" id="us_cnt">Найдено: ${list.length}</span>
    <div class="col" style="gap:8px">${list.length ? list.map(x=>{ const ls = usListings(x.id);
      return `<button class="adm-item" style="text-align:left;width:100%" data-a="usopen" data-v="${x.id}" data-s="${esc((x.name+' '+(x.phone||'')+' '+(x.company||'')).toLowerCase())}">
        <div class="between"><b>${esc(x.name)}${x.id===u.id?' <span class="tiny dim">(вы)</span>':''}</b><span class="row" style="gap:4px">${roleBadge(x)}${x.blocked?'<span class="badge b-bad">заблокирован</span>':''}${x.verified?'<span class="badge b-ok">✓</span>':''}</span></div>
        <span class="small dim num">${esc(fmtPhone(x.phone))} · ${x.type==='company'?'компания':'частное лицо'}</span>
        <span class="tiny dim">${x.created?'С '+dateStr(x.created):''} · объявлений: ${ls.filter(visible).length} активных из ${ls.length}</span></button>`; }).join('')
      : emptyBox('Никого нет', 'Попробуйте другой фильтр')}</div>`;
}
// Поиск без перерисовки экрана, чтобы клавиатура не закрывалась
function usersAfter(){
  const q = $('#us_q'); if (!q) return;
  const apply = () => { const v = q.value.trim().toLowerCase(), w = v.replace(/\D/g,''); state.usQ = q.value; let n = 0;
    document.querySelectorAll('[data-s]').forEach(el => { const s = el.dataset.s, ok = !v || s.includes(v) || (w.length>=3 && s.replace(/\D/g,'').includes(w)); el.hidden = !ok; if (ok) n++; });
    const c = $('#us_cnt'); if (c) c.textContent = 'Найдено: ' + n; };
  q.addEventListener('input', apply); apply();
}

// Карточка человека: данные, объявления, действия по роли смотрящего
function userSheet(id){
  const u = me(), x = userById(id); if (!x || !u) return;
  const isAdmin = u.role==='admin', canBlock = isAdmin || u.role==='moder';
  const ls = usListings(id).sort((a,b)=>b.created-a.created);
  const cmp = S.complaints.filter(c=>ls.some(l=>l.id===c.target) || S.comments.some(m=>m.id===c.target && m.uid===id)).length;
  const self = x.id===u.id;
  openSheet(`<div class="seller row" style="gap:12px"><div class="ava" style="width:52px;height:52px;border-radius:16px">${initials(x.name)}</div>
      <div style="flex:1;min-width:0"><h2 style="font-size:1.05rem">${esc(x.name)}</h2><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:4px">${roleBadge(x)}<span class="badge b-dim">${x.type==='company'?'Компания':'Частное лицо'}</span>${x.blocked?'<span class="badge b-bad">заблокирован</span>':''}${x.verified?'<span class="badge b-ok">✓ Проверенный</span>':''}</div></div></div>
    <div class="copy-row"><span class="phone-num num">${esc(fmtPhone(x.phone))}</span><a class="btn sm ghost" href="tel:${esc(x.phone)}" aria-label="Позвонить">${ic('phone')}</a><button class="btn sm ghost" data-a="copy" data-v="${esc(x.phone)}" aria-label="Скопировать">${ic('copy')}</button></div>
    <div class="stat-row"><div class="stat"><b class="num">${ls.filter(visible).length}</b><span class="tiny dim">активных</span></div><div class="stat"><b class="num">${ls.length}</b><span class="tiny dim">всего</span></div><div class="stat"><b class="num">${cmp}</b><span class="tiny dim">жалоб</span></div></div>
    <span class="small dim">${x.company?esc(x.company)+' · ':''}${x.created?'В Alpha Drive с '+dateStr(x.created):''}</span>
    ${ls.length?`<div class="col" style="gap:6px"><b class="small">Объявления</b>${ls.slice(0,8).map(l=>`<div class="between" style="gap:8px"><button class="small" style="text-align:left;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" data-a="usgo" data-v="${l.id}">${esc(l.title)}</button>
      <span class="tiny dim" style="flex:none">${isSold(l)?'Продано':statusText(l)}</span>${staffOn(u)&&['active','review'].includes(l.status)?`<button class="btn sm ghost" style="flex:none" data-a="lno" data-v="${l.id}">Снять</button>`:''}</div>`).join('')}</div>`:''}
    ${isAdmin && !self && x.role!=='admin' ? `<div class="col" style="gap:6px"><b class="small">Роль</b><div class="seg">${['user','operator','moder'].map(r=>`<button class="${x.role===r?'on':''}" data-a="urole" data-v="${x.id}:${r}">${roleName(r)}</button>`).join('')}</div>
      ${isStaffRole(x.role)?`<span class="tiny dim">${ROLE_CAN[x.role]}</span>`:''}</div>` : ''}
    <div class="grid2">
      <button class="btn ghost sm" data-a="usgo" data-v="seller:${x.id}">${ic('user')}Профиль продавца</button>
      ${canBlock && !self && x.role==='user' ? `<button class="btn sm ${x.blocked?'ghost':'danger'}" data-a="ban" data-v="${x.id}">${x.blocked?'Разблокировать':'Заблокировать'}</button>` : ''}
      ${isAdmin && !self ? `<button class="btn ghost sm" data-a="resetpw" data-v="${x.id}">${ic('lock')}Сбросить пароль</button>
        <button class="btn sm ${x.verified?'ghost':''}" data-a="verify" data-v="${x.id}">${x.verified?'Снять «Проверенный»':'✓ Проверенный продавец'}</button>` : ''}
    </div>
    <button class="btn ghost" data-a="closesheet">Закрыть</button>`);
}

Object.assign(FEATURE_ACTIONS, {
  usf(v){ state.usF = v; render(); },
  usopen(v){ userSheet(v); },
  usgo(v){ closeSheet(); const [k, id] = v.includes(':') ? v.split(':') : ['open', v]; if (k==='seller') go('seller', id); else A.open(id); },
  async urole(v){
    const [id, r] = v.split(':'), x = userById(id), was = x.role;
    if (was===r) return;
    x.role = r; persist(); await syncing;
    if (isStaffRole(was)) await sb.rpc('mb_staff_revoke', {p_uid:id}).then(()=>{}, ()=>{});
    if (isStaffRole(r)){ notify(id, `Вам назначена роль «${roleName(r)}». Откройте Профиль → Админ-панель и запросите доступ — администратор подтвердит вход.`); persist(); }
    toast(`${x.name}: ${roleName(r)}`); STAFF.list = null; userSheet(id); render();
  },
  async staffreq(){
    const {data, error} = await sb.rpc('mb_staff_request', {p_device:deviceName()});
    if (error){ toast(error.message.includes('function') ? 'На сервере нет функции. Админу нужно обновить базу.' : error.message); return; }
    STAFF.status = data; toast(data==='ok' ? 'Доступ уже разрешён' : 'Запрос отправлен администратору'); render();
  },
  async staffcheck(){ await refresh(); toast(STAFF.status==='ok' ? 'Доступ разрешён' : STAFF.status==='no' ? 'Вход отклонён' : 'Пока ждём администратора'); render(); },
  staffreload(){ STAFF.list = null; staffLoad(true); render(); },
  async staffok(sid){ await staffDecide(sid, true); },
  async staffno(sid){ await staffDecide(sid, false); },
  async staffrevoke(uidv){
    const {error} = await sb.rpc('mb_staff_revoke', {p_uid:uidv});
    if (error){ toast('Не получилось: '+error.message); return; }
    notify(uidv, 'Администратор закрыл ваши входы в админ-панель. Чтобы продолжить, запросите доступ снова.'); persist();
    toast('Все входы закрыты'); staffLoad(true);
  }
});

async function staffDecide(sid, ok){
  const r = (STAFF.list||[]).find(x=>x.sid===sid);
  const {error} = await sb.rpc('mb_staff_decide', {p_sid:sid, p_ok:ok});
  if (error){ toast('Не получилось: '+error.message); return; }
  if (r){ notify(r.uid, ok ? 'Администратор разрешил вход в админ-панель на устройстве: '+(r.device||'устройство') : 'Администратор не разрешил вход в админ-панель на устройстве: '+(r.device||'устройство')); persist(); }
  toast(ok ? 'Вход разрешён' : 'Вход отклонён'); staffLoad(true);
}

/* ================== Переводы новых фраз ================== */
Object.assign(TR, {
  'Управляющий':['Dolandyryjy','Manager'], 'Оператор':['Operator','Operator'], 'Пользователь':['Ulanyjy','User'], 'Пользователи':['Ulanyjylar','Users'], 'Сотрудники':['Işgärler','Staff'],
  'Ждём разрешения администратора':['Administratoryň rugsadyna garaşýarys','Waiting for the administrator’s approval'],
  'Администратор не разрешил этот вход':['Administrator bu girişe rugsat bermedi','The administrator did not approve this sign-in'],
  'Вход сотрудника подтверждает администратор':['Işgäriň girişini administrator tassyklaýar','The administrator approves staff sign-ins'],
  'Запросить доступ':['Rugsat sora','Request access'], 'Проверить':['Barla','Check'], 'Отправить запрос ещё раз':['Haýyşy ýene iber','Send the request again'],
  'Почему так':['Näme üçin','Why'], 'Запросы на вход':['Giriş haýyşlary','Sign-in requests'], 'Разрешить':['Rugsat ber','Approve'], 'Отклонить':['Ret et','Reject'],
  'Закрыть все входы':['Ähli girişleri ýap','Close all sign-ins'], 'Роль и профиль':['Rol we profil','Role and profile'], 'Роль':['Rol','Role'], 'Роли':['Rollar','Roles'],
  'Профиль продавца':['Satyjynyň profili','Seller profile'], 'Объявления':['Bildirişler','Listings'], 'Снять':['Aýyr','Remove'], 'Закрыть':['Ýap','Close'],
  'Все':['Hemmesi','All'], 'Новые за 7 дней':['7 günde täze','New in 7 days'], 'Частные':['Hususy','Private'], 'Компании':['Kompaniýalar','Companies'],
  'Проверенные':['Barlanan','Verified'], 'Заблокированные':['Petiklenen','Blocked'], 'Никого нет':['Hiç kim ýok','Nobody here'], 'Попробуйте другой фильтр':['Başga süzgüç saýlaň','Try another filter'],
  'Имя, телефон или компания':['Ady, telefony ýa-da kompaniýa','Name, phone or company'], 'Загружаем запросы…':['Haýyşlar ýüklenýär…','Loading requests…'],
  'Сейчас нет разрешённых входов':['Häzir rugsat berlen giriş ýok','No approved sign-ins now'],
  'Доступ разрешён':['Rugsat berildi','Access approved'], 'Вход отклонён':['Giriş ret edildi','Sign-in rejected'], 'Пока ждём администратора':['Administratora garaşýarys','Still waiting for the administrator'],
  'Запрос отправлен администратору':['Haýyş administratora iberildi','Request sent to the administrator'], 'Вход разрешён':['Giriş rugsat edildi','Sign-in approved'], 'Все входы закрыты':['Ähli girişler ýapyldy','All sign-ins closed'],
  'Это защита от мошенников: даже если кто-то узнает ваш пароль и войдёт, без разрешения админа он не увидит панель и ничего не сможет изменить. После «Выйти» разрешение пропадает.':['Bu galplardan gorag: kimdir biri parolyňyzy bilip girse-de, adminiň rugsady bolmasa paneli görmez we hiç zady üýtgedip bilmez. «Çykmak» basylandan soň rugsat aýrylýar.','This protects against fraud: even if someone learns your password and signs in, without the admin’s approval they won’t see the panel or change anything. Signing out removes the approval.'],
  'Разрешайте, только если точно знаете, что это сотрудник входит сам (позвоните ему).':['Diňe işgäriň özüdigini anyk bilseňiz rugsat beriň (oňa jaň ediň).','Approve only if you are sure it is the staff member (call them).']
});
TR_SUB.splice(0, TR_SUB.length, ...Object.keys(TR).filter(k => k.length >= 6 && /[ «»:,.→₽]/.test(k)).sort((a,b) => b.length - a.length));
