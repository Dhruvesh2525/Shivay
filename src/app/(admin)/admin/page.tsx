// src/app/(admin)/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Users, Trophy, TrendingUp, BarChart2, CheckCircle, Award } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface OrganizerAnalyticsData {
  role: 'organizer';
  totalTournaments: number;
  pendingTournaments: number;
  activeTournaments: number;
  totalTeams: number;
  totalIndividuals: number;
  tournamentsSummary: {
    id: string;
    name: string;
    sport: string;
    entryFee: number;
    status: string;
    maxTeams: number;
    prizePool: string;
    registeredTeams: number;
    registeredIndividuals: number;
  }[];
}

interface GeneralAnalyticsData {
  role?: string;
  totalRevenue: number;
  usersCount: number;
  bookingsCount: number;
  revenueChart: { date: string; revenue: number }[];
  utilization: { courtId: string; name: string; sport: string; rate: number }[];
}

type AnalyticsData = GeneralAnalyticsData | OrganizerAnalyticsData;

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/analytics');
        if (res.ok) {
          const stats = await res.json();
          setData(stats);
        }
      } catch (err) {
        console.error('Failed to load analytics details:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) return <div className="text-primary p-4">Loading analytics statistics...</div>;
  if (!data) return <div className="text-red-400 p-4">Failed to load dashboard data.</div>;

  // 1. Render Organizer Dashboard
  if (profile?.role === 'organizer') {
    const orgData = data as OrganizerAnalyticsData;
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Organizer Dashboard</h1>
          <p className="text-[#A7C4B8] text-sm mt-1">Overview of your hosted tournaments and player registrations.</p>
        </div>

        {/* Organizer Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#111A16] border border-[#1E3A2B] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Tournaments</span>
              <p className="text-2xl font-black text-primary font-mono mt-1">{orgData.totalTournaments}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#1A2620] text-primary">
              <Trophy className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#111A16] border border-[#1E3A2B] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Tournaments</span>
              <p className="text-2xl font-black text-foreground font-mono mt-1">{orgData.activeTournaments}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#1A2620] text-primary">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#111A16] border border-[#1E3A2B] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Registered Teams</span>
              <p className="text-2xl font-black text-foreground font-mono mt-1">{orgData.totalTeams}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#1A2620] text-primary">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#111A16] border border-[#1E3A2B] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Individuals</span>
              <p className="text-2xl font-black text-foreground font-mono mt-1">{orgData.totalIndividuals}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#1A2620] text-primary">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tournaments List Card */}
        <div className="p-6 rounded-2xl bg-[#111A16] border border-[#1E3A2B] space-y-4">
          <h2 className="text-sm font-bold text-[#A7C4B8] uppercase tracking-wider">Your Tournaments</h2>
          {orgData.tournamentsSummary.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tournaments created yet. Go to Tournaments page to create one.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1E3A2B] text-muted-foreground uppercase font-mono">
                    <th className="py-3 px-4 font-bold">Tournament Name</th>
                    <th className="py-3 px-4 font-bold">Sport</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">Entry Fee</th>
                    <th className="py-3 px-4 font-bold">Prize Pool</th>
                    <th className="py-3 px-4 font-bold">Registered Teams</th>
                    <th className="py-3 px-4 font-bold">Individuals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A2B]/50 font-medium">
                  {orgData.tournamentsSummary.map((t) => (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-foreground">{t.name}</td>
                      <td className="py-3.5 px-4 capitalize">{t.sport}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          t.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                          t.status === 'approved' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          t.status === 'published' ? 'bg-emerald-500/10 text-primary border border-emerald-500/20' :
                          'bg-white/10 text-foreground border border-white/20'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">₹{t.entryFee}</td>
                      <td className="py-3.5 px-4 font-mono">{t.prizePool || 'N/A'}</td>
                      <td className="py-3.5 px-4 font-mono">{t.registeredTeams} / {t.maxTeams}</td>
                      <td className="py-3.5 px-4 font-mono">{t.registeredIndividuals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Render General Dashboard (Super Admin / Manager)
  const genData = data as GeneralAnalyticsData;
  const isManager = profile?.role === 'manager';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {isManager ? 'Manager Dashboard' : 'Admin Dashboard'}
        </h1>
        <p className="text-[#A7C4B8] text-sm mt-1">Real-time facility performance and financial metrics.</p>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className={`grid grid-cols-1 ${isManager ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4`}>
        {!isManager && (
          <div className="p-5 rounded-2xl bg-[#111A16] border border-[#1E3A2B] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Revenue</span>
              <p className="text-2xl font-black text-primary font-mono mt-1">₹{genData.totalRevenue}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#1A2620] text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        )}

        <div className="p-5 rounded-2xl bg-[#111A16] border border-[#1E3A2B] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Bookings Placed</span>
            <p className="text-2xl font-black text-foreground font-mono mt-1">{genData.bookingsCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#1A2620] text-primary">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111A16] border border-[#1E3A2B] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Registered Users</span>
            <p className="text-2xl font-black text-foreground font-mono mt-1">{genData.usersCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#1A2620] text-primary">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${isManager ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
        {/* SVG Revenue Line Chart Card */}
        {!isManager && (
          <div className="p-6 rounded-2xl bg-[#111A16] border border-[#1E3A2B] space-y-4">
            <h2 className="text-sm font-bold text-[#A7C4B8] uppercase tracking-wider">Revenue Trend (Last 7 Days)</h2>
            
            {genData.revenueChart.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
                No revenue logged yet.
              </div>
            ) : (
              <div className="relative h-48 w-full pt-4">
                <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                  {/* Generate SVG Path from chart array */}
                  <path
                    d={`M ${genData.revenueChart.map((d, i) => {
                      const x = (i / (genData.revenueChart.length - 1)) * 100;
                      const maxRev = Math.max(...genData.revenueChart.map(item => item.revenue)) || 1;
                      const y = 50 - (d.revenue / maxRev) * 40;
                      return `${x} ${y}`;
                    }).join(' L ')}`}
                    fill="none"
                    stroke="#34D399"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                {/* Labels */}
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-2">
                  {genData.revenueChart.map((d) => (
                    <span key={d.date}>{d.date.slice(5)}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Court Utilization Card */}
        <div className="p-6 rounded-2xl bg-[#111A16] border border-[#1E3A2B] space-y-4">
          <h2 className="text-sm font-bold text-[#A7C4B8] uppercase tracking-wider font-bold">Court Utilization</h2>
          
          <div className="space-y-4">
            {genData.utilization.map((c) => (
              <div key={c.courtId} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-foreground">
                  <span>{c.name} ({c.sport})</span>
                  <span className="font-mono text-primary">{c.rate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#1A2620] overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${c.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
