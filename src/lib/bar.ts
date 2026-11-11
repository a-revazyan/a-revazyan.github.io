// Меню буфета. Чтобы добавить цену — впишите число в price (null = «по запросу»).
export type Size = 'S' | 'M' | 'L';

export interface Pack {
  size: Size;
  what: string | null;
  price: number | null;
}

export interface MenuItem {
  id: string;
  bar: string; // позиция в баре
  service: string; // что это на самом деле
  packs: Pack[];
}

/** Входит в любой пакет любой услуги */
export const COMPOSITION =
  'бриф, идея и концепция, сценарий, стилистика и мудборд, листы персонажей — детально продуманные внешность, одежда и образ каждого героя, раскадровка, производство, монтаж, цветокоррекция, звук, 3 круга правок, финальная сборка';

export const GIFT = 'К любому заказу бесплатно: составим бриф вместе и запишу видео-разбор вашей задачи';

export const menu: MenuItem[] = [
  {
    id: 'popcorn',
    bar: 'Попкорн',
    service: 'Рекламные ролики',
    packs: [
      { size: 'S', what: 'Рекламный ролик до 40 секунд', price: 20000 },
      { size: 'M', what: 'Рекламный ролик до 1 минуты', price: 35000 },
      { size: 'L', what: 'Ролик свыше минуты', price: 50000 },
    ],
  },
  {
    id: 'drinks',
    bar: 'Напитки',
    service: 'Имиджевые ролики',
    packs: [
      { size: 'S', what: 'Имиджевый ролик до 30 секунд', price: 25000 },
      { size: 'M', what: 'Имиджевый ролик до 1 минуты', price: 40000 },
      { size: 'L', what: 'Ролик свыше минуты, с героями и сюжетом', price: 60000 },
    ],
  },
  {
    id: 'nachos',
    bar: 'Начос',
    service: 'UGC и создание AI-блогеров',
    packs: [
      { size: 'S', what: 'Один вертикальный ролик до 30 секунд', price: 10000 },
      { size: 'M', what: 'Создание AI-блогера (образ, лист персонажа) и 3 ролика', price: 30000 },
      { size: 'L', what: 'AI-блогер и 10 роликов — контент на месяц', price: 60000 },
    ],
  },
  {
    id: 'hotdog',
    bar: 'Хот-дог',
    service: 'Клипы',
    packs: [
      { size: 'S', what: 'Визуализатор или лирик-видео до 1 минуты', price: 35000 },
      { size: 'M', what: 'Клип до 3 минут с липсингом', price: 70000 },
      { size: 'L', what: 'Сюжетный клип с персонажами и липсингом', price: 110000 },
    ],
  },
  {
    id: 'icecream',
    bar: 'Мороженое',
    service: 'Мультфильмы и сериалы',
    packs: [
      { size: 'S', what: 'Мультфильм до 30 секунд с озвучкой', price: 45000 },
      { size: 'M', what: 'Мультфильм до 1 минуты с озвучкой и липсингом', price: 75000 },
      { size: 'L', what: 'Мини-сериал из 3–5 серий с озвучкой и липсингом', price: 160000 },
    ],
  },
  {
    id: 'candy',
    bar: 'Конфеты',
    service: 'Моушн-дизайн и 3D',
    packs: [
      { size: 'S', what: 'Анимированный логотип или заставка до 10 секунд', price: 10000 },
      { size: 'M', what: 'Моушн-ролик до 30 секунд', price: 25000 },
      { size: 'L', what: '3D-ролик до 1 минуты', price: 45000 },
    ],
  },
];

export const price = (p: Pack) => (p.price == null ? 'по запросу' : `от ${p.price.toLocaleString('ru-RU')} ₽`);
/** Самая низкая цена услуги — для ценника на стойке */
export const minPrice = (m: MenuItem) => {
  const p = m.packs.map((x) => x.price).filter((x): x is number => x != null);
  return p.length ? `от ${Math.min(...p).toLocaleString('ru-RU')} ₽` : 'по запросу';
};

export const packName = (m: MenuItem, p: Pack) => `${m.bar} ${p.size} — ${m.service}`;

/** Награда за коллекцию корешков */
export const STUBS_FOR_DISCOUNT = 3;
export const DISCOUNT = '−10% на первый заказ';

export const TELEGRAM = 'https://t.me/a_revazyan';
export const INSTAGRAM = 'https://www.instagram.com/a.revazyan/';
