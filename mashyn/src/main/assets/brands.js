/* =====================================================
   Иконки марок: brands/<имя>.webp (до 96 px, из 8_Dizayn/logotipy_marok; Toyota, Nissan, Kia, BMW, VW, Geely, Peugeot, FAW — с автолого.рф) и страна марки.
   Логотипы — только чтобы показать марку (товарные знаки владельцев), не для рекламы.
   Нет иконки — плашка с первой буквой. Файл подключён и в sw.js (офлайн-копия иконок).
   ===================================================== */
const BRAND_LOGO = {
  'Toyota':'toyota', 'Nissan':'nissan', 'Kia':'kia', 'BMW':'bmw', 'BMW Motorrad':'bmw', 'Volkswagen':'volkswagen', 'Geely':'geely',
  'Peugeot':'peugeot', 'FAW':'faw', 'Belgee':'belgee', 'Aito':'aito', 'Deepal':'deepal', 'Denza':'denza', 'GAC':'gac', 'Kaiyi':'kaiyi',
  'Livan':'livan', 'Voyah':'voyah', 'Xiaomi':'xiaomi', 'Москвич':'moskvich', 'Tenet':'tenet',
  'Ford Trucks':'ford', 'Mitsubishi Fuso':'mitsubishi',
  'Lexus':'lexus', 'Hyundai':'hyundai', 'Hyundai Trucks':'hyundai', 'Hyundai CE':'hyundai', 'Chevrolet':'chevrolet',
  'Mercedes-Benz':'mercedes-benz', 'Mercedes-Benz Trucks':'mercedes-benz', 'Audi':'audi', 'Ford':'ford', 'Honda':'honda',
  'Mitsubishi':'mitsubishi', 'Mazda':'mazda', 'Subaru':'subaru', 'Infiniti':'infiniti', 'Genesis':'genesis', 'Land Rover':'land-rover',
  'Porsche':'porsche', 'Jeep':'jeep', 'Dodge':'dodge', 'GMC':'gmc', 'Cadillac':'cadillac', 'Volvo':'volvo', 'Volvo Trucks':'volvo',
  'Volvo CE':'volvo', 'Tesla':'tesla', 'Chery':'chery', 'Haval':'haval', 'BYD':'byd', 'Changan':'changan', 'Exeed':'exeed', 'Tank':'tank',
  'Jetour':'jetour', 'Li Auto':'li-auto', 'Zeekr':'zeekr', 'Great Wall':'great-wall', 'JAC':'jac', 'Renault':'renault',
  'Renault Trucks':'renault', 'Skoda':'skoda', 'Opel':'opel', 'Suzuki':'suzuki', 'Daewoo':'daewoo', 'Lada':'lada', 'ГАЗ':'gaz',
  'ГАЗ Грузовые':'gaz', 'УАЗ':'uaz', 'КамАЗ':'kamaz', 'МАЗ':'maz', 'Scania':'scania', 'MAN':'man', 'DAF':'daf', 'Iveco':'iveco',
  'Dongfeng':'dongfeng', 'Foton':'foton', 'Hino':'hino', 'Isuzu':'isuzu', 'ЗИЛ':'zil', 'Kenworth':'kenworth',
  'Freightliner':'freightliner', 'Peterbilt':'peterbilt', 'Mack':'mack', 'KTM':'ktm', 'Lifan':'lifan'
};
// Страны по популярности в Туркменистане; марки, которых нет в списке, — «Другие страны»
const BRAND_COUNTRIES = [
  ['Япония', ['Toyota','Lexus','Nissan','Honda','Mitsubishi','Mazda','Subaru','Infiniti','Suzuki','Hino','Isuzu','Mitsubishi Fuso','Komatsu','Hitachi','Yamaha','Kawasaki']],
  ['Корея', ['Hyundai','Kia','Genesis','Daewoo','Hyundai Trucks','Hyundai CE','Doosan','Develon']],
  ['Германия', ['Mercedes-Benz','BMW','Audi','Volkswagen','Porsche','Opel','MAN','Mercedes-Benz Trucks','Liebherr','BMW Motorrad']],
  ['США', ['Chevrolet','Ford','Jeep','Dodge','GMC','Cadillac','Tesla','Kenworth','Freightliner','Peterbilt','Mack','Caterpillar','Bobcat','Case','Harley-Davidson','Polaris']],
  ['Китай', ['Chery','Haval','Geely','BYD','Changan','Exeed','Hongqi','Tank','Jetour','Omoda','Jaecoo','Kaiyi','Livan','GAC','Li Auto','Zeekr','Voyah','Denza','Deepal','Aito','Avatr','Leapmotor','Xiaomi','Great Wall','JAC','Howo (Sinotruk)',
    'Sitrak','Chenglong','Beiben','LiuGong','SDLG','Lonking','Voge','Kove','Segway','Yadea','Shacman','FAW','Dongfeng','Foton','XCMG','Sany','Zoomlion','Shantui','CFMOTO','Haojue','Lifan','Loncin','Zongshen','Kayo','Linhai']],
  ['Россия', ['Lada','Москвич','Tenet','ГАЗ','УАЗ','КамАЗ','ГАЗ Грузовые','Урал','ЗИЛ','Ивановец','Клинцы','Галичанин','Stels','Racer','Motoland','Regulmoto','ИЖ']],
  ['Великобритания', ['Land Rover','JCB','Triumph']],
  ['Италия', ['Iveco','Ducati','Benelli','Aprilia','Vespa']]
];
const BRAND_OTHER = 'Другие страны';
const brandCountry = b => (BRAND_COUNTRIES.find(([,list]) => list.includes(b)) || [BRAND_OTHER])[0];
// [[страна, [марки…]], …] — порядок стран как в BRAND_COUNTRIES, внутри страны порядок не меняется
const byCountry = brands => [...BRAND_COUNTRIES.map(c=>c[0]), BRAND_OTHER]
  .map(c => [c, brands.filter(b => brandCountry(typeof b==='string' ? b : b[0]) === c)]).filter(([,list]) => list.length);

// Иконка марки на светлой плашке (чёрные логотипы видны и в тёмных темах); картинка не загрузилась — буква
function brandIcon(b, cls=''){
  const slug = BRAND_LOGO[b], l = esc((b||'?').trim().charAt(0).toUpperCase());
  return slug
    ? `<span class="bico ${cls}" data-l="${l}"><img src="brands/${slug}.webp" alt="" loading="lazy" onerror="const p=this.parentNode;p.classList.add('l');p.textContent=p.dataset.l"></span>`
    : `<span class="bico l ${cls}">${l}</span>`;
}

// В sw.js нужен только BRAND_LOGO — переводов там нет
if (typeof TR !== 'undefined'){
  Object.assign(TR, {'Корея':['Koreýa','Korea'], 'Другие страны':['Beýleki ýurtlar','Other countries']});
  TR_SUB.splice(0, TR_SUB.length, ...Object.keys(TR).filter(k => k.length >= 6 && /[ «»:,.→₽]/.test(k)).sort((a,b) => b.length - a.length));
}
