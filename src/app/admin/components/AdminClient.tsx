'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateShadowPlayerForm from './CreateShadowPlayerForm';
import PlayerActions from './PlayerActions';
import SeasonManagement from './SeasonManagement';
import MatchdayManagement from './MatchdayManagement';
import styles from '../page.module.css';
import { useTranslations } from '@/i18n/client';

type Player = {
  id: string;
  name: string;
  isActive: boolean;
  user: { username: string } | null;
};

type Props = {
  initialPlayers: Player[];
};

export default function AdminClient({ initialPlayers }: Props) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const router = useRouter();
  const dict = useTranslations();
  const admin = dict.admin as Record<string, unknown>;

  const fetchPlayers = async () => {
    try {
      const res = await fetch('/api/admin/players', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setPlayers(data);
      } else if (res.status === 403) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <h1 className={styles.title}>{(admin.title as string) || 'Admin Dashboard'}</h1>
          <p className={styles.subtitle}>
            {(admin.subtitle as string) || 'Manage players and shadow profiles'}
          </p>
        </header>

        <main className={styles.main}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {
                ((admin.createShadowPlayer as Record<string, string>)?.title ||
                  'Create Shadow Player') as string
              }
            </h2>
            <p className={styles.sectionDescription}>
              {
                ((admin.createShadowPlayer as Record<string, string>)?.description ||
                  "Manage player profiles. You can create shadow profiles for players who haven't registered yet.") as string
              }
            </p>
            <CreateShadowPlayerForm onSuccess={fetchPlayers} />
          </section>

          <SeasonManagement />
          <MatchdayManagement />

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {((admin.playerList as Record<string, string>)?.title || 'All Players') as string}
            </h2>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>
                      {
                        ((admin.playerList as Record<string, Record<string, string>>)?.headers
                          ?.name || 'Name') as string
                      }
                    </th>
                    <th>
                      {
                        ((admin.playerList as Record<string, Record<string, string>>)?.headers
                          ?.username || 'Username') as string
                      }
                    </th>
                    <th>
                      {
                        ((admin.playerList as Record<string, Record<string, string>>)?.headers
                          ?.status || 'Status') as string
                      }
                    </th>
                    <th>
                      {
                        ((admin.playerList as Record<string, Record<string, string>>)?.headers
                          ?.actions || 'Actions') as string
                      }
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player.id} style={{ opacity: player.isActive ? 1 : 0.6 }}>
                      <td className={styles.playerName}>{player.name}</td>
                      <td className={styles.username}>{player.user?.username || '-'}</td>
                      <td>
                        {!player.isActive ? (
                          <span className={`${styles.badge} ${styles.badgeDanger}`}>
                            {
                              ((admin.playerList as Record<string, Record<string, string>>)?.status
                                ?.inactive || 'Inactive') as string
                            }
                          </span>
                        ) : player.user ? (
                          <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                            {
                              ((admin.playerList as Record<string, Record<string, string>>)?.status
                                ?.registered || 'Registered') as string
                            }
                          </span>
                        ) : (
                          <span className={`${styles.badge} ${styles.badgeWarning}`}>
                            {
                              ((admin.playerList as Record<string, Record<string, string>>)?.status
                                ?.shadow || 'Shadow') as string
                            }
                          </span>
                        )}
                      </td>
                      <td>
                        <PlayerActions
                          player={player}
                          onUpdate={fetchPlayers}
                          onDelete={fetchPlayers}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
