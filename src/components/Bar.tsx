'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ambience } from '@/lib/sound';
import { stubs } from '@/lib/store';
import { COMPOSITION, DISCOUNT, GIFT, STUBS_FOR_DISCOUNT, TELEGRAM, menu, minPrice, packName, price, type MenuItem, type Pack, type Size } from '@/lib/bar';

type Order = { item: MenuItem; pack: Pack };
type Receipt = Order & { name: string; contact: string; task: string; url: string; discount: boolean };
type Card = { item: MenuItem; size: Size };

const byId = (id: string) => menu.find((m) => m.id === id)!;

/**
 * Предметы на стойке — координаты в процентах от картинки public/art/bar.jpg (2688×1520):
 * [left, top, width, height]. При замене арта правятся только эти числа.
 */
const SPOTS: { id: string; item: string; size: Size; box: [number, number, number, number]; tag?: 'size' | 'name' }[] = [
  { id: 'machine', item: 'popcorn', size: 'M', box: [6.5, 36.6, 14.3, 34.5] },
  { id: 'cup-s', item: 'popcorn', size: 'S', box: [24.8, 59.5, 4.9, 11.5], tag: 'size' },
  { id: 'cup-m', item: 'popcorn', size: 'M', box: [30.7, 55.3, 5.9, 15.7], tag: 'size' },
  { id: 'cup-l', item: 'popcorn', size: 'L', box: [37.4, 50.4, 7.7, 20.7], tag: 'size' },
  { id: 'soda', item: 'drinks', size: 'M', box: [47.4, 50.4, 5.2, 20.7], tag: 'name' },
  { id: 'nachos', item: 'nachos', size: 'M', box: [55.1, 61.7, 9, 9.2], tag: 'name' },
  { id: 'hotdog', item: 'hotdog', size: 'M', box: [66.4, 62.7, 9.2, 8.2], tag: 'name' },
  { id: 'candy', item: 'candy', size: 'M', box: [77.5, 47.3, 7.5, 23.7], tag: 'name' },
  { id: 'icecream', item: 'icecream', size: 'M', box: [88.3, 54.4, 4.4, 17], tag: 'name' },
];

/** Короткая строка цен для меню-табло */
const boardPrice = (m: MenuItem) =>
  m.packs.every((p) => p.price == null)
    ? 'S · M · L — по запросу'
    : `от  ${m.packs.map((p) => `${p.size} ${p.price == null ? '—' : p.price.toLocaleString('ru-RU')}`).join(' · ')} ₽`;

