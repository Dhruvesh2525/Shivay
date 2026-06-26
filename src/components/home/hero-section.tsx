'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Award, Calendar, ArrowRight } from 'lucide-react';

export default function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', damping: 20, stiffness: 100 } as const,
    },
  };

  return (
    <div className="relative overflow-hidden bg-[#051424] px-6 py-24 md:py-32 text-center border-b border-border flex flex-col items-center justify-center min-h-[600px]">
      {/* Cinematic Sports Background with Parallax Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-25 scale-105 pointer-events-none transition-transform duration-[10s] ease-out-quad"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBLV6GfZ9vjQ8ihmz5npWSwqVqk8gllK0rbUPr_PF8hTLPkyTjLXql21oCENrf0URu5Q4owqY4Ni9Hon6e8BGLSrleJH12KdO7OWmxvnXcXY2f6Gp5kZUISVn2dt4hrCIl3FxgSxhaHx3678M-Djvr5j7SWzE9Ke2EAUHIH8g1-kK3hUPNAU5m56OqJlYMjn7_gkCrzv88GcKjKV_Ui0KEqu3eynIOjVHAe28QiGKUvKaItw_bZew2Xi33YWQbnwbo02dmht8nfYmQ')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#051424]/90 via-[#051424]/40 to-[#051424]" />

      {/* Floating dynamic blobs specific to Hero */}
      <motion.div 
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" 
      />
      <motion.div 
        animate={{
          x: [0, -30, 40, 0],
          y: [0, 40, -30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" 
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative max-w-3xl mx-auto space-y-8 z-10"
      >
        {/* Badge */}
        <motion.div 
          variants={itemVariants}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black font-mono-custom uppercase tracking-widest shadow-lg shadow-primary/5 hover:border-primary/40 transition-colors cursor-default"
        >
          <Award className="w-3.5 h-3.5 animate-bounce" /> ELITE SPORTS ARENA
        </motion.div>

        {/* Dynamic Title */}
        <motion.h1
          variants={itemVariants}
          className="text-6xl md:text-8xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-[#d4e4fa] to-primary bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(171,214,0,0.25)] font-display uppercase"
        >
          CHAMPIONS<br />PLAY HERE
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-sm md:text-lg text-[#8e9379] max-w-xl mx-auto leading-relaxed font-sans"
        >
          Book premium box cricket turfs and high-performance acrylic pickleball courts. Experience real-time slot selection, tournament play, and world-class training facilities.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link
            href="/book"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-black font-mono-custom tracking-widest flex items-center justify-center gap-2 hover:bg-primary/95 hover:shadow-[0_0_24px_rgba(171,214,0,0.4)] hover:-translate-y-1 transition-all duration-300 active:translate-y-0 text-xs uppercase"
          >
            <Calendar className="w-4 h-4" /> Book Courts Now
          </Link>
          <Link
            href="/tournaments"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 font-black font-mono-custom tracking-widest text-foreground flex items-center justify-center gap-2 hover:-translate-y-1 transition-all duration-300 active:translate-y-0 text-xs uppercase group"
          >
            Join Tournaments <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
