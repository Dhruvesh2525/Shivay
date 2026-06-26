// src/app/(customer)/tournaments/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { Calendar, ArrowLeft, Trophy, Users, Star, Award } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function TournamentDetailPage({ params }: Props) {
  const router = useRouter();
  const { id } = use(params);
  const supabase = createClient();

  const [tourney, setTourney] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [regType, setRegType] = useState<'team' | 'individual'>('team');
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [captainEmail, setCaptainEmail] = useState('');
  const [playerRoster, setPlayerRoster] = useState('');
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  const [regLoading, setRegLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTourneyDetail() {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', id)
          .single();
        
        setTourney(data);
      } catch (err) {
        console.error('Error fetching tournament details:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTourneyDetail();
  }, [id]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRegLoading(true);
      setError(null);
      const playersList = playerRoster.split(',').map((p) => p.trim()).filter(Boolean);

      const res = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: id,
          registrationType: regType,
          teamName: regType === 'team' ? teamName : undefined,
          captainName,
          captainPhone,
          captainEmail,
          players: playersList,
          skillLevel
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to register.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/tournaments');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex justify-center items-center text-primary">Loading details...</main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  if (!tourney) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 p-8 text-center text-muted-foreground">Tournament not found.</main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-24 text-sm md:grid md:grid-cols-2 md:gap-8">
        <div>
          {/* Back Link */}
          <button 
            onClick={() => router.push('/tournaments')} 
            className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Tournaments
          </button>

          <div className="space-y-4">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              {tourney.sport}
            </span>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-wide">{tourney.name}</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">{tourney.description}</p>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tournament Format:</span>
                <span className="font-bold text-foreground capitalize">{tourney.format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Roster Size Limit:</span>
                <span className="font-bold text-foreground">{tourney.min_team_size} - {tourney.max_team_size} players</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prize Pool Details:</span>
                <span className="font-bold text-primary">{tourney.prize_pool || 'Glory & Trophies'}</span>
              </div>
            </div>

            {tourney.rules && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tournament Rules</h3>
                <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed p-4 rounded-xl bg-card border border-border">
                  {tourney.rules}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Registration Column Panel */}
        <div className="mt-8 md:mt-0">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xl">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Trophy className="w-5 h-5" />
              <h2 className="text-base font-black uppercase">Roster Registration</h2>
            </div>

            {success ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-400 text-xs font-bold">
                Registration successful! Roster added.
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                {tourney.allow_individual_registration && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRegType('team')}
                      className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${
                        regType === 'team'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-input border-border text-muted-foreground'
                      }`}
                    >
                      Team
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegType('individual')}
                      className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${
                        regType === 'individual'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-input border-border text-muted-foreground'
                      }`}
                    >
                      Individual
                    </button>
                  </div>
                )}

                {regType === 'team' ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Team Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Shivay Strikers"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Captain Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={captainName}
                        onChange={(e) => setCaptainName(e.target.value)}
                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Captain Phone Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="9876543210"
                        value={captainPhone}
                        onChange={(e) => setCaptainPhone(e.target.value)}
                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Captain Email Address</label>
                      <input
                        type="email"
                        placeholder="captain@example.com"
                        value={captainEmail}
                        onChange={(e) => setCaptainEmail(e.target.value)}
                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Roster Players (Comma separated list)</label>
                      <textarea
                        placeholder="Player A, Player B, Player C..."
                        value={playerRoster}
                        onChange={(e) => setPlayerRoster(e.target.value)}
                        rows={2}
                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary text-xs"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Player Skill Level</label>
                      <select
                        value={skillLevel}
                        onChange={(e) => setSkillLevel(e.target.value as any)}
                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary text-xs"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate / Intermediate-Club</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </>
                )}

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-in fade-in duration-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-black tracking-wider hover:bg-[#6EE7B7] transition-all transform active:scale-95 text-xs uppercase"
                >
                  {regLoading ? 'Registering...' : 'Register for Tournament'}
                </button>

                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  * Tournament entry fees must be settled externally. Registering here logs your roster position with the Organizer.
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
