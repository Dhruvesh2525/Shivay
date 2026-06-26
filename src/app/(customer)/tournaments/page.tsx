// src/app/(customer)/tournaments/page.tsx
import { createAdminClient } from '@/lib/supabase/admin';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import TournamentsList from '@/components/tournaments/tournaments-list';

interface Tournament {
  id: string;
  name: string;
  sport: 'cricket' | 'pickleball';
  description: string;
  start_date: string;
  registration_deadline: string;
  entry_fee: number;
  status: string;
}

async function getTournaments(): Promise<Tournament[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('tournaments')
      .select('id, name, sport, description, start_date, registration_deadline, entry_fee, status')
      .in('status', ['approved', 'published', 'registration_open', 'registration_closed', 'in_progress'])
      .is('deleted_at', null)
      .order('start_date', { ascending: true });
    return (data as Tournament[]) || [];
  } catch {
    return [];
  }
}

export default async function TournamentsListPage() {
  const tournaments = await getTournaments();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <TournamentsList tournaments={tournaments} />
      <Footer />
      <MobileNav />
    </div>
  );
}
