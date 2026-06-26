// src/app/terms/page.tsx
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions — Shivay The Cricketing Hub',
  description: 'Terms of service and booking guidelines for playing at Shivay Box Cricket and Pickleball, Karai.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 pb-24 text-sm leading-relaxed text-muted-foreground space-y-6">
        <h1 id="terms-title" className="text-3xl font-black text-primary uppercase tracking-wide">
          Terms & Conditions
        </h1>
        <p className="text-xs text-muted-foreground">Last updated: June 22, 2026</p>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground uppercase tracking-wider">1. Agreement to Terms</h2>
          <p>
            By accessing or using the Shivay booking PWA, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please do not use our services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground uppercase tracking-wider">2. Booking Rules & Slot Lock</h2>
          <p>
            All bookings are made on a 30-minute slot basis. Cricket turf reservations require a minimum of 1 hour (2 slots), and Pickleball courts require a minimum of 30 minutes. Slots selected during checkout are locked for 5 minutes to prevent double-booking. If payment is not completed within 5 minutes, slots are automatically released.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground uppercase tracking-wider">3. Customer Account Policy</h2>
          <p>
            Each user is required to register with a valid phone number and birth date. To ensure account security, we enforce a strict **one active session per account** policy. Logging in on a new device will automatically log out previous active sessions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground uppercase tracking-wider">4. Conduct at Venue</h2>
          <p>
            Players must arrive 10 minutes prior to their booked slot. Appropriate sports footwear (non-marking shoes for Pickleball) must be worn at all times. Management reserves the right to evict any individual displaying inappropriate behavior without refunds.
          </p>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
