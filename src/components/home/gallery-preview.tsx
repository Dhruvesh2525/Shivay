// src/components/home/gallery-preview.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Image as ImageIcon } from 'lucide-react';

interface GalleryItem {
  id: string;
  title: string;
  image_url: string;
  category: string;
}

export default function GalleryPreview() {
  const supabase = createClient();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGallery() {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('gallery')
          .select('id, title, image_url, category')
          .eq('is_visible', true)
          .is('deleted_at', null)
          .order('display_order', { ascending: true })
          .limit(6);
        
        if (data) {
          setItems(data as GalleryItem[]);
        }
      } catch (err) {
        console.error('Error fetching gallery items:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchGallery();
  }, []);

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <section className="w-full max-w-4xl mx-auto px-4 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold tracking-tight">Arena Gallery</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="group relative h-40 rounded-xl overflow-hidden bg-white/5 border border-white/10"
          >
            <img 
              src={item.image_url} 
              alt={item.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Dark glassmorphic hover label */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex flex-col justify-end">
              <span className="text-[9px] font-extrabold text-primary uppercase tracking-wider">
                {item.category}
              </span>
              <h4 className="text-xs font-bold text-white truncate mt-0.5">{item.title}</h4>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
