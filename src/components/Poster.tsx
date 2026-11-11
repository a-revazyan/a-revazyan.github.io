import type { Work } from '@/lib/works';

/** Афиша 2:3. Если файла нет в папке «обложки» — типографская заглушка. */
export default function Poster({ work, className = '', eager = false }: { work: Work; className?: string; eager?: boolean }) {
  return (
    <div className={`poster ${className}`}>
      {work.poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={work.poster} alt={`Афиша: ${work.title}`} loading={eager ? 'eager' : 'lazy'} decoding="async" />
      ) : (
        <div className="poster-stub">
          <small>Affiche à venir</small>
          <b>{work.title}</b>
          <small>{work.kind}</small>
        </div>
      )}
    </div>
  );
}
