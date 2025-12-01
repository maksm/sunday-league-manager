'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { enUS, sl } from 'date-fns/locale';
import styles from './MatchdayCard.module.css';
import { useTranslations } from '@/i18n/client';

type MatchdayCardProps = {
  matchday: {
    id: string;
    date: Date;
    status: string;
    matches?: { id: string }[];
    season?: { location: string } | null;
  };
  initialRsvpStatus?: string; // "IN", "IN_BEER", "OUT", "OUT_INJURED", "MAYBE"
  confirmedCount: number;
  declinedCount: number;
  userRole?: string;
};

export default function MatchdayCard({
  matchday,
  initialRsvpStatus,
  confirmedCount,
  declinedCount,
  userRole,
}: MatchdayCardProps) {
  const [status, setStatus] = useState(initialRsvpStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dict = useTranslations();
  const gameCard = dict.dashboard.gameCard as Record<string, unknown>;

  const locale = process.env.NEXT_PUBLIC_LOCALE === 'sl' ? sl : enUS;

  const handleRsvp = async (newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchdayId: matchday.id, status: newStatus }),
      });

      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      }
    } catch (error) {
      console.error('RSVP failed', error);
    } finally {
      setLoading(false);
    }
  };

  const defaultMatch = matchday.matches?.[0];

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>{(gameCard.title as string) || 'Next Matchday'}</h2>
      <div className={styles.content}>
        <div className={styles.matchInfo}>
          <p className={styles.date}>
            {format(new Date(matchday.date), 'EEEE, MMMM do, h:mm a', { locale })}
          </p>
          <p className={styles.venue}>{matchday.season?.location || 'Central Park Pitch 1'}</p>
        </div>

        <div className={styles.actions}>
          <div className={styles.actionGroup}>
            <button
              onClick={() => handleRsvp('IN')}
              disabled={loading}
              className={`${styles.button} ${styles.buttonIn} ${status === 'IN' ? styles.active : ''}`}
              title={
                ((gameCard.rsvp as Record<string, string>)?.attending || 'Attending') as string
              }
            >
              <span>⚽</span>
              <span>
                {((gameCard.rsvp as Record<string, string>)?.attending || 'Attending') as string}
              </span>
            </button>
            <button
              onClick={() => handleRsvp('IN_BEER')}
              disabled={loading}
              className={`${styles.button} ${styles.buttonIn} ${status === 'IN_BEER' ? styles.active : ''}`}
              title={
                ((gameCard.rsvp as Record<string, string>)?.attendingBeer ||
                  'Attending & Bringing Beers') as string
              }
            >
              <span>🍺</span>
              <span>
                {
                  ((gameCard.rsvp as Record<string, string>)?.attendingBeer ||
                    'Attending & Bringing Beers') as string
                }
              </span>
            </button>
            <span className={styles.count}>{confirmedCount}</span>
          </div>

          <div className={styles.actionGroup}>
            <button
              onClick={() => handleRsvp('OUT')}
              disabled={loading}
              className={`${styles.button} ${styles.buttonOut} ${status === 'OUT' ? styles.active : ''}`}
              title={
                ((gameCard.rsvp as Record<string, string>)?.notAttending ||
                  'Not Attending') as string
              }
            >
              <span>❌</span>
              <span>
                {
                  ((gameCard.rsvp as Record<string, string>)?.notAttending ||
                    'Not Attending') as string
                }
              </span>
            </button>
            <button
              onClick={() => handleRsvp('OUT_INJURED')}
              disabled={loading}
              className={`${styles.button} ${styles.buttonOut} ${status === 'OUT_INJURED' ? styles.active : ''}`}
              title={((gameCard.rsvp as Record<string, string>)?.injured || 'Injured') as string}
            >
              <Image src="/injury.png" alt="Injured" width={20} height={20} />
              <span>
                {((gameCard.rsvp as Record<string, string>)?.injured || 'Injured') as string}
              </span>
            </button>
            <span className={styles.count}>{declinedCount}</span>
          </div>
        </div>
      </div>

      {status && (
        <p className={styles.status}>
          <span
            className={`${styles.statusValue} ${status === 'IN' ? styles.statusIn : status === 'OUT' ? styles.statusOut : ''}`}
          >
            {status === 'IN' &&
              (((gameCard.rsvp as Record<string, Record<string, string>>)?.status?.in ||
                'Attending ⚽') as string)}
            {status === 'IN_BEER' &&
              (((gameCard.rsvp as Record<string, Record<string, string>>)?.status?.inBeer ||
                'Bringing Beers 🍺') as string)}
            {status === 'OUT' &&
              (((gameCard.rsvp as Record<string, Record<string, string>>)?.status?.out ||
                'Not Attending ❌') as string)}
            {status === 'OUT_INJURED' && (
              <>
                {
                  ((gameCard.rsvp as Record<string, Record<string, string>>)?.status?.outInjured ||
                    'Injured') as string
                }{' '}
                <Image src="/injury.png" alt="Injured" width={16} height={16} />
              </>
            )}
          </span>
        </p>
      )}
    </section>
  );
}
