'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { UserRole } from '@/types/api';
import ResetPasswordDialog from './ResetPasswordDialog';
import styles from './UserMenu.module.css';
import { useTranslations } from '@/i18n/client';

interface UserMenuProps {
  userName: string;
  userRole: UserRole;
}

export default function UserMenu({ userName, userRole }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dict = useTranslations();
  const userMenu = dict.dashboard.userMenu as Record<string, string>;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const handleResetPassword = () => {
    setIsOpen(false);
    setShowResetDialog(true);
  };

  return (
    <>
      <div className={styles.userMenuContainer} ref={menuRef}>
        <button
          className={styles.userBadge}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          {userName}
          <svg
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {isOpen && (
          <div className={styles.dropdown}>
            {userRole === UserRole.ADMIN && (
              <a href="/admin" className={styles.menuItem}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 1L3 4V7C3 10.5 5.5 13.5 8 14.5C10.5 13.5 13 10.5 13 7V4L8 1Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 5V8M8 10.5H8.005"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {userMenu.adminPanel || 'Admin Panel'}
              </a>
            )}
            <button className={styles.menuItem} onClick={handleResetPassword} type="button">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 7H8V4M12.5 8C12.5 10.4853 10.4853 12.5 8 12.5C5.51472 12.5 3.5 10.4853 3.5 8C3.5 5.51472 5.51472 3.5 8 3.5C9.4 3.5 10.6 4.1 11.5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {userMenu.resetPassword || 'Reset Password'}
            </button>
            <button className={styles.menuItem} onClick={handleLogout} type="button">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 11L13 8M13 8L10 5M13 8H6M6 3H5C3.89543 3 3 3.89543 3 5V11C3 12.1046 3.89543 13 5 13H6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {userMenu.logout || 'Logout'}
            </button>
          </div>
        )}
      </div>

      {showResetDialog && <ResetPasswordDialog onClose={() => setShowResetDialog(false)} />}
    </>
  );
}
