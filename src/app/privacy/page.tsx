// src/app/privacy/page.tsx
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Shivay The Cricketing Hub',
  description: 'Learn how Shivay protects your phone number, registration, and payment transaction details.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 pb-24 text-sm leading-relaxed text-muted-foreground space-y-6">
        <h1 id="privacy-title" className="text-3xl font-black text-primary uppercase tracking-wide">
          Privacy Policy
        </h1>
        <p className="text-xs text-muted-foreground">Last updated: June 22, 2026</p>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground uppercase tracking-wider">1. Information We Collect</h2>
          <p>
            We collect personal information necessary to facilitate bookings, verify customer roles, and complete transactions. This includes your full name, email address, contact phone number, and birth date.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground uppercase tracking-wider">2. Data Security & Encryption</h2>
          <p>
            Your profile details and credentials are securely stored using Supabase Row Level Security (RLS) layers. Payment details are processed externally via Razorpay over secure SSL/TLS channels. We do not store credit card or bank login details on our servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground uppercase tracking-wider">3. Cookies & Session Management</h2>
          <p>
            We use persistent cookies to authenticate active user sessions. Logging into the app on any device registers a session token to guarantee the one-session restriction.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground uppercase tracking-wider">4. Contact Information</h2>
          <p>
            If you have questions regarding data privacy or want to delete your profile log, contact us at: <a href="mailto:privacy@shivaycricketinghub.com" className="text-primary hover:underline font-bold">privacy@shivaycricketinghub.com</a>.
          </p>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
