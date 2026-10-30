/* =====================================================
   Переводы Alpha Drive: туркменский и английский.
   Интерфейс пишется по-русски, а после отрисовки русские фразы
   заменяются по словарю TR (точное совпадение или кусок текста).
   ===================================================== */

// Английские варианты для ключей T из index.html
const T_EN = {
  home:'Home', catalog:'Catalog', post:'Post', favs:'Favorites', profile:'Profile',
  searchPh:'Make, model, city…',
  s_cars:'Cars', s_import:'Imported', s_parts:'Parts', s_tech:'Machinery & services',
  s_jobs:'Driver jobs', s_rent:'Rental', s_sto:'Service & repair', s_all:'All listings',
  heroT:'Cars, machinery and jobs — in one place', heroP:'First listing — free for 7 days',
  heroFree:'All listings are free right now', heroBtn:'Post a listing',
  vip:'VIP listings', fresh:'New listings', all:'All',
  filters:'Filters', apply:'Show', reset:'Reset',
  sNew:'Newest first', sCheap:'Cheapest first', sExp:'Most expensive first',
  nothing:'Nothing found', nothingP:'Try changing the filters or search',
  city:'City', price:'Price', year:'Year', from:'from', to:'to',
  seller:'Seller', call:'Call', loginToCall:'Sign in to call',
  comments:'Comments', writeComment:'Write a comment', send:'Send',
  complain:'Report', login:'Sign in', register:'Sign up',
  password:'Password', name:'Name', phone:'Phone number', email:'Email',
  myListings:'My listings', mySubs:'My subscriptions', subs:'Subscriptions',
  theme:'Theme', language:'Language', logout:'Sign out', admin:'Admin panel',
  notifs:'Notifications', month:'mo.', perMonth:'per month', save:'Save',
  iPaid:'I have paid', pay:'Pay', choose:'Choose', back:'Back',
  descr:'Description', publish:'Publish', free7:'7 days free',
  guestTitle:'Sign in to your account', guestP:'To call sellers, post listings and write comments'
};

