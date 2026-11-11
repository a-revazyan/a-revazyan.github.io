import type { NextConfig } from 'next';

// Статическая сборка для GitHub Pages: `npm run build` кладёт готовый сайт в out/.
// Сайт живёт в корне домена (a-revazyan.github.io, потом свой домен), поэтому basePath не нужен.
const config: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
};

export default config;