export default function Bar() {
  const [card, setCard] = useState<Card | null>(null);
  useEffect(() => ambience({ foyer: 0.18 }), []);
  const [order, setOrder] = useState<Order | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  // собрал 3 корешка в зале — скидка; читаем после монтирования, localStorage есть только в браузере
  const [discount, setDiscount] = useState(false);
  useEffect(() => setDiscount(stubs().length >= STUBS_FOR_DISCOUNT), []);

  const open = (item: string, size: Size = 'M') => setCard({ item: byId(item), size });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setCard(null);
      setOrder(null);
      setReceipt(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!order) return;
    const f = new FormData(e.currentTarget);
    const name = String(f.get('name') ?? '').trim();
    const contact = String(f.get('contact') ?? '').trim();
    const task = String(f.get('task') ?? '').trim();
    const text = [
      'Здравствуйте, Алина! Заказ из буфета:',
      `${packName(order.item, order.pack)} (${price(order.pack)})`,
      discount && `Скидка за ${STUBS_FOR_DISCOUNT} корешка: ${DISCOUNT}`,
      `Имя: ${name}`,
      `Контакт: ${contact}`,
      task && `Задача: ${task}`,
    ]
      .filter(Boolean)
      .join('\n');
    const url = `${TELEGRAM}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
    setReceipt({ ...order, name, contact, task, url, discount });
    setOrder(null);
  };

  const pack = card ? card.item.packs.find((p) => p.size === card.size)! : null;

  return (
    <main className="bar">
      <header className="page-head bar-head">
        <Link href="/" className="link">
          ← Касса
        </Link>
        <div>
          <small>Buffet · Bar du cinéma</small>
          <h1>Буфет</h1>
        </div>
        <Link href="/program" className="link">
          Программа →
        </Link>
      </header>

      {/* Сцена: стойка кинобара. Меню на табло, ценники и купон рендерятся кодом поверх картинки. */}
      <div className="bar-scene">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="art" src="/art/bar.jpg" alt="Стойка буфета: попкорн-автомат, три стакана попкорна, напиток, начос, хот-дог, конфеты и мороженое" />

        <div className="menu-board" aria-label="Меню">
          {menu.map((m) => (
            <button key={m.id} onClick={() => open(m.id, m.id === 'popcorn' ? 'S' : 'M')}>
              <small>{m.bar}</small>
              <b>{m.service}</b>
              <span>{boardPrice(m)}</span>
            </button>
          ))}
        </div>

        {SPOTS.map((s) => {
          const m = byId(s.item);
          const p = m.packs.find((x) => x.size === s.size)!;
          const [left, top, width, height] = s.box;
          return (
            <button
              key={s.id}
              className={`spot spot-${s.id}`}
              style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
              onClick={() => open(s.item, s.size)}
              aria-label={s.id === 'machine' ? 'Попкорн-автомат: рекламные ролики' : `${m.bar}${s.tag === 'size' ? ` ${s.size}` : ''}: ${m.service}`}
            >
              {s.tag === 'size' && (
                <span className="tag">
                  <b>{s.size}</b>
                  {price(p)}
                </span>
              )}
              {s.tag === 'name' && (
                <span className="tag">
                  <b>{m.bar}</b>
                  {minPrice(m)}
                </span>
              )}
            </button>
          );
        })}

        <p className="coupon coupon-stuck">
          <b>Cadeau</b> {GIFT}.
        </p>
      </div>

      <div className="page bar-list">
        <p className="coupon coupon-plain">
          <b>Cadeau</b> {GIFT}.
        </p>
        {discount && (
          <p className="coupon coupon-won">
            <b>Prime</b> У вас {STUBS_FOR_DISCOUNT} корешка — {DISCOUNT}. Скидка добавится в сообщение заказа.
          </p>
        )}

        <h3>
          Меню целиком <i>La carte</i>
        </h3>
        <div className="menu">
          {menu.map((m) => (
            <article key={m.id} className="menu-row">
              <div>
                <b>{m.bar}</b>
                <span>{m.service}</span>
              </div>
              <div className="sizes">
                {m.packs.map((p) => (
                  <button key={p.size} onClick={() => setCard({ item: m, size: p.size })}>
                    <b>{p.size}</b>
                    <span className="mono">{price(p)}</span>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      {card && pack && (
        <div className="drawer-back center" onClick={() => setCard(null)}>
          <div className="bar-card" role="dialog" aria-label={card.item.service} onClick={(e) => e.stopPropagation()}>
            <small>{card.item.bar}</small>
            <h2>{card.item.service}</h2>
            <div className="bar-sizes" role="tablist" aria-label="Размер">
              {card.item.packs.map((p) => (
                <button
                  key={p.size}
                  role="tab"
                  aria-selected={p.size === card.size}
                  className={p.size === card.size ? 'on' : ''}
                  onClick={() => setCard({ ...card, size: p.size })}
                >
                  {p.size}
                </button>
              ))}
            </div>
            <p className="bar-what">{pack.what ?? 'Пакет соберём под вашу задачу'}</p>
            <p className="price mono">{price(pack)}</p>
            <p className="composition">
              <i>Состав:</i>{' '}
              {COMPOSITION}.
            </p>
            <p className="bar-gift">
              <b>Cadeau</b> {GIFT}.
            </p>
            <div className="order-nav">
              <button type="button" className="link" onClick={() => setCard(null)}>
                Закрыть
              </button>
              <button
                className="btn"
                autoFocus
                onClick={() => {
                  setOrder({ item: card.item, pack });
                  setCard(null);
                }}
              >
                Купить
              </button>
            </div>
          </div>
        </div>
      )}

      {order && (
        <div className="drawer-back center" onClick={() => setOrder(null)}>
          <form className="order" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
            <h2>Заказ</h2>
            <p className="mono">
              {packName(order.item, order.pack)} · {price(order.pack)}
            </p>
            {discount && <p className="bar-discount">Скидка за корешки: {DISCOUNT}</p>}
            <label>
              Имя
              <input name="name" required autoComplete="name" autoFocus />
            </label>
            <label>
              Как с вами связаться
              <input name="contact" required placeholder="Telegram, телефон или почта" />
            </label>
            <label>
              Пара слов о задаче
              <textarea name="task" rows={3} />
            </label>
            <p className="hint">Оплаты на сайте нет: откроется Telegram с готовым сообщением, останется нажать «Отправить».</p>
            <div className="order-nav">
              <button type="button" className="link" onClick={() => setOrder(null)}>
                Отмена
              </button>
              <button className="btn">Отправить в Telegram</button>
            </div>
          </form>
        </div>
      )}

      {receipt && (
        <div className="drawer-back center" onClick={() => setReceipt(null)}>
          <div className="receipt mono" onClick={(e) => e.stopPropagation()}>
            <b>CINÉMA ALINA REVAZYAN</b>
            <span>Buffet · чек</span>
            <hr />
            <div>
              <span>{packName(receipt.item, receipt.pack)}</span>
              <span>{price(receipt.pack)}</span>
            </div>
            <div>
              <span>Бриф + видео-разбор</span>
              <span>подарок</span>
            </div>
            {receipt.discount && (
              <div>
                <span>{STUBS_FOR_DISCOUNT} корешка</span>
                <span>−10%</span>
              </div>
            )}
            <hr />
            <span>Покупатель: {receipt.name}</span>
            <span>Контакт: {receipt.contact}</span>
            <hr />
            <span>Merci ! Осталось отправить сообщение в Telegram.</span>
            <a className="btn" href={receipt.url} target="_blank" rel="noreferrer">
              Открыть Telegram ещё раз
            </a>
            <button className="link" onClick={() => setReceipt(null)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