// Русская фраза → [туркменский, английский]
const TR = {
  // ====== Общее ======
  'Все':['Ählisi','All'], 'Авто':['Awtoulag','Cars'], 'Год':['Ýyly','Year'], 'Имя':['Adyňyz','Name'],
  'Цена':['Bahasy','Price'], 'Цвет':['Reňki','Color'], 'Язык':['Dil','Language'], 'Адрес':['Salgy','Address'],
  'Город':['Şäher','City'], 'Марка':['Marka','Make'], 'Модель':['Model','Model'], 'Поиск':['Gözleg','Search'],
  'Назад':['Yza','Back'], 'Войти':['Giriş','Sign in'], 'Выйти':['Çykmak','Sign out'], 'Готово':['Taýýar','Done'],
  'Отмена':['Ýatyr','Cancel'], 'Пароль':['Parol','Password'], 'Подать':['Goş','Post'], 'Регион':['Sebit','Region'],
  'Статус':['Ýagdaýy','Status'], 'Удалить':['Poz','Delete'], 'Удалено':['Pozuldy','Deleted'], 'Закрыть':['Ýap','Close'],
  'Выбрать':['Saýla','Choose'], 'Главная':['Baş sahypa','Home'], 'Каталог':['Katalog','Catalog'], 'Профиль':['Profil','Profile'],
  'Фильтры':['Süzgüçler','Filters'], 'Добавить':['Goş','Add'], 'Выберите':['Saýlaň','Choose'], 'Показать':['Görkez','Show'],
  'Сбросить':['Arassala','Reset'], 'Сохранить':['Ýatda sakla','Save'], 'Сохранено':['Ýatda saklandy','Saved'],
  'Отправить':['Iber','Send'], 'Описание':['Düşündiriş','Description'], 'Оплатить':['Töle','Pay'], 'Оплата':['Töleg','Payment'],
  'Подписки':['Abunalar','Subscriptions'], 'Продавец':['Satyjy','Seller'], 'продавец':['satyjy','seller'],
  'Избранное':['Halanlarym','Favorites'], 'Позвонить':['Jaň et','Call'], 'Категория':['Kategoriýa','Category'],
  'Состояние':['Ýagdaýy','Condition'], 'Заголовок':['Sözbaşy','Title'], 'Регистрация':['Hasaba alyş','Sign up'],
  'Комментарии':['Teswirler','Comments'], 'Уведомления':['Habarnamalar','Notifications'], 'Скопировано':['Göçürildi','Copied'],
  'Пользователь':['Ulanyjy','User'], 'Опубликовать':['Çap et','Publish'], 'Пожаловаться':['Şikaýat et','Report'],
  'Админ-панель':['Admin paneli','Admin panel'], 'Мои подписки':['Meniň abunalarym','My subscriptions'],
  'Мои объявления':['Meniň bildirişlerim','My listings'], 'Все объявления':['Ähli bildirişler','All listings'],
  'Новые объявления':['Täze bildirişler','New listings'], 'VIP-объявления':['VIP bildirişler','VIP listings'],
  'Новое объявление':['Täze bildiriş','New listing'], 'Подать объявление':['Bildiriş goş','Post a listing'],
  'Ничего не найдено':['Hiç zat tapylmady','Nothing found'], 'Попробуйте изменить фильтры или поиск':['Süzgüçleri ýa-da gözlegi üýtgedip görüň','Try changing the filters or search'],
  'Электронная почта':['E-poçta','Email'], 'Номер телефона':['Telefon belgisi','Phone number'], 'Тема оформления':['Reňk temasy','Theme'],
  'Войдите в аккаунт':['Hasabyňyza giriň','Sign in to your account'], 'В избранное':['Halanlaryma goş','Add to favorites'],
  'Нравится':['Halaýaryn','Like'], 'Не нравится':['Halamok','Dislike'], 'Иллюстрация':['Surat','Illustration'],
  'Найдено:':['Tapyldy:','Found:'], 'Не выбрано':['Saýlanmady','Not selected'], 'Неверный':['Nädogry','Wrong'],
  'номер':['belgi','phone'], 'адрес':['salgy','email'], 'Компания':['Kompaniýa','Company'], 'Частное лицо':['Hususy şahs','Private person'],
  'Ночь':['Gije','Night'], 'Изумруд':['Zümerret','Emerald'], 'Золото':['Altyn','Gold'], 'Океан':['Ummán','Ocean'], 'Светлая':['Ýagty','Light'],
  'Сменить раздел':['Bölümi çalyş','Change section'], 'Тип объявления':['Bildirişiň görnüşi','Listing type'],
  'Что вы хотите разместить?':['Näme ýerleşdirmek isleýärsiňiz?','What do you want to post?'],
  'Начните вводить':['Ýazyp başlaň','Start typing'], 'Найти марку':['Marka tap','Find make'],
  'Марка — можно несколько':['Marka — birnäçesini saýlap bolýar','Make — you can pick several'],
  'Вся страна':['Ähli ýurt','Whole country'], 'Весь регион':['Ähli sebit','Whole region'],
  'Город или этрап':['Şäher ýa-da etrap','City or district'], 'Сначала выберите регион':['Ilki sebiti saýlaň','Choose a region first'],
  'Сначала выберите марку':['Ilki markany saýlaň','Choose a make first'], 'Нет в списке? Впишите сами':['Sanawda ýokmy? Özüňiz ýazyň','Not on the list? Type it in'],
  'Например, Haima':['Meselem, Haima','For example, Haima'], 'Например, Camry Hybrid':['Meselem, Camry Hybrid','For example, Camry Hybrid'],
  'Впишите название':['Adyny ýazyň','Type the name'],
  'Для этой марки список моделей пока пуст — впишите модель ниже.':['Bu marka üçin modeller sanawy entek boş — modeli aşakda ýazyň.','No models listed for this make yet — type the model below.'],
  'Сначала новые':['Iň täzeler','Newest first'], 'Сначала дешевле':['Arzanlar','Cheapest first'], 'Сначала дороже':['Gymmatlar','Most expensive first'],
  'Год от':['Ýyly -dan','Year from'], 'Год до':['Ýyly -a çenli','Year to'], 'Цена от, TMT':['Bahasy -dan, TMT','Price from, TMT'], 'Цена до, TMT':['Bahasy -a çenli, TMT','Price to, TMT'],

  // ====== Разделы и поля объявлений ======
  'Из-за рубежа':['Daşary ýurtdan','Imported'], 'Запчасти':['Şaýlar','Parts'], 'Техника и услуги':['Tehnika we hyzmatlar','Machinery & services'],
  'Работа водителям':['Sürüjiler üçin iş','Driver jobs'], 'Аренда':['Kärende','Rental'], 'СТО и сервис':['Awtoserwis','Service & repair'],
  'СТО':['Awtoserwis','Service'], 'Техника':['Tehnika','Machinery'], 'Спецтехника':['Ýörite tehnika','Heavy machinery'],
  'Пробег':['Geçen ýoly','Mileage'], 'Пробег, км':['Geçen ýoly, km','Mileage, km'], 'Год выпуска':['Öndürilen ýyly','Year'],
  'Кузов':['Kuzow','Body'], 'Топливо':['Ýangyç','Fuel'], 'Коробка':['Geçiriji','Gearbox'], 'Двигатель':['Hereketlendiriji','Engine'],
  'Двигатель, л':['Hereketlendiriji, l','Engine, L'], 'Марка авто':['Awtoulagyň markasy','Car make'], 'Марка техники':['Tehnikanyň markasy','Machinery make'],
  'Бензин':['Benzin','Petrol'], 'Дизель':['Dizel','Diesel'], 'Газ/бензин':['Gaz/benzin','Gas/petrol'], 'Гибрид':['Gibrid','Hybrid'], 'Электро':['Elektrik','Electric'],
  'АКПП':['Awtomat','Automatic'], 'МКПП':['Mehaniki','Manual'], 'Вариатор':['Wariator','CVT'], 'Робот':['Robot','Robotic'],
  'Седан':['Sedan','Sedan'], 'Хэтчбек':['Hetçbek','Hatchback'], 'Универсал':['Uniwersal','Estate'], 'Внедорожник':['Ýolsuzlyk ulagy','SUV'],
  'Минивэн':['Miniwen','Minivan'], 'Пикап':['Pikap','Pickup'], 'Белый':['Ak','White'], 'Другое':['Başga','Other'],
  'Откуда':['Nireden','From'], 'Япония':['Ýaponiýa','Japan'], 'Корея':['Koreýa','Korea'], 'Китай':['Hytaý','China'], 'Грузия':['Gruziýa','Georgia'],
  'США':['ABŞ','USA'], 'ОАЭ':['BAE','UAE'], 'Целая':['Bitewi','Undamaged'], 'После ДТП':['Heläkçilikden soň','After accident'],
  'На аукционе':['Auksionda','At auction'], 'В пути':['Ýolda','In transit'], 'В Туркменистане':['Türkmenistanda','In Turkmenistan'],
  'С аукциона':['Auksiondan','From auction'], 'Аукцион':['Auksion','Auction'], 'Аукцион / лот':['Auksion / lot','Auction / lot'],
  'Цена авто, TMT':['Awtoulagyň bahasy, TMT','Car price, TMT'], 'Доставка':['Eltip bermek','Shipping'], 'Доставка, TMT':['Eltip bermek, TMT','Shipping, TMT'],
  'Растаможка':['Gümrük','Customs'], 'Растаможка, TMT':['Gümrük, TMT','Customs, TMT'], 'Цена под ключ':['Doly bahasy','Turnkey price'],
  'Итого в Ашхабаде':['Aşgabatda jemi','Total in Ashgabat'], 'Срок доставки, дней':['Eltip bermek möhleti, gün','Delivery time, days'],
  'уже здесь':['eýýäm şu ýerde','already here'], 'по курсу приложения':['programmanyň walýuta hümmeti boýunça','at the app exchange rate'],
  'Итоговая цена «под ключ» посчитается сама: авто + доставка + растаможка.':['Doly baha özi hasaplanar: awtoulag + eltip bermek + gümrük.','The turnkey price is calculated automatically: car + shipping + customs.'],
  'Укажите цену авто, доставки и растаможки':['Awtoulagyň, eltip bermegiň we gümrügiň bahasyny görkeziň','Enter the car, shipping and customs prices'],
  'Б/у':['Ulanylan','Used'], 'Новая':['Täze','New'], 'Номер детали (OEM)':['Şaýyň belgisi (OEM)','Part number (OEM)'], 'Подходит для':['Laýyk gelýär','Fits'],
  'Модели и годы':['Modeller we ýyllar','Models and years'], 'Оптика':['Optika','Lights'], 'Тормоза':['Tormozlar','Brakes'], 'Электрика':['Elektrika','Electrics'],
  'Трансмиссия':['Transmissiýa','Transmission'], 'Ходовая':['Hodowoý bölegi','Chassis'], 'Охлаждение':['Sowadyş','Cooling'], 'Аккумуляторы':['Akkumulýatorlar','Batteries'],
  'Аксессуары':['Aksessuarlar','Accessories'], 'Шины и диски':['Teker we diskler','Tires & wheels'], 'Масла и жидкости':['Ýaglar we suwuklyklar','Oils & fluids'],
  'Кузов и оптика':['Kuzow we optika','Body & lights'], 'Подвеска и рулевое':['Asma we rul','Suspension & steering'], 'Выхлопная система':['Gaz çykaryş ulgamy','Exhaust system'],
  'Салон и интерьер':['Salon we içki bezeg','Interior'], 'Стёкла и зеркала':['Aýnalar we güzgüler','Glass & mirrors'], 'Аудио и мультимедиа':['Audio we multimediýa','Audio & multimedia'],
  'Грузовые запчасти':['Ýük ulag şaýlary','Truck parts'], 'Запчасти спецтехники':['Ýörite tehnika şaýlary','Machinery parts'],
  'Тип техники':['Tehnikanyň görnüşi','Machinery type'], 'Грузоподъёмность':['Göteriş ukyby','Capacity'], 'Грузоподъёмность / объём':['Göteriş ukyby / göwrümi','Capacity / volume'],
  'Особенность':['Aýratynlygy','Feature'], 'Район работы':['Iş sebiti','Work area'], 'Автокран':['Awtokran','Truck crane'], 'Самосвал':['Samoswal','Dump truck'],
  'Эвакуатор':['Ewakuator','Tow truck'], 'Рефрижератор':['Refrižerator','Refrigerated truck'], 'Экскаватор':['Ekskawator','Excavator'], 'Погрузчик':['Ýükleýji','Loader'],
  'Манипулятор':['Manipulýator','Crane truck'], 'Автовышка':['Awtowyşka','Aerial platform'], 'Автобус':['Awtobus','Bus'], 'Грузовик':['Ýük ulagy','Truck'],
  'Фура':['Fura','Semi truck'], 'Газель':['Gazel','Gazelle van'], 'Переезд с грузчиками':['Ýükçüler bilen göçmek','Moving with loaders'],
  'Ищу водителя':['Sürüji gözleýärin','Hiring a driver'], 'Ищу работу':['Iş gözleýärin','Looking for work'], 'Вакансия':['Boş iş orny','Vacancy'], 'Вакансии':['Boş iş orunlary','Vacancies'],
  'Резюме':['Rezýume','Resume'], 'Категории прав':['Sürüjilik şahadatnamasynyň görnüşi','License categories'], 'Права':['Şahadatnama','License'],
  'Стаж':['Iş tejribesi','Experience'], 'Стаж, лет':['Iş tejribesi, ýyl','Experience, years'], 'График':['Iş tertibi','Schedule'],
  'Полный день':['Doly gün','Full day'], 'Вахта':['Wahta','Rotation'], 'Разовая работа':['Bir gezeklik iş','One-off job'],
  'Своя техника':['Öz tehnikasy','Own vehicle'], 'Со своей машиной или техникой':['Öz maşyny ýa-da tehnikasy bilen','With own car or machinery'],
  'Зарплата, TMT':['Aýlyk, TMT','Salary, TMT'], 'Зарплата по договорённости':['Aýlyk ylalaşyk boýunça','Salary negotiable'],
  'Вид аренды':['Kärendäniň görnüşi','Rental type'], 'Посуточно':['Gündelik','Daily'], 'Длительно':['Uzak möhletli','Long-term'],
  'На свадьбу':['Toý üçin','For weddings'], 'С водителем':['Sürüji bilen','With driver'], 'Услуга':['Hyzmat','Service'],
  'Часы работы':['Iş wagty','Opening hours'], 'Шиномонтаж':['Teker abatlaýyş','Tire service'], 'Диагностика':['Barlag','Diagnostics'],
  'Кузовной ремонт':['Kuzow abatlaýyş','Body repair'], 'Ремонт двигателя':['Hereketlendiriji abatlaýyş','Engine repair'], 'Мойка':['Ýuwuş','Car wash'],
  'Детейлинг':['Deteýling','Detailing'], 'Единица':['Birlik','Unit'],
  'Договорная':['Ylalaşyk boýunça','Negotiable'], 'договорная':['ylalaşyk boýunça','negotiable'],
  'за день':['güni','per day'], 'за час':['sagady','per hour'], 'за рейс':['reýsi','per trip'], 'за смену':['smenasy','per shift'],
  'за сутки':['gije-gündizi','per day'], 'за тонну':['tonnasy','per ton'], 'за км':['km-i','per km'], 'в месяц':['aýda','per month'],
  'мес.':['aý','mo.'], 'дн.':['gün','d.'], 'лет':['ýyl','years'], 'кат.':['kat.','cat.'], 'просм.':['görülen','views'], 'объявл.':['bildiriş','listings'],
  'мин назад':['min öň','min ago'], 'ч назад':['sag öň','h ago'], 'дн. назад':['gün öň','days ago'], 'мин.':['min.','min.'],
  'Фото (':['Surat (','Photos ('], 'Удалить фото':['Suraty poz','Delete photo'],
  'Состояние, комплектация, условия':['Ýagdaýy, toplumy, şertleri','Condition, equipment, terms'],
  'Заголовок: минимум 5 символов':['Sözbaşy: azyndan 5 harp','Title: at least 5 characters'], 'Заполните поле «':['Meýdany dolduryň «','Fill in the field «'],
  'Укажите цену':['Bahasyny görkeziň','Enter the price'], 'Проверьте год выпуска':['Öndürilen ýylyny barlaň','Check the year'],
  'Загружаем фото…':['Suratlar ýüklenýär…','Uploading photos…'],
  'Не удалось загрузить фото. Проверьте интернет и попробуйте ещё раз.':['Suratlary ýükläp bolmady. Interneti barlap, täzeden synanyşyň.','Could not upload photos. Check the internet and try again.'],
  'До 10 фото. Каждое приложение само уменьшит до 1 МБ, чтобы быстро грузилось при медленном интернете.':['10 surata çenli. Programma her suraty 1 MB-a çenli kiçelder, haýal internetde-de çalt açylar.','Up to 10 photos. The app shrinks each one to 1 MB so it loads fast on slow internet.'],

  // ====== Детали объявления ======
  'Пока нет комментариев. Задайте вопрос продавцу.':['Entek teswir ýok. Satyja sorag beriň.','No comments yet. Ask the seller a question.'],
  'Войдите, чтобы комментировать':['Teswir ýazmak üçin giriň','Sign in to comment'], 'Войдите, чтобы позвонить':['Jaň etmek üçin giriň','Sign in to call'],
  'Номер, WhatsApp и IMO видны после входа. Регистрация бесплатная.':['Belgi, WhatsApp we IMO girenden soň görünýär. Hasaba alyş mugt.','Phone, WhatsApp and IMO are shown after signing in. Sign-up is free.'],
  'IMO: тот же номер —':['IMO: şol bir belgi —','IMO: same number —'],
  'Напишите комментарий':['Teswir ýazyň','Write a comment'], 'Напишите хотя бы пару слов':['Iň bolmanda birnäçe söz ýazyň','Write at least a few words'],
  'Комментарий не прошёл проверку:':['Teswir barlagdan geçmedi:','The comment failed the check:'],
  'Объявление удалено':['Bildiriş pozuldy','Listing deleted'], 'Возможно, продавец снял его с публикации':['Satyjy ony aýyran bolmagy mümkin','The seller may have removed it'],
  'Объявление не опубликовано':['Bildiriş çap edilmedi','Listing not published'],
  'Добавлено в избранное':['Halanlaryma goşuldy','Added to favorites'], 'Убрано из избранного':['Halanlarymdan aýryldy','Removed from favorites'],
  'Здесь будут избранные объявления':['Bu ýerde halan bildirişleriňiz bolar','Your favorite listings will be here'],
  'Нажмите на сердечко у объявления, чтобы сохранить его':['Bildirişi saklamak üçin ýürejige basyň','Tap the heart on a listing to save it'],
  'Выберите причину. При 5 жалобах публикация скрывается до проверки.':['Sebäbini saýlaň. 5 şikaýatdan soň bildiriş barlaga çenli gizlenýär.','Choose a reason. After 5 reports the post is hidden until reviewed.'],
  'Мошенничество':['Galplyk','Fraud'], 'Неверная цена':['Nädogry baha','Wrong price'], 'Уже продано':['Eýýäm satyldy','Already sold'], 'Спам':['Spam','Spam'],
  'Оскорбления':['Kemsitmeler','Insults'], 'Жалоба отправлена модератору':['Şikaýat moderatora iberildi','Report sent to the moderator'],
  'Вы уже отправили жалобу':['Siz eýýäm şikaýat iberdiňiz','You have already reported this'],
  'Выделите и скопируйте вручную':['Belläp, özüňiz göçüriň','Select and copy manually'],
  'Удалить объявление? Его нельзя будет восстановить.':['Bildirişi pozmalymy? Ony dikeldip bolmaz.','Delete the listing? It cannot be restored.'],

  // ====== Вход и регистрация ======
  'Вход в Alpha Drive':['Alpha Drive-a giriş','Sign in to Alpha Drive'], 'Создать аккаунт':['Hasap döret','Create an account'],
  'Войдите по номеру телефона или почте':['Telefon belgisi ýa-da e-poçta bilen giriň','Sign in with phone or email'],
  'Регистрация бесплатная. Платить нужно только за объявления.':['Hasaba alyş mugt. Diňe bildirişler üçin tölenýär.','Sign-up is free. You only pay for listings.'],
  'По телефону':['Telefon bilen','By phone'], 'По почте':['E-poçta bilen','By email'], 'Тип аккаунта':['Hasabyň görnüşi','Account type'],
  'Название компании':['Kompaniýanyň ady','Company name'], 'Повторите пароль':['Paroly gaýtalaň','Repeat password'],
  '(по желанию, для восстановления пароля)':['(islege görä, paroly dikeltmek üçin)','(optional, for password recovery)'],
  'Не короче 6 символов':['6 harpdan gysga däl','At least 6 characters'], 'Забыли пароль?':['Paroly unutdyňyzmy?','Forgot password?'],
  'Показать пароль':['Paroly görkez','Show password'], 'Скрыть пароль':['Paroly gizle','Hide password'],
  'Аккаунт работает на любом телефоне: объявления, комментарии и подписки хранятся на сервере.':['Hasap islendik telefonda işleýär: bildirişler, teswirler we abunalar serwerde saklanýar.','Your account works on any phone: listings, comments and subscriptions are stored on the server.'],
  'Введите имя':['Adyňyzy ýazyň','Enter your name'], 'Номер — 8 цифр и начинается с 6, например 65 123456':['Belgi — 8 san we 6 bilen başlaýar, meselem 65 123456','The number has 8 digits and starts with 6, e.g. 65 123456'],
  'Проверьте адрес почты':['E-poçta salgysyny barlaň','Check the email address'], 'Пароль должен быть не короче 6 символов':['Parol 6 harpdan gysga bolmaly däl','The password must be at least 6 characters'],
  'Пароли не совпадают':['Parollar gabat gelmeýär','Passwords do not match'],
  'Этот номер уже зарегистрирован. Войдите или восстановите пароль.':['Bu belgi eýýäm hasaba alnan. Giriň ýa-da paroly dikeldiň.','This number is already registered. Sign in or recover your password.'],
  'Эта почта уже используется':['Bu e-poçta eýýäm ulanylýar','This email is already in use'], 'Создаём аккаунт…':['Hasap döredilýär…','Creating account…'],
  'Не удалось создать аккаунт:':['Hasap döredip bolmady:','Could not create the account:'], 'Аккаунт создан. Войдите по номеру и паролю.':['Hasap döredildi. Belgi we parol bilen giriň.','Account created. Sign in with your number and password.'],
  'Аккаунт создан':['Hasap döredildi','Account created'], 'Здравствуйте,':['Salam,','Hello,'], 'Вы вышли':['Siz çykdyňyz','You signed out'],
  'Слишком много попыток. Подождите':['Synanyşyk köp boldy. Garaşyň','Too many attempts. Wait'], 'Вход заблокирован на 5 минут после 5 ошибок':['5 ýalňyşdan soň giriş 5 minut ýapyldy','Sign-in locked for 5 minutes after 5 errors'],
  'или пароль. Осталось попыток:':['ýa-da parol. Galan synanyşyk:','or password. Attempts left:'],
  'Аккаунт заблокирован. Напишите в поддержку.':['Hasap petiklendi. Goldaw gullugyna ýazyň.','Account blocked. Contact support.'],
  'Восстановление пароля':['Paroly dikeltmek','Password recovery'], 'Если в аккаунте указана почта':['Hasapda e-poçta görkezilen bolsa','If your account has an email'],
  'Отправим код на почту, и вы зададите новый пароль. Это бесплатно.':['E-poçta kod ibereris we siz täze parol goýarsyňyz. Bu mugt.','We will email a code so you can set a new password. It is free.'],
  'Если почты нет':['E-poçta ýok bolsa','If there is no email'],
  'Напишите в поддержку с того номера, на который зарегистрирован аккаунт. Администратор проверит и сбросит пароль.':['Hasap hasaba alnan belgiden goldaw gullugyna ýazyň. Administrator barlap, paroly täzeler.','Contact support from the number the account is registered with. The administrator will check and reset the password.'],
  'Письма пока не отправляются: сброс пароля делает администратор в админ-панели':['Hatlar entek iberilmeýär: paroly administrator admin panelinde täzeleýär','Emails are not sent yet: the administrator resets passwords in the admin panel'],
  'Люди.':['Adamlar.','People.'],
  'Чтобы звонить продавцам, подавать объявления и писать комментарии':['Satyjylara jaň etmek, bildiriş goşmak we teswir ýazmak üçin','To call sellers, post listings and write comments'],

  // ====== Профиль, подписки, оплата ======
  'Удалить аккаунт':['Hasaby poz','Delete account'], 'Удалить аккаунт и все ваши объявления?':['Hasaby we ähli bildirişleriňizi pozmalymy?','Delete your account and all your listings?'],
  'Удалить навсегда':['Hemişelik poz','Delete forever'], 'Аккаунт удалён':['Hasap pozuldy','Account deleted'],
  'Не удалось удалить аккаунт. Проверьте интернет.':['Hasaby pozup bolmady. Interneti barlaň.','Could not delete the account. Check the internet.'],
  'Нет активных подписок':['Işjeň abuna ýok','No active subscriptions'], 'в избранном':['halanlarymda','in favorites'], 'Пока нет объявлений.':['Entek bildiriş ýok.','No listings yet.'],
  'Период запуска: все объявления бесплатно':['Işe giriziş döwri: ähli bildirişler mugt','Launch period: all listings are free'],
  'Период запуска: всё бесплатно':['Işe giriziş döwri: hemme zat mugt','Launch period: everything is free'],
  'Сейчас все объявления бесплатно':['Häzir ähli bildirişler mugt','All listings are free right now'],
  'Сейчас все объявления — бесплатно':['Häzir ähli bildirişler mugt','All listings are free right now'],
  'Первое объявление — бесплатно на 7 дней':['Ilkinji bildiriş — 7 gün mugt','First listing — free for 7 days'],
  'Машины, техника и работа — в одном месте':['Maşynlar, tehnika we iş — bir ýerde','Cars, machinery and jobs — in one place'],
  'До 10 фото, 30 дней, продление тоже бесплатное.':['10 surata çenli, 30 gün, uzaltmak hem mugt.','Up to 10 photos, 30 days, renewal is free too.'],
  'До 10 фото. Потом — продление подпиской.':['10 surata çenli. Soňra abuna bilen uzaldylýar.','Up to 10 photos. Then renew with a subscription.'],
  '7 дней бесплатно':['7 gün mugt','7 days free'], 'резюме бесплатно':['rezýume mugt','resume is free'],
  'Опубликовано бесплатно на 30 дней':['30 gün mugt çap edildi','Published free for 30 days'], 'Опубликовано бесплатно на 7 дней':['7 gün mugt çap edildi','Published free for 7 days'],
  'Резюме опубликовано бесплатно на 30 дней':['Rezýume 30 gün mugt çap edildi','Resume published free for 30 days'], 'Опубликовано по подписке':['Abuna boýunça çap edildi','Published with subscription'],
  'Сохранено. Объявление включится после оплаты подписки':['Ýatda saklandy. Bildiriş abuna tölenenden soň işlär','Saved. The listing turns on after the subscription is paid'],
  'Отправлено на проверку модератору:':['Moderatora barlaga iberildi:','Sent to the moderator for review:'],
  'Продлено бесплатно на 30 дней':['30 gün mugt uzaldyldy','Renewed free for 30 days'], 'Оплата за каждое объявление':['Her bildiriş üçin töleg','Pay per listing'],
  'Продвижение':['Öňe çykarmak','Promotion'], 'Поднять в топ':['Topa çykar','Bump to top'], 'Выделить цветом':['Reňk bilen bellemek','Highlight with color'],
  'VIP на главной':['Baş sahypada VIP','VIP on home page'], 'Объявление на первом месте в разделе, 3 дня':['Bildiriş bölümde birinji ýerde, 3 gün','Listing first in its section, 3 days'],
  'Яркая рамка в ленте, 7 дней':['Lentada ýagty çarçuwa, 7 gün','Bright frame in the feed, 7 days'], 'Карусель VIP на главной, 7 дней':['Baş sahypada VIP karusel, 7 gün','VIP carousel on home page, 7 days'],
  'Цены продвижения — пример, их можно изменить.':['Öňe çykarmagyň bahalary mysal, olary üýtgedip bolýar.','Promotion prices are examples and can be changed.'],
  'Я оплатил':['Töledim','I have paid'], 'Выберите банк':['Banky saýlaň','Choose a bank'], 'Заявка отправлена на проверку':['Ýüztutma barlaga iberildi','Request sent for review'],
  'Подписка активирована':['Abuna işjeňleşdirildi','Subscription activated'], 'Режим:':['Tertip:','Mode:'], 'без ограничений':['çäksiz','unlimited'],
  'до 3 авто':['3 awtoulaga çenli','up to 3 cars'], 'до 10 авто':['10 awtoulaga çenli','up to 10 cars'], 'до 30 авто':['30 awtoulaga çenli','up to 30 cars'], 'до 100 авто':['100 awtoulaga çenli','up to 100 cars'],
  '1 авто':['1 awtoulag','1 car'], '1 сервис':['1 hyzmat','1 service'], '1 единица':['1 birlik','1 unit'], 'до 3 точек':['3 nokada çenli','up to 3 locations'],
  'автопарк до 5':['awtopark 5-e çenli','fleet up to 5'], 'автопарк до 15':['awtopark 15-e çenli','fleet up to 15'], 'до 20 товаров':['20 haryda çenli','up to 20 items'],
  'до 100 товаров':['100 haryda çenli','up to 100 items'], 'до 10 вакансий':['10 boş iş ornuna çenli','up to 10 vacancies'], '«Ищу водителя»':['«Sürüji gözleýärin»','«Hiring a driver»'],
  'Авто, импорт, аренда':['Awtoulag, getirmek, kärende','Cars, imports, rental'], 'проверенная':['barlanan','verified'],

  // ====== Уведомления ======
  'Уведомлений пока нет.':['Entek habarnama ýok.','No notifications yet.'],
  'Добро пожаловать! Первое объявление — бесплатно на 7 дней.':['Hoş geldiňiz! Ilkinji bildiriş — 7 gün mugt.','Welcome! Your first listing is free for 7 days.'],
  'Новый комментарий к «':['Täze teswir «','New comment on «'], 'Объявление «':['Bildiriş «','Listing «'], 'Объявлению «':['Bildirişe «','Listing «'],
  'Срок объявления «':['Bildirişiň möhleti «','The listing «'], '» прошло проверку':['» barlagdan geçdi','» passed review'], '» отклонено модератором':['» moderator tarapyndan ret edildi','» was rejected by the moderator'],
  '» закончился. Оно скрыто, продлите подпиской.':['» tamamlandy. Ol gizlendi, abuna bilen uzaldyň.','» has expired. It is hidden — renew it with a subscription.'],
  '» осталось':['» galdy','» has left'], 'дн. Продлите подпиской.':['gün. Abuna bilen uzaldyň.','days. Renew with a subscription.'],
  'подтверждена. Подписка «':['tassyklandy. Abuna «','confirmed. Subscription «'], '» активна до':['» işjeň:','» is active until'],
  'подтверждена. «':['tassyklandy. «','confirmed. «'], '» опубликовано на 30 дней.':['» 30 günlük çap edildi.','» published for 30 days.'], '» включено.':['» işjeňleşdirildi.','» is on.'],
  'не найдена. Проверьте номер и сумму или напишите в поддержку.':['tapylmady. Belgini we möçberi barlaň ýa-da goldaw gullugyna ýazyň.','was not found. Check the number and amount, or contact support.'],

  // ====== Админ-панель ======
  'Пользователь заблокирован':['Ulanyjy petiklendi','User blocked'], 'Блокировка снята':['Petik aýryldy','User unblocked'], 'Новый пароль для':['Täze parol:','New password for'],
  'Сообщите его пользователю и попросите сменить после входа.':['Ony ulanyja aýdyň we girenden soň üýtgetmegi haýyş ediň.','Tell it to the user and ask them to change it after signing in.'],
  'Не удалось сбросить пароль:':['Paroly täzeläp bolmady:','Could not reset the password:'], 'Данные обновлены':['Maglumatlar täzelendi','Data updated'],
  'Оскорбления в тексте':['Tekstde kemsitmeler','Insults in the text'], 'Ссылка в описании':['Düşündirişde salgylanma','Link in the description'], 'Телефон в тексте':['Tekstde telefon','Phone in the text'],
  'Цена сильно ниже рынка':['Baha bazardan has pes','Price far below market'], 'Повтор объявления':['Gaýtalanýan bildiriş','Duplicate listing'],
  'Слишком много объявлений за день':['Bir günde gaty köp bildiriş','Too many listings in a day'],
  'Нет связи с сервером. Проверьте интернет.':['Serwer bilen baglanyşyk ýok. Interneti barlaň.','No connection to the server. Check the internet.'],
  'Часть изменений не сохранилась. Проверьте интернет.':['Üýtgeşmeleriň bir bölegi saklanmady. Interneti barlaň.','Some changes were not saved. Check the internet.'],

  // ====== Подсказки в полях ======
  'Ищу водителя на фуру, категория CE':['Fura üçin sürüji gerek, CE kategoriýa','Hiring a semi-truck driver, category CE'], '25 т или 10 м':['25 t ýa-da 10 m','25 t or 10 m'],
  'C, вылет стрелы 30 м':['C, strelanyň uzynlygy 30 m','C, boom reach 30 m'], 'Ашхабад и Ахал, межгород':['Aşgabat we Ahal, şäherara','Ashgabat and Ahal, intercity'],
  '09:00–20:00, без выходных':['09:00–20:00, dynç güni ýok','09:00–20:00, no days off'], 'ул. Магтымгулы, 45':['Magtymguly köç., 45','45 Magtymguly St.'], 'Где работаете':['Nirede işleýärsiňiz','Where you work'],

  // ====== Регионы и города ======
  'Ашхабад':['Aşgabat','Ashgabat'], 'Аркадаг':['Arkadag','Arkadag'], 'Ахал':['Ahal','Ahal'], 'Балкан':['Balkan','Balkan'], 'Лебап':['Lebap','Lebap'], 'Мары':['Mary','Mary'],
  'Ахалский велаят':['Ahal welaýaty','Ahal province'], 'Балканский велаят':['Balkan welaýaty','Balkan province'], 'Дашогузский велаят':['Daşoguz welaýaty','Dashoguz province'],
  'Лебапский велаят':['Lebap welaýaty','Lebap province'], 'Марыйский велаят':['Mary welaýaty','Mary province'],
  'Багтыярлык':['Bagtyýarlyk','Bagtyyarlyk'], 'Беркарарлык':['Berkararlyk','Berkararlyk'], 'Бузмеин':['Büzmeýin','Buzmeyin'], 'Копетдаг':['Köpetdag','Kopetdag'],
  'Горджав':['Gorjaw','Gorjaw'], 'Кяризек':['Kärizek','Karizek'], 'Анев':['Änew','Anau'], 'Теджен':['Tejen','Tejen'], 'Гёкдепе':['Gökdepe','Gokdepe'], 'Бахарден':['Bäherden','Baherden'],
  'Каахка':['Kaka','Kaka'], 'Сарахс':['Sarahs','Sarahs'], 'Бабадайхан':['Babadaýhan','Babadayhan'], 'Алтын асыр':['Altyn asyr','Altyn Asyr'],
  'Балканабат':['Balkanabat','Balkanabat'], 'Туркменбаши':['Türkmenbaşy','Turkmenbashi'], 'Берекет':['Bereket','Bereket'], 'Гызыларбат':['Gyzylarbat','Gyzylarbat'],
  'Магтымгулы':['Magtymguly','Magtymguly'], 'Эсенгулы':['Esenguly','Esenguly'], 'Хазар':['Hazar','Hazar'], 'Аваза':['Awaza','Awaza'], 'Этрек':['Etrek','Etrek'],
  'Дашогуз':['Daşoguz','Dashoguz'], 'Кёнеургенч':['Köneürgenç','Koneurgench'], 'Губадаг':['Gubadag','Gubadag'], 'Болдумсаз':['Boldumsaz','Boldumsaz'], 'Акдепе':['Akdepe','Akdepe'],
  'Шабат':['Şabat','Shabat'], 'Гёроглы':['Görogly','Gorogly'], 'Туркменабат':['Türkmenabat','Turkmenabat'], 'Керки':['Kerki','Kerki'], 'Газоджак':['Gazojak','Gazojak'],
  'Сейди':['Seýdi','Seydi'], 'Койтендаг':['Köýtendag','Koytendag'], 'Фараб':['Farap','Farap'], 'Халач':['Halaç','Halach'], 'Саят':['Saýat','Sayat'], 'Дянев':['Dänew','Danew'],
  'Байрамали':['Baýramaly','Bayramaly'], 'Иолотань':['Ýolöten','Yoloten'], 'Мургап':['Murgap','Murgap'], 'Туркменгала':['Türkmengala','Turkmengala'],
  'Тагтабазар':['Tagtabazar','Tagtabazar'], 'Сакарчаге':['Sakarçäge','Sakarchage'], 'Шатлык':['Şatlyk','Shatlyk'], 'Андалып':['Andalyp','Andalyp'], 'Рухубелент':['Ruhubelent','Ruhubelent'],
  'Ак бугдайский этрап':['Ak bugdaý etraby','Ak Bugday district'], 'Алтынасырский этрап':['Altyn asyr etraby','Altyn Asyr district'], 'Бабадайханский этрап':['Babadaýhan etraby','Babadayhan district'],
  'Бахарденский этрап':['Bäherden etraby','Baherden district'], 'Гёкдепинский этрап':['Gökdepe etraby','Gokdepe district'], 'Каахкинский этрап':['Kaka etraby','Kaka district'],
  'Сарахский этрап':['Sarahs etraby','Sarahs district'], 'Тедженский этрап':['Tejen etraby','Tejen district'], 'Берекетский этрап':['Bereket etraby','Bereket district'],
  'Магтымгулыйский этрап':['Magtymguly etraby','Magtymguly district'], 'Туркменбашинский этрап':['Türkmenbaşy etraby','Turkmenbashi district'], 'Эсенгулыйский этрап':['Esenguly etraby','Esenguly district'],
  'Гызыларбатский этрап':['Gyzylarbat etraby','Gyzylarbat district'], 'Этрекский этрап':['Etrek etraby','Etrek district'], 'Акдепинский этрап':['Akdepe etraby','Akdepe district'],
  'Болдумсазский этрап':['Boldumsaz etraby','Boldumsaz district'], 'Гёроглынский этрап':['Görogly etraby','Gorogly district'], 'Губадагский этрап':['Gubadag etraby','Gubadag district'],
  'Кёнеургенчский этрап':['Köneürgenç etraby','Koneurgench district'], 'Рухубелентский этрап':['Ruhubelent etraby','Ruhubelent district'], 'Шабатский этрап':['Şabat etraby','Shabat district'],
  'Гарашсызлыкский этрап':['Garaşsyzlyk etraby','Garashsyzlyk district'], 'Этрап Сапармурата Туркменбаши':['S. A. Nyýazow adyndaky etrap','Saparmurat Turkmenbashi district'],
  'Дарганатинский этрап':['Darganata etraby','Darganata district'], 'Довлетлийский этрап':['Döwletli etraby','Dowletli district'], 'Дянёвский этрап':['Dänew etraby','Danew district'],
  'Керкинский этрап':['Kerki etraby','Kerki district'], 'Койтендагский этрап':['Köýtendag etraby','Koytendag district'], 'Саятский этрап':['Saýat etraby','Sayat district'],
  'Фарабский этрап':['Farap etraby','Farap district'], 'Халачский этрап':['Halaç etraby','Halach district'], 'Ходжамбазский этрап':['Hojambaz etraby','Hojambaz district'],
  'Чарджевский этрап':['Çärjew etraby','Charjew district'], 'Гарабекевюлский этрап':['Garabekewül etraby','Garabekewul district'], 'Байрамалийский этрап':['Baýramaly etraby','Bayramaly district'],
  'Векильбазарский этрап':['Wekilbazar etraby','Wekilbazar district'], 'Марыйский этрап':['Mary etraby','Mary district'], 'Мургапский этрап':['Murgap etraby','Murgap district'],
  'Огузханский этрап':['Oguzhan etraby','Oguzhan district'], 'Сакарчагинский этрап':['Sakarçäge etraby','Sakarchage district'], 'Тагтабазарский этрап':['Tagtabazar etraby','Tagtabazar district'],
  'Туркменгалинский этрап':['Türkmengala etraby','Turkmengala district'], 'Ёлётенский этрап':['Ýolöten etraby','Yoloten district'], 'Гарагумский этрап':['Garagum etraby','Garagum district']
};

