// src/components/home/announcements.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Megaphone, AlertTriangle, AlertCircle } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
}

export default function Announcements() {
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('announcements')
          .select('id, title, content, priority, created_at')
          .eq('is_active', true)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });
        
        if (data) {
          setAnnouncements(data as Announcement[]);
        }
      } catch (err) {
        console.error('Error fetching announcements:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnnouncements();
  }, []);

  if (loading) return null; // Simple load suppression
  if (announcements.length === 0) return null;

  return (
    <section className="w-full max-w-4xl mx-auto px-4 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold tracking-tight">Announcements</h2>
      </div>

      <div className="space-y-3">
        {announcements.map((ann) => {
          const isUrgent = ann.priority === 'urgent' || ann.priority === 'high';
          return (
            <div 
              key={ann.id} 
              className={`p-4 rounded-xl border flex gap-3 items-start ${
                isUrgent 
                  ? 'bg-red-500/5 border-red-500/20' 
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {isUrgent ? (
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className={`font-bold text-sm ${isUrgent ? 'text-red-400' : 'text-foreground'}`}>
                  {ann.title}
                </h3>
                <p className="text-xs text-[#A7C4B8] mt-1 leading-relaxed">{ann.content}</p>
                <span className="text-[10px] text-muted-foreground font-mono block mt-2">
                  {new Date(ann.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
