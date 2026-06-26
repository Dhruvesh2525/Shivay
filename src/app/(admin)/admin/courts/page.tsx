// src/app/(admin)/admin/courts/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Check, Settings, Trash2, Edit, Save, Calendar, AlertTriangle } from 'lucide-react';

interface Court {
  id: string;
  name: string;
  sport: 'cricket' | 'pickleball';
  description: string;
  is_active: boolean;
  display_order: number;
}

interface Holiday {
  startDate: string;
  endDate: string;
  reason: string;
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
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Holiday closures states
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayStart, setHolidayStart] = useState('');
  const [holidayEnd, setHolidayEnd] = useState('');
  const [holidayReason, setHolidayReason] = useState('');
  const [savingHolidays, setSavingHolidays] = useState(false);
  const [holidaySuccess, setHolidaySuccess] = useState(false);

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

      // Fetch Holidays
      const { data: holidaysData } = await supabase
        .from('facility_settings')
        .select('value')
        .eq('key', 'holiday_closures')
        .single();

      if (holidaysData?.value) {
        setHolidays(holidaysData.value.holidays || []);
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
      setSettingsSuccess(false);
      setSettingsError(null);
      const { error } = await supabase
        .from('facility_settings')
        .upsert({
          key: 'operating_hours',
          value: { opens_at: opensAt, closes_at: closesAt }
        });

      if (error) throw error;
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setSettingsError(err.message || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveHolidays = async (newHolidaysList: Holiday[]) => {
    try {
      setSavingHolidays(true);
      setHolidaySuccess(false);
      const { error } = await supabase
        .from('facility_settings')
        .upsert({
          key: 'holiday_closures',
          value: { holidays: newHolidaysList }
        });

      if (error) throw error;
      setHolidays(newHolidaysList);
      setHolidaySuccess(true);
      setTimeout(() => setHolidaySuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save holidays:', err);
    } finally {
      setSavingHolidays(false);
    }
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayStart || !holidayEnd || !holidayReason) return;
    const list = [...holidays, { startDate: holidayStart, endDate: holidayEnd, reason: holidayReason }];
    handleSaveHolidays(list);
    setHolidayStart('');
    setHolidayEnd('');
    setHolidayReason('');
  };

  const handleDeleteHoliday = (index: number) => {
    if (!confirm('Are you sure you want to remove this holiday period?')) return;
    const list = holidays.filter((_, i) => i !== index);
    handleSaveHolidays(list);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Courts & Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your playing courts and facility rules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Facility Settings Panel */}
        <section className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Facility Operating Hours</h2>
          </div>

          {settingsSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-primary text-xs font-bold animate-in fade-in duration-200">
              Operating hours settings saved successfully!
            </div>
          )}

          {settingsError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-in fade-in duration-200">
              {settingsError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Opening Time</label>
              <input
                type="time"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
                className="w-full p-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Closing Time</label>
              <input
                type="time"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                className="w-full p-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary text-sm"
              />
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold tracking-wide flex items-center gap-2 hover:bg-[#6EE7B7] transition-all text-xs"
          >
            <Save className="w-4 h-4" /> {savingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </section>

        {/* Holiday closures panel */}
        <section className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Holiday Closures (Day-Wise)</h2>
          </div>

          {holidaySuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-primary text-xs font-bold animate-in fade-in duration-200">
              Holiday settings saved successfully!
            </div>
          )}

          <form onSubmit={handleAddHoliday} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-muted-foreground font-bold mb-1 uppercase">Start Date</label>
                <input
                  type="date"
                  required
                  value={holidayStart}
                  onChange={(e) => setHolidayStart(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-muted-foreground font-bold mb-1 uppercase">End Date</label>
                <input
                  type="date"
                  required
                  value={holidayEnd}
                  onChange={(e) => setHolidayEnd(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground font-bold mb-1 uppercase">Reason for closure</label>
              <input
                type="text"
                required
                placeholder="e.g. Diwali Festival Maintenance"
                value={holidayReason}
                onChange={(e) => setHolidayReason(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={savingHolidays}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold flex items-center gap-1.5 hover:bg-[#6EE7B7] transition-all text-xs"
            >
              <Plus className="w-4 h-4" /> Add Holiday Period
            </button>
          </form>

          {/* Holiday log list */}
          <div className="pt-3 border-t border-white/5 space-y-2 max-h-48 overflow-y-auto">
            {holidays.length === 0 ? (
              <p className="text-xs text-muted-foreground">No holiday closures configured.</p>
            ) : (
              holidays.map((h, i) => (
                <div key={i} className="p-3 rounded-lg bg-input border border-border flex items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="font-bold text-foreground block">{h.reason}</span>
                    <span className="text-muted-foreground text-[10px] font-mono">
                      {h.startDate} to {h.endDate}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteHoliday(i)}
                    className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

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
                  className="w-full p-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Sport Type</label>
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value as any)}
                  className="w-full p-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary text-sm"
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
                className="w-full p-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary text-sm"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-muted-foreground"
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
