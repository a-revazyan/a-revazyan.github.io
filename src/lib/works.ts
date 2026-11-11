import data from '@/data/works.json';
import media from '@/data/media.json';

export type Orientation = 'h' | 'v' | 's';

export interface Item {
  /** «Серия 2», «Бонус: Проходка» или название работы */
  label: string;
  short: string;
  video: string;
  duration: number;
  orientation: Orientation;
  extra: boolean;
}

export interface Work {
  slug: string;
  title: string;
  section: string;
  kind: string;
  /** Описание в одну строку: программа, титры, превью ссылки */
  about: string;
  orientation: Orientation;
  poster: string | null;
  spec: boolean | null;
  items: Item[];
  total: number;
  isSeries: boolean;
}

export interface Section {
  id: string;
  title: string;
  fr: string;
}

interface RawPart {
  n?: number;
  title?: string;
  video: string;
  duration: number;
  orientation?: Orientation;
}
interface RawWork {
  slug: string;
  title: string;
  section: string;
  kind: string;
  about?: string;
  duration?: number;
  orientation: Orientation;
  video?: string;
  poster?: string;
  spec: boolean | null;
  episodes?: RawPart[];
  extras?: RawPart[];
}

const videos = media.videos as unknown as Record<string, number[]>;
const posters = media.posters as unknown as Record<string, string>;

export const sections = data.sections as Section[];

export const works: Work[] = (data.works as unknown as RawWork[]).map((w) => {
  const items: Item[] = [];
  if (w.video) {
    items.push({ label: w.title, short: w.title, video: w.video, duration: w.duration ?? 0, orientation: w.orientation, extra: false });
  }
  for (const e of w.episodes ?? []) {
    items.push({ label: `Серия ${e.n}`, short: String(e.n), video: e.video, duration: e.duration, orientation: e.orientation ?? w.orientation, extra: false });
  }
  for (const e of w.extras ?? []) {
    items.push({ label: `Бонус: ${e.title}`, short: `★ ${e.title}`, video: e.video, duration: e.duration, orientation: e.orientation ?? w.orientation, extra: true });
  }
  const file = posters[w.slug];
  return {
    slug: w.slug,
    title: w.title,
    section: w.section,
    kind: w.kind,
    about: w.about ?? '',
    orientation: w.orientation,
    poster: file ? `/posters/${file}` : null,
    spec: w.spec,
    items,
    total: items.filter((i) => !i.extra).reduce((s, i) => s + i.duration, 0),
    isSeries: !w.video,
  };
});

export const bySlug = (slug: string) => works.find((w) => w.slug === slug);
export const bySection = (id: string) => works.filter((w) => w.section === id);
export const sectionOf = (w: Work) => sections.find((s) => s.id === w.section)!;
export const nextWork = (w: Work) => works[(works.indexOf(w) + 1) % works.length];

/** 261 → «04:21», как время сеанса на табло */
export const fmt = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const FALLBACK: Record<Orientation, number> = { h: 16 / 9, v: 9 / 16, s: 4 / 3 };
/** Реальное соотношение сторон файла, иначе по полю orientation */
export const aspect = (item: Item) => {
  const d = videos[item.video];
  return d ? d[0] / d[1] : FALLBACK[item.orientation];
};

/** Постоянное «место в зале» для билета */
export const seat = (slug: string) => {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return { row: (h % 12) + 1, place: (h % 24) + 1 };
};
