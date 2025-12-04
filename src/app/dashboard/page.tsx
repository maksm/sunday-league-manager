import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import type { Player } from '@prisma/client';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import MatchdayCard from './MatchdayCard';

import VotingCard from './VotingCard';
import { authOptions } from '../api/auth/[...nextauth]/route';
import styles from './page.module.css';
import { getLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { sortPlayers } from '@/lib/player-utils';

export default async function DashboardPage() {
  const locale = getLocale();
  const dict = await getDictionary(locale);
  const dashboard = dict.dashboard as Record<string, unknown>;

  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  // Fetch User to get Player ID
  const user = await prisma.user.findUnique({
    where: { username: session.user.name! },
    include: { player: true },
  });

  if (!user?.player) {
    // Handle edge case where user has no player profile
    return <div>{(dashboard.noPlayerProfile as string) || 'Error: No player profile found.'}</div>;
  }

  // Fetch Next Matchday
  const nextMatchday = await prisma.matchday.findFirst({
    where: {
      status: 'SCHEDULED',
      date: {
        gte: new Date(),
      },
    },
    include: {
      rsvps: true,
      matches: true,
      season: true,
    },
    orderBy: { date: 'asc' },
  });

  const confirmedCount =
    nextMatchday?.rsvps?.filter(
      (r: { status: string }) => r.status === 'IN' || r.status === 'IN_BEER'
    ).length || 0;
  const declinedCount =
    nextMatchday?.rsvps?.filter(
      (r: { status: string }) => r.status === 'OUT' || r.status === 'OUT_INJURED'
    ).length || 0;

  const attendingPlayerIds = new Set<string>(
    nextMatchday?.rsvps
      ?.filter((r: { status: string }) => r.status === 'IN' || r.status === 'IN_BEER')
      .map((r: { playerId: string }) => r.playerId) || []
  );
  const beerPlayerIds = new Set<string>(
    nextMatchday?.rsvps
      ?.filter((r: { status: string }) => r.status === 'IN_BEER')
      .map((r: { playerId: string }) => r.playerId) || []
  );

  const declinedPlayerIds = new Set<string>(
    nextMatchday?.rsvps
      ?.filter((r: { status: string }) => r.status === 'OUT' || r.status === 'OUT_INJURED')
      .map((r: { playerId: string }) => r.playerId) || []
  );
  const injuredPlayerIds = new Set<string>(
    nextMatchday?.rsvps
      ?.filter((r: { status: string }) => r.status === 'OUT_INJURED')
      .map((r: { playerId: string }) => r.playerId) || []
  );

  // Fetch Last Played Matchday (for Voting) - within last 24h
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const lastMatchday = await prisma.matchday.findFirst({
    where: {
      status: 'COMPLETED',
      updatedAt: {
        gte: yesterday,
      },
    },
    include: {
      rsvps: {
        where: { status: 'IN' },
        include: { player: true },
      },
      votes: {
        where: { voterId: user.player.id },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const showVoting = lastMatchday && lastMatchday.votes.length === 0;

  // Fetch User's RSVP for next matchday
  let rsvpStatus = undefined;
  if (nextMatchday) {
    const rsvp = await prisma.rSVP.findUnique({
      where: {
        matchdayId_playerId: {
          matchdayId: nextMatchday.id,
          playerId: user.player.id,
        },
      },
    });
    rsvpStatus = rsvp?.status;
  }

  // Fetch Players (Attending first, then alphabetical)
  const players = await prisma.player.findMany({
    where: { isActive: true },
    include: { team: true },
    orderBy: { name: 'asc' },
  });

  const sortedPlayers = sortPlayers(players, attendingPlayerIds, beerPlayerIds, declinedPlayerIds);

  // Get all unique teams
  const teams = await prisma.team.findMany({
    orderBy: { name: 'asc' },
  });

  // Group players by team, free agents, and bench
  const rsvpedPlayerIds = new Set<string>(
    nextMatchday?.rsvps?.map((r: { playerId: string }) => r.playerId) || []
  );

  const playersByTeam: Record<string, typeof players> = {};
  const freeAgents: typeof players = [];
  const benchPlayers: typeof players = [];

  sortedPlayers.forEach((player) => {
    // Check if player has RSVPed
    if (!rsvpedPlayerIds.has(player.id)) {
      benchPlayers.push(player);
    } else if (player.teamId) {
      if (!playersByTeam[player.teamId]) {
        playersByTeam[player.teamId] = [];
      }
      playersByTeam[player.teamId].push(player);
    } else {
      freeAgents.push(player);
    }
  });

  const renderPlayerRow = (player: (typeof players)[0], showTeamColumn: boolean = false) => {
    const isAttending = attendingPlayerIds.has(player.id);
    const isDeclined = declinedPlayerIds.has(player.id);
    return (
      <tr key={player.id}>
        <td className={styles.playerName}>
          {player.name}
          {isAttending && (
            <span className={styles.attendingBadge} title="Attending">
              {beerPlayerIds.has(player.id) ? '🍺' : '⚽'}
            </span>
          )}
          {isDeclined && (
            <span className={styles.declinedBadge} title="Not attending">
              {injuredPlayerIds.has(player.id) ? (
                <Image src="/injury.png" alt="Injured" width={16} height={16} />
              ) : (
                '❌'
              )}
            </span>
          )}
        </td>
        {showTeamColumn && (
          <td className={styles.teamCell}>
            {player.team ? (
              <>
                <span className={styles.teamBadge}>{player.team.badge}</span>
                <span>{player.team.name}</span>
              </>
            ) : (
              <>
                <span className={styles.teamBadge}>💰</span>
                <span className={styles.noTeam}>Prost agent</span>
              </>
            )}
          </td>
        )}
        <td>
          <div className={styles.formContainer}>
            {player.form ? (
              player.form.split(',').map((result: string, i: number) => (
                <span
                  key={i}
                  className={`${styles.formBadge} ${
                    result === 'W'
                      ? styles.formBadgeW
                      : result === 'L'
                        ? styles.formBadgeL
                        : styles.formBadgeD
                  }`}
                >
                  {result}
                </span>
              ))
            ) : (
              <span className={styles.noForm}>-</span>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        {/* Voting Section */}
        {showVoting && (
          <VotingCard
            gameId={lastMatchday.id}
            players={lastMatchday.rsvps.map((r: { player: Player }) => r.player)}
          />
        )}

        {/* Next Matchday Card */}
        {nextMatchday ? (
          <>
            <MatchdayCard
              matchday={nextMatchday}
              initialRsvpStatus={rsvpStatus}
              confirmedCount={confirmedCount}
              declinedCount={declinedCount}
              userRole={user.role}
            />
          </>
        ) : (
          <div className={`${styles.section} ${styles.emptyState}`}>
            {(dashboard.noGames as string) || 'No upcoming matchdays scheduled.'}
          </div>
        )}

        {/* Formations by Team */}
        <div className={styles.formationsWrapper}>
          <h2 className={styles.mainTitle}>
            {
              ((dashboard.leaderboard as Record<string, string>)?.title ||
                'Last Formations') as string
            }
          </h2>

          {/* Team Sections */}
          {teams.map((team) => {
            const teamPlayers = playersByTeam[team.id] || [];
            if (teamPlayers.length === 0) return null;

            return (
              <section key={team.id} className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.teamBadge}>{team.badge}</span>
                  {team.name}
                </h3>
                <table className={styles.leaderboardTable}>
                  <thead>
                    <tr>
                      <th className={styles.colPlayer}>
                        {
                          ((dashboard.leaderboard as Record<string, Record<string, string>>)
                            ?.headers?.player || 'Player') as string
                        }
                      </th>
                      <th className={styles.colForm}>
                        {
                          ((dashboard.leaderboard as Record<string, Record<string, string>>)
                            ?.headers?.form || 'Form') as string
                        }
                      </th>
                    </tr>
                  </thead>
                  <tbody>{teamPlayers.map((player) => renderPlayerRow(player))}</tbody>
                </table>
              </section>
            );
          })}

          {/* Free Agents */}
          {freeAgents.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                {
                  ((dashboard.leaderboard as Record<string, Record<string, string>>)?.teams
                    ?.freeAgents || 'Free Agents') as string
                }
              </h3>
              <table className={styles.leaderboardTable}>
                <thead>
                  <tr>
                    <th className={styles.colPlayer}>
                      {
                        ((dashboard.leaderboard as Record<string, Record<string, string>>)?.headers
                          ?.player || 'Player') as string
                      }
                    </th>
                    <th className={styles.colForm}>
                      {
                        ((dashboard.leaderboard as Record<string, Record<string, string>>)?.headers
                          ?.form || 'Form') as string
                      }
                    </th>
                  </tr>
                </thead>
                <tbody>{freeAgents.map((player) => renderPlayerRow(player))}</tbody>
              </table>
            </section>
          )}

          {/* Bench (Not Responded) */}
          {benchPlayers.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                {
                  ((dashboard.leaderboard as Record<string, Record<string, string>>)?.teams
                    ?.bench || 'Bench (No Response)') as string
                }
              </h3>
              <table className={styles.leaderboardTable}>
                <thead>
                  <tr>
                    <th className={styles.colPlayer}>
                      {
                        ((dashboard.leaderboard as Record<string, Record<string, string>>)?.headers
                          ?.player || 'Player') as string
                      }
                    </th>
                    <th className={styles.colTeam}>Ekipa</th>
                    <th className={styles.colForm}>
                      {
                        ((dashboard.leaderboard as Record<string, Record<string, string>>)?.headers
                          ?.form || 'Form') as string
                      }
                    </th>
                  </tr>
                </thead>
                <tbody>{benchPlayers.map((player) => renderPlayerRow(player, true))}</tbody>
              </table>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
