'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Program from './Program';
import { T, markNotice, noticeSeen, reducedMotion } from '@/lib/store';
import { ambience, sfx } from '@/lib/sound';
import { aspect, bySlug, fmt, nextWork } from '@/lib/works';

// curtain (занавес раздвигается) → notice («Съёмка запрещена», раз за визит) → play → credits
type Phase = 'curtain' | 'notice' | 'play' | 'credits';

export default function Hall({ slug }: { slug: string }) {
  const work = bySlug(slug)!;
  const next = nextWork(work);

  const [sel, setSel] = useState({ slug, i: 0 });
  const i = sel.slug === slug ? Math.min(sel.i, work.items.length - 1) : 0;
  const item = work.items[i];
  const following = work.items[i + 1];

  const [phase, setPhase] = useState<Phase>('curtain');
  const [open, setOpen] = useState(false);
  const [needTap, setNeedTap] = useState(false);
  const [program, setProgram] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(item.duration);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [ui, setUi] = useState(true);

  const stage = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const uiTimer = useRef(0);

  // размер сцены → размер экрана под соотношение сторон видео
  useEffect(() => {
    const el = stage.current!;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure(); // сразу, не дожидаясь ResizeObserver (в фоновой вкладке он не срабатывает)
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const ar = aspect(item);
  const sw = Math.min(box.w, box.h * ar);
  const sh = sw / ar;

  // вход в зал: занавес, потом заставка или сразу фильм
  useEffect(() => {
    const n = Number(new URLSearchParams(location.search).get('s'));
    if (n > 1) setSel({ slug, i: n - 1 });
    const fast = reducedMotion();
    const a = window.setTimeout(() => {
      setOpen(true);
      sfx('curtain', 0.7);
    }, 60);
    const b = window.setTimeout(() => setPhase(noticeSeen() ? 'play' : 'notice'), fast ? 60 : 60 + T.curtain);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
    // только при первом входе в зал
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // проектор стрекочет, пока идёт занавес, заставка и титры; на время фильма — тишина, звучит сам фильм
    if (phase === 'play') ambience({}, 1.5);
    else ambience({ projector: phase === 'credits' ? 0.14 : 0.28 }, 0.8);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'notice') return;
    const t = window.setTimeout(() => {
      markNotice();
      setPhase('play');
    }, T.notice);
    return () => clearTimeout(t);
  }, [phase]);

  // смена фильма или серии: сразу показываем, без повторного занавеса
  useEffect(() => {
    setPhase((p) => (p === 'credits' ? 'play' : p));
    setProgram(false);
    setTime(0);
    setDur(item.duration);
  }, [item.video, item.duration]);

  useEffect(() => {
    if (phase !== 'play') return;
    const v = video.current!;
    setNeedTap(false);
    v.currentTime = 0;
    v.play().catch(() => setNeedTap(true)); // прямая ссылка: браузер ждёт клика
  }, [phase, item.video]);

  const skipIntro = () => {
    markNotice();
    setOpen(true);
    setPhase('play');
  };

  const go = (n: number) => {
    setSel({ slug, i: n });
    history.replaceState(null, '', n ? `?s=${n + 1}` : location.pathname);
    setPhase((p) => (p === 'credits' ? 'play' : p));
  };

  const poke = useCallback(() => {
    setUi(true);
    clearTimeout(uiTimer.current);
    uiTimer.current = window.setTimeout(() => setUi(false), 2600);
  }, []);
  useEffect(() => () => clearTimeout(uiTimer.current), []);

  const toggle = () => {
    const v = video.current!;
    if (v.paused) v.play().catch(() => setNeedTap(true));
    else v.pause();
    poke();
  };

  const fullscreen = () => {
    const el = screen.current!;
    const v = video.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => v.webkitEnterFullscreen?.());
    else v.webkitEnterFullscreen?.(); // iPhone
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'Escape') setProgram(false);
      if (phase !== 'play') return;
      const v = video.current!;
      if (e.key === ' ') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'ArrowRight') v.currentTime += 5;
      else if (e.key === 'ArrowLeft') v.currentTime -= 5;
      else if (e.key === 'f') fullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const intro = phase === 'curtain' || phase === 'notice';

  return (
    <main className={`hall phase-${phase}`}>
      <header className="hall-top">
        <Link href="/" className="link">
          ← Касса
        </Link>
        <div className="hall-title">
          <b>{work.title}</b>
          <span>
            {work.items.length > 1 ? `${item.label} · ` : ''}
            {work.kind}
          </span>
        </div>
        <Link href="/bar" className="sortie">
          SORTIE<small>Выход · буфет</small>
        </Link>
      </header>

      <div className="stage">
        {/* зал вокруг экрана: картинка public/art/hall.jpg, занавес и экран встают в её чёрный проём */}
        <div className="hall-scene">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hall-art" src="/art/hall.jpg" alt="" />
          <div className="opening" ref={stage}>
            <div className="curtain" aria-hidden />
            <div
              ref={screen}
              className={`screen ${ui || !playing ? 'show-ui' : ''}`}
              style={{ width: open ? sw : 0, height: sh || '100%' }}
              onMouseMove={poke}
            >
              <video
                ref={video}
                src={`/video/${item.video}`}
                playsInline
                preload="auto"
                muted={muted}
                onClick={toggle}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
                onEnded={() => {
                  if (document.fullscreenElement) document.exitFullscreen();
                  setPhase('credits');
                }}
              />

              {phase === 'notice' && (
                <button className="notice" onClick={skipIntro}>
                  <span className="notice-cam">
                    <i />
                  </span>
                  <b>Съёмка запрещена</b>
                  <em>Défense de filmer</em>
                  <small>Экранку всё равно никто не досмотрит. Лучше возьмите попкорн.</small>
                </button>
              )}

              {phase === 'play' && needTap && (
                <button
                  className="tap"
                  onClick={() => {
                    setNeedTap(false);
                    video.current!.play();
                  }}
                >
                  <span>▶</span>
                  Начать сеанс
                </button>
              )}

              {phase === 'play' && !needTap && (
                <div className="controls" onClick={(e) => e.stopPropagation()}>
                  <button onClick={toggle} aria-label={playing ? 'Пауза' : 'Смотреть'}>
                    {playing ? '❚❚' : '▶'}
                  </button>
                  <span className="mono">{fmt(time)}</span>
                  <input
                    className="seek"
                    type="range"
                    min={0}
                    max={dur || 1}
                    step={0.1}
                    value={time}
                    aria-label="Перемотка"
                    onChange={(e) => {
                      video.current!.currentTime = Number(e.target.value);
                      poke();
                    }}
                  />
                  <span className="mono">{fmt(dur)}</span>
                  <button onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Включить звук' : 'Выключить звук'}>
                    {muted || volume === 0 ? '🔇' : '🔊'}
                  </button>
                  <input
                    className="vol"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    aria-label="Громкость"
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      video.current!.volume = n;
                      setVolume(n);
                      setMuted(n === 0);
                    }}
                  />
                  <button onClick={fullscreen} aria-label="Во весь экран">
                    ⛶
                  </button>
                </div>
              )}

              {phase === 'credits' && (
                <div className="credits">
                  <small>Fin</small>
                  <h2>{work.title}</h2>
                  {work.about && <p className="about">{work.about}</p>}
                  <p>
                    Réalisation — <Link href="/director">Алина Ревазян</Link>
                  </p>
                  {work.spec && <p className="spec">Концепт / spec-реклама</p>}
                  <div className="credits-nav">
                    {following && (
                      <button className="btn" onClick={() => go(i + 1)}>
                        {following.extra && !item.extra ? 'Бонус после титров' : following.label} →
                      </button>
                    )}
                    <Link className={`btn ${following ? 'btn-ghost' : ''}`} href={`/film/${next.slug}`}>
                      Следующий сеанс: {next.title} →
                    </Link>
                    <button className="link" onClick={() => setPhase('play')}>
                      ↺ Ещё раз
                    </button>
                    <Link className="link" href="/bar">
                      Заказать такой же →
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <div className="curtain" aria-hidden />
          </div>
        </div>

        {intro && (
          <button className="skip" onClick={skipIntro}>
            Пропустить →
          </button>
        )}
      </div>

      <footer className="hall-bottom">
        {work.items.length > 1 && (
          <div className="episodes" role="tablist" aria-label="Серии">
            {work.items.map((it, n) => (
              <button key={it.video} role="tab" aria-selected={n === i} className={n === i ? 'on' : ''} onClick={() => go(n)}>
                {it.short}
              </button>
            ))}
          </div>
        )}
        <button className="btn btn-ghost" onClick={() => setProgram(true)}>
          Программа
        </button>
        <Link className="btn" href={`/film/${next.slug}`}>
          Следующий сеанс →
        </Link>
      </footer>

      {program && (
        <div className="drawer-back" onClick={() => setProgram(false)}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()}>
            <header>
              <h2>Программа</h2>
              <button className="link" onClick={() => setProgram(false)}>
                Закрыть ✕
              </button>
            </header>
            <Program current={slug} />
          </aside>
        </div>
      )}
    </main>
  );
}
