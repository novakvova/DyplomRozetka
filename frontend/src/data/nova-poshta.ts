export const novaPoshta = [
  { city: 'Київ', points: ['Відділення №12, вул. Січових Стрільців', 'Поштомат №4331, ТРЦ Gulliver'] },
  { city: 'Львів', points: ['Відділення №7, вул. Городоцька', 'Поштомат №2104, Forum Lviv'] },
  { city: 'Одеса', points: ['Відділення №18, вул. Дерибасівська', 'Поштомат №1190, City Center'] },
  { city: 'Харків', points: ['Відділення №3, просп. Науки', 'Поштомат №3022, ТРЦ Nikolsky'] },
];

export type NovaPoshtaCity = (typeof novaPoshta)[number];
