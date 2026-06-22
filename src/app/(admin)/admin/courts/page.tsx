// src/app/(admin)/admin/courts/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Check, Settings, Trash2, Edit, Save } from 'lucide-react';

interface Court {
  id: string;
  name: string;
  sport: 'cricket' | 'pickleball';
  description: string;
  is_active: boolean;
  display_order: number;
}

export default function AdminCourts() {
  const supabase = createClient();

  // Court list state
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);

  // Add court form states
  const [name, setName] = useState('');
  const [sport, setSport] = useState<'cricket' | 'pickleball'>('cricket');
  const [description, setDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Settings states
  const [opensAt, setOpensAt] = useState('06:00:00');
  const [closesAt, setClosesAt] = useState('23:00:00');
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchCourtsAndSettings = async () => {
    try {
      setLoading(true);
      // Fetch Courts
      const { data: courtData } = await supabase
        .from('courts')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (courtData) setCourts(courtData as Court[]);

      // Fetch Operating Hours Settings
      const { data: opHours } = await supabase
        .from('facility_settings')
        .select('value')
        .eq('key', 'operating_hours')
        .single();
      
      if (opHours?.value) {
        setOpensAt(opHours.value.opens_at || '06:00:00');
        setClosesAt(opHours.value.closes_at || '23:00:00');
      }
    } catch (err) {
      console.error('Error fetching courts and settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourtsAndSettings();
  }, []);

  const handleAddCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('courts')
        .insert({
          name,
          sport,
          description,
          display_order: courts.length + 1,
          is_active: true
        });

      if (error) throw error;
      
      setIsAdding(false);
      setName('');
      setDescription('');
      fetchCourtsAndSettings();
    } catch (err) {
      console.error('Failed to add court:', err);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courts')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchCourtsAndSettings();
    } catch (err) {
      console.error('Failed to toggle active status:', err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      const { error } = await supabase
        .from('facility_settings')
        .upsert({
          key: 'operating_hours',
          value: { opens_at: opensAt, closes_at: closesAt }
        });

      if (error) throw error;
      alert('Operating hours settings saved!');
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Courts & Settings</h1>
        <p className="text-[#A7C4B8] text-sm mt-1">Configure your playing courts and facility rules.</p>
      </div>

      {/* Facility Settings Panel */}
      <section className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Facility Operating Hours</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Opening Time</label>
            <input
              type="time"
              value={opensAt}
              onChange={(e) => setOpensAt(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Closing Time</label>
            <input
              type="time"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className="mt-4 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold tracking-wide flex items-center gap-2 hover:bg-[#6EE7B7] transition-all text-xs"
        >
          <Save className="w-4 h-4" /> {savingSettings ? 'Saving...' : 'Save Settings'}
        </button>
      </section>

      {/* Courts Panel */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Manage Courts</h2>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2 rounded-lg bg-secondary text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground font-bold transition-all flex items-center gap-1.5 text-xs"
          >
            <Plus className="w-4 h-4" /> Add Court
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddCourt} className="p-6 rounded-2xl bg-white/5 border border-primary/20 space-y-4">
            <h3 className="font-bold text-sm">New Court Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Court Name</label>
                <input
                  type="text"
                  required
                  placeholder="Cricket Net A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Sport Type</label>
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value as any)}
                  className="w-full p-3 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary text-sm"
                >
                  <option value="cricket">Cricket</option>
                  <option value="pickleball">Pickleball</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about court dimensions, flooring, accessories..."
                rows={2}
                className="w-full p-3 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary text-sm"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-[#A7C4B8]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
              >
                Create Court
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="p-8 text-center">Loading courts data...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courts.map((court) => (
              <div 
                key={court.id} 
                className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {court.sport}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">ORDER #{court.display_order}</span>
                  </div>
                  <h3 className="font-bold text-base">{court.name}</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-0.5">{court.description || 'No description provided'}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleActive(court.id, court.is_active)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      court.is_active 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}
                  >
                    {court.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
