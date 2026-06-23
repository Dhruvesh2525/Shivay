// src/app/(customer)/book/page.tsx
import { createAdminClient } from '@/lib/supabase/admin';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import BookCourtsList from '@/components/book/book-courts-list';

interface Court {
  id: string;
  name: string;
  sport: 'cricket' | 'pickleball';
  description: string;
  image_url: string;
}

async function getCourts(): Promise<Court[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('courts')
      .select('id, name, sport, description, image_url')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    return (data as Court[]) || [];
  } catch {
    return [];
  }
}

export default async function BookPage() {
  const courts = await getCourts();

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F0D]">
      <Header />
      <BookCourtsList courts={courts} />
      <Footer />
      <MobileNav />
    </div>
  );
}
