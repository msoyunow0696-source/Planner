/* =====================================================
   Помощник: чат, который подбирает объявления по обычной фразе
   («нужна Камри до 20 000, автомат, не старше 2015») и отвечает
   на частые вопросы. Чего не понял — передаёт оператору
   (обращение в поддержку с темой «Помощник»), ответ приходит сюда же.
   Работает без нейросети, прямо в телефоне.
   Подключается после staff.js.
   ===================================================== */
SUP_TOPICS.push('Помощник');
let BOT = lsGet('mb_bot', []);          // переписка: [{who:'me'|'bot', text, time, ids?, crit?, sup?, btn?}]
const botSave = () => { BOT = BOT.slice(-40); lsSet('mb_bot', BOT); };
const botSay = (text, extra={}) => BOT.push({who:'bot', text, time:now(), ...extra});

/* ================== Разбор фразы ================== */
const norm = s => ' ' + String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[«»"!?.,;:()]/g,' ').replace(/\s+/g,' ') + ' ';
// Как люди пишут марки и модели по-русски (окончания отрезаем при сравнении)
const BRAND_SAY = {Toyota:'тойота тоета тайота toyota toýota toyta', Lexus:'лексус lexus leksus', Hyundai:'хендай хундай хюндай хендэ hyundai hýundaý hundai hundaý', Kia:'киа kia kiýa', Mercedes:'мерседес мерс мерин mercedes mersedes',
  'Mercedes-Benz':'мерседес мерс mercedes mersedes', BMW:'бмв бэха bmw', Chevrolet:'шевроле шевролет chevrolet chevy şewrolet şewrole sewrolet', Nissan:'ниссан нисан nissan', Honda:'хонда honda', Lada:'лада ваз жигули lada žiguli jiguli',
  Volkswagen:'фольксваген volkswagen vw folksvagen folkswagen', Ford:'форд ford', Mazda:'мазда mazda', Audi:'ауди audi', Daewoo:'дэу деу daewoo deu', Mitsubishi:'митсубиси мицубиси mitsubishi mitsubişi',
  Subaru:'субару subaru', Opel:'опель opel', Gaz:'газель gaz', GAZ:'газель gaz', Geely:'джили geely', Chery:'чери chery', Haval:'хавал haval', Infiniti:'инфинити infiniti', Porsche:'порше porsche', Tesla:'тесла tesla'};
const MODEL_SAY = {'Camry':'камри камрю kamri kamry', 'Corolla':'королла корола korolla korola', 'Land Cruiser':'крузак крузер ленд kruzak kruzer', 'Land Cruiser Prado':'прадо prado', 'RAV4':'рав4 рав', 'Highlander':'хайлендер хайландер haýlender haýlander hailender',
  'Sequoia':'секвойя секвоя sekwoýa sekwoya', 'Tundra':'тундра', '4Runner':'форанер раннер', 'Avalon':'авалон', 'Yaris':'ярис', 'Hilux':'хайлюкс хайлакс', 'Sonata':'соната', 'Elantra':'элантра',
  'Accent':'акцент aksent akcent', 'Solaris':'солярис', 'Tucson':'туксон тусон', 'Santa Fe':'сантафе санта', 'Optima':'оптима', 'Sportage':'спортейдж спортаж sportaž sportaj', 'Rio':'рио', 'Sorento':'соренто',
  'Nexia':'нексия нексиа nekseýa neksiýa neksiya', 'Cobalt':'кобальт kobalt', 'Lacetti':'лачетти лацетти laçetti lasetti', 'Gentra':'джентра жентра jentra', 'Malibu':'малибу', 'Cruze':'круз', 'Spark':'спарк', 'Damas':'дамас',
  'Captiva':'каптива kaptiwa', 'Tahoe':'тахо taho', 'Altima':'альтима', 'Patrol':'патрол', 'X-Trail':'икстрейл', 'Accord':'аккорд', 'Civic':'цивик', 'CR-V':'црв', 'Priora':'приора',
  'Niva':'нива', 'Granta':'гранта', 'Vesta':'веста', 'Gelandewagen':'гелик гелендваген gelik', 'G-Class':'гелик гелендваген gelik gelendwagen', 'E-Class':'ешка'};
const stem = w => w.length > 4 ? w.slice(0, w.length - 1) : w;
const hasWord = (txt, words) => words.split(' ').some(w => w && (w.length <= 3 ? txt.includes(' '+w+' ') : txt.includes(' '+stem(w))));
const allBrands = () => { const m = {}; for (const g of Object.values(CATALOG)) for (const [b, ms] of Object.entries(g)) m[b] = ms; return m; };

// Города по-туркменски (в приложении они записаны по-русски)
const TM_PLACES = {'Ашхабад':['Aşgabat','Ashgabat'], 'Ахалский велаят':['Änew','Tejen','Kaka','Sarahs','Bäherden','Gökdepe','Babadaýhan'],
  'Балканский велаят':['Balkanabat','Türkmenbaşy','Awaza','Gyzylarbat','Serdar','Etrek','Esenguly','Magtymguly','Bereket'],
  'Дашогузский велаят':['Daşoguz','Köneürgenç','Görogly','Gubadag','Boldumsaz','Akdepe','Şabat'],
  'Лебапский велаят':['Türkmenabat','Çärjew','Kerki','Farap','Halaç','Saýat','Döwletli','Darganata','Köýtendag'],
  'Марыйский велаят':['Mary','Baýramaly','Murgap','Sakarçäge','Tagtabazar','Wekilbazar','Ýolöten','Türkmengala','Oguzhan']};
const CAMRY_NICK = [
  [/ (listi[cčç]?[hk]?ka|listiçka|листичка|листочка)/, 1996, 2001],
  [/ (bab[yi][cčç]?[hk]?ka|babyçka|бабочка|бабичка|бабычка)/, 2001, 2003],
  [/ (dut[yýi]|duty|дуты[йе]?|дутая|дутыш)/, 2003, 2005],
  [/ ([oö]k[uü]z ?kelle|öküz kelle|окуз келле|бычья голова)/, 2005, 2007],
  [/ (palta|палта|пальто)/, 2007, 2010]];
function parseCar(text){
  let s = norm(text); const c = {};
  const brands = allBrands();
  // Раздел
  if (/ (мото|мотоцикл|скутер|мопед|квадро|байк|питбайк|motosikl|motorcycle|moped|skuter)/.test(s)) c.sec = 'moto';
  else if (/ (запчаст|шины|шину|резин|диски|аккумулятор|бампер|фары|parts|zapças|ehtiýat şaý|teker|şina)/.test(s)) c.sec = 'parts';
  else if (/ (аренд|прокат|напрокат|kärende|kärendä|kirä|arenda|rent)/.test(s)) c.sec = 'rent';
  else if (/ (пригон|из-за рубеж|из оаэ|из кореи|из сша|из китая|растамож|daşary ýurt|import|getiril)/.test(s)) c.sec = 'import';
  // Марка и модель
  for (const [b, ms] of Object.entries(brands)){
    const say = BRAND_SAY[b] || b.toLowerCase() + ' ' + (BRAND_CYR[b] || '');
    if (hasWord(s, say.trim())){ c.brand = b; break; }
  }
  const pool = c.brand ? [[c.brand, brands[c.brand]]] : Object.entries(brands);
  // «крузак» — это любой Land Cruiser: по прозвищу ищем по началу названия модели
  const flat = s.replace(/[-\s]/g,'');
  outer: for (const [b, ms] of pool) for (const m of [...ms].sort((x,y)=>y.length-x.length)){
    if (s.includes(' '+m.toLowerCase()+' ') || (m.length > 3 && flat.includes(m.toLowerCase().replace(/[-\s]/g,'')))){ c.model = m; c.brand = c.brand || b; break outer; }
    const key = Object.keys(MODEL_SAY).filter(k => m.startsWith(k)).sort((x,y)=>y.length-x.length)[0];
    if (key && hasWord(s, MODEL_SAY[key])){ c.model = key; c.brand = c.brand || b; break outer; }
  }
  // Народные прозвища Камри по поколениям (их пишут по-разному)
  for (const [re, y1, y2] of CAMRY_NICK) if (re.test(s)){ c.brand = 'Toyota'; c.model = 'Camry'; c.ymin = c.ymin || y1; c.ymax = c.ymax || y2; s = s.replace(re, ' '); break; }
  // Цена: «до 20 000», «20 тыс», «20к», «от 10 до 15 тысяч», «бюджет 12000»
  const num = (n, u) => { let v = Number(String(n).replace(/[\s.,]/g,'')); if (/^(тыс|к|k|müň)/.test(u||'') || (v < 1000 && /тыс|к|k/.test(u||''))) v *= 1000; return v; };
  const P = '(\\d{1,3}(?:[\\s.,]\\d{3})+|\\d+)\\s*(тыс[а-я]*|к|k|müň)?(?=\\s|$|tmt|ман|man)';
  let m = s.match(new RegExp(' от ' + P + '\\s*до ' + P));
  if (m){ const a = num(m[1], m[2] || m[4]), b = num(m[3], m[4]); if (a > 1990 || a < 1950) c.pmin = a; c.pmax = b; }
  m = s.match(new RegExp(' (до|дешевле|не дороже|максимум|бюджет|за|в пределах|under|çenli|budget) ' + P));
  if (m && !c.pmax){ const v = num(m[2], m[3]); if (!(v >= 1950 && v <= 2035 && !m[3])) c.pmax = v; }
  if (!c.pmax){ m = s.match(/ (\d+)\s*(тыс[а-я]*|к|k) /); if (m) c.pmax = num(m[1], m[2]); }
  // Туркменский: «10 000-den 15 000-e çenli», «20 müň manada çenli», «2015-den täze», «2010-dan köne»
  const PT = '(\\d{1,3}(?:[\\s.,]\\d{3})+|\\d+)\\s*(müň|k)?', W = '[-a-zçäöüýňşž]*', MAN = '(?:mana[td][a-zçäöüýňşž]*\\s*|tmt\\s*)?';
  const Y = '(19[5-9]\\d|20[0-3]\\d)(?:-?n?j?[iy])?(?: ýyl[a-zçäöüýňşž]*)?-?(?:d[aäe]n|ýyldan)?';
  let t = s.match(new RegExp(' ' + Y + ' (täze|ýokary|soň|bäri|has täze)'));
  if (t){ c.ymin = Number(t[1]); s = s.replace(t[0], ' '); }
  t = s.match(new RegExp(' ' + Y + ' (köne|öň|aşak)'));
  if (t){ c.ymax = Number(t[1]); s = s.replace(t[0], ' '); }
  t = s.match(new RegExp(' ' + PT + '-?d[aäe]n\\s*' + MAN + PT + W + '\\s*' + MAN + '(?:çenli|çen)'));
  if (t){ c.pmin = num(t[1], t[2]); c.pmax = num(t[3], t[4]); s = s.replace(t[0], ' '); }
  t = s.match(new RegExp(' ' + PT + W + '\\s*' + MAN + '(?:çenli|çen|aşak)'));
  if (t && !c.pmax){ const v = num(t[1], t[2]); if (!(v >= 1950 && v <= 2035 && !t[2])){ c.pmax = v; s = s.replace(t[0], ' '); } }
  // Год: «не старше 2015», «от 2015», «2015+», «после 2015», «до 2010 года»
  m = s.match(/ (не старше|от|после|свежее|новее|с|from) (19[5-9]\d|20[0-3]\d)/) || s.match(/ (19[5-9]\d|20[0-3]\d) ?\+/);
  if (m) c.ymin = Number(m[2] || m[1]);
  m = s.match(/ (до|старше|не новее) (19[5-9]\d|20[0-3]\d) (г|год)/);
  if (m) c.ymax = Number(m[2]);
  if (!c.ymin && !c.ymax){ m = s.match(/ (19[5-9]\d|20[0-3]\d)( г| год| года| goda| ýyl)? /); if (m && !(c.pmax === Number(m[1]))){ c.ymin = Number(m[1]) - 1; c.ymax = Number(m[1]) + 1; } }
  // Коробка, топливо, кузов, состояние
  if (/ (автомат|акпп|automatic|awtomat)/.test(s)) c.gear = 'АКПП';
  else if (/ (механик|мкпп|ручн|manual|mehani)/.test(s)) c.gear = 'МКПП';
  else if (/ (вариатор|wariator|variator)/.test(s)) c.gear = 'Вариатор';
  if (/ (дизел|солярк|diesel|dizel|dizil)/.test(s)) c.fuel = 'Дизель';
  else if (/ (газ |метан|пропан|на газу|gaz |gazda|propan|metan)/.test(s)) c.fuel = 'Газ/бензин';
  else if (/ (гибрид|hybrid|gibrid)/.test(s)) c.fuel = 'Гибрид';
  else if (/ (электро|электрич|electric|elektro|elektrik)/.test(s)) c.fuel = 'Электро';
  if (!c.fuel && / (бензин|benzin)/.test(s)) c.fuel = 'Бензин';
  if (/ (седан|sedan)/.test(s)) c.body = 'Седан';
  else if (/ (внедорож|джип|кроссовер|suv|jeep|jip)/.test(s)) c.body = 'Внедорожник';
  else if (/ (хэтчбек|хетчбек|hatchback|hetçbek|heçbek|hetchbek)/.test(s)) c.body = 'Хэтчбек';
  else if (/ (универсал|wagon|uniwersal|universal)/.test(s)) c.body = 'Универсал';
  else if (/ (минивэн|минивен|minivan|семейн|miniwen|miniven)/.test(s)) c.body = 'Минивэн';
  else if (/ (пикап|pickup|pikap)/.test(s)) c.body = 'Пикап';
  if (/ (нов(ый|ую|ая|ое) |новень|täze |new )/.test(s) && !/ (не нов|новее)/.test(s)) c.usage = 'new';
  else if (/ (с пробегом|б\/у|бу |подержан|used|ulanylan|ulanylyp|köne)/.test(s)) c.usage = 'used';
  if (/ (кредит|рассрочк|kredit|karz|nesýe)/.test(s)) c.credit = 'yes';
  if (/ (обмен|swap|çalyş|çalşyk|obmen)/.test(s)) c.swap = 'yes';
  // Регион
  for (const r of REGIONS){
    const say = [r.short, r.tm.replace(/ welaýaty$/,''), r.en, ...r.places, ...(TM_PLACES[r.k]||[])].map(x=>x.toLowerCase().replace(/ /g,''));
    const ss = s.replace(/ (велаят|welaýat)[а-яa-zçäöüýňşž]*/g,' ');
    if (say.some(w => w.length >= 4 ? ss.includes(' '+w) : ss.includes(' '+w+' ')) || hasWord(ss, say.join(' '))){ c.reg = r.k; break; }
  }
  return c;
}
const critKeys = c => Object.keys(c).filter(k => c[k] !== undefined && c[k] !== '');
const wantsCar = s => / (ищу|нужн|хочу|подбер|подскаж|покаж|найд|есть ли|куп|машин|авто|тачк|maşyn|awtoulag|ulag|gerek|isleýän|gözleý|satyn|alaýyn|almak|need|looking|want|car)/.test(s);

function findCars(c){
  const sec = c.sec || 'cars';
  const ok = l => visible(l) && (sec==='cars' ? CAR_SECS.includes(l.sec) : l.sec===sec);
  const test = (l, cr) => { const sp = l.specs || {};
    if (cr.brand && ![sp.brand, sp.tbrand, sp.pbrand].includes(cr.brand)) return false;
    if (cr.model && !String(sp.model||'').toLowerCase().startsWith(cr.model.toLowerCase()) && !l.title.toLowerCase().includes(cr.model.toLowerCase())) return false;
    if (cr.pmax && !(l.price && l.price <= cr.pmax)) return false;
    if (cr.pmin && !(l.price >= cr.pmin)) return false;
    if (cr.ymin && (sp.year||0) < cr.ymin) return false;
    if (cr.ymax && (sp.year||9999) > cr.ymax) return false;
    for (const k of ['gear','fuel','body','usage','credit','swap']) if (cr[k] && !String(sp[k]||'').split(', ').includes(cr[k])) return false;
    if (cr.reg && l.reg !== cr.reg) return false;
    return true; };
  const base = S.listings.filter(ok);
  let hits = base.filter(l => test(l, c)), soft = '';
  // Ничего не нашли — смягчаем условия по очереди и говорим, что именно
  const steps = [['reg','в других регионах'],['ymin','чуть старше'],['ymax','чуть новее'],['gear','с другой коробкой'],['fuel','на другом топливе'],['body','в другом кузове'],['pmax','чуть дороже']];
  let cr = {...c};
  for (const [k, why] of steps){
    if (hits.length) break;
    if (!cr[k]) continue;
    if (k==='pmax') cr.pmax = Math.round(cr.pmax * 1.25); else if (k==='ymin') cr.ymin -= 2; else if (k==='ymax') cr.ymax += 2; else delete cr[k];
    hits = base.filter(l => test(l, cr)); soft = why;
  }
  return {hits:rank(hits), soft, crit:cr, sec};
}

const critText = c => [c.brand && (c.brand + (c.model ? ' ' + c.model : '')), c.body, c.gear, c.fuel, c.usage && USAGE[c.usage],
  c.ymin && c.ymax && c.ymax - c.ymin <= 2 ? `${c.ymin}–${c.ymax} г.` : c.ymin ? `от ${c.ymin} г.` : c.ymax ? `до ${c.ymax} г.` : '',
  c.pmin ? `от ${fmt(c.pmin)} TMT` : '', c.pmax ? `до ${fmt(c.pmax)} TMT` : '', c.credit && 'в кредит', c.swap && 'обмен', c.reg && regShort(c.reg)].filter(Boolean).join(', ');

/* ================== Частые вопросы ================== */
const faqA = q => (FAQ.find(f => f[0]===q) || [,''])[1];
const BOT_FAQ = [
  [/ (как|где|хочу) .*(подать|разместить|выставить|продать|добавить)|подать объявлен|разместить объявлен|bildiriş goý|bildiriş ber|nädip sat|bildirişi nädip/, () => faqA('Как подать объявление?'), ['Подать объявление','tab','post']],
  [/ (сколько стоит|цена|платн|бесплатн).*(размещ|объявлен|подписк)|подписк|тариф|abuna|näçe dur|tölegli|mugt/, () => S.settings.mode==='free' ? 'Нажмите красную кнопку «+» внизу, выберите раздел и заполните поля. Объявление публикуется на 30 дней, потом его можно продлить.' : faqA('Сколько стоит размещение?') + ( ' Цены — в Профиль → Подписки.'), ['Цены и подписки','tab','plans']],
  [/ на проверке|почему .*(провер|скрыт|отклон)| barlag/, () => faqA('Почему объявление «На проверке»?')],
  [/ продлить|срок .*(кончил|закончил|истек)| uzalt| möhlet/, () => faqA('Как продлить объявление?')],
  [/ (пароль|забыл|не могу войти|parol)/, () => faqA('Я забыл пароль'), ['Восстановить пароль','forgot']],
  [/ (мошен|обман|кинул|развод|предоплат|безопасн|galp|aldaw|aldan|howpsuz)/, () => faqA('Как не попасть на мошенника?')],
  [/ (уведом|сообщ.* о нов|первым узна|habarnama|habar ber)/, () => faqA('Как узнать о новых машинах первым?')],
  [/ (написать продавц|связаться|номер продавц|позвонить продавц|satyja|satyjy bilen|jaň et)/, () => faqA('Как написать продавцу?')],
  [/ (изменить цену|снизить цену|продано|продал|bahasyny üýtget|satyldy|satdym)/, () => faqA('Как изменить цену или отметить «Продано»?')],
  [/ (отзыв|teswir)/, () => faqA('Как оставить отзыв о продавце?')],
  [/ удалить (аккаунт|профил)| hasab[a-zýňş]* (poz|aýyr)/, () => faqA('Как удалить аккаунт?')],
  [/ (сколько стоит моя|оценить|оценк|за сколько продать|maşynym näçe|näçä sat|bahala)/, () => 'Посчитаю среднюю цену по похожим объявлениям — нажмите кнопку ниже.', ['Сколько стоит моя машина?','estimate']],
  [/ (vip|вип|топ|поднять|продвиж|выделить)/, () => S.settings.mode==='free' ? 'VIP-объявления сейчас выбирает администратор.' : 'Продвижение: ' + PROMOS.map(p => `${p.n} — ${p.price} TMT`).join('; ') + '. Кнопка «Продвинуть» — в вашем объявлении.'],
  [/ (vin|вин-код|вин код)/, () => 'VIN — 17 знаков. Если продавец указал VIN, в объявлении видно страну, марку и год. Проверяйте, что VIN на машине совпадает с документами.'],
  [/ (телефон поддержк|контакт|как связаться с вами|номер поддержк|goldaw|telefon belgi)/, () => `Служба поддержки: ${fmtPhone(supPhone())}. Работаем каждый день с 09:00 до 21:00.`, ['Служба поддержки','support']]
];
const OPERATOR_RE = / (оператор|живой человек|менеджер|operator)/;

/* ================== Ответ помощника ================== */
function botReply(text){
  const s = norm(text);
  if (OPERATOR_RE.test(s) && !/ (как|сколько|телефон|номер|контакт)/.test(s)) return botSay('Помощник отвечает сам. Напишите, какую машину ищете, — например: «Toyota Camry до 20 000, автомат», или задайте вопрос о приложении.');
  for (const [re, ans, btn] of BOT_FAQ) if (re.test(s)) return botSay(ans(), btn ? {btn} : {});
  if (/ (привет|здравств|салам|salam|hello|hi |добрый|ýagşy|gutlaýar)/.test(s) && s.length < 30) return botSay('Здравствуйте! Напишите, какую машину ищете — модель, бюджет, год, коробку, город. Подберу объявления.');
  if (/ (спасибо|сагбол|sag bol|sagbol|minnetdar|thanks)/.test(s)) return botSay('Пожалуйста! Если что-то ещё — пишите.');

  let c = parseCar(text);
  // «а подешевле?», «а автомат?», «только в Ашхабаде» — уточняем прошлый поиск
  const last = [...BOT].reverse().find(m => m.crit);
  if (last && /^ (а|и|еще|только|лучше|можно|подешевле|дешевле|подороже|новее|свежее|has|diňe|ýene|arzanrak|täzeräk) /.test(s) && !c.brand && !c.model){
    const prev = {...last.crit}, prices = (last.ids||[]).map(id => S.listings.find(l=>l.id===id)?.price).filter(Boolean);
    if (/ (подешевле|дешевле|arzanrak|has arzan)/.test(s) && !c.pmax) c.pmax = Math.round((prev.pmax || Math.min(...prices, 1e9)) * 0.85) || undefined;
    if (/ (новее|свежее|täzeräk|has täze)/.test(s) && !c.ymin) c.ymin = (prev.ymin || 2010) + 3;
    c = {...prev, ...c};
  }
  if (!critKeys(c).length && !wantsCar(s)) return botFallback();
  if (!critKeys(c).length) return botSay('Подскажите подробнее: какая марка или кузов, бюджет, год? Например: «Седан до 15 000, автомат, не старше 2012».');

  const r = findCars(c);
  if (!r.hits.length){
    return botSay(`По запросу «${critText(c)}» сейчас объявлений нет. Сохраните поиск — придёт уведомление, когда появится. Или напишите иначе.`, {crit:c, sec:r.sec, btn:['Сообщить, когда появится','helperalert']});
  }
  const top = r.hits.slice(0, 5);
  const intro = r.soft ? `Точно по запросу ничего нет. Нашёл похожие — ${r.soft}:` : `Нашёл ${r.hits.length} ${plural(r.hits.length, 'объявление', 'объявления', 'объявлений')}${critText(r.crit) ? ' — ' + critText(r.crit) : ''}:`;
  botSay(intro, {ids:top.map(l=>l.id), crit:r.crit, sec:r.sec, total:r.hits.length});
}
const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a===1 && b!==11 ? one : a>=2 && a<=4 && (b<10 || b>=20) ? few : many; };