Object.assign(TR, {
  // ====== Каталог марок и мелочи ======
  'Легковые':['Ýeňil awtoulaglar','Passenger cars'], 'Легковая':['Ýeňil awtoulag','Passenger car'], 'Грузовые':['Ýük ulaglary','Trucks'],
  'Автомобиль':['Awtoulag','Car'], 'ГАЗ':['GAZ','GAZ'], 'УАЗ':['UAZ','UAZ'], 'ЗИЛ':['ZIL','ZIL'], 'МАЗ':['MAZ','MAZ'], 'КамАЗ':['KamAZ','KamAZ'], 'Урал':['Ural','Ural'],
  'ГАЗ Грузовые':['GAZ ýük ulaglary','GAZ Trucks'], 'Газель Next':['Gazel Next','Gazelle Next'], 'Газон Next':['Gazon Next','Gazon Next'], 'Волга 3110':['Wolga 3110','Volga 3110'],
  'Да':['Hawa','Yes'], 'км':['km','km'], 'Заголовок *':['Sözbaşy *','Title *'], 'Регион *':['Sebit *','Region *'], 'Цена, TMT':['Bahasy, TMT','Price, TMT'],
  '✓ проверенная':['✓ barlanan','✓ verified'], '25 т или 10 м³':['25 t ýa-da 10 m³','25 t or 10 m³'], '−18…+5 °C, вылет стрелы 30 м':['−18…+5 °C, strelanyň uzynlygy 30 m','−18…+5 °C, boom reach 30 m'],
  '₽ по курсу приложения':['₽ programmanyň hümmeti boýunça','₽ at the app exchange rate'], 'Не удалось прочитать фото':['Suraty okap bolmady','Could not read the photo'],
  'Мердан':['Merdan','Merdan'], 'Русский':['Русский','Русский'],

  // ====== Подписки и оплата ======
  'Сейчас период запуска — все объявления бесплатно.':['Häzir işe giriziş döwri — ähli bildirişler mugt.','Launch period — all listings are free right now.'],
  'Платить ничего не нужно. Цены ниже начнут действовать позже, мы заранее предупредим.':['Hiç zat tölemeli däl. Aşakdaky bahalar soňrak güýje girer, öňünden duýduryrys.','Nothing to pay. The prices below will apply later — we will warn you in advance.'],
  'Сейчас оплата за каждое объявление:':['Häzir her bildiriş üçin töleg:','Currently pay per listing:'], 'TMT частным лицам и':['TMT hususy şahslara we','TMT for private persons and'],
  'TMT компаниям, на 30 дней.':['TMT kompaniýalara, 30 gün üçin.','TMT for companies, for 30 days.'], 'Подписка выгоднее, если объявлений несколько.':['Bildiriş birnäçe bolsa, abuna has bähbitli.','A subscription pays off if you have several listings.'],
  'Подписки на объявления':['Bildiriş abunalary','Listing subscriptions'], 'Частным лицам':['Hususy şahslara','Private persons'], 'Компаниям':['Kompaniýalara','Companies'],
  'Экономия':['Tygşytlylyk','Savings'], 'TMT · всего':['TMT · jemi','TMT · total'], 'Без скидки. Чем дольше срок, тем выгоднее.':['Arzanladyşsyz. Möhlet näçe uzyn bolsa, şonça bähbitli.','No discount. The longer the term, the better the price.'],
  '₽ при оплате через банк РФ':['₽ RF banky arkaly tölenende','₽ when paying via a Russian bank'],
  '✓ Первое объявление — бесплатно на 7 дней':['✓ Ilkinji bildiriş — 7 gün mugt','✓ First listing — free for 7 days'], '✓ «Ищу работу» — всегда бесплатно':['✓ «Iş gözleýärin» — hemişe mugt','✓ «Looking for work» — always free'],
  '✓ «Iş gözleýärin» — всегда бесплатно':['✓ «Iş gözleýärin» — hemişe mugt','✓ «Looking for work» — always free'],
  '✓ Скрытые объявления включатся сразу после оплаты':['✓ Gizlenen bildirişler tölegden soň derrew açylar','✓ Hidden listings turn on right after payment'],
  '✓ Тарифы компаний: автосалоны, импортёры, магазины, автопарки':['✓ Kompaniýa tarifleri: awtosalonlar, getirijiler, dükanlar, awtoparklar','✓ Company plans: dealers, importers, shops, fleets'],
  'Подать объявление бесплатно':['Bildirişi mugt goş','Post a listing for free'], 'Оформить за':['Rejelemek:','Get it for'],
  'Заказ не найден':['Sargyt tapylmady','Order not found'], 'Оплата подтверждена':['Töleg tassyklandy','Payment confirmed'], 'Ожидает проверки':['Barlag garaşylýar','Awaiting review'],
  'Подписка активна. Объявления в этом разделе снова видны всем.':['Abuna işjeň. Bu bölümdäki bildirişler ýene hemmä görünýär.','Subscription active. Your listings in this section are visible again.'],
  'Администратор проверит перевод и включит подписку. Обычно это занимает до 30 минут. Вы получите уведомление.':['Administrator geçirimi barlap, abunany açar. Adatça 30 minuda çenli wagt alýar. Size habar geler.','The administrator will check the transfer and turn on the subscription. It usually takes up to 30 minutes. You will get a notification.'],
  'Код заказа':['Sargyt kody','Order code'], 'В профиль':['Profile','To profile'], 'или':['ýa-da','or'], '₽ через банк РФ (курс':['₽ RF banky arkaly (hümmeti','₽ via a Russian bank (rate'],
  '₽ за 1 TMT)':['₽ 1 TMT üçin)','₽ per 1 TMT)'], 'Способ оплаты':['Töleg usuly','Payment method'], 'С туркменского номера':['Türkmen belgisinden','From a Turkmen number'],
  'Банк РФ':['RF banky','Russian bank'], 'банк РФ':['RF banky','Russian bank'], 'Сбербанк':['Sberbank','Sberbank'], 'Альфа-Банк':['Alfa-Bank','Alfa-Bank'], 'Озон Банк':['Ozon Bank','Ozon Bank'], 'Другой банк':['Başga bank','Other bank'],
  'Переведите сумму на номер':['Möçberi şu belgä geçiriň','Transfer the amount to the number'], 'Переведите по номеру телефона (СБП)':['Telefon belgisi boýunça geçiriň (SBP)','Transfer by phone number (SBP)'],
  'Сумма':['Möçberi','Amount'], 'Комментарий к переводу':['Geçirime bellik','Transfer comment'], 'Переводите только с вашего номера':['Diňe öz belgiňizden geçiriň','Transfer only from your number'],
  '. Перевод с другого номера не засчитается.':['. Başga belgiden geçirim hasaba alynmaz.','. A transfer from another number will not count.'], 'Сумма должна совпадать:':['Möçber gabat gelmeli:','The amount must match:'],
  'Обязательно укажите код':['Kody hökman görkeziň','Be sure to include the code'], 'в комментарии к переводу. Без кода оплату невозможно найти.':['geçirimiň belliginde. Kodsuz tölegi tapyp bolmaýar.','in the transfer comment. Without the code the payment cannot be found.'],
  'Перевод должен быть привязан к аккаунту с номером':['Geçirim şu belgili hasaba degişli bolmaly','The transfer must be linked to the account with number'],
  'Подписка включится после проверки перевода администратором.':['Abuna administrator geçirimi barlandan soň açylar.','The subscription turns on after the administrator checks the transfer.'],
  'Прототип: деньги никуда не уходят. Номера получателя задаются в админ-панели.':['Synag görnüşi: pul hiç ýere gitmeýär. Alyjynyň belgileri admin panelinde goýulýar.','Prototype: no money is moved. Recipient numbers are set in the admin panel.'],
  'Подписка:':['Abuna:','Subscription:'], 'Размещение объявления на 30 дней: «':['Bildirişi 30 gün ýerleşdirmek: «','Listing placement for 30 days: «'], 'Продвижение:':['Öňe çykarmak:','Promotion:'],

  // ====== Профиль ======
  'Администратор':['Administrator','Administrator'], 'Модератор':['Moderator','Moderator'], 'активных':['işjeň','active'], 'подписок':['abuna','subscriptions'],
  'У вас есть бесплатное объявление на 7 дней':['Sizde 7 günlük mugt bildiriş bar','You have a free 7-day listing'], 'Подайте первое объявление без оплаты':['Ilkinji bildirişi tölegsiz goşuň','Post your first listing without paying'],
  'Оплата на проверке:':['Töleg barlagda:','Payment under review:'], 'Подписка включится после подтверждения администратором':['Abuna administrator tassyklandan soň açylar','The subscription turns on after the administrator confirms it'],
  '+ Подать':['+ Goş','+ Post'], 'Продлить бесплатно':['Mugt uzalt','Renew for free'], 'Продлить':['Uzalt','Renew'],
  'На проверке у модератора':['Moderatoryň barlagynda','Under moderator review'], 'Отклонено модератором':['Moderator tarapyndan ret edildi','Rejected by the moderator'],
  'Скрыто из-за жалоб, ждёт проверки':['Şikaýatlar sebäpli gizlendi, barlag garaşylýar','Hidden due to reports, awaiting review'], 'Скрыто: нужна подписка':['Gizlendi: abuna gerek','Hidden: subscription needed'],
  'Срок закончился, скрыто':['Möhleti gutardy, gizlendi','Expired, hidden'], 'Активно':['Işjeň','Active'],
  'Бесплатно.':['Mugt.','Free.'], 'Резюме «Ищу работу» публикуется на 30 дней, продление тоже бесплатное.':['«Iş gözleýärin» rezýumesi 30 gün çap edilýär, uzaltmak hem mugt.','A «Looking for work» resume is published for 30 days; renewal is free too.'],
  'Бесплатно на 30 дней.':['30 gün mugt.','Free for 30 days.'], 'Сейчас период запуска: все объявления бесплатные, продление тоже.':['Häzir işe giriziş döwri: ähli bildirişler mugt, uzaltmak hem.','Launch period: all listings are free, renewals too.'],
  'Бесплатно на 7 дней.':['7 gün mugt.','Free for 7 days.'], 'За 2 дня до конца придёт напоминание. Потом объявление скроется, и его можно продлить подпиской.':['Gutarmagyna 2 gün galanda ýatlatma geler. Soňra bildiriş gizlener, ony abuna bilen uzaldyp bolar.','You will get a reminder 2 days before the end. Then the listing is hidden and can be renewed with a subscription.'],
  'По вашей подписке':['Abunaňyz boýunça','With your subscription'], '» до':['» şu güne çenli:','» until'], 'Размещение —':['Ýerleşdirmek —','Placement —'], 'TMT за 30 дней.':['TMT 30 gün üçin.','TMT for 30 days.'],
  'После публикации откроется оплата. При нескольких объявлениях выгоднее':['Çap edilenden soň töleg açylar. Bildiriş birnäçe bolsa, has bähbitli:','Payment opens after publishing. With several listings it is cheaper to get a'],
  'подписка':['abuna','subscription'], 'Нужна подписка.':['Abuna gerek.','Subscription needed.'], 'Объявление сохранится и включится сразу после оплаты.':['Bildiriş saklanar we tölegden soň derrew açylar.','The listing will be saved and turned on right after payment.'], 'Смотреть цены':['Bahalary gör','See prices'],

  // ====== Админ-панель ======
  'Нет доступа':['Rugsat ýok','No access'], 'Раздел только для администраторов':['Bölüm diňe administratorlar üçin','Administrators only'],
  'Оплаты':['Tölegler','Payments'], 'Проверка':['Barlag','Review'], 'Жалобы':['Şikaýatlar','Reports'], 'Люди':['Adamlar','People'], 'Настройки':['Sazlamalar','Settings'],
  'ждёт':['garaşýar','pending'], 'с номера':['belgiden','from number'], 'Проверьте: перевод с номера':['Barlaň: geçirim şu belgiden','Check: transfer from number'], 'и код':['we kod','and code'],
  'в комментарии':['bellikde','in the comment'], 'Активировать':['Işjeňleşdir','Activate'], 'Отклонить':['Ret et','Reject'], 'Новых оплат нет':['Täze töleg ýok','No new payments'],
  'Здесь появятся заявки «Я оплатил»':['«Töledim» ýüztutmalary şu ýerde peýda bolar','«I have paid» requests will appear here'], 'Одобрить':['Tassykla','Approve'], 'Открыть':['Aç','Open'],
  'Очередь пуста':['Nobat boş','Queue is empty'], 'Бот отправляет сюда подозрительные объявления':['Bot şübheli bildirişleri şu ýere iberýär','The bot sends suspicious listings here'],
  'Бот проверяет каждое объявление: мат и оскорбления, ссылки и телефоны в тексте, цену сильно ниже рынка, повторы и слишком много объявлений с одного номера.':['Bot her bildirişi barlaýar: sögünç we kemsitmeler, tekstdäki salgylanmalar we telefonlar, bazardan has pes baha, gaýtalanmalar we bir belgiden gaty köp bildiriş.','The bot checks every listing: profanity and insults, links and phones in the text, prices far below market, duplicates and too many listings from one number.'],
  '(удалено)':['(pozuldy)','(deleted)'], 'Объявление':['Bildiriş','Listing'], 'Комментарий':['Teswir','Comment'], 'Автор:':['Awtory:','Author:'], 'Оставить':['Galdyr','Keep'],
  'Заблокировать автора':['Awtory petikle','Block the author'], 'Жалоб нет':['Şikaýat ýok','No reports'], 'При 5 жалобах объявление скрывается автоматически':['5 şikaýatdan soň bildiriş awtomatik gizlenýär','After 5 reports a listing is hidden automatically'],
  'заблокирован':['petiklenen','blocked'], 'модератор':['moderator','moderator'], 'компания':['kompaniýa','company'], 'частное лицо':['hususy şahs','private person'],
  'Разблокировать':['Petigi aýyr','Unblock'], 'Заблокировать':['Petikle','Block'], 'Снять модератора':['Moderatorlykdan aýyr','Remove moderator'], 'Сделать модератором':['Moderator et','Make moderator'],
  'Сбросить пароль':['Paroly täzele','Reset password'], 'Режим оплаты объявлений':['Bildiriş töleg tertibi','Listing payment mode'], 'Бесплатно':['Mugt','Free'], 'За объявление':['Bildiriş üçin','Per listing'],
  'Период запуска: все объявления бесплатные, продление тоже.':['Işe giriziş döwri: ähli bildirişler mugt, uzaltmak hem.','Launch period: all listings are free, renewals too.'],
  'Каждое объявление оплачивается отдельно на 30 дней. Подписки тоже доступны.':['Her bildiriş 30 gün üçin aýratyn tölenýär. Abunalar hem elýeterli.','Each listing is paid separately for 30 days. Subscriptions are available too.'],
  'Объявления размещаются по подпискам. Первое — бесплатно на 7 дней.':['Bildirişler abuna boýunça ýerleşdirilýär. Ilkinjisi — 7 gün mugt.','Listings are placed with subscriptions. The first one is free for 7 days.'],
  'За объявление: частное лицо, TMT':['Bildiriş üçin: hususy şahs, TMT','Per listing: private person, TMT'], 'За объявление: компания, TMT':['Bildiriş üçin: kompaniýa, TMT','Per listing: company, TMT'],
  'Курс: рублей за 1 TMT':['Hümmet: 1 TMT üçin rubl','Rate: rubles per 1 TMT'], 'Номер для переводов (Туркменистан)':['Geçirimler üçin belgi (Türkmenistan)','Number for transfers (Turkmenistan)'],
  'Номер для СБП (банк РФ)':['SBP üçin belgi (RF banky)','Number for SBP (Russian bank)'], 'Обновить данные с сервера':['Maglumatlary serwerden täzele','Refresh data from server'],
  'пользователей':['ulanyjy','users'], 'TMT оплачено':['TMT tölendi','TMT paid'], 'жалоб':['şikaýat','reports'],
  '→ Люди.':['→ Adamlar.','→ People.'], 'Сейчас в приложении:':['Häzir programmada:','Now in the app:']
});

