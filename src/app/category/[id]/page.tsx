import type { Metadata, ResolvingMetadata } from 'next';
import CategoryClient from '@/components/CategoryClient';

type Props = {
  params: Promise<{ id: string }>;
};

const CATEGORY_MAP: Record<string, { title: string, color: string }> = {
  'hussainiya_poems': { title: 'قصائد حسينية', color: '#7A1F2B' },
  'muwalid': { title: 'مواليد', color: '#1F6B4F' },
  'naei': { title: 'نعي', color: '#5B2A4E' },
  'dua': { title: 'أدعية ومناجاة', color: '#1D5560' },
  'quran': { title: 'قرآن', color: '#2D5B3F' },
  'ziyarat': { title: 'زيارات', color: '#8A5A16' },
  'lectures': { title: 'محاضرات', color: '#2E3A6B' },
  'variety': { title: 'منوعات', color: '#3D4A57' },
  'nasheed': { title: 'أناشيد إسلامية', color: '#8A4B26' },
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
