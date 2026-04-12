import type {
  CatalogCategory,
  CatalogDatabase,
  CatalogProductRecord,
  ProductCategory,
  ProductDetails,
  ProductItem,
  ProductPriceFilter,
} from '../types/product';

export const catalogCategories: CatalogCategory[] = [
  {
    id: 'smartphones',
    title: 'Смартфони',
    description: 'Apple, Samsung та інші хіти сезону.',
  },
  {
    id: 'laptops',
    title: 'Ноутбуки',
    description: 'Для навчання, роботи й мобільного офісу.',
  },
  {
    id: 'audio',
    title: 'Аудіо',
    description: 'Навушники, колонки й персональний звук.',
  },
  {
    id: 'gaming',
    title: 'Геймінг',
    description: 'Консолі, аксесуари та все для гри.',
  },
  {
    id: 'home',
    title: 'Дім',
    description: 'Техніка для комфорту та затишку.',
  },
  {
    id: 'accessories',
    title: 'Аксесуари',
    description: 'Кабелі, зарядки та корисні дрібниці.',
  },
];

export const productCatalog: ProductItem[] = [
  {
    id: 'iphone-15-128-black',
    title: 'Apple iPhone 15 128GB Black',
    subtitle: 'Смартфон із Dynamic Island і камерою 48 Мп',
    category: 'smartphones',
    brand: 'Apple',
    price: 38999,
    previousPrice: 40999,
    badge: 'Топ продажів',
    rating: 4.9,
    reviewsCount: 314,
  },
  {
    id: 'galaxy-s24-256',
    title: 'Samsung Galaxy S24 256GB Onyx Black',
    subtitle: 'Флагман із Galaxy AI та AMOLED 120 Гц',
    category: 'smartphones',
    brand: 'Samsung',
    price: 34999,
    previousPrice: 36999,
    badge: 'Новинка',
    rating: 4.8,
    reviewsCount: 221,
  },
  {
    id: 'macbook-air-m3-13',
    title: 'Apple MacBook Air 13" M3 16/512GB',
    subtitle: 'Легкий ноутбук для продуктивної роботи',
    category: 'laptops',
    brand: 'Apple',
    price: 58999,
    previousPrice: 61999,
    badge: 'Хіт для роботи',
    rating: 4.9,
    reviewsCount: 142,
  },
  {
    id: 'asus-vivobook-15',
    title: 'ASUS Vivobook 15 Ryzen 7/16GB/512GB',
    subtitle: 'Універсальний ноутбук для навчання і дому',
    category: 'laptops',
    brand: 'ASUS',
    price: 28999,
    previousPrice: 30999,
    badge: 'Оптимальний вибір',
    rating: 4.7,
    reviewsCount: 98,
  },
  {
    id: 'airpods-pro-2-usbc',
    title: 'Apple AirPods Pro 2 USB-C',
    subtitle: 'Адаптивний шумозаглушення та просторовий звук',
    category: 'audio',
    brand: 'Apple',
    price: 11999,
    previousPrice: 12999,
    badge: 'Рекомендуємо',
    rating: 4.9,
    reviewsCount: 403,
  },
  {
    id: 'jbl-charge-5',
    title: 'JBL Charge 5 Blue',
    subtitle: 'Потужна портативна колонка з вологозахистом',
    category: 'audio',
    brand: 'JBL',
    price: 6999,
    previousPrice: 7499,
    rating: 4.8,
    reviewsCount: 176,
  },
  {
    id: 'ps5-slim-digital',
    title: 'Sony PlayStation 5 Slim Digital Edition',
    subtitle: 'Консоль нового покоління для AAA-геймінгу',
    category: 'gaming',
    brand: 'Sony',
    price: 23999,
    previousPrice: 24999,
    badge: 'Геймерський must-have',
    rating: 4.9,
    reviewsCount: 189,
  },
  {
    id: 'dyson-v8-advanced',
    title: 'Dyson V8 Advanced',
    subtitle: 'Бездротовий пилосос для швидкого прибирання',
    category: 'home',
    brand: 'Dyson',
    price: 16999,
    previousPrice: 18499,
    rating: 4.8,
    reviewsCount: 87,
  },
  {
    id: 'anker-powerbank-20k',
    title: 'Anker Power Bank 20000 mAh',
    subtitle: 'Швидка зарядка для смартфона, планшета й ноутбука',
    category: 'accessories',
    brand: 'Anker',
    price: 2199,
    previousPrice: 2599,
    badge: 'Практичний аксесуар',
    rating: 4.7,
    reviewsCount: 512,
  },
  {
    id: 'baseus-cable-100w',
    title: 'Baseus USB-C Cable 100W 2m',
    subtitle: 'Міцний кабель для швидкої зарядки і передачі даних',
    category: 'accessories',
    brand: 'Baseus',
    price: 499,
    previousPrice: 649,
    rating: 4.6,
    reviewsCount: 268,
  },
];

