import Link from 'next/link';
import Poster from './Poster';
import { bySection, fmt, sections } from '@/lib/works';

/** Буклет «Программа»: все работы по разделам. Используется на /program и в зале. */
export default function Program({ current }: { current?: string }) {
  return (
    <div className="program">
      {sections.map((s) => (
        <section key={s.id}>
          <h3>
            {s.title} <i>{s.fr}</i>
          </h3>
          <div className="program-grid">
            {bySection(s.id).map((w) => (
              <Link key={w.slug} href={`/film/${w.slug}`} className={`card ${w.slug === current ? 'is-current' : ''}`}>
                <Poster work={w} />
                <b>{w.title}</b>
                <span>{w.kind}</span>
                {w.about && <p className="about">{w.about}</p>}
                <span className="mono">
                  {w.isSeries ? `${w.items.filter((i) => !i.extra).length} сер. · ` : ''}
                  {fmt(w.total)}
                  {w.spec ? ' · концепт / spec' : ''}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
