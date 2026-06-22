// src/app/page.tsx
import Header from '@/components/layout/header';
import HeroSection from '@/components/home/hero-section';
import FacilityStatus from '@/components/home/facility-status';
import HomeData from '@/components/home/home-data';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';

// Fetch all home data server-side (much faster than 4+ client fetches)
async function getHomeData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/home`, {
      next: { revalidate: 60 }, // cache for 60s
    });
    if (!res.ok) throw new Error('Failed to fetch home data');
    return res.json();
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
