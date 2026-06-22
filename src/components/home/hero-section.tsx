// src/components/home/hero-section.tsx
'use client';

import Link from 'next/link';
import { Calendar, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#111A16] to-[#0A0F0D] px-6 py-20 text-center border-b border-[#1E3A2B] flex flex-col items-center justify-center min-h-[500px]">
      
      {/* Dynamic 3D Floating Radial Lights */}
      <motion.div 
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
          x: [-20, 20, -20],
          y: [-20, 20, -20]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 left-1/3 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" 
      />
      <motion.div 
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.08, 0.15, 0.08],
          x: [20, -20, 20],
          y: [20, -20, 20]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#6EE7B7]/10 rounded-full blur-3xl pointer-events-none" 
      />

      <div className="relative max-w-2xl mx-auto space-y-8 z-10">
        
        {/* Animated Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider shadow-lg shadow-primary/5 hover:border-primary/40 transition-colors"
        >
          <Shield className="w-3.5 h-3.5 animate-pulse" /> First-Class Sports Facility
        </motion.div>

        {/* 3D Isometric Animated Title */}
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          style={{ perspective: 1000 }}
          className="text-5xl md:text-7xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-[#F0FDF4] to-primary bg-clip-text text-transparent filter drop-shadow-[0_4px_12px_rgba(52,211,153,0.15)]"
        >
          CHAMPIONS PLAY HERE
        </motion.h1>
        
        {/* Animated Paragraph */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-sm md:text-lg text-[#A7C4B8] max-w-xl mx-auto leading-relaxed"
        >
          Book premium box cricket turfs and high-performance acrylic pickleball courts. Instant confirmation, real-time slot selection, and tournament play.
        </motion.p>

        {/* Responsive Interactive Action Blocks */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link
            href="/book"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-black tracking-wider flex items-center justify-center gap-2 hover:bg-[#6EE7B7] hover:shadow-[0_0_25px_rgba(52,211,153,0.4)] transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 text-sm uppercase"
          >
            <Calendar className="w-4 h-4" /> Book Courts Now
          </Link>
          <Link
            href="/tournaments"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 font-black tracking-wider text-foreground flex items-center justify-center gap-2 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 text-sm uppercase"
          >
            Join Tournaments
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
