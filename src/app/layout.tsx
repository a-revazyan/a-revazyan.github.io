import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter, Oswald } from 'next/font/google';
import { SoundToggle } from '@/components/Sound';
import './globals.css';

// вывеска и заголовки — тонкая контрастная антиква, как буквы на фасаде
const display = Cormorant_Garamond({ subsets: ['latin', 'cyrillic'], weight: ['500', '600'], variable: '--f-display' });
// табло, билеты, кнопки — узкий гротеск, как сменные буквы на маркизе
const board = Oswald({ subsets: ['latin', 'cyrillic'], variable: '--f-board' });
// всё остальное: текст, подписи, поля форм, служебные пометки
const text = Inter({ subsets: ['latin', 'cyrillic'], style: ['normal', 'italic'], variable: '--f-text' });

// адрес сайта для превью ссылок; при переезде на свой домен — поменять здесь
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://a-revazyan.github.io';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Cinéma Alina Revazyan', template: '%s · Cinéma Alina Revazyan' },
  description: 'Портфолио режиссёра и дизайнера Алины Ревазян в виде кинотеатра: реклама, мини-фильмы, сериалы.',
  openGraph: { images: ['/art/facade.jpg'], locale: 'ru_RU', siteName: 'Cinéma Alina Revazyan' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#321A0F' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${board.variable} ${text.variable}`}>
      <body>
        {children}
        <SoundToggle />
      </body>
    </html>
  );
}
