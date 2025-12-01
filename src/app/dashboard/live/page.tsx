import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import styles from '../page.module.css';
import LiveMatchReporter from '@/components/LiveMatchReporter';
import MatchFeed from '@/components/MatchFeed';
import CreateMatchButton from '@/components/CreateMatchButton';
import TeamBuilder from '@/components/TeamBuilder';
import MatchLineupEditor from '@/components/MatchLineupEditor';

export default async function LivePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  const currentMatchday = await prisma.matchday.findFirst({
    where: {
      status: 'SCHEDULED',
      date: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
    include: {
      matches: {
        include: {
          events: {
            orderBy: { timestamp: 'desc' },
          },
          stats: true,
        },
      },
      rsvps: {
        where: { status: { in: ['IN', 'IN_BEER'] } },
        include: { player: true },
      },
      season: true,
      teams: {
        include: { players: true },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { date: 'asc' },
  });

  if (!currentMatchday) {
    return (
      <div className={styles.container}>
        <h1>Live Matchday</h1>
        <p>No matchday scheduled for today.</p>
      </div>
    );
  }

  const rsvpedPlayers = currentMatchday.rsvps.map((r) => r.player);

  // Fetch all active players for the team builder (including non-RSVP'd)
  const allActivePlayers = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  const allEvents = currentMatchday.matches
    .flatMap((m) => m.events)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Live Matchday</h1>
        <div className={styles.statusBadge}>
          <span className={styles.statusDot}></span>
          Live
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.mainColumn}>
          <div className={styles.section}>
            <h2>
              {currentMatchday.season?.name} - {new Date(currentMatchday.date).toLocaleDateString()}
            </h2>

            {currentMatchday.matches.length === 0 && (
              <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                <p style={{ marginBottom: '1rem' }}>No matches scheduled yet.</p>
                <CreateMatchButton matchdayId={currentMatchday.id} teams={currentMatchday.teams} />
              </div>
            )}

            {currentMatchday.matches.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <CreateMatchButton
                  matchdayId={currentMatchday.id}
                  label="Add Another Match"
                  teams={currentMatchday.teams}
                />
              </div>
            )}

            {currentMatchday.matches.map((match) => (
              <div
                key={match.id}
                style={{
                  marginBottom: '2rem',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1rem',
                }}
              >
                <LiveMatchReporter matchId={match.id} players={rsvpedPlayers} />
                <MatchLineupEditor
                  matchId={match.id}
                  initialStats={match.stats}
                  allPlayers={rsvpedPlayers}
                />
              </div>
            ))}
          </div>

          <TeamBuilder
            matchdayId={currentMatchday.id}
            initialPlayers={rsvpedPlayers}
            allPlayers={allActivePlayers}
            initialTeams={currentMatchday.teams}
          />
        </div>

        <div className={styles.sidebar}>
          <MatchFeed events={allEvents} />
        </div>
      </div>
    </div>
  );
}
