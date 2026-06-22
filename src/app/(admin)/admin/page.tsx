// src/app/(admin)/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Zap, Users, Trophy, TrendingUp, BarChart2 } from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  usersCount: number;
  bookingsCount: number;
  revenueChart: { date: string; revenue: number }[];
  utilization: { courtId: string; name: string; sport: string; rate: number }[];
}

export default function AdminDashboard() {
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Admin Dashboard</h1>
        <p className="text-[#A7C4B8] text-sm mt-1">Real-time facility performance and financial metrics.</p>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#111A16] border border-[#1E3A2B] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Revenue</span>
            <p className="text-2xl font-black text-primary font-mono mt-1">₹{data.totalRevenue}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#1A2620] text-primary">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111A16] border border-[#1E3A2B] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Bookings Placed</span>
            <p className="text-2xl font-black text-foreground font-mono mt-1">{data.bookingsCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#1A2620] text-primary">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111A16] border border-[#1E3A2B] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Registered Users</span>
            <p className="text-2xl font-black text-foreground font-mono mt-1">{data.usersCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#1A2620] text-primary">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SVG Revenue Line Chart Card */}
        <div className="p-6 rounded-2xl bg-[#111A16] border border-[#1E3A2B] space-y-4">
          <h2 className="text-sm font-bold text-[#A7C4B8] uppercase tracking-wider">Revenue Trend (Last 7 Days)</h2>
          
          {data.revenueChart.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
              No revenue logged yet.
            </div>
          ) : (
            <div className="relative h-48 w-full pt-4">
              <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                {/* Generate SVG Path from chart array */}
                <path
                  d={`M ${data.revenueChart.map((d, i) => {
                    const x = (i / (data.revenueChart.length - 1)) * 100;
                    const maxRev = Math.max(...data.revenueChart.map(item => item.revenue)) || 1;
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
                {data.revenueChart.map((d) => (
                  <span key={d.date}>{d.date.slice(5)}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Court Utilization Card */}
        <div className="p-6 rounded-2xl bg-[#111A16] border border-[#1E3A2B] space-y-4">
          <h2 className="text-sm font-bold text-[#A7C4B8] uppercase tracking-wider font-bold">Court Utilization</h2>
          
          <div className="space-y-4">
            {data.utilization.map((c) => (
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
