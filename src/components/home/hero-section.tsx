// src/components/home/hero-section.tsx
import Link from 'next/link';
import { Calendar, Shield } from 'lucide-react';

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#111A16] to-[#0A0F0D] px-6 py-12 text-center border-b border-[#1E3A2B]">
      {/* Decorative turf green accent background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-2xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5" /> First-Class Sports Facility
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
          CHAMPIONS PLAY HERE
        </h1>
        
        <p className="text-sm md:text-base text-[#A7C4B8] max-w-lg mx-auto leading-relaxed">
          Book premium box cricket turfs and high-performance acrylic pickleball courts. Instant confirmation, real-time slot selection, and tournament play.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/book"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-[#6EE7B7] transition-all transform active:scale-95 text-sm"
          >
            <Calendar className="w-4 h-4" /> Book Courts Now
          </Link>
          <Link
            href="/tournaments"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 font-bold tracking-wide text-foreground flex items-center justify-center gap-2 transition-all text-sm"
          >
            Join Tournaments
          </Link>
        </div>
      </div>
    </div>
  );
}
