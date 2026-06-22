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
    <div className="w-full max-w-4xl mx-auto px-4 mt-6">
      <div className="flex items-center justify-between p-4 rounded-xl bg-[#111A16] border border-[#1E3A2B]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#1A2620]">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#A7C4B8] uppercase tracking-wider">Facility Hours</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Open 24 hours · 7 days a week · Current time: {timeString}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold tracking-wide uppercase text-primary">Open 24/7</span>
        </div>
      </div>
    </div>
  );
}