function botFallback(){
  botSay('Не понял. Я подбираю машины и отвечаю на частые вопросы о приложении. Напишите иначе — например: «Седан до 15 000, автомат» или «Как подать объявление?».', {miss:1});
}

// Передаём вопрос оператору: обращение в поддержку с последними сообщениями из чата
function botHandoff(){
  const u = me();
  if (!u) return botSay('Чтобы оператор ответил, войдите в аккаунт.', {btn:['Войти','auth','login']});
  const open = S.support.find(x => x.uid===u.id && x.topic==='Помощник' && x.status==='open');
  if (open) return botSay('Ваш вопрос уже у оператора. Ответ придёт в уведомления и сюда, в этот чат.');
  const asked = BOT.filter(m => m.who==='me').slice(-4).map(m => '— ' + m.text).join('\n');
  const text = ('Вопрос из чата-помощника:\n' + (asked || '— Пользователь просит связаться с оператором')).slice(0, 1000);
  const sup = {id:uid(), uid:u.id, topic:'Помощник', text, time:now(), status:'open', reply:''};
  S.support.push(sup); persist();
  botSay('Передал оператору. Он ответит в течение дня (с 09:00 до 21:00) — ответ придёт в уведомления и сюда.', {sup:sup.id});
}

/* ================== Экран ================== */
const botCar = l => `<button class="card row" style="gap:10px;padding:8px;text-align:left;width:100%" data-a="open" data-v="${l.id}">
  <div style="width:72px;height:54px;border-radius:10px;overflow:hidden;flex:none">${mainPic(l)}</div>
  <div style="flex:1;min-width:0"><b class="small" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(l.title)}</b>
  <span class="small num" style="color:var(--accent);font-weight:700">${esc(priceText(l))}</span><br><span class="tiny dim">${[l.specs?.year, l.specs?.gear, placeText(l)].filter(Boolean).map(esc).join(' · ')}</span></div></button>`;
