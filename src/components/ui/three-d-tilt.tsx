'use client';

import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface ThreeDTiltProps {
  children: React.ReactNode;
  className?: string;
}

export default function ThreeDTilt({ children, className = '' }: ThreeDTiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);

  // Mouse coordinates relative to card center (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring physics for smooth movement
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), springConfig);

  // Spotlight highlight coordinates
  const glareX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left - width / 2;
    const mouseY = event.clientY - rect.top - height / 2;

    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseEnter = () => {
    setHovering(true);
  };

  const handleMouseLeave = () => {
    setHovering(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`perspective-1000 ${className}`}
    >
      <motion.div
        style={{
          rotateX: rotateX,
          rotateY: rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          scale: hovering ? 1.03 : 1,
        }}
        transition={{
          type: 'spring',
          ...springConfig,
        }}
        className="w-full h-full relative rounded-2xl overflow-hidden glass-card transition-shadow duration-300 hover:shadow-[0_20px_40px_rgba(171,214,0,0.15)]"
      >
        {/* Dynamic Highlight Glare */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_var(--glare-x)_var(--glare-y),rgba(255,255,255,0.12)_0%,transparent_50%)]"
          style={{
            // @ts-ignore
            '--glare-x': glareX,
            // @ts-ignore
            '--glare-y': glareY,
            opacity: hovering ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        />
        <div style={{ transform: 'translateZ(20px)' }} className="w-full h-full">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