// Текст с числами внутри: «от 5 TMT», «5 жалоб», «3 ч назад»
const TR_RE = [
  [/^от (\d[\d\s]*)/, (m,n) => ['başlap '+n, 'from '+n]],
  [/^(\d+) жалоб$/, (m,n) => [n+' şikaýat', n+' reports']],
  [/^(\d+) (мин назад|ч назад|дн\. назад)$/, (m,n,u) => [n+' '+TR[u][0], n+' '+TR[u][1]]],
  [/^(\d+) (объявл\.|просм\.)$/, (m,n,u) => [n+' '+TR[u][0], n+' '+TR[u][1]]],
  [/^осталось (\d+) дн\.$/, (m,n) => [n+' gün galdy', n+' days left']],
  [/^([\d\s.,]+) (км|л|лет)$/, (m,n,u) => [n+' '+({км:'km',л:'l',лет:'ýyl'})[u], n+' '+({км:'km',л:'L',лет:'years'})[u]]]
];

const LANG_IDX = () => LANG==='tm' ? 0 : 1;
const CYR = /[А-Яа-яЁё]/;
// Короткие слова (одно слово) заменяем только целиком, длинные фразы — и внутри текста
const TR_SUB = Object.keys(TR).filter(k => k.length >= 6 && /[ «»:,.→₽]/.test(k)).sort((a,b) => b.length - a.length);

