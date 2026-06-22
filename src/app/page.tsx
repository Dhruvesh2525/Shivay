// src/app/page.tsx
import Header from '@/components/layout/header';
import HeroSection from '@/components/home/hero-section';
import FacilityStatus from '@/components/home/facility-status';
import QuickBook from '@/components/home/quick-book';
import Announcements from '@/components/home/announcements';
import GalleryPreview from '@/components/home/gallery-preview';
import ReviewsCarousel from '@/components/home/reviews-carousel';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F0D]">
      <Header />
      
      <main className="flex-1 pb-16 md:pb-0">
        <HeroSection />
        
        <FacilityStatus />
        
        <QuickBook />
        
        <Announcements />
        
        <GalleryPreview />
        
        <ReviewsCarousel />
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