export function getCatalogCategoryTitle(
  category: ProductCategory,
  categories: CatalogCategory[] = catalogCategories
) {
  return categories.find((item) => item.id === category)?.title ?? 'Категорія';
}

export const productDetailsMap: Record<ProductItem['id'], ProductDetails> = {
  'iphone-15-128-black': {
    overview:
      'iPhone 15 створений для щоденної швидкої роботи, якісної мобільної фотографії та стабільної автономності. Dynamic Island спрощує взаємодію з повідомленнями, а нова камера 48 Мп дає чіткі кадри навіть у вечірньому світлі.',
    highlights: [
      'Dynamic Island для швидкого доступу до активностей і сповіщень',
      'Основна камера 48 Мп з деталізованими фото й 2x zoom',
      'USB-C для заряджання та сумісності з сучасними аксесуарами',
    ],
    specifications: [
      { label: 'Дисплей', value: '6.1" Super Retina XDR OLED' },
      { label: 'Процесор', value: 'Apple A16 Bionic' },
      { label: 'Памʼять', value: '128 ГБ' },
      { label: 'Камери', value: '48 Мп + 12 Мп / 12 Мп фронтальна' },
    ],
    included: ['Смартфон', 'USB-C кабель', 'Документація'],
  },
  'galaxy-s24-256': {
    overview:
      'Galaxy S24 орієнтований на користувачів, яким потрібен флагман Android із компактним корпусом, швидкою камерою та AI-функціями для тексту, фото й пошуку. AMOLED-дисплей 120 Гц робить взаємодію плавною в будь-яких сценаріях.',
    highlights: [
      'Galaxy AI для перекладів, редагування фото та розумного пошуку',
      'Яскравий AMOLED 120 Гц із високою читабельністю на сонці',
      'Потужна потрійна камера для фото, відео та зуму',
    ],
    specifications: [
      { label: 'Дисплей', value: '6.2" Dynamic AMOLED 2X, 120 Гц' },
      { label: 'Процесор', value: 'Samsung Exynos 2400' },
      { label: 'Памʼять', value: '256 ГБ' },
      { label: 'Акумулятор', value: '4000 мА·год, швидка зарядка' },
    ],
    included: ['Смартфон', 'USB-C кабель', 'Скрепка для SIM', 'Документація'],
  },
  'macbook-air-m3-13': {
    overview:
      'MacBook Air на чипі M3 підходить для офісної роботи, монтажу контенту, навчання та повсякденних задач без компромісів по автономності. Легкий корпус дозволяє використовувати його як основний ноутбук у поїздках і на зустрічах.',
    highlights: [
      'Чип Apple M3 для швидкої роботи з офісом, графікою та браузером',
      'Безшумна конструкція без активного охолодження',
      'До 18 годин автономної роботи в мобільному режимі',
    ],
    specifications: [
      { label: 'Дисплей', value: '13.6" Liquid Retina' },
      { label: 'Процесор', value: 'Apple M3' },
      { label: 'Памʼять', value: '16 ГБ RAM / SSD 512 ГБ' },
      { label: 'Вага', value: '1.24 кг' },
    ],
    included: ['Ноутбук', 'Адаптер живлення', 'Кабель MagSafe', 'Документація'],
  },
  'asus-vivobook-15': {
    overview:
      'Vivobook 15 — практичний ноутбук для навчання, домашніх задач і щоденної роботи. Завдяки Ryzen 7 та 16 ГБ RAM він добре тримає багатозадачність, а 15.6-дюймовий формат зручний для таблиць, браузера та відеозустрічей.',
    highlights: [
      'Баланс продуктивності та ціни для універсального використання',
      '16 ГБ оперативної памʼяті для стабільної багатозадачності',
      'Повнорозмірна клавіатура для комфортної роботи з текстом',
    ],
    specifications: [
      { label: 'Дисплей', value: '15.6" Full HD' },
      { label: 'Процесор', value: 'AMD Ryzen 7' },
      { label: 'Памʼять', value: '16 ГБ RAM / SSD 512 ГБ' },
      { label: 'ОС', value: 'Windows / DOS залежно від конфігурації' },
    ],
    included: ['Ноутбук', 'Зарядний пристрій', 'Документація'],
  },
  'airpods-pro-2-usbc': {
    overview:
      'AirPods Pro 2 дають щільний інтегрований досвід для екосистеми Apple: адаптивне шумозаглушення, просторовий звук і зручне перемикання між пристроями. Модель з USB-C спрощує заряджання від тих самих кабелів, що й iPhone чи iPad.',
    highlights: [
      'Активне шумозаглушення та режим прозорості',
      'Персоналізований просторовий звук з відстеженням голови',
      'USB-C кейс із підтримкою швидкого заряджання',
    ],
    specifications: [
      { label: 'Тип', value: 'TWS навушники' },
      { label: 'Підключення', value: 'Bluetooth 5.x' },
      { label: 'Автономність', value: 'До 6 годин без кейса' },
      { label: 'Сумісність', value: 'iPhone, iPad, Mac, Android' },
    ],
    included: ['Навушники', 'Кейс USB-C', 'Насадки 4 розмірів', 'Документація'],
  },
  'jbl-charge-5': {
    overview:
      'JBL Charge 5 — портативна колонка для відпочинку вдома, на природі чи в дорозі. Вона поєднує насичене звучання, вологозахист і функцію power bank, тому зручна не лише для музики, а й для підзарядки гаджетів у русі.',
    highlights: [
      'Фірмовий звук JBL Pro Sound з виразним басом',
      'Захист IP67 від води й пилу',
      'Може заряджати смартфон через USB',
    ],
    specifications: [
      { label: 'Тип', value: 'Портативна Bluetooth-колонка' },
      { label: 'Потужність', value: '40 Вт' },
      { label: 'Автономність', value: 'До 20 годин' },
      { label: 'Захист', value: 'IP67' },
    ],
    included: ['Колонка', 'USB-C кабель', 'Документація'],
  },
  'ps5-slim-digital': {
    overview:
      'PlayStation 5 Slim Digital Edition створена для сучасного консольного геймінгу без дисків. Вона займає менше місця, але зберігає швидкий SSD, підтримку трасування променів і стабільний доступ до цифрової бібліотеки PlayStation Store.',
    highlights: [
      'Швидкий SSD для майже миттєвих завантажень',
      'Підтримка 4K-геймінгу та трасування променів',
      'Компактніший корпус у порівнянні з базовою PS5',
    ],
    specifications: [
      { label: 'Тип', value: 'Ігрова консоль Digital Edition' },
      { label: 'Накопичувач', value: 'SSD 1 ТБ' },
      { label: 'Відео', value: 'До 4K / 120 FPS у підтримуваних іграх' },
      { label: 'Комплектний контролер', value: 'DualSense' },
    ],
    included: ['Консоль', 'DualSense', 'Кабель HDMI', 'Живлення', 'Документація'],
  },
  'dyson-v8-advanced': {
    overview:
      'Dyson V8 Advanced орієнтований на швидке щоденне прибирання квартири або будинку без привʼязки до розетки. Пилосос легко трансформується у ручний формат і дає достатню потужність для підлоги, меблів та автомобіля.',
    highlights: [
      'Бездротовий формат для швидкого прибирання без дротів',
      'Трансформація в ручний пилосос для меблів і салону авто',
      'Фірмова циклонна технологія Dyson',
    ],
    specifications: [
      { label: 'Тип', value: 'Вертикальний бездротовий пилосос' },
      { label: 'Час роботи', value: 'До 40 хвилин' },
      { label: 'Контейнер', value: '0.54 л' },
      { label: 'Призначення', value: 'Суха уборка' },
    ],
    included: ['Пилосос', 'Трубка', 'Насадки', 'Док-станція', 'Документація'],
  },
  'anker-powerbank-20k': {
    overview:
      'Power Bank Anker 20000 mAh підходить для подорожей, відряджень і резервного заряджання кількох пристроїв протягом дня. Велика ємність і підтримка швидкої зарядки дозволяють заряджати смартфон, навушники, планшет і навіть частину ноутбуків.',
    highlights: [
      'Ємність 20000 мА·год для кількох циклів заряджання',
      'Підтримка швидкої зарядки сучасних смартфонів',
      'Надійний корпус і перевірений бренд аксесуарів',
    ],
    specifications: [
      { label: 'Ємність', value: '20000 мА·год' },
      { label: 'Порти', value: 'USB-C + USB-A' },
      { label: 'Потужність', value: 'До 20 Вт' },
      { label: 'Сумісність', value: 'Смартфони, планшети, аксесуари' },
    ],
    included: ['Power Bank', 'USB-C кабель', 'Документація'],
  },
  'baseus-cable-100w': {
    overview:
      'Baseus USB-C 100W — універсальний кабель для швидкої зарядки ноутбуків, смартфонів і павербанків. Посилене обплетення та довжина 2 метри роблять його зручним як вдома, так і на роботі чи в авто.',
    highlights: [
      'Потужність до 100 Вт для ноутбуків і смартфонів',
      'Довжина 2 метри для більш гнучкого розміщення',
      'Надійне обплетення для щоденного використання',
    ],
    specifications: [
      { label: 'Тип', value: 'USB-C to USB-C' },
      { label: 'Потужність', value: 'До 100 Вт' },
      { label: 'Довжина', value: '2 м' },
      { label: 'Призначення', value: 'Зарядка та передача даних' },
    ],
    included: ['Кабель Baseus 2 м'],
  },
};

