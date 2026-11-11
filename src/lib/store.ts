// Мелкая память визита. Всё в try/catch: в приватном режиме хранилище может быть недоступно.
const get = (s: 'local' | 'session', k: string) => {
  try {
    return (s === 'local' ? localStorage : sessionStorage).getItem(k);
  } catch {
    return null;
  }
};
const set = (s: 'local' | 'session', k: string, v: string) => {
  try {
    (s === 'local' ? localStorage : sessionStorage).setItem(k, v);
  } catch {
    /* ок */
  }
};

/** «Съёмка запрещена» показывается один раз за визит */
export const noticeSeen = () => get('session', 'notice') === '1';
export const markNotice = () => set('session', 'notice', '1');

/** Заставка «Войти» — один раз за визит и только новым посетителям */
export const entered = () => get('session', 'entered') === '1' || get('local', 'foyer') === '1';
export const markEntered = () => set('session', 'entered', '1');

/** Повторный визит: фойе без анимации кассира */
export const foyerSeen = () => get('local', 'foyer') === '1';
export const markFoyer = () => set('local', 'foyer', '1');

/** Коллекция корешков */
export const stubs = (): string[] => {
  try {
    return JSON.parse(get('local', 'stubs') ?? '[]');
  } catch {
    return [];
  }
};
export const addStub = (slug: string) => {
  const s = stubs();
  if (!s.includes(slug)) set('local', 'stubs', JSON.stringify([...s, slug]));
};

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Тайминги переходов, мс. Одно место, чтобы крутить ритм. */
export const T = {
  cashier: 600, // кассир отрывает билет
  hand: 650, // рука забирает билет
  stub: 850, // контролёр рвёт корешок
  corridor: 1200, // проход по коридору
  curtain: 1200, // занавес раздвигается
  notice: 3500, // «Съёмка запрещена»
};
