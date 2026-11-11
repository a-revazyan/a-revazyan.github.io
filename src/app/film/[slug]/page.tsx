import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Hall from '@/components/Hall';
import { bySlug, works } from '@/lib/works';

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = () => works.map((w) => ({ slug: w.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const w = bySlug((await params).slug);
  if (!w) return {};
  return {
    title: w.title,
    description: `${w.about || w.kind} Режиссёр Алина Ревазян.`,
    openGraph: { title: w.title, description: w.about || w.kind, images: w.poster ? [w.poster] : [] },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (!bySlug(slug)) notFound();
  return <Hall slug={slug} />;
}
