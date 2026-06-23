'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trophy, Calendar, Check, X, Trash2, Plus, Sparkles, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface Tournament {
  id: string;
  name: string;
  sport: 'cricket' | 'pickleball';
  format: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_teams: number;
  entry_fee: number;
  prize_pool: string;
  status: string;
  organizer_id: string;
}

export default function AdminTournaments() {
  const supabase = createClient();
  const { profile } = useAuth();
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New tournament form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [sport, setSport] = useState<'cricket' | 'pickleball'>('cricket');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [format, setFormat] = useState('league');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxTeams, setMaxTeams] = useState(8);
  const [minTeamSize, setMinTeamSize] = useState(6);
  const [maxTeamSize, setMaxTeamSize] = useState(11);
  const [entryFee, setEntryFee] = useState(1500);
  const [prizePool, setPrizePool] = useState('');
  const [allowIndividual, setAllowIndividual] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('tournaments')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      if (data) setTournaments(data as Tournament[]);
    } catch (err: any) {
      console.error('Failed to fetch tournaments:', err);
      setError(err.message || 'Failed to fetch tournaments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setError(null);
      const { error: updateErr } = await supabase
        .from('tournaments')
        .update({ status: newStatus })
        .eq('id', id);

      if (updateErr) throw updateErr;
      
      // Update local state
      setTournaments(prev =>
        prev.map(t => (t.id === id ? { ...t, status: newStatus } : t))
      );
    } catch (err: any) {
      console.error('Failed to update tournament status:', err);
      setError(err.message || 'Failed to update tournament status.');
    }
  };

  const handleDeleteTournament = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;
    try {
      setError(null);
      const { error: deleteErr } = await supabase
        .from('tournaments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (deleteErr) throw deleteErr;
      
      // Remove from local state
      setTournaments(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      console.error('Failed to delete tournament:', err);
      setError(err.message || 'Failed to delete tournament.');
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      setError(null);

      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          sport,
          description,
          rules,
          format,
          startDate,
          endDate,
          deadline,
          maxTeams: Number(maxTeams),
          minTeamSize: Number(minTeamSize),
          maxTeamSize: Number(maxTeamSize),
          entryFee: Number(entryFee),
          prizePool,
          allowIndividual
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create tournament.');
      }

      setShowAddModal(false);
      // Reset form
      setName('');
      setSport('cricket');
      setDescription('');
      setRules('');
      setFormat('league');
      setStartDate('');
      setEndDate('');
      setDeadline('');
      setMaxTeams(8);
      setMinTeamSize(6);
      setMaxTeamSize(11);
      setEntryFee(1500);
      setPrizePool('');
      setAllowIndividual(false);

      // Refresh list
      fetchTournaments();
    } catch (err: any) {
      console.error('Failed to create tournament:', err);
      setError(err.message || 'Failed to create tournament.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'approved': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'published': return 'bg-emerald-500/10 text-primary border border-emerald-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default: return 'bg-white/10 text-foreground border border-white/20';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Tournaments</h1>
          <p className="text-[#A7C4B8] text-sm mt-1">Manage league tournaments, review registration rosters, and approve schedules.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black tracking-wider flex items-center gap-1.5 hover:bg-[#6EE7B7] transition-all text-xs"
        >
          <Plus className="w-4 h-4" /> Create Tournament
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5 animate-in fade-in duration-200">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-[#A7C4B8]">Loading tournaments...</div>
      ) : tournaments.length === 0 ? (
        <div className="p-12 text-center bg-white/5 rounded-2xl border border-white/10 text-muted-foreground text-xs">
          No tournaments created yet.
        </div>
      ) : (
        <div className="space-y-4">
          {tournaments.map((t) => (
            <div 
              key={t.id} 
              className="p-5 rounded-2xl bg-[#111A16] border border-[#1E3A2B] flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {t.sport}
                  </span>
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${getStatusColor(t.status)}`}>
                    {t.status}
                  </span>
                </div>
                <h3 className="font-bold text-base text-foreground">
                  {t.name}
                </h3>
                <p className="text-xs text-[#A7C4B8] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  {t.start_date} to {t.end_date} (Deadline: {t.registration_deadline})
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground pt-1.5 font-mono">
                  <span>Entry: ₹{t.entry_fee}</span>
                  <span>Prize: {t.prize_pool || 'N/A'}</span>
                  <span>Format: <span className="capitalize">{t.format}</span></span>
                  <span>Max Teams: {t.max_teams}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {t.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'approved')}
                      className="px-3 py-1.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-primary text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'rejected')}
                      className="px-3 py-1.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                )}
                
                {t.status === 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'published')}
                    className="px-3 py-1.5 rounded bg-primary/20 border border-primary/30 text-primary text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Publish
                  </button>
                )}

                <button
                  onClick={() => handleDeleteTournament(t.id)}
                  className="p-2 rounded bg-white/5 border border-white/10 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-all"
                  title="Delete Tournament"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Tournament Form Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-[#111A16] border border-[#1E3A2B] shadow-2xl space-y-4 my-8">
            <div className="flex items-center gap-2 text-primary border-b border-[#1E3A2B] pb-3">
              <Trophy className="w-5 h-5" />
              <h3 className="font-black text-sm uppercase">Create Tournament</h3>
            </div>

            <form onSubmit={handleCreateTournament} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground uppercase font-bold mb-1">Tournament Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shivay Monsoon Cup"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground uppercase font-bold mb-1">Sport</label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="cricket">Cricket</option>
                    <option value="pickleball">Pickleball</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground uppercase font-bold mb-1">Description</label>
                <textarea
                  placeholder="Provide tournament highlights and formats..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-muted-foreground uppercase font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground uppercase font-bold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground uppercase font-bold mb-1">Reg Deadline</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-muted-foreground uppercase font-bold mb-1">Format</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. league, knockout"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground uppercase font-bold mb-1">Entry Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={entryFee}
                    onChange={(e) => setEntryFee(Number(e.target.value))}
                    className="w-full p-2 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground uppercase font-bold mb-1">Max Teams</label>
                  <input
                    type="number"
                    required
                    value={maxTeams}
                    onChange={(e) => setMaxTeams(Number(e.target.value))}
                    className="w-full p-2 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-muted-foreground uppercase font-bold mb-1">Min Team Size</label>
                  <input
                    type="number"
                    value={minTeamSize}
                    onChange={(e) => setMinTeamSize(Number(e.target.value))}
                    className="w-full p-2 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground uppercase font-bold mb-1">Max Team Size</label>
                  <input
                    type="number"
                    value={maxTeamSize}
                    onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                    className="w-full p-2 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground uppercase font-bold mb-1">Prize Pool</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹50,000 cash"
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="allowIndividual"
                  checked={allowIndividual}
                  onChange={(e) => setAllowIndividual(e.target.checked)}
                  className="rounded border-[#1E3A2B] text-primary focus:ring-primary h-4 w-4 bg-[#1A2620]"
                />
                <label htmlFor="allowIndividual" className="text-muted-foreground font-bold uppercase cursor-pointer selection:bg-transparent">Allow Individual Registration</label>
              </div>

              <div>
                <label className="block text-muted-foreground uppercase font-bold mb-1">Rules</label>
                <textarea
                  placeholder="General tournament rules and code of conduct..."
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  rows={2}
                  className="w-full p-2 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-3 border-t border-[#1E3A2B]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-[#A7C4B8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-black tracking-wider hover:bg-[#6EE7B7] transition-all"
                >
                  {formSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
