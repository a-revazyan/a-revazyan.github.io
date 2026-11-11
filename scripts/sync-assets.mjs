// Копирует ассеты из исходных папок (../видео, ../обложки, ../фото, ../works.json)
// в site/public и site/src/data. Исходники не изменяются. Запуск: npm run assets
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.resolve(site, '..');
const pub = path.join(site, 'public');
const dataDir = path.join(site, 'src', 'data');

const ensure = (d) => fs.mkdirSync(d, { recursive: true });
const list = (d, re) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => re.test(f)) : []);
const stale = (from, to) =>
  !fs.existsSync(to) || fs.statSync(to).mtimeMs < fs.statSync(from).mtimeMs;

[path.join(pub, 'video'), path.join(pub, 'posters'), path.join(pub, 'photo'), dataDir].forEach(ensure);

// 1. Видео + реальные размеры кадра
const videos = {};
for (const f of list(path.join(src, 'видео'), /\.mp4$/i)) {
  const from = path.join(src, 'видео', f);
  const to = path.join(pub, 'video', f);
  if (stale(from, to)) fs.copyFileSync(from, to);
  try {
    const out = JSON.parse(
      execFileSync('ffprobe', [
        '-v', 'error', '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height:stream_side_data=rotation',
        '-of', 'json', from,
      ]).toString(),
    );
    const s = out.streams[0];
    const rot = Math.abs(s.side_data_list?.[0]?.rotation ?? 0);
    videos[f] = rot === 90 || rot === 270 ? [s.height, s.width] : [s.width, s.height];
  } catch {
    /* ffprobe нет — размер возьмём из orientation */
  }
}

// 2. Афиши: уменьшаем до 1350px по длинной стороне и жмём в JPEG (sips есть на любом Mac).
// Берём из двух папок: «_для сайта/обложки» (имя файла = slug) и «мои работы кино/обложки»
// (русские имена, сопоставляются таблицей ниже), плюс site/art/posters — перерисованные афиши (имя = slug).
// Каждая следующая папка главнее предыдущей, если афиша есть в нескольких.
const POSTER_NAMES = {
  'камо грядеши': 'kamo-gryadeshi',
  'лит энерджи': 'lit-energy-film', // «Un court métrage»
  'лит энерджи 2': 'lit-energy-ad', // «Film publicitaire»
  'кэлвин кляин': 'calvin-klein',
  'яндекс': 'yandex-3d-motion',
  'золотой ключ': 'zolotoy-klyuch',
  'тенотен': 'tenoten',
  'собака ру': 'sobaka-ru',
  'инфлюенсер': 'ai-influencer',
};
const posters = {};
for (const dir of [path.join(src, 'обложки'), path.join(src, '..', 'обложки'), path.join(site, 'art', 'posters')]) {
  for (const f of list(dir, /\.(png|jpe?g|webp)$/i)) {
    const from = path.join(dir, f);
    const base = f.replace(/\.[^.]+$/, '').normalize('NFC').toLowerCase();
    const slug = POSTER_NAMES[base] ?? base;
    let name = `${slug}.jpg`;
    try {
      const to = path.join(pub, 'posters', name);
      if (stale(from, to)) {
        execFileSync('sips', ['-Z', '1350', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82', from, '--out', to], { stdio: 'ignore' });
      }
    } catch {
      name = `${slug}${path.extname(f)}`;
      fs.copyFileSync(from, path.join(pub, 'posters', name));
    }
    posters[slug] = name;
  }
}

// 3. Фото
for (const f of list(path.join(src, 'фото'), /\.(png|jpe?g)$/i)) {
  fs.copyFileSync(path.join(src, 'фото', f), path.join(pub, 'photo', f));
}

// 4. Данные
fs.copyFileSync(path.join(src, 'works.json'), path.join(dataDir, 'works.json'));
fs.writeFileSync(path.join(dataDir, 'media.json'), JSON.stringify({ videos, posters }, null, 2));

const works = JSON.parse(fs.readFileSync(path.join(src, 'works.json'), 'utf8')).works;
const missingPosters = works.filter((w) => !posters[w.slug]).map((w) => w.slug);
const missingVideos = works
  .flatMap((w) => [w.video, ...(w.episodes ?? []).map((e) => e.video), ...(w.extras ?? []).map((e) => e.video)])
  .filter((v) => v && !videos[v]);

console.log(`видео: ${Object.keys(videos).length}, афиши: ${Object.keys(posters).length}`);
const extra = Object.keys(posters).filter((p) => !works.some((w) => w.slug === p));
if (extra.length) console.log(`афиши без работы в works.json (проверьте имя файла): ${extra.join(', ')}`);
if (missingPosters.length) console.log(`нет афиш (будут заглушки): ${missingPosters.join(', ')}`);
if (missingVideos.length) console.log(`НЕТ ВИДЕО: ${missingVideos.join(', ')}`);
