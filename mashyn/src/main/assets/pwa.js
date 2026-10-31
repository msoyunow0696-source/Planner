/* =====================================================
   Веб-версия как приложение: установка на iPhone и Windows.
   Windows, Android-браузер: кнопка «Установить» (событие beforeinstallprompt).
   iPhone: подсказка «Поделиться → На экран „Домой“» — другого способа Safari не даёт.
   В Android-приложении (есть мост MBAndroid) и в уже установленной версии ничего не показываем.
   Подключается после features-plus.js, дополняет FEATURE_ACTIONS.
   ===================================================== */
const IN_APK = !!window.MBAndroid;
const IS_IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_ANDROID = /Android/i.test(navigator.userAgent);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
let installEvt = null;   // отложенное предложение браузера установить приложение

const canInstall = () => !IN_APK && !isStandalone() && /^https?:$/.test(location.protocol) && (!!installEvt || IS_IOS);
const installHint = () => IS_IOS ? 'Значок на экране «Домой» — открывается как приложение'
  : IS_ANDROID ? 'Значок на главном экране — открывается как приложение'
  : 'Своё окно и значок на рабочем столе — как обычная программа';
const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICON_INSTALL = svg('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>');
const ICON_SHARE = svg('<path d="M12 15V3M8 7l4-4 4 4"/><path d="M8 11H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2"/>');

// Карточка на главной: можно скрыть на 30 дней
function installCard(){
  if (!canInstall() || lsGet('mb_installhide', 0) > now() - 30*DAY) return '';
  return `<div class="card pad col" style="gap:12px;border-color:var(--accent)">
    <div class="row" style="gap:12px;align-items:flex-start">
      <img src="app-192.png" alt="" style="width:46px;height:46px;border-radius:12px;flex:none">
      <span style="flex:1;min-width:0"><b>Установите Alpha Drive</b><br><span class="small dim">${installHint()}</span></span>
      <button class="icon-btn" data-a="installhide" aria-label="Скрыть">${ic('x')}</button>
    </div>
    <button class="btn sm" data-a="install">${ICON_INSTALL}Установить</button></div>`;
}
// Пункт в профиле — виден, пока приложение не установлено
const installItem = () => canInstall()
  ? `<button data-a="install">${ICON_INSTALL}<span class="grow">Установить приложение<br><span class="tiny dim">${installHint()}</span></span></button>` : '';

function iosInstallSheet(){
  const step = (n, title, hint, icon='') => `<div class="row" style="gap:12px;align-items:flex-start">
    <span class="num" style="width:30px;height:30px;border-radius:50%;display:grid;place-items:center;flex:none;background:var(--accent);color:var(--on);font-weight:700">${n}</span>
    <span style="flex:1"><b>${title}</b>${icon?` <span style="display:inline-grid;vertical-align:-5px;width:22px;height:22px;color:var(--accent)">${icon}</span>`:''}<br><span class="small dim">${hint}</span></span></div>`;
  openSheet(`<div class="between"><h2>Установка на iPhone</h2><button class="icon-btn" data-a="closesheet" aria-label="Закрыть">${ic('x')}</button></div>
    ${step(1, 'Нажмите «Поделиться»', 'Значок внизу экрана Safari. Если его не видно — сначала нажмите «•••»', ICON_SHARE)}
    ${step(2, 'Выберите «На экран „Домой“»', 'Если пункта не видно, прокрутите список вниз')}
    ${step(3, 'Нажмите «Добавить»', 'Значок Alpha Drive появится на экране «Домой»')}
    <p class="small dim" style="margin:0">Ссылку открыли в Telegram или Instagram? Сначала откройте её в Safari.</p>
    <button class="btn" data-a="closesheet">Понятно</button>`);
}

Object.assign(FEATURE_ACTIONS, {
  async install(){
    if (installEvt){
      // Окно браузера можно показать только один раз; если откажутся, браузер предложит снова позже
      const e = installEvt; installEvt = null;
      e.prompt();
      await e.userChoice.catch(() => {});
      render();
    } else if (IS_IOS) iosInstallSheet();
  },
  installhide(){ lsSet('mb_installhide', now()); render(); }
});

