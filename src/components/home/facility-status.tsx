// src/components/home/facility-status.tsx
'use client';

import { useState, useEffect } from 'react';
import { Clock, ShieldAlert } from 'lucide-react';

export default function FacilityStatus() {
  const [isOpen, setIsOpen] = useState(true);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const hours = now.getHours();
      
      // Operating hours seed default: 06:00 to 23:00 (6 AM to 11 PM)
      const openHour = 6;
      const closeHour = 23;
      
      if (hours >= openHour && hours < closeHour) {
        setIsOpen(true);
        setTimeString('Open today: 6:00 AM - 11:00 PM');
      } else {
        setIsOpen(false);
        setTimeString('Closed right now. Opens at 6:00 AM');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute
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
            <p className="text-xs text-muted-foreground mt-0.5">{timeString}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-primary animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs font-bold tracking-wide uppercase">
            {isOpen ? 'Open Now' : 'Closed'}
          </span>
        </div>
      </div>
    </div>
  );
}
