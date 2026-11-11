'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { ambience, isMuted, setMuted, subscribe, unlock, type LoopName } from '@/lib/sound';

/** Кнопка звука в правом верхнем углу + «пробуждение» звука по первому жесту. Стоит в layout. */
export function SoundToggle() {
  const muted = useSyncExternalStore(subscribe, isMuted, () => false);

  useEffect(() => {
    const wake = () => {
      if (!isMuted()) unlock();
    };
    window.addEventListener('pointerdown', wake, { once: true, capture: true });
    window.addEventListener('keydown', wake, { once: true, capture: true });
    return () => {
      window.removeEventListener('pointerdown', wake, { capture: true });
      window.removeEventListener('keydown', wake, { capture: true });
    };
  }, []);

  return (
    <button
      className="sound-toggle"
      onClick={() => setMuted(!muted)}
      aria-pressed={!muted}
      aria-label={muted ? 'Включить звук' : 'Выключить звук'}
      title={muted ? 'Включить звук' : 'Выключить звук'}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        {muted ? (
          <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        )}
      </svg>
    </button>
  );
}

/** Фон сцены для серверных страниц (программа, анкета): <Ambience foyer={0.18} /> */
export function Ambience(props: Partial<Record<LoopName, number>>) {
  const key = JSON.stringify(props);
  useEffect(() => {
    ambience(JSON.parse(key));
  }, [key]);
  return null;
}