function trString(s){
  if (LANG==='ru' || !s || !CYR.test(s)) return s;
  const i = LANG_IDX(), k = s.trim();
  if (TR[k]) return s.replace(k, TR[k][i]);
  for (const [re, fn] of TR_RE){ const m = k.match(re); if (m) return s.replace(m[0], fn(...m)[i]); }
  // Строка из частей через « · » или «, » (например «2015 · Ашхабад») — переводим каждую часть
  if (/ · |, /.test(k)){
    const parts = k.split(/( · |, )/);
    const done = parts.map(p => (p===' · ' || p===', ') ? p : trString(p));
    if (done.join('') !== k) return s.replace(k, done.join(''));
  }
  let out = s;
  for (const key of TR_SUB){ if (out.includes(key)) out = out.split(key).join(TR[key][i]); if (!CYR.test(out)) break; }
  return out;
}

const TR_ATTRS = ['placeholder', 'aria-label', 'title'];
function translateTree(root){
  if (LANG==='ru' || !root) return;
  if (root.nodeType === 3){ const v = trString(root.data); if (v !== root.data) root.data = v; return; }
  if (root.nodeType !== 1 || root.tagName==='SCRIPT' || root.tagName==='STYLE') return;
  for (const a of TR_ATTRS){ const v = root.getAttribute && root.getAttribute(a); if (v && CYR.test(v)){ const t2 = trString(v); if (t2 !== v) root.setAttribute(a, t2); } }
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = w.nextNode(); n; n = w.nextNode()){
    if (n.nodeType === 3){ if (CYR.test(n.data)){ const v = trString(n.data); if (v !== n.data) n.data = v; } }
    else for (const a of TR_ATTRS){ const v = n.getAttribute(a); if (v && CYR.test(v)){ const t2 = trString(v); if (t2 !== v) n.setAttribute(a, t2); } }
  }
}

// Следим за всем, что появляется на экране (экраны, окна, подсказки, ошибки)
function startTranslator(){
  new MutationObserver(list => {
    if (LANG==='ru') return;
    for (const m of list){
      if (m.type === 'characterData') translateTree(m.target);
      else if (m.type === 'attributes') translateTree(m.target);
      else m.addedNodes.forEach(translateTree);
    }
  }).observe(document.body, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:TR_ATTRS});
  translateTree(document.body);
}

// Кредит и обмен у авто
Object.assign(TR, {
  'Кредит':['Kredit','Credit'], 'Обмен':['Çalyşmak','Trade-in'], '✓ Есть':['✓ Bar','✓ Yes'], '✗ Нет':['✗ Ýok','✗ No'],
  '✓ Кредит':['✓ Kredit','✓ Credit'], '✗ Кредит':['✗ Kredit','✗ Credit'], '✓ Обмен':['✓ Çalyşmak','✓ Trade-in'], '✗ Обмен':['✗ Çalyşmak','✗ Trade-in'], 'Условия':['Şertler','Terms']
});


