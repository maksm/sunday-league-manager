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
  initialRsvpStatus?: string; // "IN", "IN_BEER", "IN_SUIT", "OUT", "OUT_INJURED", "OUT_BEER", "MAYBE"
  confirmedCount: number;
  declinedCount: number;
  userRole?: string;
};

export default function MatchdayCard({
  matchday,
  initialRsvpStatus,
  confirmedCount,
  declinedCount,
}: MatchdayCardProps) {
  const [status, setStatus] = useState(initialRsvpStatus);
  const [loading, setLoading] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const router = useRouter();
  const dict = useTranslations();
  const gameCard = dict.dashboard.gameCard as Record<string, unknown>;

  const locale = process.env.NEXT_PUBLIC_LOCALE === 'sl' ? sl : enUS;

  const handleClearRsvp = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rsvp', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchdayId: matchday.id }),
      });

      if (res.ok) {
        setStatus(undefined);
        setShowClearModal(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Clear RSVP failed', error);
    } finally {
      setLoading(false);
    }
  };

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
            <button
              onClick={() => handleRsvp('IN_SUIT')}
              disabled={loading}
              className={`${styles.button} ${styles.buttonIn} ${status === 'IN_SUIT' ? styles.active : ''}`}
              title={
                ((gameCard.rsvp as Record<string, string>)?.attendingSuit ||
                  'Coming in Style') as string
              }
            >
              <span>🤵</span>
              <span>
                {
                  ((gameCard.rsvp as Record<string, string>)?.attendingSuit ||
                    'Coming in Style') as string
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
            <button
              onClick={() => handleRsvp('OUT_BEER')}
              disabled={loading}
              className={`${styles.button} ${styles.buttonOut} ${status === 'OUT_BEER' ? styles.active : ''}`}
              title={
                ((gameCard.rsvp as Record<string, string>)?.injuredBeer ||
                  'Injured & Bringing Beers') as string
              }
            >
              <span>🏥🍺</span>
              <span>
                {
                  ((gameCard.rsvp as Record<string, string>)?.injuredBeer ||
                    'Injured & Bringing Beers') as string
                }
              </span>
            </button>
            <span className={styles.count}>{declinedCount}</span>
          </div>
        </div>
      </div>

      {status && (
        <div className={styles.statusRow}>
          <p className={styles.status}>
            <span
              className={`${styles.statusValue} ${status?.startsWith('IN') ? styles.statusIn : status?.startsWith('OUT') ? styles.statusOut : ''}`}
            >
              {status === 'IN' &&
                (((gameCard.rsvp as Record<string, Record<string, string>>)?.status?.in ||
                  'Attending ⚽') as string)}
              {status === 'IN_BEER' &&
                (((gameCard.rsvp as Record<string, Record<string, string>>)?.status?.inBeer ||
                  'Bringing Beers 🍺') as string)}
              {status === 'IN_SUIT' &&
                (((gameCard.rsvp as Record<string, Record<string, string>>)?.status?.inSuit ||
                  'Coming in Style 🤵') as string)}
              {status === 'OUT' &&
                (((gameCard.rsvp as Record<string, Record<string, string>>)?.status?.out ||
                  'Not Attending ❌') as string)}
              {status === 'OUT_INJURED' && (
                <>
                  {
                    ((gameCard.rsvp as Record<string, Record<string, string>>)?.status
                      ?.outInjured || 'Injured') as string
                  }{' '}
                  <Image src="/injury.png" alt="Injured" width={16} height={16} />
                </>
              )}
              {status === 'OUT_BEER' &&
                (((gameCard.rsvp as Record<string, Record<string, string>>)?.status?.outBeer ||
                  'Injured & Bringing Beers 🏥🍺') as string)}
            </span>
          </p>
          <button
            className={styles.clearButton}
            onClick={() => setShowClearModal(true)}
            disabled={loading}
            title={((gameCard.rsvp as Record<string, string>)?.clear || 'Clear') as string}
          >
            ✕
          </button>
        </div>
      )}

      {showClearModal && (
        <div className={styles.modalOverlay} onClick={() => setShowClearModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              {((gameCard.rsvp as Record<string, string>)?.clearTitle || 'Clear RSVP?') as string}
            </h3>
            <p className={styles.modalText}>
              {
                ((gameCard.rsvp as Record<string, string>)?.clearConfirm ||
                  'Are you sure you want to clear your response?') as string
              }
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.modalCancel}
                onClick={() => setShowClearModal(false)}
                disabled={loading}
              >
                {((gameCard.rsvp as Record<string, string>)?.cancel || 'Cancel') as string}
              </button>
              <button className={styles.modalConfirm} onClick={handleClearRsvp} disabled={loading}>
                {loading
                  ? (((gameCard.rsvp as Record<string, string>)?.clearing ||
                      'Clearing...') as string)
                  : (((gameCard.rsvp as Record<string, string>)?.confirmClear ||
                      'Clear') as string)}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
