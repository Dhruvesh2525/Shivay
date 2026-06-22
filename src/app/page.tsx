// src/app/page.tsx
import Header from '@/components/layout/header';
import HeroSection from '@/components/home/hero-section';
import FacilityStatus from '@/components/home/facility-status';
import HomeData from '@/components/home/home-data';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { createAdminClient } from '@/lib/supabase/admin';

// Query Supabase DIRECTLY — no self-fetch that breaks on Vercel (localhost bug)
async function getHomeData() {
  try {
    const supabase = createAdminClient();

    const [courtsRes, announcementsRes, reviewsRes] = await Promise.all([
      supabase
        .from('courts')
        .select('id, name, sport')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),

      supabase
        .from('announcements')
        .select('id, title, content, priority, created_at')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5),

      supabase
        .from('reviews')
        .select('id, comment, overall_rating, created_at, profiles(full_name)')
        .eq('is_visible', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(3),
    ]);

    return {
      courts: courtsRes.data || [],
      announcements: announcementsRes.data || [],
      reviews: reviewsRes.data || [],
    };
  } catch {
    return { courts: [], announcements: [], reviews: [] };
  }
}

export default async function Home() {
  const { courts, announcements, reviews } = await getHomeData();

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F0D]">
      <Header />

      <main className="flex-1 pb-16 md:pb-0">
        <HeroSection />
        <FacilityStatus />
        <HomeData courts={courts} announcements={announcements} reviews={reviews} />
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
