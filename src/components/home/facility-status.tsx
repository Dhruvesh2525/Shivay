// src/components/home/facility-status.tsx
'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function FacilityStatus() {
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop mt-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between p-4 rounded-2xl glass-card">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-primary uppercase tracking-wider font-mono-custom">Facility Hours</h3>
            <p className="text-xs text-[#8e9379] mt-0.5 font-mono-custom">Open 24 hours · 7 days a week · Local Time: {timeString}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-secondary/10 border border-secondary/20 px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-[9px] font-black tracking-wider uppercase text-secondary font-mono-custom">Open 24/7</span>
        </div>
      </div>
    </div>
  );
}
