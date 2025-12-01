import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import styles from './page.module.css';
import { getLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { authOptions } from './api/auth/[...nextauth]/route';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  const locale = getLocale();
  const dict = await getDictionary(locale);
  const home = dict.home as Record<string, unknown>;
  const common = dict.common as Record<string, unknown>;
  const upcomingMatches = [
    {
      id: 1,
      homeTeam: 'FC Lions',
      awayTeam: 'United Warriors',
      date: 'Sunday, 24 Nov',
      time: '15:00',
      venue: 'Central Stadium',
      matchday: 'Matchday 12',
    },
    {
      id: 2,
      homeTeam: 'Rangers FC',
      awayTeam: 'City Strikers',
      date: 'Sunday, 24 Nov',
      time: '17:30',
      venue: 'Riverside Ground',
      matchday: 'Matchday 12',
    },
    {
      id: 3,
      homeTeam: 'Athletic Club',
      awayTeam: 'Phoenix United',
      date: 'Sunday, 1 Dec',
      time: '14:00',
      venue: 'Victory Park',
      matchday: 'Matchday 13',
    },
    {
      id: 4,
      homeTeam: 'Eagles FC',
      awayTeam: 'Thunder FC',
      date: 'Sunday, 1 Dec',
      time: '16:00',
      venue: 'North Field',
      matchday: 'Matchday 13',
    },
    {
      id: 5,
      homeTeam: 'Titans SC',
      awayTeam: 'Victory FC',
      date: 'Sunday, 8 Dec',
      time: '15:30',
      venue: 'Champions Arena',
      matchday: 'Matchday 14',
    },
    {
      id: 6,
      homeTeam: 'Dynamo FC',
      awayTeam: 'Sporting Club',
      date: 'Sunday, 8 Dec',
      time: '18:00',
      venue: 'East Stadium',
      matchday: 'Matchday 14',
    },
  ];

  return (
    <div className={styles.container}>
      <main className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.title}>
              {process.env.NEXT_PUBLIC_APP_NAME ||
                (home.hero as Record<string, string>)?.title ||
                'Sunday League Manager'}
            </h1>
            <p className={styles.subtitle}>
              {(home.hero as Record<string, string>)?.subtitle ||
                'Your complete platform for managing Sunday football.'}
            </p>
            <div className={styles.ctaGroup}>
              <Link href="/register" className={styles.buttonPrimary}>
                {
                  ((home.hero as Record<string, Record<string, string>>)?.cta?.register ||
                    'Register') as string
                }
              </Link>
              <Link href="/login" className={styles.buttonSecondary}>
                {
                  ((home.hero as Record<string, Record<string, string>>)?.cta?.signIn ||
                    'Sign In') as string
                }
              </Link>
            </div>
          </div>
        </div>
      </main>

      <section className={styles.matchesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {
              ((home.upcomingFixtures as Record<string, string>)?.title ||
                'Upcoming Fixtures') as string
            }
          </h2>
          <Link href="/dashboard" className={styles.viewAll}>
            {
              ((home.upcomingFixtures as Record<string, string>)?.viewAll ||
                'View all matches →') as string
            }
          </Link>
        </div>

        <div className={styles.matchesGrid}>
          {upcomingMatches.map((match) => (
            <div key={match.id} className={styles.matchCard}>
              <div className={styles.matchHeader}>
                <span className={styles.matchday}>
                  {
                    ((home.upcomingFixtures as Record<string, string>)?.matchday ||
                      'Matchday') as string
                  }{' '}
                  {match.matchday.split(' ')[1]}
                </span>
                <span className={styles.venue}>{match.venue}</span>
              </div>

              <div className={styles.matchTeams}>
                <div className={styles.team}>
                  <div className={styles.teamBadge}>
                    {match.homeTeam
                      .split(' ')
                      .map((word) => word[0])
                      .join('')}
                  </div>
                  <span className={styles.teamName}>{match.homeTeam}</span>
                </div>

                <div className={styles.matchTime}>
                  <span className={styles.vs}>
                    {((common.common as Record<string, string>)?.vs || 'VS') as string}
                  </span>
                </div>

                <div className={styles.team}>
                  <div className={styles.teamBadge}>
                    {match.awayTeam
                      .split(' ')
                      .map((word) => word[0])
                      .join('')}
                  </div>
                  <span className={styles.teamName}>{match.awayTeam}</span>
                </div>
              </div>

              <div className={styles.matchFooter}>
                <div className={styles.matchDateTime}>
                  <span className={styles.date}>{match.date}</span>
                  <span className={styles.time}>{match.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>
          {
            ((home.leagueHighlights as Record<string, string>)?.title ||
              'League Highlights') as string
          }
        </h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>248</div>
            <div className={styles.statLabel}>
              {
                ((home.leagueHighlights as Record<string, Record<string, string>>)?.stats
                  ?.totalMatches || 'Total Matches') as string
              }
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>1,847</div>
            <div className={styles.statLabel}>
              {
                ((home.leagueHighlights as Record<string, Record<string, string>>)?.stats
                  ?.goalsScored || 'Goals Scored') as string
              }
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>32</div>
            <div className={styles.statLabel}>
              {
                ((home.leagueHighlights as Record<string, Record<string, string>>)?.stats
                  ?.activeTeams || 'Active Teams') as string
              }
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>584</div>
            <div className={styles.statLabel}>
              {
                ((home.leagueHighlights as Record<string, Record<string, string>>)?.stats
                  ?.registeredPlayers || 'Registered Players') as string
              }
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