export function buildSeedCatalogProducts(): CatalogProductRecord[] {
  return productCatalog.map((product) => ({
    ...product,
    details: productDetailsMap[product.id],
  }));
}

export function buildSeedCatalogDatabase(): CatalogDatabase {
  return {
    version: 1,
    seededAt: new Date().toISOString(),
    categories: catalogCategories.map((category) => ({ ...category })),
    products: buildSeedCatalogProducts(),
  };
}

export function findProductById(
  productId: string,
  products: CatalogProductRecord[] = buildSeedCatalogProducts()
) {
  return products.find((item) => item.id === productId) ?? null;
}

export function getRelatedProducts(
  product: ProductItem,
  products: CatalogProductRecord[] = buildSeedCatalogProducts(),
  limit = 3
) {
  return products
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, limit);
}

export function getCatalogBrands(products: ProductItem[] = productCatalog) {
  return Array.from(new Set(products.map((item) => item.brand))).sort((left, right) =>
    left.localeCompare(right, 'uk-UA')
  );
}

export const catalogBrands = getCatalogBrands(productCatalog);

export const catalogPriceFilters: Array<{
  id: ProductPriceFilter;
  title: string;
}> = [
  { id: 'all', title: 'Будь-яка ціна' },
  { id: 'under-10000', title: 'До 10 000 грн' },
  { id: '10000-30000', title: '10 000 – 30 000 грн' },
  { id: '30000-plus', title: 'Від 30 000 грн' },
  { id: 'discount-only', title: 'Лише зі знижкою' },
];
