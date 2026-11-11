'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import Poster from './Poster';
import { STUBS_FOR_DISCOUNT } from '@/lib/bar';
import { T, addStub, entered, foyerSeen, markEntered, markFoyer, reducedMotion, stubs } from '@/lib/store';
import { ambience, sfx } from '@/lib/sound';
import { bySection, bySlug, fmt, seat, sectionOf, sections, type Section, type Work } from '@/lib/works';

const MAIN = ['son-raskolnikova', 'kamo-gryadeshi', 'glam-squad'].map((s) => bySlug(s)!).filter(Boolean);

// Табло = маркиза: самый длинный раздел уходит на правое крыло, остальные на левое
const longest = [...sections].sort((a, b) => bySection(b.id).length - bySection(a.id).length)[0];
const WINGS: Section[][] = [sections.filter((s) => s !== longest), [longest]];

// idle → tearing (кассир рвёт билет) → ticket (ждём «Забрать») → taking (рука)
// → stub (контролёр, корешок) → corridor → переход на /film/:slug, там занавес
type Stage = 'idle' | 'tearing' | 'ticket' | 'taking' | 'stub' | 'corridor';

export default function Foyer() {
  const router = useRouter();
  const [intro, setIntro] = useState(true);
  const [pick, setPick] = useState<Work | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [pocket, setPocket] = useState(0);
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  useEffect(() => {
    // кадры перехода грузим заранее, чтобы за 2–3 секунды перехода они не мигали пустотой
    ['/art/ticket.jpg', '/art/hand.webp', '/art/controller.jpg', '/art/corridor.jpg', '/art/hall.jpg'].forEach((src) => {
      new Image().src = src;
    });
    setPocket(stubs().length);
    ambience({ foyer: 0.22 }); // тихий гул фойе
    if (entered()) setIntro(false);
    return clear;
  }, []);

  const enterCinema = () => {
    markEntered();
    setIntro(false);
  };

  const choose = (w: Work) => {
    clear();
    setPick(w);
    router.prefetch(`/film/${w.slug}`);
    // повторный визит — без анимации кассира
    const wait = foyerSeen() || reducedMotion() ? 0 : T.cashier;
    markFoyer();
    sfx('register', 0.5); // касса выбивает билет
    if (!wait) return setStage('ticket');
    setStage('tearing');
    later(() => setStage('ticket'), wait);
  };

  const enter = useCallback(
    (w: Work) => {
      clear();
      router.push(`/film/${w.slug}`);
    },
    [router],
  );

  const take = () => {
    if (!pick) return;
    const w = pick;
    addStub(w.slug);
    if (reducedMotion()) return enter(w);
    setStage('taking');
    later(() => {
      setStage('stub');
      sfx('tear', 0.9); // контролёр рвёт корешок
    }, T.hand);
    later(() => {
      setStage('corridor');
      ambience({ projector: 0.2 }, 1.2); // фойе стихает, впереди стрекочет проектор
    }, T.hand + T.stub);
    later(() => enter(w), T.hand + T.stub + T.corridor);
  };

  const close = () => {
    clear();
    setStage('idle');
    setPick(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && stage === 'ticket' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const inTransit = stage === 'taking' || stage === 'stub' || stage === 'corridor';
  const s = pick ? seat(pick.slug) : null;

  return (
    <main className="foyer">
      <div className="facade">
        <div className="scene">
          <h1 className="sr-only">Cinéma Alina Revazyan</h1>
          <div className="plate">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <picture>
              <source media="(max-width: 640px), (max-width: 860px) and (orientation: portrait)" srcSet="/art/facade-mobile.jpg" />
              <img className="art" src="/art/facade.jpg" alt="Фасад кинотеатра Alina Revazyan" />
            </picture>
            <Link href="/program" className="entrance" aria-label="Вход: смотреть всю программу без билета">
              <span>
                Entrée
                <small>смотреть всё</small>
              </span>
            </Link>
          </div>

          {/* табло сеансов на пустых крыльях маркизы */}
          <section className="marquee" id="seances" aria-label="Табло сеансов">
            {WINGS.map((wing, n) => (
              <div key={n} className={`wing wing-${n ? 'r' : 'l'}`}>
                {wing.map((sec) => (
                  <div key={sec.id} role="list" aria-label={sec.title}>
                    <h2>{sec.title}</h2>
                    {bySection(sec.id).map((w) => (
                      <button key={w.slug} role="listitem" className="row" onClick={() => choose(w)}>
                        <span className="row-title">{w.title}</span>
                        <span className="row-time">{w.isSeries ? `${w.items.filter((i) => !i.extra).length} серий` : fmt(w.total)}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </section>

          {/* окно кассы; на телефоне это ссылка с подписью — по ней листаем к списку сеансов */}
          <a href="#seances" className="window" aria-label="Касса: к списку сеансов">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/art/cashier.jpg" alt="Кассир в окошке" className={stage === 'tearing' ? 'is-busy' : ''} />
            <span className={`subtitle ${stage === 'tearing' ? 'is-busy' : ''}`}>
              {stage === 'tearing' ? 'Одну минуту…' : 'Выберите сеанс'}
            </span>
          </a>

          {/* на десктопе реплика кассира — облачко, не ссылка */}
          <div
            className="bubble"
            aria-hidden
            key={stage === 'tearing' ? 'busy' : 'idle'}
            style={stage === 'tearing' ? { animationDelay: '0s' } : undefined}
          >
            {stage === 'tearing' ? 'Одну минуту…' : 'Выберите сеанс на табло ↑'}
          </div>

          <div className="affiches">
            {MAIN.map((w) => (
              <button key={w.slug} className="frame" onClick={() => choose(w)} aria-label={`Билет на «${w.title}»`}>
                <Poster work={w} eager />
              </button>
            ))}
            <Link href="/director" className="frame employee" aria-label="Сотрудник месяца: Алина Ревазян">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/photo/alina.jpg" alt="Алина Ревазян" />
              <b>Сотрудник месяца</b>
            </Link>
          </div>
        </div>
      </div>

      <nav className="foyer-nav">
        <Link href="/program" className="btn">
          <span className="skip-word">Пропустить и</span>
          <span>смотреть всё</span>
        </Link>
        <Link href="/bar" className="btn btn-ghost">
          Буфет
        </Link>
        {pocket > 0 && (
          <span className="pocket">
            {pocket < STUBS_FOR_DISCOUNT
              ? `корешки: ${pocket} из ${STUBS_FOR_DISCOUNT} — за три скидка 10%`
              : `корешки: ${pocket} · скидка 10% ждёт в буфете`}
          </span>
        )}
      </nav>

      {intro && (
        <div className="intro">
          <p className="intro-note">Со звуком интереснее</p>
          <div className="intro-title">
            <p>
              <span>Alina Revazyan</span>
              <span>présente</span>
            </p>
            <p>
              <span>La</span>
              <span>séance</span>
            </p>
            <p>
              <span>va</span>
              <span>bientôt</span>
            </p>
            <p className="spread">Commencer</p>
          </div>
          <p className="intro-text">Портфолио режиссёра и дизайнера. Возьмите билет в кассе и проходите в зал.</p>
          <button className="btn btn-light" onClick={enterCinema} autoFocus>
            Войти
          </button>
        </div>
      )}

      {pick && stage !== 'idle' && (
        <div className={`overlay stage-${stage}`} onClick={() => (inTransit ? enter(pick) : stage === 'ticket' && close())}>
          {(stage === 'tearing' || stage === 'ticket' || stage === 'taking') && (
            <>
              {stage === 'tearing' && <div className="subtitle is-busy">Одну минуту, отрываю билет…</div>}
              {stage !== 'tearing' && (
                <div className="ticket-wrap" onClick={(e) => e.stopPropagation()}>
                  {/* бланк билета — картинка public/art/ticket.jpg, текст поверх рендерится кодом */}
                  <div className="ticket">
                    <div className="ticket-main">
                      <h2>{pick.title}</h2>
                      <p>
                        {sectionOf(pick).title} · {pick.kind}
                      </p>
                      <dl>
                        <div>
                          <dt>Salle</dt>
                          <dd>1</dd>
                        </div>
                        <div>
                          <dt>Ряд</dt>
                          <dd>{s!.row}</dd>
                        </div>
                        <div>
                          <dt>Место</dt>
                          <dd>{s!.place}</dd>
                        </div>
                        <div>
                          <dt>Сеанс</dt>
                          <dd>{pick.isSeries ? `${pick.items.filter((i) => !i.extra).length} сер.` : fmt(pick.total)}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  <button className="btn ticket-take" onClick={take} disabled={stage !== 'ticket'} autoFocus>
                    Забрать
                  </button>
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {stage === 'taking' && <img className="hand" src="/art/hand.webp" alt="" />}
            </>
          )}

          {/* контролёр рвёт корешок; корешок улетает в «карман» (счётчик корешков внизу) */}
          {stage === 'stub' && (
            <div className="controller">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/art/controller.jpg" alt="Контролёр отрывает корешок билета" />
              <div className="stub-fly">{pick.title}</div>
            </div>
          )}

          {/* проход по коридору: наезд камеры к дверям «Salle 1» */}
          {stage === 'corridor' && (
            <div className="corridor">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/art/corridor.jpg" alt="Коридор к залу" />
            </div>
          )}

          {inTransit && (
            <button className="skip" onClick={() => enter(pick)}>
              Пропустить →
            </button>
          )}
          {stage === 'ticket' && (
            <button className="skip" onClick={close}>
              ← Другой сеанс
            </button>
          )}
        </div>
      )}
    </main>
  );
}
