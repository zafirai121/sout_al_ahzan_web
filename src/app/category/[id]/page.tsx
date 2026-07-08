import type { Metadata, ResolvingMetadata } from 'next';
import CategoryClient from '@/components/CategoryClient';

type Props = {
  params: Promise<{ id: string }>;
};

const CATEGORY_MAP: Record<string, { title: string, color: string }> = {
  'hussainiya_poems': { title: 'قصائد حسينية', color: '#8400e7' },
  'muwalid': { title: 'مواليد', color: '#509bf5' },
  'naei': { title: 'نعي', color: '#af2896' },
  'dua': { title: 'أدعية ومناجاة', color: '#1db954' },
  'quran': { title: 'قرآن', color: '#006450' },
  'lectures': { title: 'محاضرات', color: '#e1118c' },
  'variety': { title: 'منوعات', color: '#ff4632' },
  'nasheed': { title: 'أناشيد إسلامية', color: '#e91429' },
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const categoryInfo = CATEGORY_MAP[id] || { title: 'تصنيف غير معروف', color: '#333' };
  
  const pageTitle = `${categoryInfo.title} | صوت الأحزان`;
  const description = `استمع إلى أروع ال${categoryInfo.title} بجودة عالية وبدون إعلانات على منصة صوت الأحزان.`;

  return {
    title: pageTitle,
    description: description,
    openGraph: {
      title: pageTitle,
      description: description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: pageTitle,
      description: description,
    },
  };
}

// Next.js dynamic param generation for static pages (SSG)
export async function generateStaticParams() {
  return Object.keys(CATEGORY_MAP).map((id) => ({
    id: id,
  }));
}

export default async function CategoryPageServer({ params }: Props) {
  // Pass the params promise to the client component using React use() hook pattern
  return <CategoryClient params={params} />;
}