// Оценка цены, поиски, сравнение, VIN, фото
Object.assign(TR, {
  'Сколько стоит моя машина?':['Maşynym näçe durýar?','How much is my car worth?'], 'Сколько стоит машина?':['Maşyn näçe durýar?','Car value'],
  'Средняя цена по похожим объявлениям':['Meňzeş bildirişler boýunça ortaça baha','Average price of similar listings'],
  'Средняя цена по похожим объявлениям в приложении':['Programmadaky meňzeş bildirişler boýunça ortaça baha','Average price of similar listings in the app'],
  'Узнать цену':['Bahany bil','Get the price'], 'средняя цена':['ortaça baha','average price'], 'Самая низкая':['Iň arzan','Lowest'], 'Самая высокая':['Iň gymmat','Highest'],
  'Похожих объявлений':['Meňzeş bildirişler','Similar listings'], 'Похожие объявления':['Meňzeş bildirişler','Similar listings'],
  'Цена зависит от пробега, состояния и комплектации. Это ориентир, а не точная оценка.':['Baha geçen ýoluna, ýagdaýyna we toplumyna bagly. Bu takyk baha däl-de, ugur görkeziji.','The price depends on mileage, condition and trim. It is a guide, not an exact valuation.'],
  'Пока мало похожих объявлений':['Entek meňzeş bildiriş az','Not enough similar listings yet'],
  'Попробуйте без модели или другой год. Чем больше объявлений в приложении, тем точнее оценка.':['Modelsiz ýa-da başga ýyl bilen synanyşyň. Bildiriş näçe köp bolsa, baha şonça takyk bolar.','Try without the model or another year. The more listings in the app, the more accurate the estimate.'],
  'Цена на рынке':['Bazardaky baha','Market price'], 'Средняя цена':['Ortaça baha','Average price'], 'От и до':['Aralygy','Range'], 'Цена по рынку':['Bazar bahasy','Fair price'],
  'Уведомления о поиске':['Gözleg habarnamalary','Search alerts'],
  'Сообщим о новых объявлениях':['Täze bildirişler barada habar bereris','We will notify you about new listings'],
  'Откройте раздел, настройте фильтры (марка, цена, год) и нажмите «Сообщить о новых». Когда появится подходящая машина, придёт уведомление.':['Bölümi açyň, süzgüçleri sazlaň (marka, baha, ýyl) we «Täzeler barada habar ber» basyň. Laýyk maşyn peýda bolanda habar geler.','Open a section, set filters (make, price, year) and tap «Notify me». When a matching car appears, you get a notification.'],
  'Пока нет сохранённых поисков':['Entek saklanan gözleg ýok','No saved searches yet'],
  'Сохраните поиск в любом разделе — и не пропустите нужную машину':['Islendik bölümde gözlegi saklaň — gerekli maşyny sypdyrmaň','Save a search in any section and never miss the right car'],
  'Перейти к авто':['Awtoulaglara geç','Go to cars'], 'Сообщить о новых по этому поиску':['Bu gözleg boýunça täzeler barada habar ber','Notify me about new matches'],
  'Такой поиск уже сохранён':['Bu gözleg eýýäm saklandy','This search is already saved'],
  'Сохранено. Пришлём уведомление о новых объявлениях':['Saklandy. Täze bildirişler barada habar ibereris','Saved. We will notify you about new listings'],
  'Новое объявление по вашему поиску: «':['Gözlegiňiz boýunça täze bildiriş: «','New listing for your search: «'],
  'Сравнение':['Deňeşdirme','Compare'], 'Сравнить с другими':['Beýlekiler bilen deňeşdir','Compare with others'], 'Убрать из сравнения':['Deňeşdirmeden aýyr','Remove from comparison'],
  'Добавлено к сравнению':['Deňeşdirmä goşuldy','Added to comparison'], 'Можно сравнить до 3 машин':['3 maşyna çenli deňeşdirip bolýar','You can compare up to 3 cars'],
  'Добавьте 2–3 машины':['2–3 maşyn goşuň','Add 2–3 cars'], 'Откройте объявление и нажмите «Сравнить»':['Bildirişi açyp, «Deňeşdir» basyň','Open a listing and tap «Compare»'],
  'Убрать':['Aýyr','Remove'], 'Зелёным отмечено лучшее: цена, год, пробег, кредит и обмен.':['Iň gowusy ýaşyl bilen bellendi: baha, ýyl, geçen ýoly, kredit we çalyşmak.','Best values are in green: price, year, mileage, credit and trade-in.'],
  '✓ Проверенный':['✓ Barlanan','✓ Verified'], '✓ Проверенный продавец':['✓ Barlanan satyjy','✓ Verified seller'],
  'Снять «Проверенный»':['«Barlanan» belgini aýyr','Remove «Verified»'], 'Продавец отмечен как проверенный':['Satyjy barlanan diýip bellendi','Seller marked as verified'], 'Отметка снята':['Belgi aýryldy','Mark removed'],
  'VIN (по желанию)':['VIN (islege görä)','VIN (optional)'], '17 знаков, например JTNB11HK0J3012345':['17 belgi, meselem JTNB11HK0J3012345','17 characters, e.g. JTNB11HK0J3012345'],
  'VIN — 17 латинских букв и цифр (без I, O, Q)':['VIN — 17 latyn harp we san (I, O, Q-syz)','VIN — 17 Latin letters and digits (no I, O, Q)'],
  'Проверка по VIN':['VIN boýunça barlag','VIN check'], 'VIN с ошибкой':['VIN ýalňyş','Invalid VIN'], '✓ VIN корректный':['✓ VIN dogry','✓ Valid VIN'],
  'Производитель':['Öndüriji','Manufacturer'], 'Страна сборки':['Ýygnalan ýurdy','Assembly country'], 'Год по VIN':['VIN boýunça ýyly','Year by VIN'],
  'Расшифровка VIN':['VIN-i açmak','Decode VIN'], 'Фото с аукционов':['Auksion suratlary','Auction photos'], 'Угон и тотал (США)':['Ogurlyk we doly zeper (ABŞ)','Theft & total loss (USA)'],
  'В Туркменистане нет общей базы залогов и ДТП. Перед покупкой проверяйте документы и номер кузова на самой машине.':['Türkmenistanda girew we heläkçilik boýunça umumy baza ýok. Satyn almazdan öň resminamalary we maşyndaky kuzow belgisini barlaň.','Turkmenistan has no shared database of liens and accidents. Before buying, check the documents and the VIN on the car itself.'],
  'Великобритания':['Beýik Britaniýa','United Kingdom'], 'Франция / Испания':['Fransiýa / Ispaniýa','France / Spain'], 'Германия':['Germaniýa','Germany'],
  'Швеция':['Şwesiýa','Sweden'], 'Италия':['Italiýa','Italy'], 'Россия':['Russiýa','Russia'], 'Чехия':['Çehiýa','Czechia'], 'Бразилия':['Braziliýa','Brazil'],
  'Канада':['Kanada','Canada'], 'Мексика':['Meksika','Mexico'], 'Австралия':['Awstraliýa','Australia'],
  'Chevrolet (Корея)':['Chevrolet (Koreýa)','Chevrolet (Korea)'], 'Nissan (США)':['Nissan (ABŞ)','Nissan (USA)'], 'Honda (США)':['Honda (ABŞ)','Honda (USA)'], 'Honda (Канада)':['Honda (Kanada)','Honda (Canada)'],
  'Toyota (США)':['Toyota (ABŞ)','Toyota (USA)'], 'Toyota (Канада)':['Toyota (Kanada)','Toyota (Canada)'], 'Hyundai / Kia (США)':['Hyundai / Kia (ABŞ)','Hyundai / Kia (USA)'], 'Ford (Китай)':['Ford (Hytaý)','Ford (China)'],
  '📸 Как сфотографировать машину, чтобы продать быстрее':['📸 Maşyny çalt satmak üçin nädip suratyny almaly','📸 How to photograph your car to sell faster'],
  'Как сфотографировать машину':['Maşynyň suratyny nädip almaly','How to photograph your car'],
  'Спереди под углом':['Öňünden burç bilen','Front at an angle'], 'Машина целиком, видны фары и бок':['Maşyn doly, çyralar we gapdaly görünýär','Whole car, headlights and side visible'],
  'Сзади под углом':['Yzyndan burç bilen','Rear at an angle'], 'Задние фонари и другой бок':['Yzky çyralar we beýleki gapdaly','Tail lights and the other side'],
  'Сбоку':['Gapdaldan','Side'], 'Ровно сбоку, вся машина в кадре':['Göni gapdaldan, maşyn doly kadrda','Straight from the side, whole car in frame'],
  'Салон спереди':['Öňki salon','Front interior'], 'Руль, панель, передние сиденья':['Rul, panel, öňki oturgyçlar','Steering wheel, dashboard, front seats'],
  'Приборная панель':['Enjamlar paneli','Instrument cluster'], 'Включите зажигание: видно пробег и нет ошибок':['Ot almany açyň: geçen ýoly görünsin we ýalňyşlyk bolmasyn','Turn on the ignition: show mileage and no warning lights'],
  'Подкапотное пространство':['Kapotyň aşagy','Engine bay'], 'Двигатель чистый и сухой':['Hereketlendiriji arassa we gury','Engine clean and dry'],
  'Советы':['Maslahatlar','Tips'],
  '☀️ Снимайте днём, при дневном свете, не против солнца':['☀️ Gündiz, gün ýagtysynda, güne garşy däl surata alyň','☀️ Shoot in daylight, not against the sun'],
  '🧽 Помойте машину — чистая продаётся быстрее и дороже':['🧽 Maşyny ýuwuň — arassa maşyn çalt we gymmat satylýar','🧽 Wash the car — clean cars sell faster and for more'],
  '📱 Держите телефон горизонтально, на уровне фар':['📱 Telefony keseligine, çyralaryň derejesinde saklaň','📱 Hold the phone horizontally at headlight level'],
  '🚫 Без людей и мусора в кадре, номер можно закрыть':['🚫 Kadrda adam we zir-zibil bolmasyn, belgini ýapyp bolýar','🚫 No people or clutter in the frame; you can cover the plate'],
  'Понятно':['Düşnükli','Got it']
});

// Числа внутри новых строк: «Ниже рынка на 12%», «По 5 похожим…»
TR_RE.push(
  [/^Ниже рынка на (\d+)%$/, (m,n) => ['Bazardan '+n+'% arzan', n+'% below market']],
  [/^Выше рынка на (\d+)%$/, (m,n) => ['Bazardan '+n+'% gymmat', n+'% above market']],
  [/^По (\d+) похожим объявлениям: та же марка и модель, год ±2$/, (m,n) => [n+' meňzeş bildiriş boýunça: şol bir marka we model, ýyly ±2', 'Based on '+n+' similar listings: same make and model, year ±2']],
  [/^Сохранено: (\d+)$/, (m,n) => ['Saklanan: '+n, 'Saved: '+n]],
  [/^Сравнение · (\d+)$/, (m,n) => ['Deňeşdirme · '+n, 'Compare · '+n]],
  [/^Год в объявлении \((\d+)\) не совпадает с годом по VIN\. Уточните у продавца\.$/, (m,n) => ['Bildirişdäki ýyl ('+n+') VIN boýunça ýyl bilen gabat gelmeýär. Satyjydan anyklaň.', 'The listing year ('+n+') does not match the VIN year. Ask the seller.']]
);

// Новые длинные фразы тоже ищем внутри текста
TR_SUB.splice(0, TR_SUB.length, ...Object.keys(TR).filter(k => k.length >= 6 && /[ «»:,.→₽]/.test(k)).sort((a,b) => b.length - a.length));

Object.assign(TR, {
  'Сравнение ·':['Deňeşdirme ·','Compare ·'], 'Компания ·':['Kompaniýa ·','Company ·'], 'Частное лицо ·':['Hususy şahs ·','Private person ·'],
  'Марка *':['Marka *','Make *'], 'Модель *':['Model *','Model *'], 'Год выпуска *':['Öndürilen ýyly *','Year *']
});
TR_RE.push(
  [/^Фото \((\d+) из (\d+)\)$/, (m,a,b) => ['Surat ('+a+' / '+b+')', 'Photos ('+a+' of '+b+')']],
  [/^(?:от ([\d\s]+?) )?(?:до ([\d\s]+?) )?TMT$/, (m,a,b) => [
    (a?a+'-dan ':'')+(b?b+'-a çenli ':'')+'TMT', (a?'from '+a+' ':'')+(b?'up to '+b+' ':'')+'TMT']]
);