const HELPER_CHIPS = ['Седан до 15 000 TMT', 'Внедорожник в Ашхабаде', 'Toyota Camry, автомат', 'Как подать объявление?', 'Как не попасть на мошенника?'];

Object.assign(FEATURE_SCREENS, {
  helper(){
    if (!BOT.length){ botSay('Здравствуйте! Я помощник AlphaCars TM. Напишите, какую машину ищете, — например: «Нужна Камри до 20 000, автомат, не старше 2015». Или задайте вопрос о приложении.'); botSave(); }
    const u = me();
    return {title:'Помощник', html:`
      <div class="card pad row small" style="gap:10px">${ic('chat','style="width:22px;height:22px;color:var(--accent);flex:none"')}<span class="dim">Подбираю объявления и отвечаю на частые вопросы. Можно писать по-туркменски и по-русски.</span></div>
      <div class="chat" id="botbox">${BOT.map(m => {
        if (m.who==='me') return `<div class="bubble me"><span>${esc(m.text)}</span><span class="tiny">${timeStr(m.time)}</span></div>`;
        const cars = (m.ids||[]).map(id => S.listings.find(l=>l.id===id)).filter(Boolean);
        const sup = m.sup && S.support.find(x=>x.id===m.sup);
        return `<div class="bubble" style="max-width:92%;gap:8px"><span>${esc(m.text)}</span>
          ${cars.length?`<div class="col" style="gap:6px">${cars.map(botCar).join('')}</div>`:''}
          ${m.total>cars.length?`<button class="btn sm ghost" data-a="helperall" data-v="${BOT.indexOf(m)}">Показать все (${m.total})</button>`:''}
          ${m.btn && m.btn[1]!=='helperop'?`<button class="btn sm ${m.btn[1]==='helperop'?'':'ghost'}" data-a="helperbtn" data-v="${BOT.indexOf(m)}">${esc(m.btn[0])}</button>`:''}
          <span class="tiny">${timeStr(m.time)}</span></div>
          ${sup&&sup.reply?`<div class="bubble" style="border:1px solid var(--ok)"><span><b style="color:var(--ok)">Оператор:</b> ${esc(sup.reply)}</span></div>`:''}`; }).join('')}</div>
      <div class="chips">${HELPER_CHIPS.map(q=>`<button class="chip" data-a="helperask" data-v="${esc(q)}">${esc(q)}</button>`).join('')}</div>
      <div class="chat-input"><textarea id="bot_text" class="inp" maxlength="300" rows="1" placeholder="Что ищете?" aria-label="Сообщение помощнику"></textarea>
        <button class="btn" data-a="helpersend" aria-label="Отправить">${ic('up','style="transform:rotate(90deg)"')}</button></div>
      <div class="between"><span></span><button class="link tiny" data-a="helperclear">Очистить чат</button></div>`,
      after(){
        $('#botbox')?.lastElementChild?.scrollIntoView({block:'end'});
        const ta = $('#bot_text');
        ta.addEventListener('keydown', e => { if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); A.helpersend(); } });
        // Ждём ответ оператора, пока чат открыт
        const waiting = BOT.some(m => m.sup && !S.support.find(x=>x.id===m.sup)?.reply);
        clearInterval(botTimer);
        if (waiting) botTimer = setInterval(async () => {
          if (stack[stack.length-1].name!=='helper'){ clearInterval(botTimer); return; }
          if (document.hidden || !$('#sheet').hidden) return;
          const before = JSON.stringify(S.support.map(x=>x.reply));
          try { await pullColl('support'); } catch { return; }
          if (JSON.stringify(S.support.map(x=>x.reply)) !== before) render();
        }, 15000);
      }};
  }
});
let botTimer = 0;