// Перерисовать главную или профиль, когда браузер разрешил установку (не мешая вводу текста)
const pwaRefresh = () => {
  const cur = typeof stack !== 'undefined' && stack[stack.length-1];
  if (cur && ['home', 'profile'].includes(cur.name) && !document.activeElement?.matches('input,textarea,select')) render();
};

if (!IN_APK){
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; pwaRefresh(); });
  addEventListener('appinstalled', () => { installEvt = null; toast('Приложение установлено'); pwaRefresh(); });
  if ('serviceWorker' in navigator && window.isSecureContext)
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

  // «Назад» браузера и телефона ведёт по экранам приложения, а не прочь с сайта.
  // Над страницей держим одну запись в истории: «Назад» снимает её — обрабатываем и ставим снова.
  let armed = false;
  const arm = () => { if (!armed){ history.pushState({ad: 1}, ''); armed = true; } };
  addEventListener('click', arm, true);   // только после нажатия пользователя, иначе браузер такую запись пропускает
  addEventListener('popstate', () => { if (armed){ armed = false; sysBack(); arm(); } });
  // «Да» в вопросе «Выйти?»: установленное приложение закрываем, в браузере — уходим на прошлую страницу
  window.pwaExit = () => { armed = false; window.close(); setTimeout(() => history.go(-2), 150); };

  // Цвет строки состояния и заголовка окна — под тему приложения
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) new MutationObserver(() => {
    const c = getComputedStyle(document.body).getPropertyValue('--bg1').trim();
    if (c) meta.content = c;
  }).observe(document.body, {attributes: true, attributeFilter: ['data-t']});
}

Object.assign(TR, {
  'Установите Alpha Drive':['Alpha Drive-y guruň','Install Alpha Drive'],
  'Установить':['Gurnamak','Install'],
  'Установить приложение':['Programmany gurnamak','Install the app'],
  'Значок на экране «Домой» — открывается как приложение':['«Öý» ekranynda nyşan — programma ýaly açylýar','An icon on your Home Screen — opens like an app'],
  'Значок на главном экране — открывается как приложение':['Baş ekranda nyşan — programma ýaly açylýar','An icon on your home screen — opens like an app'],
  'Своё окно и значок на рабочем столе — как обычная программа':['Aýratyn penjire we iş stolunda nyşan — adaty programma ýaly','Its own window and a desktop icon — like a regular program'],
  'Установка на iPhone':['iPhone-a gurnamak','Install on iPhone'],
  'Нажмите «Поделиться»':['«Поделиться» (Share) düwmesine basyň','Tap “Share”'],
  'Значок внизу экрана Safari. Если его не видно — сначала нажмите «•••»':['Nyşan Safari-niň aşagynda. Görünmese — ilki «•••» basyň','The icon is at the bottom of Safari. If you can’t see it, tap “•••” first'],
  'Выберите «На экран „Домой“»':['«На экран „Домой“» (Add to Home Screen) saýlaň','Choose “Add to Home Screen”'],
  'Если пункта не видно, прокрутите список вниз':['Görünmese, sanawy aşak süýşüriň','If you can’t see it, scroll down the list'],
  'Нажмите «Добавить»':['«Добавить» (Add) basyň','Tap “Add”'],
  'Значок Alpha Drive появится на экране «Домой»':['Alpha Drive nyşany «Öý» ekranynda peýda bolar','The Alpha Drive icon will appear on your Home Screen'],
  'Ссылку открыли в Telegram или Instagram? Сначала откройте её в Safari.':['Salgyny Telegram ýa-da Instagram-da açdyňyzmy? Ilki ony Safari-de açyň.','Opened the link in Telegram or Instagram? Open it in Safari first.'],
  'Приложение установлено':['Programma gurnaldy','App installed'],
  'Скрыть':['Gizlemek','Hide'],
  'Выйти из приложения?':['Programmadan çykmalymy?','Exit the app?'],
  'Нет':['Ýok','No']
});
TR_SUB.splice(0, TR_SUB.length, ...Object.keys(TR).filter(k => k.length >= 6 && /[ «»:,.→₽]/.test(k)).sort((a,b) => b.length - a.length));
