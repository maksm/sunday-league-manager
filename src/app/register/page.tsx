'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { useTranslations } from '@/i18n/client';

type Player = {
  id: string;
  name: string;
};

type Team = {
  id: string;
  name: string;
  badge: string | null;
};

export default function RegisterPage() {
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameManuallyEdited, setIsUsernameManuallyEdited] = useState(false);
  const [isClaiming, setIsClaiming] = useState(true);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dict = useTranslations();
  const register = dict.auth.register as Record<string, unknown>;

  useEffect(() => {
    fetch('/api/players?shadow=true')
      .then((res) => res.json())
      .then((data) => setAvailablePlayers(data))
      .catch(console.error);

    fetch('/api/teams')
      .then((res) => res.json())
      .then((data) => setTeams(data))
      .catch(console.error);
  }, []);

  const generateUsername = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    let generated = parts[0] || '';

    if (parts.length > 1) {
      const lastName = parts[parts.length - 1];
      if (lastName.length > 0) {
        generated += lastName[0];
      }
    }

    return generated.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  };

  useEffect(() => {
    if (!isClaiming && !isUsernameManuallyEdited) {
      setUsername(generateUsername(name));
    }
  }, [name, isClaiming, isUsernameManuallyEdited]);

  useEffect(() => {
    if (isClaiming && selectedPlayerId && !isUsernameManuallyEdited) {
      const player = availablePlayers.find((p) => p.id === selectedPlayerId);
      if (player) {
        setUsername(generateUsername(player.name));
      }
    }
  }, [selectedPlayerId, isClaiming, availablePlayers, isUsernameManuallyEdited]);

  const filteredPlayers = availablePlayers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          name: isClaiming ? undefined : name,
          playerId: isClaiming ? selectedPlayerId : undefined,
          username,
          teamId: selectedTeamId || null,
        }),
      });

      if (res.ok) {
        router.push('/login');
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError(
        ((register.errors as Record<string, string>)?.unexpectedError ||
          'An unexpected error occurred') as string
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{(register.title as string) || 'Join the League'}</h1>
          <p className={styles.subtitle}>
            {(register.subtitle as string) || 'Create your account or claim your profile'}
          </p>
        </div>

        {error && (
          <div className={styles.alert}>
            <p className={styles.alertText}>{error}</p>
          </div>
        )}

        <div className={styles.tabSwitcher}>
          <button
            type="button"
            onClick={() => {
              setIsClaiming(false);
              setSelectedPlayerId('');
              setSearchQuery('');
              setUsername('');
              setIsUsernameManuallyEdited(false);
            }}
            className={`${styles.tabButton} ${!isClaiming ? styles.tabButtonActive : ''}`}
          >
            {((register.tabs as Record<string, string>)?.newPlayer || 'New Player') as string}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsClaiming(true);
              setName('');
              setUsername('');
              setIsUsernameManuallyEdited(false);
            }}
            className={`${styles.tabButton} ${isClaiming ? styles.tabButtonClaim : ''}`}
          >
            {((register.tabs as Record<string, string>)?.claimProfile || 'Claim Profile') as string}
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {isClaiming ? (
            <div className={styles.formSection}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  {
                    ((register.claimProfile as Record<string, string>)?.searchTitle ||
                      'Search for Your Profile') as string
                  }
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    ((register.claimProfile as Record<string, string>)?.searchPlaceholder ||
                      'Type your name...') as string
                  }
                  className={styles.input}
                />
              </div>

              <div className={styles.playerList}>
                {filteredPlayers.length === 0 ? (
                  <div className={styles.playerListEmpty}>
                    {searchQuery
                      ? (((register.claimProfile as Record<string, string>)?.noResults ||
                          'No players found') as string)
                      : (((register.claimProfile as Record<string, string>)?.startTyping ||
                          'Start typing to search...') as string)}
                  </div>
                ) : (
                  filteredPlayers.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlayerId(p.id)}
                      className={`${styles.playerItem} ${
                        selectedPlayerId === p.id ? styles.playerItemSelected : ''
                      }`}
                    >
                      <div className={styles.playerItemContent}>
                        <span
                          className={`${styles.playerName} ${
                            selectedPlayerId === p.id ? styles.playerNameSelected : ''
                          }`}
                        >
                          {p.name}
                        </span>
                        {selectedPlayerId === p.id && (
                          <svg className={styles.checkIcon} fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                {
                  ((register.newPlayer as Record<string, string>)?.nameLabel ||
                    'Full Name') as string
                }
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                placeholder={
                  ((register.newPlayer as Record<string, string>)?.namePlaceholder ||
                    'Enter your full name') as string
                }
                required={!isClaiming}
                disabled={loading}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>
              {((register.common as Record<string, string>)?.usernameLabel || 'Username') as string}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setIsUsernameManuallyEdited(true);
              }}
              className={styles.input}
              placeholder={
                ((register.common as Record<string, string>)?.usernamePlaceholder ||
                  'Choose a username') as string
              }
              required
              disabled={loading}
              minLength={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              {
                ((register.newPlayer as Record<string, string>)?.passwordLabel ||
                  'Password') as string
              }
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder={
                ((register.newPlayer as Record<string, string>)?.passwordPlaceholder ||
                  'Create a strong password') as string
              }
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Team</label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className={styles.input}
              disabled={loading}
            >
              <option value="">💰 Prost agent</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.badge} {team.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={(isClaiming && !selectedPlayerId) || loading}
            className={styles.button}
          >
            {loading ? (
              <span className={styles.buttonContent}>
                <svg className={styles.spinner} viewBox="0 0 24 24">
                  <circle
                    className={styles.spinnerCircle}
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className={styles.spinnerPath}
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {isClaiming
                  ? (((register.claimProfile as Record<string, string>)?.submitting ||
                      'Claiming...') as string)
                  : (((register.newPlayer as Record<string, string>)?.submitting ||
                      'Creating...') as string)}
              </span>
            ) : isClaiming ? (
              (((register.claimProfile as Record<string, string>)?.submit ||
                'Claim & Register') as string)
            ) : (
              (((register.newPlayer as Record<string, string>)?.submit ||
                'Create Account') as string)
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            {
              ((register.footer as Record<string, string>)?.hasAccount ||
                'Already have an account?') as string
            }{' '}
            <Link href="/login" className={styles.link}>
              {((register.footer as Record<string, string>)?.loginLink || 'Sign in') as string}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