Object.assign(FEATURE_ACTIONS, {
  helper(){ go('helper'); },
  helperask(text){ helperAsk(text); },
  helpersend(){ const ta = $('#bot_text'), text = ta.value.trim(); if (text) helperAsk(text); },
  helperclear(){ BOT = []; botSave(); render(); },
  helperop(){ botHandoff(); botSave(); render(); },
  helperbtn(i){ const m = BOT[i]; if (!m?.btn) return; const [, a, v] = m.btn; if (a==='helperalert') return helperAlert(m); if (a==='helperop'){ A.helperop(); return; } A[a] && A[a](v); },
  helperall(i){
    const m = BOT[i], c = m.crit || {}, f = {};
    if (c.brand) f.brand = [c.brand];
    for (const k of ['pmin','pmax','ymin','ymax','reg']) if (c[k]) f[k] = c[k];
    for (const k of ['gear','fuel','body','usage','credit','swap']) if (c[k]) f[k] = [c[k]];
    state.filters[m.sec] = f; state.q = c.model || '';
    go('section', m.sec);
  }
});
function helperAsk(text){
  BOT.push({who:'me', text:text.slice(0, 300), time:now()});
  try { botReply(text); } catch (e){ console.warn(e); botFallback(); }
  botSave(); render();
}
// «Сообщить, когда появится» — через сохранённые поиски (features.js)
function helperAlert(m){
  const u = me(); if (!u){ go('auth','login'); return; }
  const c = m.crit || {}, f = {};
  if (c.brand) f.brand = [c.brand];
  for (const k of ['pmin','pmax','ymin','ymax','reg']) if (c[k]) f[k] = c[k];
  for (const k of ['gear','fuel','body','usage']) if (c[k]) f[k] = [c[k]];
  state.filters[m.sec] = f; state.q = c.model || '';
  go('section', m.sec);
  toast('Нажмите «Сообщить о новых по этому поиску»');
}

