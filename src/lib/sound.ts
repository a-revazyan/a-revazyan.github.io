// Звук сайта: эмбиент фойе, проектор и короткие эффекты. Web Audio, а не <audio>: на iPhone у <audio>
// нельзя менять громкость, и тихий эмбиент играл бы на полную.
// Звук молчит до первого клика или нажатия клавиши (браузеры всё равно не дают играть раньше) —
// это и есть «звук выключен до первого клика» из ТЗ. Выключатель запоминается в localStorage.
// Звук видео в зале сюда не входит: у плеера своя громкость.

const SRC = {
  foyer: '/sound/foyer.mp3', // петля: тихий эмбиент фойе
  projector: '/sound/projector.wav', // петля: стрекот проектора, синтез 24 к/с; WAV — у MP3 на стыке петли щелчок
  register: '/sound/register.mp3', // касса выбивает билет
  tear: '/sound/tear.mp3', // контролёр рвёт корешок
  curtain: '/sound/curtain.mp3', // занавес раздвигается
} as const;

type Name = keyof typeof SRC;
/** У MP3 по краям служебная тишина кодека — в петле её пропускаем, иначе на стыке провал */
const LOOP_TRIM: Record<'foyer' | 'projector', number> = { foyer: 0.04, projector: 0 };
export type LoopName = 'foyer' | 'projector';
export type SfxName = Exclude<Name, LoopName>;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let unlocked = false;
let muted = false;
try {
  muted = typeof localStorage !== 'undefined' && localStorage.getItem('sound') === 'off';
} catch {
  /* приватный режим — просто не помним */
}

const buffers = new Map<Name, Promise<AudioBuffer | null>>();
const loops = new Map<LoopName, { gain: GainNode; source: AudioBufferSourceNode }>();
let wanted: Partial<Record<LoopName, number>> = {};
const subs = new Set<() => void>();
const notify = () => subs.forEach((f) => f());

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  return ctx;
}

function load(name: Name) {
  if (!buffers.has(name)) {
    buffers.set(
      name,
      fetch(SRC[name])
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
        .then((b) => audio().decodeAudioData(b))
        .catch(() => null), // нет файла — сайт просто молчит
    );
  }
  return buffers.get(name)!;
}

/** Первый жест пользователя: будим аудио, грузим звуки, включаем нужные петли */
export function unlock() {
  if (unlocked) return;
  unlocked = true;
  audio().resume().catch(() => {});
  (Object.keys(SRC) as Name[]).forEach(load);
  applyLoops(0.8);
  notify();
}

export const isMuted = () => muted;
export const isUnlocked = () => unlocked;
export function subscribe(fn: () => void) {
  subs.add(fn);
  return () => void subs.delete(fn);
}

export function setMuted(next: boolean) {
  muted = next;
  try {
    localStorage.setItem('sound', next ? 'off' : 'on');
  } catch {
    /* ок */
  }
  if (ctx && master) master.gain.setTargetAtTime(next ? 0 : 1, ctx.currentTime, 0.12);
  if (!next) unlock();
  notify();
}

/** Короткий эффект. До первого клика и при выключенном звуке ничего не делает. */
export async function sfx(name: SfxName, volume = 0.8) {
  if (!unlocked || muted) return;
  const buf = await load(name);
  if (!buf || !ctx || !master) return;
  const s = ctx.createBufferSource();
  const g = ctx.createGain();
  s.buffer = buf;
  g.gain.value = volume;
  s.connect(g).connect(master);
  s.start();
}

/**
 * Фоновые петли сцены: громкость каждой (0…1), не названные — затихают.
 * Вызывается при входе в сцену; до первого клика просто запоминается.
 */
export function ambience(levels: Partial<Record<LoopName, number>>, fade = 1.2) {
  wanted = levels;
  if (unlocked) applyLoops(fade);
}

function applyLoops(fade: number) {
  const c = audio();
  (['foyer', 'projector'] as LoopName[]).forEach(async (name) => {
    const target = wanted[name] ?? 0;
    let loop = loops.get(name);
    if (!loop && target > 0) {
      const buf = await load(name);
      if (!buf || (wanted[name] ?? 0) === 0 || loops.has(name)) return;
      const source = c.createBufferSource();
      const gain = c.createGain();
      source.buffer = buf;
      source.loop = true;
      if (LOOP_TRIM[name]) {
        source.loopStart = LOOP_TRIM[name];
        source.loopEnd = buf.duration - LOOP_TRIM[name];
      }
      gain.gain.value = 0;
      source.connect(gain).connect(master!);
      source.start(0, LOOP_TRIM[name]);
      loop = { gain, source };
      loops.set(name, loop);
    }
    if (!loop) return;
    loop.gain.gain.cancelScheduledValues(c.currentTime);
    loop.gain.gain.setTargetAtTime(wanted[name] ?? 0, c.currentTime, Math.max(fade, 0.05) / 3);
  });
}