// Поддержка, «О приложении», панель, статистика, «Поделиться»
Object.assign(TR, {
  'Служба поддержки':['Goldaw gullugy','Support'], 'Ответим на вопросы, поможем с объявлением и разберёмся с жалобой':['Soraglara jogap bereris, bildiriş bilen kömek ederis we şikaýata seredilýär','We answer questions, help with listings and handle complaints'],
  'Связаться с нами':['Biz bilen habarlaşyň','Contact us'], 'IMO: тот же номер':['IMO: şol bir belgi','IMO: same number'], 'Работаем каждый день с 09:00 до 21:00':['Her gün 09:00-dan 21:00-a çenli işleýäris','Open every day 09:00–21:00'],
  'Частые вопросы':['Köp soralýan soraglar','FAQ'], 'Написать нам':['Bize ýazyň','Write to us'], 'Тема':['Tema','Topic'],
  'Вопрос':['Sorag','Question'], 'Проблема в приложении':['Programmada mesele','App problem'], 'Мошенник или обман':['Galp ýa-da aldaw','Fraud or scam'], 'Предложение':['Teklip','Suggestion'],
  'Опишите вопрос или проблему. Если про объявление — напишите его название.':['Soragy ýa-da meseläni düşündiriň. Bildiriş barada bolsa, adyny ýazyň.','Describe your question or problem. If it is about a listing, write its title.'],
  'Войдите, чтобы написать в поддержку':['Goldaw gullugyna ýazmak üçin giriň','Sign in to contact support'], 'Мои обращения':['Meniň ýüztutmalarym','My requests'],
  'Поддержка:':['Goldaw:','Support:'], 'Есть ответ':['Jogap bar','Answered'], 'Закрыто':['Ýapyldy','Closed'], 'Ждёт ответа':['Jogap garaşýar','Waiting for reply'],
  'Отправлено. Мы ответим в уведомлениях':['Iberildi. Jogaby habarnamalarda bereris','Sent. We will reply in notifications'], 'Ответ поддержки:':['Goldaw gullugynyň jogaby:','Support reply:'],
  'Как подать объявление?':['Bildirişi nädip goşmaly?','How do I post a listing?'],
  'Нажмите жёлтую кнопку «+» внизу, выберите раздел, заполните поля и добавьте до 10 фото. Нажмите «Опубликовать».':['Aşakdaky sary «+» düwmä basyň, bölümi saýlaň, meýdanlary dolduryň we 10 surata çenli goşuň. «Çap et» basyň.','Tap the yellow «+» button, choose a section, fill in the fields and add up to 10 photos. Tap «Publish».'],
  'Сколько стоит размещение?':['Ýerleşdirmek näçe durýar?','How much does posting cost?'],
  'Сейчас период запуска: все объявления бесплатные на 30 дней, продление тоже бесплатное.':['Häzir işe giriziş döwri: ähli bildirişler 30 gün mugt, uzaltmak hem mugt.','Launch period: all listings are free for 30 days, renewals too.'],
  'Почему объявление «На проверке»?':['Näme üçin bildiriş «Barlagda»?','Why is my listing «Under review»?'],
  'Бот нашёл в нём что-то подозрительное: ссылку, телефон в тексте или слишком низкую цену. Модератор проверит его в течение дня.':['Bot onda şübheli zat tapdy: salgylanma, tekstde telefon ýa-da gaty pes baha. Moderator ony bir günüň dowamynda barlar.','The bot found something suspicious: a link, a phone in the text or a very low price. A moderator will check it within a day.'],
  'Как продлить объявление?':['Bildirişi nädip uzaltmaly?','How do I renew a listing?'],
  'Профиль → Мои объявления → кнопка «Продлить» у объявления, срок которого закончился.':['Profil → Meniň bildirişlerim → möhleti gutaran bildirişde «Uzalt» düwmesi.','Profile → My listings → the «Renew» button on an expired listing.'],
  'Я забыл пароль':['Paroly unutdym','I forgot my password'], 'Напишите нам ниже или позвоните. Администратор проверит номер и выдаст новый пароль.':['Aşakda bize ýazyň ýa-da jaň ediň. Administrator belgini barlap, täze parol berer.','Write to us below or call. The administrator will check your number and give you a new password.'],
  'Как не попасть на мошенника?':['Galplardan nädip goranmaly?','How do I avoid scammers?'],
  'Не переводите предоплату незнакомым. Смотрите машину вживую, проверяйте документы и VIN. На подозрительное объявление нажмите «Пожаловаться».':['Tanamaýan adamlara öňünden töleg geçirmäň. Maşyna öz gözüňiz bilen serediň, resminamalary we VIN-i barlaň. Şübheli bildirişde «Şikaýat et» basyň.','Never prepay strangers. See the car in person, check the documents and VIN. Tap «Report» on suspicious listings.'],
  'Как узнать о новых машинах первым?':['Täze maşynlar barada birinji bolup nädip bilmeli?','How do I hear about new cars first?'],
  'Откройте раздел, настройте фильтры и нажмите «Сообщить о новых по этому поиску». Уведомление придёт, даже если приложение закрыто.':['Bölümi açyň, süzgüçleri sazlaň we «Bu gözleg boýunça täzeler barada habar ber» basyň. Programma ýapyk bolsa-da habar geler.','Open a section, set filters and tap «Notify me about new matches». You get a notification even when the app is closed.'],
  'Как удалить аккаунт?':['Hasaby nädip pozmaly?','How do I delete my account?'], 'Профиль → внизу кнопка «Удалить аккаунт». Все ваши объявления тоже удалятся.':['Profil → aşakda «Hasaby poz» düwmesi. Ähli bildirişleriňiz hem pozular.','Profile → «Delete account» at the bottom. All your listings will be deleted too.'],
  'О приложении':['Programma barada','About'],
  'Alpha Drive — автомаркет Туркменистана. Только машины и всё, что с ними связано: продажа, пригон из-за рубежа, запчасти, спецтехника, аренда, СТО и работа для водителей.':['Alpha Drive — Türkmenistanyň awtobazary. Diňe maşynlar we olar bilen baglanyşykly zatlar: satuw, daşary ýurtdan getirmek, şaýlar, ýörite tehnika, kärende, awtoserwis we sürüjiler üçin iş.','Alpha Drive is the car marketplace of Turkmenistan. Only cars and everything around them: sales, imports, parts, heavy machinery, rental, service and driver jobs.'],
  'Что умеет приложение':['Programma näme edip bilýär','What the app can do'],
  'Объявления о машинах с фото, VIN и ✓ кредитом / обменом':['Surat, VIN we ✓ kredit / çalyşmak bilen maşyn bildirişleri','Car listings with photos, VIN and ✓ credit / trade-in'],
  'Оценка цены: дешевле или дороже рынка':['Baha bahalandyrmasy: bazardan arzanmy ýa gymmatmy','Price check: below or above market'],
  'Уведомления о новых машинах по вашему поиску':['Gözlegiňiz boýunça täze maşynlar barada habarnamalar','Alerts about new cars for your search'],
  'Сравнение 2–3 машин рядом':['2–3 maşyny ýanaşyk deňeşdirmek','Compare 2–3 cars side by side'], 'Проверенные продавцы и автосалоны':['Barlanan satyjylar we awtosalonlar','Verified sellers and dealers'],
  'Три языка: Türkmençe, Русский, English':['Üç dil: Türkmençe, Русский, English','Three languages: Türkmençe, Русский, English'],
  'Правила размещения':['Ýerleşdiriş düzgünleri','Posting rules'],
  '1. Только настоящие машины, запчасти и услуги. Без одежды, техники для дома и прочего.':['1. Diňe hakyky maşynlar, şaýlar we hyzmatlar. Eşik, öý tehnikasy we başga zatlar däl.','1. Only real cars, parts and services. No clothes, home appliances or other goods.'],
  '2. Фото — только вашей машины. Чужие фото из интернета запрещены.':['2. Surat — diňe öz maşynyňyzyňky. Internetden alnan suratlar gadagan.','2. Photos of your own car only. Pictures from the internet are not allowed.'],
  '3. Цена должна быть настоящей. Цена «для привлечения» — повод для удаления.':['3. Baha hakyky bolmaly. «Çekmek üçin» goýlan baha pozmaga sebäp bolýar.','3. The price must be real. Fake «bait» prices lead to removal.'],
  '4. Без ссылок, оскорблений и телефонов в тексте — номер берётся из профиля.':['4. Tekstde salgylanma, kemsitme we telefon bolmasyn — belgi profilden alynýar.','4. No links, insults or phone numbers in the text — the number comes from your profile.'],
  '5. Одна машина — одно объявление. Повторы удаляются.':['5. Bir maşyn — bir bildiriş. Gaýtalanýanlar pozulýar.','5. One car — one listing. Duplicates are removed.'],
  '6. За обман и мошенничество аккаунт блокируется.':['6. Aldaw we galplyk üçin hasap petiklenýär.','6. Accounts are blocked for scams and fraud.'],
  'Политика конфиденциальности':['Gizlinlik syýasaty','Privacy policy'],
  'Мы храним: имя, номер телефона, почту (если указали), ваши объявления, фото, комментарии и обращения в поддержку.':['Biz saklaýarys: adyňyz, telefon belgiňiz, e-poçtaňyz (görkezen bolsaňyz), bildirişleriňiz, suratlaryňyz, teswirleriňiz we goldaw gullugyna ýüztutmalaryňyz.','We store: your name, phone number, email (if given), listings, photos, comments and support requests.'],
  'Номер телефона видят только вошедшие пользователи — чтобы покупатель мог позвонить продавцу.':['Telefon belgisini diňe giren ulanyjylar görýär — alyjy satyja jaň edip bilsin diýip.','Only signed-in users see phone numbers — so buyers can call sellers.'],
  'Пароль хранится в зашифрованном виде, его не видит даже администратор.':['Parol şifrlenen görnüşde saklanýar, ony hatda administrator hem görmeýär.','Passwords are stored encrypted; even the administrator cannot see them.'],
  'Мы не продаём и не передаём ваши данные третьим лицам.':['Biz maglumatlaryňyzy satmaýarys we üçünji taraplara bermeýäris.','We do not sell or share your data with third parties.'],
  'Удалить аккаунт и все данные можно в Профиле в любой момент.':['Hasaby we ähli maglumatlary islendik wagt Profilde pozup bolýar.','You can delete your account and all data in Profile at any time.'],
  'Сайт приложения':['Programmanyň saýty','App website'], 'Версия':['Wersiýa','Version'],
  'Обзор':['Syn','Overview'], 'Поддержка':['Goldaw','Support'], 'Пользователей':['Ulanyjylar','Users'], 'Активных объявлений':['Işjeň bildirişler','Active listings'],
  'Просмотров':['Görülen','Views'], 'Комментариев':['Teswirler','Comments'], 'всего':['jemi','total'], 'Нужно сделать':['Etmeli işler','To do'],
  'Оплаты ждут проверки':['Tölegler barlag garaşýar','Payments awaiting review'], 'Объявления на проверке':['Barlagdaky bildirişler','Listings under review'], 'Обращения в поддержку':['Goldaw ýüztutmalary','Support requests'],
  'Объявления по разделам':['Bölümler boýunça bildirişler','Listings by section'], 'Популярные марки':['Meşhur markalar','Popular makes'], 'Регионы':['Sebitler','Regions'],
  'Самые просматриваемые':['Iň köp görülenler','Most viewed'], 'Пока нет данных':['Entek maglumat ýok','No data yet'],
  'Обращений нет':['Ýüztutma ýok','No requests'], 'Здесь появятся вопросы и жалобы пользователей':['Ulanyjylaryň soraglary we şikaýatlary şu ýerde peýda bolar','User questions and complaints will appear here'],
  'Ответ:':['Jogap:','Reply:'], 'Ответ пользователю':['Ulanyja jogap','Reply to user'], 'Ответить':['Jogap ber','Reply'], 'Напишите ответ':['Jogap ýazyň','Write a reply'], 'Ответ отправлен':['Jogap iberildi','Reply sent'],
  'Телефон поддержки':['Goldaw telefony','Support phone'], 'Telegram (без @)':['Telegram (@-syz)','Telegram (without @)'], 'Почта':['E-poçta','Email'],
  'Поделиться':['Paýlaş','Share'], 'Скопировать текст':['Teksti göçür','Copy text']
});
TR_RE.push(
  [/^\+(\d+) за 7 дней$/, (m,n) => ['7 günde +'+n, '+'+n+' in 7 days']],
  [/^Версия ([\d.]+)$/, (m,n) => ['Wersiýa '+n, 'Version '+n]]
);
TR_SUB.splice(0, TR_SUB.length, ...Object.keys(TR).filter(k => k.length >= 6 && /[ «»:,.→₽]/.test(k)).sort((a,b) => b.length - a.length));