// Помощник на главной: карточка и круглая кнопка (листают вниз — кнопка прячется, вверх — появляется, чтобы не закрывать сердечко и цену)
let fabY = 0;
addEventListener('scroll', () => { const f = document.querySelector('.helper-fab'), y = scrollY; if (f) f.classList.toggle('hide', y > fabY && y > 80); fabY = y; }, {passive:true});
const helperCard = () => `<button class="card pad row" data-a="helper" style="text-align:left;gap:12px">${i3d('helper')}<span style="flex:1"><b>Помощник подберёт машину</b><br><span class="small dim">Напишите, что ищете: модель, бюджет, год</span></span>${ic('back','style="width:18px;transform:rotate(180deg);color:var(--dim)"')}</button>`;
const helperFab = () => `<button class="helper-fab" data-a="helper" aria-label="Помощник">${ic('chat')}</button>`;
document.head.insertAdjacentHTML('beforeend', `<style>
.helper-fab{position:fixed;right:max(16px,calc(50% - 320px));bottom:calc(88px + env(safe-area-inset-bottom,0px));z-index:30;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:var(--on);box-shadow:0 6px 20px rgba(0,0,0,.3);transition:transform .25s ease,opacity .25s ease}
.helper-fab svg{width:22px;height:22px}
.helper-fab.hide{transform:translateY(24px) scale(.6);opacity:0;pointer-events:none}
</style>`);

