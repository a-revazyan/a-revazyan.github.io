import type { Metadata } from 'next';
import Bar from '@/components/Bar';

export const metadata: Metadata = {
  title: 'Буфет',
  description: 'Услуги и цены: рекламные ролики S / M / L, имиджевые ролики, клипы, мультфильмы, моушн-дизайн и 3D.',
};

export default function Page() {
  return <Bar />;
}
