import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
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

  // Fetch current season
  const currentSeason = await prisma.season.findFirst({
    where: {
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    },
    orderBy: { startDate: 'desc' },
  });

  // Fetch next 4 matchdays from current season
  const upcomingMatchdays = currentSeason
    ? await prisma.matchday.findMany({
        where: {
          seasonId: currentSeason.id,
          date: { gte: new Date() },
          status: 'SCHEDULED',
        },
        orderBy: { date: 'asc' },
        take: 4,
        include: {
          season: true,
        },
      })
    : [];

  const upcomingMatches = upcomingMatchdays.map((matchday, index) => {
    // Alternate home/away each matchday
    const isBeliBaletHome = index % 2 === 0;
    return {
      id: matchday.id,
      homeTeam: isBeliBaletHome ? 'Beli Balet' : 'Cika Internazionale',
      awayTeam: isBeliBaletHome ? 'Cika Internazionale' : 'Beli Balet',
      date: new Date(matchday.date).toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      }),
      time: matchday.season?.startHour || '15:00',
      venue: matchday.season?.location || 'TBD',
      matchday: `Matchday ${index + 1}`,
    };
  });

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

            {/* League Highlights */}
            <div className={styles.heroStats}>
              <div className={styles.heroStatItem}>
                <div className={styles.heroStatValue}>20+</div>
                <div className={styles.heroStatLabel}>let tradicije</div>
              </div>
              <div className={styles.heroStatDivider}></div>
              <div className={styles.heroStatItem}>
                <div className={styles.heroStatValue}>25+</div>
                <div className={styles.heroStatLabel}>petkov v sezoni</div>
              </div>
              <div className={styles.heroStatDivider}></div>
              <div className={styles.heroStatItem}>
                <div className={styles.heroStatValue}>1</div>
                <div className={styles.heroStatLabel}>večni derby</div>
              </div>
              <div className={styles.heroStatDivider}></div>
              <div className={styles.heroStatItem}>
                <div className={styles.heroStatValue}>30+</div>
                <div className={styles.heroStatLabel}>registriranih igralcev</div>
              </div>
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
    </div>
  );
}
