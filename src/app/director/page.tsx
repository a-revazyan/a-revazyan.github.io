import type { Metadata } from 'next';
import Link from 'next/link';
import { Ambience } from '@/components/Sound';
import { INSTAGRAM, TELEGRAM } from '@/lib/bar';

export const metadata: Metadata = {
  title: 'Встреча с режиссёром',
  description: 'Алина Ревазян, дизайнер и AI-режиссёр. Реклама, мультфильмы, моушн, 3D и AI-персонажи — каждая сцена как кадр из кино.',
  openGraph: { images: ['/art/director-poster.jpg'] },
};

const SKILLS = ['Реклама', 'Имиджевые ролики', 'Мультфильмы и сериалы', 'Клипы', 'Моушн-дизайн', '3D', 'AI-блогеры'];

export default function Page() {
  return (
    <main className="page director-page">
      <Ambience foyer={0.18} />
      <header className="page-head">
        <Link href="/" className="link">
          ← Касса
        </Link>
        <div>
          <small>Ce soir au foyer</small>
          <h1>Встреча с режиссёром</h1>
        </div>
        <Link href="/program" className="link">
          Программа →
        </Link>
      </header>

      <article className="director">
        {/* афиша висит в рамке, как на фасаде; картинка — public/art/director-poster.jpg */}
        <div className="director-poster">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/art/director-poster.jpg" alt="Афиша «Rencontre avec la réalisatrice»: Алина Ревазян" />
        </div>

        <div className="director-notes">
          <small>Programme · о режиссёре</small>
          <h2>Алина Ревазян</h2>
          <p className="lead">Дизайнер и AI-режиссёр</p>
          <p>
            Все мои работы начинаются с креатива: я ищу нетривиальные идеи и воплощаю их в проектах. Создаю рекламу,
            мультфильмы, моушн, 3D и AI-персонажей. Каждую сцену продумываю и выстраиваю в полноценную
            кинематографичную картинку.
          </p>
          <ul className="skills">
            {SKILLS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>

          <dl className="contacts">
            <div>
              <dt>Telegram</dt>
              <dd>
                <a href={TELEGRAM} target="_blank" rel="noreferrer">
                  @a_revazyan
                </a>
              </dd>
            </div>
            <div>
              <dt>Instagram</dt>
              <dd>
                <a href={INSTAGRAM} target="_blank" rel="noreferrer">
                  @a.revazyan
                </a>
              </dd>
            </div>
          </dl>

          <div className="director-nav">
            <Link href="/bar" className="btn">
              Заказать ролик
            </Link>
            <Link href="/program" className="btn btn-ghost">
              Смотреть работы
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
