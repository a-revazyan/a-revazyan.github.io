import type { Metadata } from 'next';
import Link from 'next/link';
import { Ambience } from '@/components/Sound';
import Program from '@/components/Program';

export const metadata: Metadata = { title: 'Программа' };

export default function Page() {
  return (
    <main className="page">
      <Ambience foyer={0.18} />
      <header className="page-head">
        <Link href="/" className="link">
          ← Касса
        </Link>
        <div>
          <small>Programme</small>
          <h1>Программа</h1>
        </div>
        <Link href="/bar" className="link">
          Буфет →
        </Link>
      </header>
      <Program />
    </main>
  );
}
