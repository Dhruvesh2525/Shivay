// src/app/refund-policy/page.tsx
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy — Shivay The Cricketing Hub',
  description: 'Understand the booking cancellation tiers, refund processing timelines, and wallet compensations.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F0D]">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 pb-24 text-sm leading-relaxed text-[#A7C4B8] space-y-6">
        <h1 id="refund-policy-title" className="text-3xl font-black text-primary uppercase tracking-wide">
          Refund & Cancellation Policy
        </h1>
        <p className="text-xs text-muted-foreground">Last updated: June 22, 2026</p>

        <section className="space-y-3 bg-[#111A16] p-5 rounded-2xl border border-[#1E3A2B]">
          <h2 className="text-base font-bold text-primary uppercase tracking-wider">Cancellation Timeframes & Tiers</h2>
          <p className="text-xs text-muted-foreground mb-4">Refund calculations are based on the gap between the cancellation request time and the booking start time:</p>
          <ul className="space-y-2 text-xs">
            <li className="flex justify-between border-b border-white/5 pb-2">
              <span className="font-bold text-foreground">More than 12 Hours before slot</span>
              <span className="text-primary font-bold">100% Refund</span>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-2">
              <span className="font-bold text-foreground">6 to 12 Hours before slot</span>
              <span className="text-primary font-bold">70% Refund</span>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-2">
              <span className="font-bold text-foreground">3 to 6 Hours before slot</span>
              <span className="text-primary font-bold">50% Refund</span>
            </li>
            <li className="flex justify-between pb-1">
              <span className="font-bold text-foreground">Less than 3 Hours before slot</span>
              <span className="text-red-400 font-bold">0% Refund (No Refund)</span>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground uppercase tracking-wider">Refund Approval Flow</h2>
          <p>
            All refund claims must be initiated directly from your Booking History panel. Once submitted, the request is reviewed by the Super Admin. Approved refunds can be credited to your venue **wallet** balance or reversed back to the original source card (via Razorpay). Wallet credits are processed instantly, while card reversals may take 5–7 business days to reflect in your account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground uppercase tracking-wider">Forced Closures & Weather</h2>
          <p>
            If a court is closed by management due to weather conditions or system maintenance, affected bookings will be refunded at 100% value into the user's wallet as compensation.
          </p>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