/* ================== Переводы новых фраз ================== */
Object.assign(TR, {
  'Помощник':['Kömekçi','Assistant'], 'Помощник подберёт машину':['Kömekçi maşyn saýlar','The assistant will find a car'],
  'Напишите, что ищете: модель, бюджет, год':['Näme gözleýändigiňizi ýazyň: model, býudžet, ýyl','Write what you need: model, budget, year'],
  'Подбираю объявления и отвечаю на частые вопросы. Можно писать по-туркменски и по-русски.':['Bildirişleri saýlaýaryn we köp berilýän soraglara jogap berýärin. Türkmençe-de, rusça-da ýazyp bilersiňiz.','I find listings and answer common questions. You can write in Turkmen or Russian.'],
  'Не понял. Я подбираю машины и отвечаю на частые вопросы о приложении. Напишите иначе — например: «Седан до 15 000, автомат» или «Как подать объявление?».':['Düşünmedim. Men maşyn saýlaýaryn we programma barada köp berilýän soraglara jogap berýärin. Başgaça ýazyň — mysal üçin: «15 000 çenli sedan, awtomat» ýa-da «Bildirişi nädip goýmaly?».','I didn’t get that. I find cars and answer common questions about the app. Try again — e.g. “Sedan under 15 000, automatic” or “How do I post a listing?”.'],
  'Помощник отвечает сам. Напишите, какую машину ищете, — например: «Toyota Camry до 20 000, автомат», или задайте вопрос о приложении.':['Kömekçi özi jogap berýär. Haýsy maşyny gözleýändigiňizi ýazyň — mysal üçin: «20 000 çenli Toyota Camry, awtomat», ýa-da programma barada sorag beriň.','The assistant answers by itself. Tell me what car you need — e.g. “Toyota Camry under 20 000, automatic” — or ask about the app.'],
  'Что ищете?':['Näme gözleýärsiňiz?','What are you looking for?'], 'Очистить чат':['Çaty arassala','Clear chat'], 'Позвать оператора':['Operatory çagyr','Call an operator'],
  'Седан до 15 000 TMT':['15 000 TMT çenli sedan','Sedan under 15 000 TMT'], 'Внедорожник в Ашхабаде':['Aşgabatda ýolsuzyň ulagy','SUV in Ashgabat'], 'Toyota Camry, автомат':['Toyota Camry, awtomat','Toyota Camry, automatic'],
  'Войдите, чтобы задать вопрос оператору':['Operatora sorag bermek üçin giriň','Sign in to ask an operator'], 'Сообщить, когда появится':['Peýda bolanda habar ber','Notify me when available'],
  'Оператор:':['Operator:','Operator:'], 'Подать объявление':['Bildiriş goý','Post a listing'], 'Цены и подписки':['Bahalar we abunalar','Prices and plans'], 'Восстановить пароль':['Paroly dikelt','Recover password'],
  'Пожалуйста! Если что-то ещё — пишите.':['Hoş! Başga zat bolsa ýazyň.','You’re welcome! Write if you need anything else.'],
  'Передал оператору. Он ответит в течение дня (с 09:00 до 21:00) — ответ придёт в уведомления и сюда.':['Operatora geçirdim. Ol gün dowamynda jogap berer (09:00–21:00) — jogap habarlara we şu ýere geler.','Passed to an operator. They’ll reply within a day (09:00–21:00) — the answer will come to notifications and here.'],
  'Ваш вопрос уже у оператора. Ответ придёт в уведомления и сюда, в этот чат.':['Soragyňyz eýýäm operatorda. Jogap habarlara we şu çata geler.','Your question is already with an operator. The answer will come to notifications and to this chat.'],
  'Чтобы оператор ответил, войдите в аккаунт.':['Operator jogap bermegi üçin hasaba giriň.','Sign in so an operator can reply.'],
  'Этот вопрос лучше задать оператору — он ответит в течение дня.':['Bu soragy operatora bermek gowy — ol gün dowamynda jogap berer.','Better to ask an operator — they’ll reply within a day.'],
  'Я пока умею подбирать машины и отвечать на частые вопросы о приложении. Переформулируйте или передам вопрос оператору.':['Men häzirlikçe maşyn saýlap we programma barada köp berilýän soraglara jogap berip bilýärin. Başgaça ýazyň ýa-da soragy operatora geçireýin.','For now I can find cars and answer common questions about the app. Rephrase it, or I’ll pass it to an operator.'],
  'Здравствуйте! Я помощник AlphaCars TM. Напишите, какую машину ищете, — например: «Нужна Камри до 20 000, автомат, не старше 2015». Или задайте вопрос о приложении.':['Salam! Men AlphaCars TM kömekçisi. Haýsy maşyny gözleýändigiňizi ýazyň, mysal üçin: «20 000 çenli Camry, awtomat, 2015-den täze». Ýa-da programma barada sorag beriň.','Hello! I’m the AlphaCars TM assistant. Tell me what car you need, e.g. “Camry under 20 000, automatic, 2015 or newer”. Or ask about the app.'],
  'Здравствуйте! Напишите, какую машину ищете — модель, бюджет, год, коробку, город. Подберу объявления.':['Salam! Haýsy maşyny gözleýändigiňizi ýazyň — model, býudžet, ýyl, korobka, şäher. Bildirişleri saýlaýyn.','Hello! Tell me what car you need — model, budget, year, gearbox, city. I’ll find listings.'],
  'Подскажите подробнее: какая марка или кузов, бюджет, год? Например: «Седан до 15 000, автомат, не старше 2012».':['Has jikme-jik ýazyň: haýsy marka ýa-da kuzow, býudžet, ýyl? Mysal: «15 000 çenli sedan, awtomat, 2012-den täze».','Tell me more: which make or body, budget, year? E.g. “Sedan under 15 000, automatic, 2012 or newer”.'],
  'Нажмите «Сообщить о новых по этому поиску»':['«Bu gözleg boýunça täzeler barada habar ber» basyň','Tap “Notify me about new ones for this search”'],
  'Запросы сотрудников':['Işgärleriň haýyşlary','Staff requests']
});
TR_RE.push(
  [/^Нашёл (\d+) (объявление|объявления|объявлений)(?: — (.+))?:$/, (m,n,w,c) => [n+' bildiriş tapdym'+(c?' — '+c:'')+':', 'Found '+n+' listing'+(n==='1'?'':'s')+(c?' — '+c:'')+':']],
  [/^Показать все \((\d+)\)$/, (m,n) => ['Hemmesini görkez ('+n+')', 'Show all ('+n+')']]
);
TR_SUB.splice(0, TR_SUB.length, ...Object.keys(TR).filter(k => k.length >= 6 && /[ «»:,.→₽]/.test(k)).sort((a,b) => b.length - a.length));