// Защита: памятка покупателю и сообщения сервера
Object.assign(TR, {
  'Безопасная сделка':['Howpsuz söwda','Safe deal'],
  '⚠️ Продавец зарегистрировался недавно. Будьте особенно внимательны.':['⚠️ Satyjy ýaňy-ýakynda hasaba durdy. Has seresap boluň.','⚠️ This seller signed up recently. Be extra careful.'],
  '• Не переводите предоплату и «залог» до осмотра машины':['• Maşyna seretmezden öň öňünden töleg we «girew» geçirmäň','• Do not send prepayments or «deposits» before seeing the car'],
  '• Смотрите машину вживую, сверяйте VIN с документами':['• Maşyna öz gözüňiz bilen serediň, VIN-i resminamalar bilen deňeşdiriň','• See the car in person and match the VIN with the documents'],
  '• Слишком низкая цена — частый признак обмана':['• Gaty pes baha — aldawyň ýygy alamaty','• A price that is too low is a common sign of fraud'],
  'Подозрительно? Пожалуйтесь — модератор проверит':['Şübhelimi? Şikaýat ediň — moderator barlar','Suspicious? Report it — a moderator will check'],
  'Просит предоплату':['Öňünden töleg soraýar','Asks for prepayment'], 'Ссылка или предоплата в тексте':['Tekstde salgylanma ýa-da öňünden töleg','Link or prepayment in the text'],
  'Имя: от 2 до 60 символов':['Ady: 2-den 60 harpa çenli','Name: 2 to 60 characters'], 'Это имя занято. Выберите другое.':['Bu at eýýäm eýeleli. Başgasyny saýlaň.','This name is taken. Choose another.'],
  'Номер телефона не совпадает с регистрацией':['Telefon belgisi hasaba alyş bilen gabat gelmeýär','The phone number does not match the registration'],
  'Нельзя менять роль':['Roly üýtgedip bolmaýar','You cannot change the role'], 'Нельзя менять блокировку и проверку':['Petigi we barlagy üýtgedip bolmaýar','You cannot change block or verification'],
  'Номер телефона менять нельзя':['Telefon belgisini üýtgedip bolmaýar','The phone number cannot be changed'], 'Можно менять только свои записи':['Diňe öz ýazgylaryňyzy üýtgedip bolýar','You can only change your own records'],
  'Можно менять только своё объявление':['Diňe öz bildirişiňizi üýtgedip bolýar','You can only change your own listing'],
  'Не больше 10 объявлений в сутки':['Gije-gündizde 10 bildirişden köp däl','No more than 10 listings per day'], 'Слишком много комментариев. Подождите час.':['Teswir gaty köp. Bir sagat garaşyň.','Too many comments. Wait an hour.'],
  'Слишком много жалоб за сутки':['Bir günde şikaýat gaty köp','Too many reports today'], 'Слишком много обращений. Подождите час.':['Ýüztutma gaty köp. Bir sagat garaşyň.','Too many requests. Wait an hour.'],
  'Слишком много заявок на оплату':['Töleg ýüztutmasy gaty köp','Too many payment requests'], 'Не больше 20 сохранённых поисков':['20 saklanan gözlegden köp däl','No more than 20 saved searches'],
  'Нельзя отправлять уведомления другим':['Başgalara habarnama iberip bolmaýar','You cannot send notifications to others'],
  'Заголовок: от 5 до 120 символов':['Sözbaşy: 5-den 120 harpa çenli','Title: 5 to 120 characters'], 'Описание слишком длинное':['Düşündiriş gaty uzyn','The description is too long'],
  'Проверьте цену':['Bahany barlaň','Check the price'], 'Не больше 10 фото':['10 suratdan köp däl','No more than 10 photos'],
  'Фото можно загружать только через приложение':['Suratlary diňe programma arkaly ýükläp bolýar','Photos can only be uploaded through the app'],
  'Срок объявления не больше 30 дней':['Bildirişiň möhleti 30 günden köp däl','A listing lasts no more than 30 days'], 'Неверный статус объявления':['Bildirişiň ýagdaýy nädogry','Invalid listing status'],
  'Это поле может менять только администратор':['Bu meýdany diňe administrator üýtgedip bilýär','Only the administrator can change this field'],
  'Статус объявления меняет модератор':['Bildirişiň ýagdaýyny moderator üýtgedýär','The moderator changes the listing status'],
  'Комментарий: от 2 до 500 символов':['Teswir: 2-den 500 harpa çenli','Comment: 2 to 500 characters'], 'Объявление не найдено':['Bildiriş tapylmady','Listing not found'],
  'Неверное обращение':['Nädogry ýüztutma','Invalid request'], 'Обращение меняет только поддержка':['Ýüztutmany diňe goldaw gullugy üýtgedýär','Only support can change a request'],
  'Жалобу изменить нельзя':['Şikaýaty üýtgedip bolmaýar','A report cannot be changed'], 'Неверная заявка на оплату':['Nädogry töleg ýüztutmasy','Invalid payment request'],
  'Оплату подтверждает только администратор':['Tölegi diňe administrator tassyklaýar','Only the administrator confirms payments'],
  'Подписку меняет только администратор':['Abunany diňe administrator üýtgedýär','Only the administrator changes subscriptions'],
  'Уведомление изменить нельзя':['Habarnamany üýtgedip bolmaýar','A notification cannot be changed']
});
TR_SUB.splice(0, TR_SUB.length, ...Object.keys(TR).filter(k => k.length >= 6 && /[ «»:,.→₽]/.test(k)).sort((a,b) => b.length - a.length));

// Почта: подтверждение и восстановление пароля
Object.assign(TR, {
  'Электронная почта':['E-poçta','Email'], '✓ Подтверждена':['✓ Tassyklandy','✓ Confirmed'], 'Не подтверждена':['Tassyklanmadyk','Not confirmed'],
  'Мы отправили письмо на':['Hat iberdik:','We sent an email to'],
  '. Откройте его и нажмите «Подтвердить почту». Письма нет? Проверьте папку «Спам».':['. Ony açyp, «E-poçtany tassykla» basyň. Hat ýokmy? «Spam» bukjasyny barlaň.','. Open it and tap «Confirm email». No email? Check the Spam folder.'],
  '— можно входить по почте и восстанавливать пароль через письмо.':['— e-poçta bilen girip we paroly hat arkaly dikeldip bolýar.','— you can sign in with email and recover your password by email.'],
  'Добавьте почту — по ней можно входить и восстановить пароль, если забудете.':['E-poçta goşuň — onuň bilen girip, paroly unutsaňyz dikeldip bolýar.','Add an email — you can sign in with it and recover your password if you forget it.'],
  'Другая почта':['Başga e-poçta','Another email'], 'Отправить ещё раз':['Ýene iber','Send again'], 'Подтвердить':['Tassykla','Confirm'],
  'Письмо отправлено. Откройте почту и нажмите «Подтвердить почту»':['Hat iberildi. E-poçtany açyp, «E-poçtany tassykla» basyň','Email sent. Open your inbox and tap «Confirm email»'],
  'По подтверждённой почте':['Tassyklanan e-poçta boýunça','By confirmed email'],
  'Пришлём письмо со ссылкой. Нажмите на неё и придумайте новый пароль.':['Salgylanmaly hat ibereris. Oňa basyp, täze parol oýlap tapyň.','We will email you a link. Tap it and choose a new password.'],
  'Отправить письмо':['Hat iber','Send email'],
  'Если эта почта подтверждена, письмо уже отправлено. Проверьте почту и папку «Спам».':['Bu e-poçta tassyklanan bolsa, hat eýýäm iberildi. E-poçtany we «Spam» bukjasyny barlaň.','If this email is confirmed, the email has been sent. Check your inbox and the Spam folder.'],
  'Слишком много писем. Попробуйте через час.':['Hat gaty köp. Bir sagatdan soň synanyşyň.','Too many emails. Try again in an hour.'],
  'Войдите в аккаунт ещё раз':['Hasaba täzeden giriň','Sign in again'],
  'Отправка писем ещё не настроена. Напишите в поддержку.':['Hat ibermek entek sazlanmady. Goldaw gullugyna ýazyň.','Email sending is not set up yet. Contact support.'],
  'Нет связи с сервером. Проверьте интернет.':['Serwer bilen baglanyşyk ýok. Interneti barlaň.','No connection to the server. Check the internet.'],
  'Не удалось отправить письмо. Попробуйте позже.':['Haty iberip bolmady. Soňrak synanyşyň.','Could not send the email. Try again later.'],
  '(по желанию — придёт письмо для подтверждения)':['(islege görä — tassyklamak üçin hat geler)','(optional — you will get a confirmation email)']
});
TR_RE.push([/^Мы отправили письмо на (\S+)\. Откройте его и нажмите «Подтвердить почту»\. Письма нет\? Проверьте папку «Спам»\.$/,
  (m,e) => [e+' salgysyna hat iberdik. Ony açyp, «E-poçtany tassykla» basyň. Hat ýokmy? «Spam» bukjasyny barlaň.', 'We sent an email to '+e+'. Open it and tap «Confirm email». No email? Check the Spam folder.']]);
TR_SUB.splice(0, TR_SUB.length, ...Object.keys(TR).filter(k => k.length >= 6 && /[ «»:,.→₽]/.test(k)).sort((a,b) => b.length - a.length));

// Видео и настройки
Object.assign(TR, {
  'Видео (по желанию, 1 шт., до':['Wideo (islege görä, 1 sany,','Video (optional, 1, up to'], 'Добавить видео':['Wideo goş','Add video'], 'Убрать':['Aýyr','Remove'],
  'Короткое видео: машина снаружи, салон, звук двигателя.':['Gysga wideo: maşynyň daşy, salony, hereketlendirijiniň sesi.','A short video: outside, interior, engine sound.'],
  'Загружаем видео… Это может занять минуту.':['Wideo ýüklenýär… Bu bir minut wagt alyp biler.','Uploading video… This may take a minute.'],
  'Не удалось загрузить фото или видео. Проверьте интернет и попробуйте ещё раз.':['Surat ýa-da wideony ýükläp bolmady. Interneti barlap, täzeden synanyşyň.','Could not upload photos or video. Check the internet and try again.'],
  '▶ Видео':['▶ Wideo','▶ Video'],
  'Настройки':['Sazlamalar','Settings'], 'Язык, тема, размер шрифта, уведомления':['Dil, tema, şriftiň ölçegi, habarnamalar','Language, theme, font size, notifications'],
  'Размер шрифта':['Şriftiň ölçegi','Font size'], 'Маленький':['Kiçi','Small'], 'Обычный':['Adaty','Normal'], 'Крупный':['Iri','Large'], 'Очень крупный':['Has iri','Extra large'],
  'Уведомления на телефон':['Telefona habarnamalar','Phone notifications'],
  'Когда приложение закрыто: комментарии, ответы поддержки, новые машины по поиску':['Programma ýapyk wagty: teswirler, goldawyň jogaplary, gözleg boýunça täze maşynlar','When the app is closed: comments, support replies, new cars for your search'],
  'Цена в рублях':['Rubl bilen baha','Price in rubles'], 'Показывать «≈ … ₽» под ценой объявления':['Bildirişiň bahasynyň aşagynda «≈ … ₽» görkez','Show «≈ … ₽» under the listing price'],
  'Вкл.':['Açyk','On'], 'Выкл.':['Ýapyk','Off'],
  'Правила размещения, конфиденциальность, версия':['Ýerleşdiriş düzgünleri, gizlinlik, wersiýa','Posting rules, privacy, version'],
  'Обновить данные':['Maglumatlary täzele','Refresh data'], 'Список сравнения очищен':['Deňeşdirme sanawy arassalandy','Comparison list cleared']
});
TR_RE.push(
  [/^(Маленький|Обычный|Крупный|Очень крупный): так будет выглядеть текст во всём приложении\.$/, (m,n) => [TR[n][0]+': programmadaky ähli tekst şeýle görner.', TR[n][1]+': this is how text will look across the app.']],
  [/^Видео \(по желанию, 1 шт\., до (\d+) сек и (\d+) МБ\)$/, (m,a,b) => ['Wideo (islege görä, 1 sany, '+a+' sek we '+b+' MB çenli)', 'Video (optional, 1, up to '+a+' sec and '+b+' MB)']],
  [/^Видео больше (\d+) МБ\. Снимите короче или в меньшем качестве\.$/, (m,n) => ['Wideo '+n+' MB-dan uly. Gysgarak ýa-da pes hilde surata alyň.', 'The video is over '+n+' MB. Record a shorter or lower-quality one.']],
  [/^Видео длиннее (\d+) секунд\. Обрежьте его\.$/, (m,n) => ['Wideo '+n+' sekuntdan uzyn. Ony gysgaldyň.', 'The video is longer than '+n+' seconds. Trim it.']],
  [/^Очистить сравнение \((\d+)\)$/, (m,n) => ['Deňeşdirmäni arassala ('+n+')', 'Clear comparison ('+n+')']],
  [/^Правила размещения, конфиденциальность, версия ([\d.]+)$/, (m,n) => ['Ýerleşdiriş düzgünleri, gizlinlik, wersiýa '+n, 'Posting rules, privacy, version '+n]],
  [/^🎬 (.+) · ([\d.]+) МБ$/, (m,a,b) => ['🎬 '+a+' · '+b+' MB', '🎬 '+a+' · '+b+' MB']]
);
TR_SUB.splice(0, TR_SUB.length, ...Object.keys(TR).filter(k => k.length >= 6 && /[ «»:,.→₽]/.test(k)).sort((a,b) => b.length - a.length));
Object.assign(TR, {'Видео можно загружать только через приложение':['Wideony diňe programma arkaly ýükläp bolýar','Videos can only be uploaded through the app']});
Object.assign(TR, {'Скопировать текст (для IMO и других)':['Teksti göçür (IMO we beýlekiler üçin)','Copy text (for IMO and others)']});
TR_RE.push([/^([\d.]+) МБ$/, (m,n) => [n+' MB', n+' MB']]);
Object.assign(TR, {
  'Скопировать ссылку':['Salgylanmany göçür','Copy link'], 'Отправить ссылку (IMO, Telegram, WhatsApp…)':['Salgylanmany iber (IMO, Telegram, WhatsApp…)','Send link (IMO, Telegram, WhatsApp…)']
});
Object.assign(TR, {'Скачать приложение для Android':['Android üçin programmany ýükle','Download the Android app']});
Object.assign(TR, {'Код страны':['Ýurduň kody','Country code']});
TR_RE.push([/^Проверьте номер\. Пример: (\+\d+ [\d ]+)$/, (m,n) => ['Belgini barlaň. Mysal: '+n, 'Check the number. Example: '+n]]);
